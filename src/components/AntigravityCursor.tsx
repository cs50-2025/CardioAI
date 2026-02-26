import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export default function AntigravityCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 20, stiffness: 250, mass: 0.5 };
  const ringConfig = { damping: 15, stiffness: 100, mass: 1 };

  const dotX = useSpring(cursorX, springConfig);
  const dotY = useSpring(cursorY, springConfig);
  
  const ringX = useSpring(cursorX, ringConfig);
  const ringY = useSpring(cursorY, ringConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsHovering(!!isInteractive);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (typeof window === 'undefined') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Main Dot */}
      <motion.div
        className="fixed w-2 h-2 bg-neon-blue rounded-full"
        animate={{
          scale: isHovering ? 0.5 : 1,
        }}
        style={{
          left: dotX,
          top: dotY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
      />
      
      {/* Outer Ring */}
      <motion.div
        className="fixed w-8 h-8 border border-neon-blue/50 rounded-full"
        animate={{
          scale: isHovering ? 1.5 : 1,
          borderColor: isHovering ? 'rgba(0, 242, 255, 1)' : 'rgba(0, 242, 255, 0.5)',
          backgroundColor: isHovering ? 'rgba(0, 242, 255, 0.1)' : 'transparent',
        }}
        style={{
          left: ringX,
          top: ringY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 0.5 : 0,
        }}
      />

      {/* Trailing Particles (Antigravity effect) */}
      {[...Array(3)].map((_, i) => (
        <TrailingParticle 
          key={i} 
          x={cursorX} 
          y={cursorY} 
          delay={i * 0.1} 
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}

function TrailingParticle({ x, y, delay, isVisible }: { x: any, y: any, delay: number, isVisible: boolean }) {
  const springX = useSpring(x, { damping: 10 + delay * 20, stiffness: 50 + delay * 50 });
  const springY = useSpring(y, { damping: 10 + delay * 20, stiffness: 50 + delay * 50 });

  return (
    <motion.div
      className="fixed w-1 h-1 bg-neon-purple/30 rounded-full"
      style={{
        left: springX,
        top: springY,
        translateX: '-50%',
        translateY: '-50%',
        opacity: isVisible ? 0.3 : 0,
      }}
    />
  );
}
