import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export default function MouseAura() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const auraX = useSpring(mouseX, springConfig);
  const auraY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 150);
      mouseY.set(e.clientY - 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      style={{
        left: auraX,
        top: auraY,
      }}
      className="fixed w-[300px] h-[300px] rounded-full pointer-events-none z-0 blur-[100px] opacity-50 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"
    />
  );
}
