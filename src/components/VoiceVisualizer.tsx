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
      
      ctx.clearRect(0, 0, width, height);
      
      if (isRecording || isPlaying) {
        const bars = 64;
        const barWidth = width / bars;
        const centerY = height / 2;
        
        for (let i = 0; i < bars; i++) {
          const normalizedIndex = i / bars;
          const frequency = Math.sin(normalizedIndex * Math.PI * 4 + Date.now() * 0.01);
          const baseHeight = (Math.random() * 0.6 + 0.4) * height * (audioLevel * 1.5 + 0.2);
          const barHeight = baseHeight * (1 + frequency * 0.3);
          
          const x = i * barWidth;
          const y = centerY - barHeight / 2;
          
          // Create gradient based on state
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          if (isRecording) {
            gradient.addColorStop(0, '#EF4444');
            gradient.addColorStop(0.5, '#F87171');
            gradient.addColorStop(1, '#DC2626');
          } else {
            gradient.addColorStop(0, '#0067D2');
            gradient.addColorStop(0.5, '#3B82F6');
            gradient.addColorStop(1, '#8B5CF6');
          }
          
          ctx.fillStyle = gradient;
          ctx.shadowColor = isRecording ? '#EF4444' : '#0067D2';
          ctx.shadowBlur = 10;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
          
          // Add glow effect
          ctx.shadowBlur = 0;
        }
      } else {
        // Idle state - subtle ambient visualization
        const bars = 32;
        const barWidth = width / bars;
        const centerY = height / 2;
        
        for (let i = 0; i < bars; i++) {
          const normalizedIndex = i / bars;
          const wave = Math.sin(normalizedIndex * Math.PI * 2 + Date.now() * 0.002);
          const barHeight = (wave * 0.1 + 0.1) * height;
          
          const x = i * barWidth;
          const y = centerY - barHeight / 2;
          
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(0, 103, 210, 0.3)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.3)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
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
        width={600}
        height={80}
        className="w-full h-20 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10"
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0067D2]/10 to-purple-500/10 pointer-events-none"></div>
    </div>
  );
};