import { useEffect, useRef, useState } from 'react';

export function useSocket(userId: string | undefined) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', userId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message' || data.type === 'message_sent') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'notification') {
        setNotifications((prev) => [data.notification, ...prev]);
      }
    };

    return () => {
      socket.close();
    };
  }, [userId]);

  const sendMessage = (receiverId: string, content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'message', receiverId, content }));
    }
  };

  return { messages, setMessages, sendMessage, notifications };
}
