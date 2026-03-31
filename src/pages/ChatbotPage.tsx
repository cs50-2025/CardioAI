import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatWithAI } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, Heart, Zap, Coffee, Wind, ChevronRight } from 'lucide-react';

const ASSISTANTS = [
  {
    id: 'cardiologist',
    name: 'Dr. Pulse',
    role: 'Cardiologist',
    icon: Heart,
    color: 'text-neon-blue',
    bg: 'bg-neon-blue/10',
    instruction: 'You are Dr. Pulse, a world-class cardiologist. You are professional, detailed, and data-driven. You use medical terminology but explain it clearly. You focus on heart health, vitals, and long-term cardiac care.'
  },
  {
    id: 'fitness',
    name: 'Coach Flex',
    role: 'Fitness Expert',
    icon: Zap,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    instruction: 'You are Coach Flex, a high-energy fitness expert specializing in cardiac rehab. You are motivational, encouraging, and focused on safe movement. You provide exercise tips and keep the user excited about their activity goals.'
  },
  {
    id: 'wellness',
    name: 'Zen',
    role: 'Wellness Guide',
    icon: Wind,
    color: 'text-neon-purple',
    bg: 'bg-neon-purple/10',
    instruction: 'You are Zen, a calm and empathetic wellness guide. You focus on stress management, breathing exercises, and mental health. You speak softly and use soothing language to help the user stay relaxed.'
  },
  {
    id: 'nutrition',
    name: 'Chef Hearty',
    role: 'Nutritionist',
    icon: Coffee,
    color: 'text-neon-pink',
    bg: 'bg-neon-pink/10',
    instruction: 'You are Chef Hearty, a nutritionist who loves heart-healthy cooking. You provide delicious, low-sodium, and heart-friendly recipes and dietary advice. You are friendly and practical about food choices.'
  }
];

export default function ChatbotPage() {
  const { user } = useAuth();
  const [selectedAssistant, setSelectedAssistant] = useState(() => {
    const saved = localStorage.getItem('selected_assistant');
    return ASSISTANTS.find(a => a.id === saved) || ASSISTANTS[0];
  });

  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, assistantId?: string }[]>(() => {
    const saved = localStorage.getItem(`chatbot_history_${user?.id}`);
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: `Hello ${user?.name}! I'm ${ASSISTANTS[0].name}, your ${ASSISTANTS[0].role}. How can I help you today?`, assistantId: ASSISTANTS[0].id }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`chatbot_history_${user?.id}`, JSON.stringify(messages));
    localStorage.setItem('selected_assistant', selectedAssistant.id);
  }, [messages, selectedAssistant, user]);
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
    const aiResponse = await chatWithAI(userMsg, context, selectedAssistant.instruction);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse || "I'm sorry, I couldn't process that.", assistantId: selectedAssistant.id }]);
    setLoading(false);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your chat history?')) {
      setMessages([{ 
        role: 'ai', 
        content: `Hello ${user?.name}! I'm ${selectedAssistant.name}, your ${selectedAssistant.role}. How can I help you today?`,
        assistantId: selectedAssistant.id
      }]);
    }
  };

  return (
    <div className="flex gap-8 h-[calc(100vh-120px)] max-w-6xl mx-auto">
      {/* Assistant Selection Sidebar */}
      <div className="w-72 space-y-4">
        <div className="glass p-6 rounded-3xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Your AI Companions</h3>
          <div className="space-y-3">
            {ASSISTANTS.map((assistant) => (
              <button
                key={assistant.id}
                onClick={() => {
                  setSelectedAssistant(assistant);
                  if (messages.length === 1 && messages[0].role === 'ai') {
                    setMessages([{ 
                      role: 'ai', 
                      content: `Hello ${user?.name}! I'm ${assistant.name}, your ${assistant.role}. How can I help you today?`,
                      assistantId: assistant.id
                    }]);
                  }
                }}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                  selectedAssistant.id === assistant.id 
                    ? `glass border-border bg-muted/50` 
                    : 'border-transparent hover:bg-muted/30'
                }`}
              >
                <div className={`p-2 rounded-xl ${assistant.bg}`}>
                  <assistant.icon className={`w-5 h-5 ${assistant.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{assistant.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{assistant.role}</p>
                </div>
                {selectedAssistant.id === assistant.id && (
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/50" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={clearHistory}
          className="w-full p-4 glass rounded-2xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-red-400 hover:border-red-400/20 transition-all"
        >
          Clear History
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${selectedAssistant.bg} rounded-xl`}>
              <selectedAssistant.icon className={`w-6 h-6 ${selectedAssistant.color}`} />
            </div>
            <div>
              <h2 className="font-display font-bold">{selectedAssistant.name}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {selectedAssistant.role} • Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">
            <Sparkles className="w-3 h-3" /> Powered by Gemini
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.map((msg, i) => {
            const msgAssistant = ASSISTANTS.find(a => a.id === msg.assistantId) || selectedAssistant;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${
                  msg.role === 'user' 
                    ? 'bg-neon-blue text-primary-foreground font-medium rounded-tr-none' 
                    : 'bg-muted/30 border border-border text-foreground rounded-tl-none'
                }`}>
                  {msg.role === 'ai' && (
                    <div className={`p-2 rounded-lg ${msgAssistant.bg} h-fit mt-1`}>
                      <msgAssistant.icon className={`w-4 h-4 ${msgAssistant.color}`} />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.role === 'user' && <User className="w-5 h-5 shrink-0 mt-1 opacity-50" />}
                </div>
              </motion.div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-6 bg-muted/30 border-t border-border">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${selectedAssistant.name} anything...`}
              className="w-full bg-muted/30 border border-border rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-neon-blue/50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 ${selectedAssistant.bg.replace('/10', '')} text-primary-foreground rounded-xl hover:scale-105 transition-transform disabled:opacity-50`}
              style={{ backgroundColor: selectedAssistant.id === 'cardiologist' ? '#00f2ff' : selectedAssistant.id === 'fitness' ? '#39ff14' : selectedAssistant.id === 'wellness' ? '#bc13fe' : '#ff00bd' }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-muted-foreground/50 uppercase tracking-widest">
            AI can make mistakes. Consult a doctor for medical advice.
          </p>
        </form>
      </div>
    </div>
  );
}
