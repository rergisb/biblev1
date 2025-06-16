import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  isPlaying: boolean;
  audioLevel?: number;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isRecording,
  isPlaying,
  audioLevel = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.clearRect(0, 0, width, height);
      
      if (isRecording || isPlaying) {
        // Active state - animated circular waves
        const time = Date.now() * 0.003;
        const rings = 5;
        
        for (let i = 0; i < rings; i++) {
          const ringProgress = (i / rings);
          const baseRadius = 40 + (i * 25);
          const waveAmplitude = (audioLevel * 20 + 5) * (1 - ringProgress * 0.3);
          
          // Create wave effect
          const points = 64;
          ctx.beginPath();
          
          for (let j = 0; j <= points; j++) {
            const angle = (j / points) * Math.PI * 2;
            const wave1 = Math.sin(angle * 3 + time + ringProgress * 2) * waveAmplitude * 0.3;
            const wave2 = Math.sin(angle * 5 - time * 1.5 + ringProgress * 3) * waveAmplitude * 0.2;
            const wave3 = Math.sin(angle * 7 + time * 0.8 + ringProgress * 4) * waveAmplitude * 0.1;
            
            const radius = baseRadius + wave1 + wave2 + wave3;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (j === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.closePath();
          
          // Create gradient based on state
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + waveAmplitude);
          
          if (isRecording) {
            gradient.addColorStop(0, `rgba(16, 185, 129, ${0.4 - ringProgress * 0.3})`); // emerald-500
            gradient.addColorStop(0.5, `rgba(5, 150, 105, ${0.3 - ringProgress * 0.2})`); // emerald-600
            gradient.addColorStop(1, `rgba(4, 120, 87, ${0.1 - ringProgress * 0.1})`); // emerald-700
          } else {
            gradient.addColorStop(0, `rgba(20, 184, 166, ${0.4 - ringProgress * 0.3})`); // teal-500
            gradient.addColorStop(0.5, `rgba(13, 148, 136, ${0.3 - ringProgress * 0.2})`); // teal-600
            gradient.addColorStop(1, `rgba(15, 118, 110, ${0.1 - ringProgress * 0.1})`); // teal-700
          }
          
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Add glow effect
          ctx.shadowColor = isRecording ? '#10B981' : '#14B8A6';
          ctx.shadowBlur = 15 - (ringProgress * 10);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // Central pulse
        const pulseRadius = 15 + Math.sin(time * 2) * 5;
        const pulseGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        
        if (isRecording) {
          pulseGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
          pulseGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
          pulseGradient.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
          pulseGradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = pulseGradient;
        ctx.fill();
        
      } else {
        // Idle state - gentle ambient visualization
        const time = Date.now() * 0.001;
        const rings = 3;
        
        for (let i = 0; i < rings; i++) {
          const ringProgress = (i / rings);
          const baseRadius = 60 + (i * 30);
          const opacity = 0.1 - (ringProgress * 0.05);
          
          // Gentle breathing effect
          const breathe = Math.sin(time + ringProgress * 2) * 0.1 + 0.9;
          const radius = baseRadius * breathe;
          
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          gradient.addColorStop(0, `rgba(20, 184, 166, ${opacity * 0.5})`);
          gradient.addColorStop(0.7, `rgba(13, 148, 136, ${opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(15, 118, 110, 0)`);
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        // Subtle center dot
        const dotGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 8);
        dotGradient.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
        dotGradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = dotGradient;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPlaying, audioLevel]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-72 h-72 rounded-full"
        style={{ filter: 'blur(0.5px)' }}
      />
      {/* Additional glow overlay */}
      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
        isRecording 
          ? 'bg-emerald-500/5 shadow-2xl shadow-emerald-500/20' 
          : isPlaying
          ? 'bg-teal-500/5 shadow-2xl shadow-teal-500/20'
          : 'bg-teal-500/2'
      }`}></div>
    </div>
  );
};