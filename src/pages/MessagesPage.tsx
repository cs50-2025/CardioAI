import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Search, Phone, Video, Info, MoreVertical, MessageSquare, Mic, Square, Play, Activity, Heart, Droplets, X } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const { messages, setMessages, sendMessage } = useSocket(user?.id);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [input, setInput] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          sendMessage(selectedContact.id, `AUDIO:${base64data}`);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("Microphone access required for voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] glass rounded-3xl overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/30">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-display font-bold mb-4">{t('messages')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-muted/30 border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-blue/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-muted/30 ${
                selectedContact?.id === contact.id ? 'bg-muted/50 border-l-4 border-l-neon-blue' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center font-bold text-neon-blue border border-border">
                {contact.name[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold truncate">{contact.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                  {contact.role === 'doctor' ? 'Specialist' : `Patient • ${contact.id}`}
                </p>
              </div>
              <div className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center font-bold text-neon-blue border border-border">
                  {selectedContact.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{selectedContact.name}</h3>
                  <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedContact.role !== 'doctor' && (
                  <button 
                    onClick={() => setShowAbout(true)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-all"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                )}
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
                      ? 'bg-neon-blue text-primary-foreground font-medium rounded-tr-none' 
                      : 'bg-muted/30 border border-border text-foreground rounded-tl-none'
                  }`}>
                    {msg.content.startsWith('AUDIO:') ? (
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${msg.sender_id === user?.id ? 'bg-muted' : 'bg-neon-blue/20'}`}>
                          <Mic className={`w-4 h-4 ${msg.sender_id === user?.id ? 'text-primary-foreground' : 'text-neon-blue'}`} />
                        </div>
                        <audio controls className="h-8 w-48 filter invert brightness-100 contrast-100" src={msg.content.replace('AUDIO:', '')} />
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <p className={`text-[9px] mt-1 uppercase tracking-widest ${
                      msg.sender_id === user?.id ? 'text-primary-foreground/40' : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <form onSubmit={handleSend}>
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isRecording ? `Recording... ${recordingTime}s` : "Type a message..."}
                      disabled={isRecording}
                      className="w-full bg-muted/50 border border-border rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-neon-blue/50 transition-all disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || isRecording}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-neon-blue text-primary-foreground rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
                
                <button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`p-4 rounded-2xl transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-foreground animate-pulse' 
                      : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>
              {isRecording && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2 text-center animate-pulse">
                  Release to send voice message
                </p>
              )}
            </div>

            {/* About Modal */}
            <AnimatePresence>
              {showAbout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAbout(false)}
                    className="absolute inset-0 bg-background/90 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-md glass p-8 rounded-[32px]"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-display font-bold">About Patient</h3>
                      <button onClick={() => setShowAbout(false)} className="p-2 text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
                        <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center">
                          <User className="text-neon-blue" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Full Name</p>
                          <p className="font-bold">{selectedContact.name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Age</p>
                          <p className="text-xl font-bold">{selectedContact.age || '45'}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Difficulty</p>
                          <p className="text-xl font-bold text-neon-purple">{selectedContact.difficulty || 'Medium'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest ml-1">Latest Vitals</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                            <Heart className="w-4 h-4 text-red-400" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-bold">HR</p>
                              <p className="text-sm font-bold">{selectedContact.heart_rate || '72'} BPM</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                            <Activity className="w-4 h-4 text-neon-blue" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-bold">BP</p>
                              <p className="text-sm font-bold">{selectedContact.blood_pressure || '120/80'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                            <Droplets className="w-4 h-4 text-neon-green" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-bold">SPO2</p>
                              <p className="text-sm font-bold">{selectedContact.spo2 || '98'}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50">
            <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-display font-bold text-xl">Select a contact to start messaging</p>
            <p className="text-sm mt-2">Secure, end-to-end encrypted communication</p>
          </div>
        )}
      </div>
    </div>
  );
}
