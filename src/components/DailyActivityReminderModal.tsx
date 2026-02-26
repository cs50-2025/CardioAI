import { motion } from 'motion/react';
import { Activity, Clock, ArrowRight, CheckCircle } from 'lucide-react';

interface DailyActivityReminderModalProps {
  onSendNow: () => void;
  onRemindLater: () => void;
}

export default function DailyActivityReminderModal({ onSendNow, onRemindLater }: DailyActivityReminderModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md glass p-8 rounded-3xl text-center space-y-8"
      >
        <div className="w-20 h-20 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-10 h-10 text-neon-purple animate-pulse" />
        </div>
        
        <div>
          <h2 className="text-2xl font-display font-bold">Daily Health Goal</h2>
          <p className="text-white/60 mt-2">It's time for your daily fitness and meditation sessions. Consistency is key to heart health!</p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={onSendNow}
            className="w-full bg-neon-blue text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            Send Me Now
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={onRemindLater}
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <Clock className="w-5 h-5" />
            Remind Me Later (10 min)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
