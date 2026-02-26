import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Video, X, Camera, Loader2, CheckCircle } from 'lucide-react';

interface Medication {
  name: string;
  time: string;
}

interface MedicationReminderModalProps {
  medication: Medication;
  onComplete: (videoUrl: string) => void;
  onClose: () => void;
}

export default function MedicationReminderModal({ medication, onComplete, onClose }: MedicationReminderModalProps) {
  const [step, setStep] = useState<'reminder' | 'recording' | 'uploading' | 'success'>('reminder');
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      setStep('recording');
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera access is required to record medication intake.");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        onComplete(reader.result as string);
        setStep('success');
      };
    };
    recorder.start();
    setRecording(true);
    setTimeout(() => stopRecording(), 5000); // Auto stop after 5s
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setStep('uploading');
    }
  };

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
        className="relative w-full max-w-md glass p-8 rounded-3xl overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {step === 'reminder' && (
            <motion.div 
              key="reminder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto">
                <Pill className="w-10 h-10 text-neon-blue animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Medication Reminder</h2>
                <p className="text-white/60 mt-2">Please take your medication: <span className="text-neon-blue font-bold">{medication.name}</span></p>
              </div>
              <button 
                onClick={startCamera}
                className="w-full bg-neon-blue text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
              >
                <Video className="w-5 h-5" />
                Record Intake
              </button>
            </motion.div>
          )}

          {step === 'recording' && (
            <motion.div 
              key="recording"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
                <video ref={videoRef} muted playsInline className="w-full h-full object-cover mirror" />
                {recording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-red-50 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Recording...</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-white/60 mb-4">Show yourself taking the medication clearly.</p>
                {!recording ? (
                  <button 
                    onClick={startRecording}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Recording
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="w-full bg-white/10 text-white font-bold py-4 rounded-xl"
                  >
                    Stop Recording
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'uploading' && (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 space-y-6"
            >
              <Loader2 className="w-12 h-12 text-neon-blue animate-spin mx-auto" />
              <p className="text-lg font-bold">Uploading to Doctor...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-6"
            >
              <CheckCircle className="w-16 h-16 text-neon-green mx-auto" />
              <div>
                <h3 className="text-xl font-bold">Intake Recorded</h3>
                <p className="text-white/40 mt-2">Your doctor has been notified.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full bg-white/10 text-white font-bold py-4 rounded-xl"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
