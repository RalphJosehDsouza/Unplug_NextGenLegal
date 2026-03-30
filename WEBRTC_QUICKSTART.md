# WebRTC Video Calling - Quick Start

## Installation (First Time Only)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### 2. Run Database Migration

```bash
cd backend
npm run db:migrate
```

### 3. Verify Dependencies Added

Check that these packages are installed:

**Backend:**
```bash
npm list socket.io  # Should be socket.io@4.7.2+
```

**Frontend:**
```bash
npm list simple-peer socket.io-client  # Should be installed
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
[server] NextGenLegal API listening on port 4000
[server] WebRTC Socket.io initialized
```

### Start Frontend Development Server

In another terminal:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Testing the Feature

### Scenario 1: Citizen Requests Video Call

1. **Login as Citizen** (http://localhost:5173)
   - Use a citizen account
   - Go to "My Bookings" page
   - Click "Video Call" button on any upcoming booking

2. **Expected Result**:
   - Button changes to show loading state
   - Notification sent to lawyer

### Scenario 2: Lawyer Receives & Responds

1. **Login as Lawyer** (in another browser/incognito)
   - Dashboard should show "Video Call Alerts" section
   - New incoming call appears with citizen name

2. **Accept or Decline**:
   - Click "Accept" to accept the call
   - Schedule dialog appears

3. **Schedule or Start**:
   - Option 1: Check "Start Video Call Immediately" → Click "Start Now"
   - Option 2: Select a date/time → Click "Schedule Call"

### Scenario 3: Citizen Joins Call

1. **Citizen sees notification** with scheduled time
2. **Countdown timer** appears
3. **When time arrives**, "Join Call Now" button activates
4. **Click "Join Call Now"** to start the video call

### Scenario 4: Video Call Active

Once both parties join:
1. **Two video boxes** appear (local + remote)
2. **Local video** shows in bottom-right corner
3. **Remote video** shows in main area
4. **Call duration** displayed at top-left
5. **Controls** at bottom:
   - Mute/Unmute audio
   - Toggle video
   - End Call button

## Troubleshooting

### Issue: "Connecting..." stays forever

**Solution**:
1. Check backend is running: `curl http://localhost:4000/api/lawyers?limit=1`
2. Check frontend console (F12) for errors
3. Refresh page and try again

### Issue: Black screen instead of video

**Solution**:
1. Check browser permissions (Camera/Microphone)
   - Click lock icon next to URL
   - Allow Camera & Microphone
   - Refresh page
2. Verify browser supports WebRTC (Chrome, Firefox, Safari, Edge)
3. Check if device has camera/mic attached

### Issue: Can't see remote video

**Solution**:
1. Both parties must be in the same room
2. Check Socket.io is connected (console should show "Socket.io Connected")
3. Try refreshing both pages
4. Check room ID is the same for both

### Issue: No audio

**Solution**:
1. Check system volume
2. Check browser hasn't muted the tab
3. Check microphone permissions
4. Try clicking "Mute" button to toggle

### Issue: Database error on load

**Solution**:
```bash
# Re-run migrations
cd backend
npm run db:migrate

# Or undo and redo
npm run db:undo
npm run db:migrate
```

## File Structure

```
backend/
├── models/
│   └── Booking.js                          # Updated with WebRTC fields
├── config/
│   └── socket.js                           # NEW: Socket.io configuration
├── controllers/
│   └── webrtcController.js                 # NEW: WebRTC endpoints
├── routes/
│   └── webrtcRoutes.js                     # NEW: WebRTC routes
├── migrations/
│   └── 20260331000000-add-webrtc-fields-to-booking.cjs  # NEW: DB migration
└── server.js                               # Updated: HTTP server + Socket.io

src/
├── hooks/
│   └── useSocket.ts                        # NEW: Socket.io hook
├── components/
│   └── webrtc/
│       ├── WebRTCVideo.tsx                 # NEW: Video component
│       ├── LawyerAlertsTab.tsx             # NEW: Lawyer alerts
│       └── CitizenVideoCall.tsx            # NEW: Citizen call UI
└── pages/
    └── MyBookings/
        └── index.tsx                       # Updated: Added video call button
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webrtc/initiate` | POST | Citizen initiates call |
| `/api/webrtc/accept` | POST | Lawyer accepts call |
| `/api/webrtc/reject` | POST | Lawyer rejects call |
| `/api/webrtc/schedule` | POST | Lawyer schedules/starts call |
| `/api/webrtc/end` | POST | End the call |
| `/api/webrtc/status/:booking_id` | GET | Get call status |

## Socket.io Events Summary

| Event | Direction | Purpose |
|-------|-----------|---------|
| `register-user` | Client→Server | Register user socket |
| `call-request` | Client→Server | Notify lawyer of call |
| `incoming-call` | Server→Client | Lawyer receives call alert |
| `accept-call` | Client→Server | Lawyer accepts call |
| `call-accepted` | Server→Client | Citizen notified of acceptance |
| `schedule-call` | Client→Server | Lawyer schedules call time |
| `call-scheduled` | Server→Client | Citizen gets scheduled time |
| `join-room` | Client→Server | Join WebRTC room |
| `webrtc-offer/answer/ice-candidate` | Both | WebRTC signaling |

## Debugging

### Enable detailed logging

In `src/hooks/useSocket.ts`:
```typescript
socketRef.current = io(SOCKET_URL, {
  // ... other options
  transports: ['websocket'], // Force WebSocket for debugging
  reconnection: true,
});
```

In `backend/config/socket.js`:
```javascript
const io = new Server(server, {
  // ... other options
  debug: true, // Enable debug logging
});
```

### Check Socket Connection

Browser Console:
```javascript
// Check if socket is connected
if (window.socket) {
  console.log('Socket connected:', window.socket.connected);
  console.log('Socket ID:', window.socket.id);
}
```

### Monitor Network

F12 → Network tab:
- Look for WebSocket connection (ws://localhost:4000/socket.io/...)
- Check Socket.io messages
- Monitor message flow during call

## Performance Tips

1. **Close unused tabs** to reduce background connections
2. **Use wired network** if WiFi is unstable
3. **Close bandwidth-heavy apps** during calls
4. **Reduce video resolution** for slower connections
5. **Test microphone** before starting important calls

## Next Steps

1. Run the application following the steps above
2. Test with two browser windows
3. Verify all features work
4. Check browser console for any errors
5. Refer to WEBRTC_IMPLEMENTATION.md for detailed documentation

---

**Need Help?** Check the full documentation in [WEBRTC_IMPLEMENTATION.md](./WEBRTC_IMPLEMENTATION.md)
