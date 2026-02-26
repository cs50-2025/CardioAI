import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, Play, Pause, RotateCcw, 
  CheckCircle2, Loader2, Sparkles,
  ArrowRight, Heart, Camera
} from 'lucide-react';

export default function MeditationPage() {
  const { user } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const [status, setStatus] = useState<'idle' | 'active' | 'completed'>('idle');
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-out'>('inhale');
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('meditation_progress');
    return saved ? parseInt(saved, 10) : 300;
  });

  useEffect(() => {
    localStorage.setItem('meditation_progress', timeLeft.toString());
  }, [timeLeft]);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let timer: any;
    let phaseTimer: any;

    if (status === 'active') {
      startRecording();
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeMeditation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const cyclePhases = () => {
        setPhase('inhale');
        phaseTimer = setTimeout(() => {
          setPhase('hold');
          phaseTimer = setTimeout(() => {
            setPhase('exhale');
            phaseTimer = setTimeout(() => {
              setPhase('hold-out');
              phaseTimer = setTimeout(cyclePhases, 4000);
            }, 4000);
          }, 4000);
        }, 4000);
      };
      cyclePhases();
    }

    return () => {
      clearInterval(timer);
      clearTimeout(phaseTimer);
    };
  }, [status]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const completeMeditation = async () => {
    setStatus('completed');
    setLoading(true);
    localStorage.removeItem('meditation_progress');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setTimeout(async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        try {
          await fetch('/api/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: user?.id,
              type: 'Meditation',
              videoUrl: base64data
            })
          });
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
    }, 500);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-160px)] relative">
      {/* Background Glow */}
      <div className={`absolute inset-0 transition-all duration-1000 blur-[120px] rounded-full opacity-20 ${
        phase === 'inhale' ? 'bg-neon-blue' : phase === 'exhale' ? 'bg-neon-purple' : 'bg-white'
      }`} />

      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl font-display font-bold mb-2">Mindful <span className="text-neon-blue">Breathing</span></h1>
        <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold">AI-Guided Cardiovascular Relaxation</p>
      </div>

      {/* Video Preview */}
      <div className="absolute top-4 right-4 w-48 aspect-video glass rounded-2xl overflow-hidden z-20 border-neon-blue/30 shadow-lg">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover mirror" />
        {status === 'active' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-bold text-white uppercase">Rec</span>
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-center w-80 h-80 mb-16 z-10">
        {/* Breathing Circle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ scale: phase === 'inhale' ? 0.8 : 1.2, opacity: 0.3 }}
            animate={{ 
              scale: phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.8 : phase === 'hold' ? 1.2 : 0.8,
              opacity: 1
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-full border-2 ${
              phase === 'inhale' ? 'border-neon-blue shadow-[0_0_50px_rgba(0,242,255,0.3)]' : 
              phase === 'exhale' ? 'border-neon-purple shadow-[0_0_50px_rgba(188,19,254,0.3)]' : 
              'border-white/20'
            }`}
          />
        </AnimatePresence>

        <div className="text-center">
          <motion.p 
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-display font-bold uppercase tracking-widest mb-2"
          >
            {status === 'active' ? phase.replace('-', ' ') : 'Ready?'}
          </motion.p>
          <p className="text-4xl font-mono font-bold text-white/60">{formatTime(timeLeft)}</p>
        </div>
      </div>

      <div className="flex gap-6 relative z-10">
        {status === 'idle' ? (
          <button 
            onClick={() => setStatus('active')}
            className="bg-neon-blue text-black font-bold px-12 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,242,255,0.3)]"
          >
            <Play className="w-5 h-5 fill-current" />
            Begin Session
          </button>
        ) : status === 'active' ? (
          <button 
            onClick={() => setStatus('idle')}
            className="glass px-12 py-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all"
          >
            <Pause className="w-5 h-5 fill-current" />
            Pause
          </button>
        ) : null}
      </div>

      <div className="mt-16 grid grid-cols-3 gap-8 w-full max-w-2xl relative z-10">
        {[
          { label: 'Heart Rate', value: '68 bpm', icon: Heart, color: 'text-red-400' },
          { label: 'Stress Level', value: 'Low', icon: Sparkles, color: 'text-neon-blue' },
          { label: 'Session', value: '5:00', icon: Wind, color: 'text-neon-green' },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-sm font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {status === 'completed' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md glass p-10 rounded-[40px] text-center"
            >
              <div className="w-24 h-24 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-neon-green/30">
                <CheckCircle2 className="w-12 h-12 text-neon-green" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">Session Complete</h2>
              <p className="text-white/40 mb-8">Your cardiovascular system is now more relaxed. Great job!</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-neon-blue text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                >
                  Back to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
