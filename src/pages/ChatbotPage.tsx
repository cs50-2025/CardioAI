import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatWithAI } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>(() => {
    const saved = localStorage.getItem('chatbot_history');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: `Hello ${user?.name}! I'm your CardioAI assistant. How can I help you today?` }
    ];
  });

  useEffect(() => {
    localStorage.setItem('chatbot_history', JSON.stringify(messages));
  }, [messages]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const context = `User is a ${user?.role}. Name: ${user?.name}. ${user?.role === 'patient' ? `Health stats: HR ${user.heart_rate}, BP ${user.blood_pressure}, SPO2 ${user.spo2}` : ''}`;
    const aiResponse = await chatWithAI(userMsg, context);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse || "I'm sorry, I couldn't process that." }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto glass rounded-3xl overflow-hidden">
      <div className="p-6 border-bottom border-white/10 flex items-center gap-3 bg-white/5">
        <div className="p-2 bg-neon-blue/20 rounded-xl">
          <Bot className="w-6 h-6 text-neon-blue" />
        </div>
        <div>
          <h2 className="font-display font-bold">CardioAI Assistant</h2>
          <p className="text-xs text-white/40 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Powered by Gemini AI
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${
              msg.role === 'user' 
                ? 'bg-neon-blue text-black font-medium' 
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              {msg.role === 'ai' && <Bot className="w-5 h-5 shrink-0 mt-1 opacity-50" />}
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.role === 'user' && <User className="w-5 h-5 shrink-0 mt-1 opacity-50" />}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white/5 border-t border-white/10">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cardiovascular health..."
            className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-neon-blue/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-neon-blue text-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-3 text-white/20 uppercase tracking-widest">
          AI can make mistakes. Consult a doctor for medical advice.
        </p>
      </form>
    </div>
  );
}
