import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';

export function useMessages(userId: string | undefined, contactId: string | undefined) {
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Notifications
    const qNotif = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeNotif = onSnapshot(qNotif, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribeNotif();
  }, [userId]);

  useEffect(() => {
    if (!userId || !contactId) return;

    // Messages
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.filter(m => 
        (m.sender_id === userId && m.receiver_id === contactId) || 
        (m.sender_id === contactId && m.receiver_id === userId)
      ));
    });

    return () => unsubscribe();
  }, [userId, contactId]);

  const sendMessage = async (receiverId: string, content: string) => {
    await addDoc(collection(db, 'messages'), {
      sender_id: userId,
      receiver_id: receiverId,
      content,
      timestamp: serverTimestamp(),
      seen: 0
    });
  };

  return { messages, sendMessage, notifications };
}
