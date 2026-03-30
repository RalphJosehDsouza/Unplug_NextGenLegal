import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Connect to Socket.io
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket.io] Connected');
      setIsConnected(true);
      // Register user
      socketRef.current.emit('register-user', user.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[Socket.io] Disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('[Socket.io] Error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};
