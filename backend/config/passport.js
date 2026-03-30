import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { User } from '../models/index.js';

function getGoogleEmail(profile) {
  return profile?.emails?.[0]?.value || null;
}

function getGoogleName(profile) {
  return profile?.displayName || profile?.name?.givenName || 'Google User';
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const google_id = profile.id;
        const email = getGoogleEmail(profile);
        const full_name = getGoogleName(profile);

        if (!email) {
          return done(new Error('Google account email not available'));
        }

        let user = await User.findOne({ where: { google_id } });

        if (!user) {
          user = await User.create({
            email,
            password_hash: null,
            full_name,
            phone: null,
            role: 'citizen',
            preferred_lang: 'en',
            aadhaar_verified: false,
            google_id,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

export default passport;

