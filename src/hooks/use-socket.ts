'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';

const SOCKET_PORT = 3003;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAppStore();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const socket = io('/?XTransformPort=' + SOCKET_PORT, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user:online', user.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('users:online', (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.emit('user:offline', user.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const sendMessage = useCallback((data: {
    senderId: string;
    receiverId: string;
    content: string;
    attachment?: string;
  }) => {
    socketRef.current?.emit('message:send', data);
  }, []);

  const onMessageReceived = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('message:receive', callback);
    return () => {
      socketRef.current?.off('message:receive', callback);
    };
  }, []);

  const onMessageSent = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('message:sent', callback);
    return () => {
      socketRef.current?.off('message:sent', callback);
    };
  }, []);

  const startTyping = useCallback((senderId: string, receiverId: string) => {
    socketRef.current?.emit('typing:start', { senderId, receiverId });
  }, []);

  const stopTyping = useCallback((senderId: string, receiverId: string) => {
    socketRef.current?.emit('typing:stop', { senderId, receiverId });
  }, []);

  const onTypingIncoming = useCallback((callback: (data: { senderId: string }) => void) => {
    socketRef.current?.on('typing:incoming', callback);
    return () => {
      socketRef.current?.off('typing:incoming', callback);
    };
  }, []);

  const onTypingStopped = useCallback((callback: (data: { senderId: string }) => void) => {
    socketRef.current?.on('typing:stopped', callback);
    return () => {
      socketRef.current?.off('typing:stopped', callback);
    };
  }, []);

  const onNotification = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('notification:new', callback);
    return () => {
      socketRef.current?.off('notification:new', callback);
    };
  }, []);

  return {
    isConnected,
    onlineUsers,
    sendMessage,
    onMessageReceived,
    onMessageSent,
    startTyping,
    stopTyping,
    onTypingIncoming,
    onTypingStopped,
    onNotification,
  };
}
