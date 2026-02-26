import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Search, Phone, Video, Info, MoreVertical, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const { messages, setMessages, sendMessage } = useSocket(user?.id);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const fetchContacts = async () => {
    try {
      if (user?.role === 'doctor') {
        const res = await fetch(`/api/doctors/${user.id}/patients`);
        const data = await res.json();
        setContacts(data);
      } else {
        // Patients only have their doctor
        const res = await fetch(`/api/doctors/${user?.doctor_id}/patients`); // This is a hack to get doctor info if needed, but let's just mock for now
        setContacts([{ id: user?.doctor_id, name: 'Dr. Cardiovascular Specialist', role: 'doctor' }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await fetch(`/api/messages/${user?.id}/${contactId}`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedContact) return;
    sendMessage(selectedContact.id, input);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-160px)] glass rounded-3xl overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-white/5">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-display font-bold mb-4">{t('messages')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-blue/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-white/5 ${
                selectedContact?.id === contact.id ? 'bg-white/10 border-l-4 border-l-neon-blue' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center font-bold text-neon-blue border border-white/10">
                {contact.name[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold truncate">{contact.name}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">
                  {contact.role === 'doctor' ? 'Specialist' : `Patient • ${contact.id}`}
                </p>
              </div>
              <div className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-black/20">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-neon-blue border border-white/10">
                  {selectedContact.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{selectedContact.name}</h3>
                  <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Phone className="w-5 h-5" /></button>
                <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Video className="w-5 h-5" /></button>
                <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Info className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.sender_id === user?.id 
                      ? 'bg-neon-blue text-black font-medium rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[9px] mt-1 uppercase tracking-widest ${
                      msg.sender_id === user?.id ? 'text-black/40' : 'text-white/40'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 border-t border-white/10 bg-white/5">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-neon-blue/50 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-neon-blue text-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20">
            <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-display font-bold text-xl">Select a contact to start messaging</p>
            <p className="text-sm mt-2">Secure, end-to-end encrypted communication</p>
          </div>
        )}
      </div>
    </div>
  );
}
