import { Server } from 'socket.io';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store active connections: socketId -> userId mapping
  const userSockets = new Map();
  // Store active rooms: roomId -> { creator, peer, connectedAt }
  const activeRooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);

    // Register user to socket mapping
    socket.on('register-user', (userId) => {
      userSockets.set(socket.id, userId);
      socket.userId = userId;
      socket.broadcast.emit('user-online', userId);
      console.log(`[Socket.io] User ${userId} registered with socket ${socket.id}`);
    });

    // Lawyer receives call request
    socket.on('call-request', (data) => {
      const { booking_id, lawyer_id, citizen_id, citizen_name } = data;
      const lawyerSocket = Array.from(userSockets.entries()).find(
        ([_, userId]) => userId === lawyer_id
      );

      if (lawyerSocket) {
        io.to(lawyerSocket[0]).emit('incoming-call', {
          booking_id,
          citizen_id,
          citizen_name,
        });
        console.log(`[Socket.io] Call request sent to lawyer ${lawyer_id}`);
      } else {
        console.warn(`[Socket.io] No active socket for lawyer user ${lawyer_id}`);
      }
    });

    // Lawyer accepts the call request
    socket.on('accept-call', (data) => {
      const { booking_id, citizen_id } = data;
      const citizenSocket = Array.from(userSockets.entries()).find(
        ([_, userId]) => userId === citizen_id
      );

      if (citizenSocket) {
        io.to(citizenSocket[0]).emit('call-accepted', {
          booking_id,
          message: 'Lawyer accepted your call request',
        });
        console.log(`[Socket.io] Call accepted for booking ${booking_id}`);
      }
    });

    // Lawyer rejects the call request
    socket.on('reject-call', (data) => {
      const { booking_id, citizen_id } = data;
      const citizenSocket = Array.from(userSockets.entries()).find(
        ([_, userId]) => userId === citizen_id
      );

      if (citizenSocket) {
        io.to(citizenSocket[0]).emit('call-rejected', {
          booking_id,
          message: 'Lawyer declined your call request',
        });
        console.log(`[Socket.io] Call rejected for booking ${booking_id}`);
      }
    });

    // Lawyer schedules call time
    socket.on('schedule-call', (data) => {
      const { booking_id, citizen_id, scheduled_time, webrtc_room_id } = data;
      const citizenSocket = Array.from(userSockets.entries()).find(
        ([_, userId]) => userId === citizen_id
      );

      if (citizenSocket) {
        io.to(citizenSocket[0]).emit('call-scheduled', {
          booking_id,
          scheduled_time,
          webrtc_room_id,
          message: 'Your video call has been scheduled',
        });
        console.log(`[Socket.io] Call scheduled for ${scheduled_time}, room: ${webrtc_room_id}`);
      }
    });

    // WebRTC signaling: client sending offer
    socket.on('webrtc-offer', (data) => {
      const { roomId, offer, from_user_id } = data;
      const room = io.of('/').adapter.rooms.get(roomId);
      const otherUser = Array.from(room || []).find((sid) => sid !== socket.id);

      if (otherUser) {
        io.to(otherUser).emit('webrtc-offer', { offer, from: socket.id });
        console.log(`[Socket.io] WebRTC offer sent from ${from_user_id} in room ${roomId}`);
      }
    });

    // WebRTC signaling: peer sending answer
    socket.on('webrtc-answer', (data) => {
      const { roomId, answer, from_user_id } = data;
      const room = io.of('/').adapter.rooms.get(roomId);
      const otherUser = Array.from(room || []).find((sid) => sid !== socket.id);

      if (otherUser) {
        io.to(otherUser).emit('webrtc-answer', { answer, from: socket.id });
        console.log(`[Socket.io] WebRTC answer sent from ${from_user_id} in room ${roomId}`);
      }
    });

    // WebRTC signaling: ICE candidates
    socket.on('webrtc-ice-candidate', (data) => {
      const { roomId, candidate, from_user_id } = data;
      const room = io.of('/').adapter.rooms.get(roomId);
      const otherUser = Array.from(room || []).find((sid) => sid !== socket.id);

      if (otherUser) {
        io.to(otherUser).emit('webrtc-ice-candidate', { candidate, from: socket.id });
      }
    });

    // Join WebRTC room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      const roomSize = io.of('/').adapter.rooms.get(roomId)?.size || 0;
      socket.broadcast.to(roomId).emit('user-joined-room', {
        userId: socket.userId,
        roomSize,
      });
      console.log(`[Socket.io] User joined room ${roomId}, total: ${roomSize}`);
    });

    // Leave WebRTC room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit('user-left-room', { userId: socket.userId });
      console.log(`[Socket.io] User left room ${roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      userSockets.delete(socket.id);
      socket.broadcast.emit('user-offline', userId);
      console.log(`[Socket.io] User disconnected: ${socket.id}, userId: ${userId}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`[Socket.io] Error: ${error}`);
    });
  });

  return io;
};

export default initializeSocket;
