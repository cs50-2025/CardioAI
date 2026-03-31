import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Play, Pause, RotateCcw, Camera, Video, 
  CheckCircle2, AlertCircle, Loader2, Trophy,
  ArrowRight, Timer, Activity, Brain
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
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
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
  const [aiFeedback, setAiFeedback] = useState("The AI will monitor your movements and provide real-time corrections during the workout.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastAnalysisTimeRef = useRef(0);

  const exercises = EXERCISES[user?.difficulty as keyof typeof EXERCISES] || EXERCISES.Medium;
  const currentExercise = exercises[currentExerciseIdx];

  useEffect(() => {
    let timer: any;
    if (status === 'active' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (status === 'active' && timeLeft === 0) {
      if (currentExerciseIdx < exercises.length - 1) {
        setStatus('break');
        setTimeLeft(10);
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

  useEffect(() => {
    let analysisInterval: any;
    if (status === 'active') {
      analysisInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastAnalysisTimeRef.current > 5000 && !isAnalyzing) {
          analyzeForm();
        }
      }, 1000);
    }
    return () => clearInterval(analysisInterval);
  }, [status, isAnalyzing]);

  const analyzeForm = async () => {
    if (!canvasRef.current || !videoRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    lastAnalysisTimeRef.current = Date.now();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: `You are a professional fitness coach. Analyze the person's form in this image for the exercise: ${currentExercise.name}. 
            Provide a short, encouraging correction or feedback (max 15 words). 
            If their form looks good, say something positive. 
            Focus on safety and effectiveness for someone with cardiovascular concerns.` }
          ]
        }
      });

      if (response.text) {
        setAiFeedback(response.text.trim());
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      // Setup Canvas Recording
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      if (typeof (canvas as any).captureStream !== 'function') {
        throw new Error("Video recording is not supported in this browser.");
      }
      
      const drawFrame = () => {
        if (!isRunningRef.current || !ctx || !videoRef.current) return;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const currentStatus = statusRef.current;

        if (currentStatus === 'break') {
          // Draw REST TIME
          ctx.fillStyle = '#00f2ff';
          ctx.font = 'bold 120px "Space Grotesk", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('REST TIME', canvas.width / 2, canvas.height / 2);
        } else if (videoRef.current && videoRef.current.readyState >= 2) {
          // Draw Video
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        
        requestRef.current = requestAnimationFrame(drawFrame);
      };
      
      isRunningRef.current = true;
      requestRef.current = requestAnimationFrame(drawFrame);

      const canvasStream = (canvas as any).captureStream(30);
      // Add audio from original stream
      stream.getAudioTracks().forEach(track => {
        try {
          canvasStream.addTrack(track);
        } catch (e) {
          console.warn("Could not add audio track to recording", e);
        }
      });

      if (typeof window.MediaRecorder === 'undefined') {
        throw new Error("MediaRecorder is not supported in this browser.");
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Fallback to browser default
          }
        }
      }

      const recorder = new MediaRecorder(canvasStream, mimeType ? { mimeType } : {});
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;

      setStatus('preparing');
      setTimeLeft(5);
      const prepTimer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(prepTimer);
            setStatus('active');
            setTimeLeft(exercises[0].duration);
            setIsRecording(true);
            try {
              if (recorder.state === 'inactive') {
                recorder.start();
              }
            } catch (e) {
              console.error("Failed to start recorder:", e);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Workout start error:", err);
      alert(err.message || "Camera access required for AI guidance.");
    }
  };

  const completeWorkout = async () => {
    isRunningRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Failed to stop recorder:", e);
      }
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
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

    // Wait for recorder to stop and get blobs
    setTimeout(async () => {
      // Convert blobs to data URL for demo purposes
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          await fetch('/api/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: user?.id,
              type: 'Fitness',
              videoUrl: base64data
            })
          });
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      if (chunksRef.current.length > 0) {
        reader.readAsDataURL(blob);
      } else {
        // Fallback if no blobs recorded
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Live <span className="text-neon-blue">Fitness</span></h1>
          <p className="text-muted-foreground text-sm mt-1">AI-guided cardiovascular training • {user?.difficulty} Level</p>
        </div>
        {status === 'idle' ? (
          <button 
            onClick={startWorkout}
            className="bg-neon-blue text-primary-foreground font-bold px-8 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,242,255,0.3)]"
          >
            <Play className="w-5 h-5 fill-current" />
            {t('startWorkout')}
          </button>
        ) : status !== 'completed' && (
          <button 
            onClick={completeWorkout}
            className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-red-500/30 transition-all"
          >
            <Pause className="w-5 h-5" />
            Finish Session
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera View */}
        <div className="lg:col-span-2 relative aspect-video glass rounded-3xl overflow-hidden bg-muted/50">
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
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Exercise</p>
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
                className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
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
                <p className="text-sm font-medium text-muted-foreground">Next: {exercises[currentExerciseIdx + 1]?.name}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!streamRef.current && status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50">
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
                      ? 'bg-muted/30 border-border/50 opacity-40'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                    <p className="text-sm font-bold">{ex.name}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{ex.duration}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-l-4 border-l-neon-purple">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-neon-purple" />
                AI Feedback
              </h3>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-neon-purple uppercase tracking-widest">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing...
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed min-h-[3em]">
              {aiFeedback}
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
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
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
              <p className="text-muted-foreground mb-8">Your performance has been recorded and sent to your doctor for review.</p>
              
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                  <span className="text-sm text-muted-foreground font-bold uppercase">Status</span>
                  <span className="text-sm font-bold text-neon-green flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {loading ? 'Uploading...' : 'Uploaded'}
                  </span>
                </div>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-neon-blue text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
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
