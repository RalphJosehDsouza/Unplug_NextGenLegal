import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Lawyer } from '../models/Lawyer.js';
import { randomBytes } from 'crypto';


export const initiateVideoCall = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    const citizen_id = req.user.id;

    // Find booking
    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== citizen_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update booking call status
    booking.call_status = 'pending';
    booking.webrtc_room_id = `room_${randomBytes(16).toString('hex')}`;
    await booking.save();

    // Get citizen and lawyer details
    const citizen = await User.findByPk(citizen_id);
    const lawyerProfile = await Lawyer.findByPk(booking.lawyer_id);
    if (!lawyerProfile?.user_id) {
      return res.status(400).json({ success: false, message: 'Lawyer profile is not linked to a user' });
    }
    const lawyer = lawyerProfile ? await User.findByPk(lawyerProfile.user_id) : null;

    // Create notification for lawyer
    await Notification.create({
      user_id: lawyerProfile.user_id,
      title: 'Incoming Video Call Request',
      body: `${citizen.full_name} has requested a video call for booking #${booking_id.slice(0, 8)}`,
      type: 'booking',
      resource_id: booking_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Video call initiated',
      data: {
        booking_id,
        call_status: 'pending',
        webrtc_room_id: booking.webrtc_room_id,
        citizen_name: citizen.full_name,
        lawyer_name: lawyer?.full_name || 'Lawyer',
      },
    });
  } catch (error) {
    console.error('[WebRTC] initiateVideoCall error:', error);
    next(error);
  }
};

export const acceptVideoCall = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    const lawyer_id = req.user.id;

    // Find booking
    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const lawyerProfile = await Lawyer.findByPk(booking.lawyer_id);
    if (!lawyerProfile || lawyerProfile.user_id !== lawyer_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (booking.call_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Call not in pending state' });
    }

    // Update booking status
    booking.call_status = 'accepted';
    await booking.save();

    // Create notification for citizen
    const lawyer = await User.findByPk(lawyer_id);
    await Notification.create({
      user_id: booking.user_id,
      title: 'Video Call Accepted',
      body: `${lawyer.full_name} has accepted your video call request. Waiting for timing...`,
      type: 'booking',
      resource_id: booking_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Video call accepted',
      data: {
        booking_id,
        call_status: 'accepted',
        webrtc_room_id: booking.webrtc_room_id,
      },
    });
  } catch (error) {
    console.error('[WebRTC] acceptVideoCall error:', error);
    next(error);
  }
};

export const rejectVideoCall = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    const lawyer_id = req.user.id;

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const lawyerProfile = await Lawyer.findByPk(booking.lawyer_id);
    if (!lawyerProfile || lawyerProfile.user_id !== lawyer_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    booking.call_status = 'rejected';
    await booking.save();

    // Notification for citizen
    const lawyer = await User.findByPk(lawyer_id);
    await Notification.create({
      user_id: booking.user_id,
      title: 'Video Call Declined',
      body: `${lawyer.full_name} has declined your video call request.`,
      type: 'booking',
      resource_id: booking_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Video call rejected',
      data: { booking_id, call_status: 'rejected' },
    });
  } catch (error) {
    console.error('[WebRTC] rejectVideoCall error:', error);
    next(error);
  }
};

export const scheduleVideoCall = async (req, res, next) => {
  try {
    const { booking_id, scheduled_time, start_immediately } = req.body;
    const lawyer_id = req.user.id;

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const lawyerProfile = await Lawyer.findByPk(booking.lawyer_id);
    if (!lawyerProfile || lawyerProfile.user_id !== lawyer_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (booking.call_status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Call must be in accepted state' });
    }

    if (start_immediately) {
      // Start call immediately
      booking.call_status = 'active';
      booking.call_started_at = new Date();
    } else {
      // Schedule for later
      booking.call_status = 'scheduled';
      booking.scheduled_call_time = new Date(scheduled_time);
    }

    await booking.save();

    // Notification for citizen
    const lawyer = await User.findByPk(lawyer_id);
    const notificationMessage = start_immediately
      ? `${lawyer.full_name} is ready for your video call now!`
      : `${lawyer.full_name} has scheduled your video call for ${new Date(scheduled_time).toLocaleString()}`;

    await Notification.create({
      user_id: booking.user_id,
      title: 'Video Call Scheduled',
      body: notificationMessage,
      type: 'booking',
      resource_id: booking_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Video call scheduled/started',
      data: {
        booking_id,
        call_status: booking.call_status,
        scheduled_call_time: booking.scheduled_call_time,
        webrtc_room_id: booking.webrtc_room_id,
        start_immediately,
      },
    });
  } catch (error) {
    console.error('[WebRTC] scheduleVideoCall error:', error);
    next(error);
  }
};

export const endVideoCall = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user.id;

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const lawyerProfile = await Lawyer.findByPk(booking.lawyer_id);
    const isLawyerUser = lawyerProfile?.user_id === user_id;
    if (booking.user_id !== user_id && !isLawyerUser) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    booking.call_status = 'completed';
    booking.call_ended_at = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Video call ended',
      data: {
        booking_id,
        call_status: 'completed',
        call_ended_at: booking.call_ended_at,
      },
    });
  } catch (error) {
    console.error('[WebRTC] endVideoCall error:', error);
    next(error);
  }
};

export const getCallStatus = async (req, res, next) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const lawyerProfile = await Lawyer.findByPk(booking.lawyer_id);
    const isLawyerUser = lawyerProfile?.user_id === user_id;
    if (booking.user_id !== user_id && !isLawyerUser) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({
      success: true,
      data: {
        booking_id,
        call_status: booking.call_status,
        scheduled_call_time: booking.scheduled_call_time,
        webrtc_room_id: booking.webrtc_room_id,
        call_started_at: booking.call_started_at,
        call_ended_at: booking.call_ended_at,
      },
    });
  } catch (error) {
    console.error('[WebRTC] getCallStatus error:', error);
    next(error);
  }
};
