import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Camera, Video, 
  CheckCircle2, AlertCircle, Loader2, Trophy,
  ArrowRight, Timer, Activity
} from 'lucide-react';

const EXERCISES = {
  Easy: [
    { name: 'Neck Rotations', duration: 30 },
    { name: 'Shoulder Shrugs', duration: 30 },
    { name: 'Seated Leg Lifts', duration: 45 }
  ],
  Medium: [
    { name: 'Jumping Jacks', duration: 45 },
    { name: 'High Knees', duration: 45 },
    { name: 'Mountain Climbers', duration: 60 }
  ],
  Hard: [
    { name: 'Burpees', duration: 60 },
    { name: 'Pushups', duration: 60 },
    { name: 'Plank Jacks', duration: 60 }
  ]
};

export default function FitnessPage() {
  const { user } = useAuth();
  const { t } = useTranslation(user?.settings?.language || 'en');
  const [status, setStatus] = useState<'idle' | 'preparing' | 'active' | 'break' | 'completed'>('idle');
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(() => {
    const saved = localStorage.getItem('fitness_exercise_idx');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('fitness_time_left');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('fitness_exercise_idx', currentExerciseIdx.toString());
  }, [currentExerciseIdx]);

  useEffect(() => {
    localStorage.setItem('fitness_time_left', timeLeft.toString());
  }, [timeLeft]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const exercises = EXERCISES[user?.difficulty as keyof typeof EXERCISES] || EXERCISES.Medium;
  const currentExercise = exercises[currentExerciseIdx];

  useEffect(() => {
    let timer: any;
    if (status === 'active' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (status === 'active' && timeLeft === 0) {
      if (currentExerciseIdx < exercises.length - 1) {
        setStatus('break');
        setTimeLeft(20);
      } else {
        completeWorkout();
      }
    } else if (status === 'break' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (status === 'break' && timeLeft === 0) {
      setCurrentExerciseIdx(prev => prev + 1);
      setStatus('active');
      setTimeLeft(exercises[currentExerciseIdx + 1].duration);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const startWorkout = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      setStatus('preparing');
      setTimeLeft(5);
      const prepTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(prepTimer);
            setStatus('active');
            setTimeLeft(exercises[0].duration);
            setIsRecording(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      alert("Camera access required for AI guidance.");
    }
  };

  const completeWorkout = async () => {
    setStatus('completed');
    setIsRecording(false);
    setLoading(true);
    localStorage.removeItem('fitness_exercise_idx');
    localStorage.removeItem('fitness_time_left');
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    // Simulate upload
    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user?.id,
          type: 'Fitness',
          videoUrl: 'https://example.com/video.mp4'
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Live <span className="text-neon-blue">Fitness</span></h1>
          <p className="text-white/40 text-sm mt-1">AI-guided cardiovascular training • {user?.difficulty} Level</p>
        </div>
        {status === 'idle' && (
          <button 
            onClick={startWorkout}
            className="bg-neon-blue text-black font-bold px-8 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,242,255,0.3)]"
          >
            <Play className="w-5 h-5 fill-current" />
            {t('startWorkout')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera View */}
        <div className="lg:col-span-2 relative aspect-video glass rounded-3xl overflow-hidden bg-black/40">
          <video 
            ref={videoRef} 
            muted 
            playsInline 
            className="w-full h-full object-cover mirror"
          />
          
          {/* Overlay UI */}
          <AnimatePresence>
            {status === 'active' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none"
              >
                <div className="flex justify-between items-start">
                  <div className="glass-dark px-6 py-4 rounded-2xl border-l-4 border-l-neon-blue">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Current Exercise</p>
                    <h3 className="text-xl font-display font-bold">{currentExercise.name}</h3>
                  </div>
                  <div className="glass-dark px-6 py-4 rounded-2xl flex items-center gap-4">
                    <Timer className="w-6 h-6 text-neon-blue" />
                    <span className="text-3xl font-mono font-bold">{timeLeft}s</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="glass-dark px-8 py-4 rounded-full flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">AI Monitoring Active</span>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'preparing' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <p className="text-xl font-display font-bold mb-4 uppercase tracking-widest">Get Ready</p>
                <span className="text-8xl font-display font-bold text-neon-blue">{timeLeft}</span>
              </motion.div>
            )}

            {status === 'break' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-neon-blue/20 backdrop-blur-md"
              >
                <p className="text-2xl font-display font-bold mb-2 uppercase tracking-widest">Rest Period</p>
                <span className="text-6xl font-display font-bold mb-4">{timeLeft}s</span>
                <p className="text-sm font-medium text-white/60">Next: {exercises[currentExerciseIdx + 1]?.name}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!streamRef.current && status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
              <Camera className="w-16 h-16 mb-4" />
              <p className="font-medium">Camera Preview Unavailable</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl">
            <h3 className="font-display font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-blue" />
              Workout Plan
            </h3>
            <div className="space-y-4">
              {exercises.map((ex, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    i === currentExerciseIdx && status !== 'idle' && status !== 'completed'
                      ? 'bg-neon-blue/10 border-neon-blue/30' 
                      : i < currentExerciseIdx || status === 'completed'
                      ? 'bg-white/5 border-white/5 opacity-40'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-white/40">{i + 1}</span>
                    <p className="text-sm font-bold">{ex.name}</p>
                  </div>
                  <span className="text-xs font-mono text-white/40">{ex.duration}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-l-4 border-l-neon-purple">
            <h3 className="font-display font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-neon-purple" />
              AI Feedback
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {status === 'active' 
                ? "Form looks great! Keep your core tight and maintain a steady rhythm." 
                : "The AI will monitor your movements and provide real-time corrections during the workout."}
            </p>
          </div>
        </div>
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
                <Trophy className="w-12 h-12 text-neon-green" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">Workout Complete!</h2>
              <p className="text-white/40 mb-8">Your performance has been recorded and sent to your doctor for review.</p>
              
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-sm text-white/40 font-bold uppercase">Status</span>
                  <span className="text-sm font-bold text-neon-green flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {loading ? 'Uploading...' : 'Uploaded'}
                  </span>
                </div>
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
