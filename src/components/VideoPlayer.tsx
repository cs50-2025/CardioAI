import { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, FastForward, Rewind, 
  Maximize, Volume2, Settings, SkipBack, SkipForward
} from 'lucide-react';

export default function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (src) {
      let url = src;
      // If it's a base64 data URL, convert to blob for better performance
      if (src.startsWith('data:')) {
        try {
          const parts = src.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'video/webm';
          const b64Data = parts[1];
          
          const byteCharacters = atob(b64Data);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          const blob = new Blob(byteArrays, { type: mime });
          url = URL.createObjectURL(blob);
          setObjectUrl(url);
        } catch (e) {
          console.error("Failed to convert base64 to blob", e);
        }
      } else {
        setObjectUrl(src);
      }

      if (videoRef.current) {
        videoRef.current.load();
      }
      setIsPlaying(false);
      setProgress(0);

      return () => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      };
    }
  }, [src]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Playback failed:", err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const seek = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };

  return (
    <div className="relative group glass rounded-2xl overflow-hidden bg-black">
      {objectUrl ? (
        <video 
          key={objectUrl}
          ref={videoRef}
          src={objectUrl}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          playsInline
        />
      ) : (
        <div className="w-full aspect-video flex items-center justify-center text-white/20">
          <Settings className="w-8 h-8 animate-spin" />
        </div>
      )}
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer relative">
          <div 
            className="absolute inset-y-0 left-0 bg-neon-blue rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => seek(-10)} className="text-white/60 hover:text-white transition-all">
              <Rewind className="w-5 h-5" />
            </button>
            <button onClick={togglePlay} className="p-2 bg-neon-blue text-black rounded-full hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button onClick={() => seek(10)} className="text-white/60 hover:text-white transition-all">
              <FastForward className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 ml-4">
              {[0.5, 1, 1.5, 2].map(speed => (
                <button 
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  className={`text-[10px] font-bold px-2 py-1 rounded border ${
                    playbackRate === speed ? 'bg-neon-blue border-neon-blue text-black' : 'border-white/20 text-white/60'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Volume2 className="w-5 h-5 text-white/60" />
            <Maximize className="w-5 h-5 text-white/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
