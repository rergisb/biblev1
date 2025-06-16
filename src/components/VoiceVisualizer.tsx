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
        const bars = 32;
        const barWidth = width / bars;
        
        for (let i = 0; i < bars; i++) {
          const barHeight = (Math.random() * 0.5 + 0.5) * height * (audioLevel * 2 + 0.1);
          const x = i * barWidth;
          const y = (height - barHeight) / 2;
          
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          if (isRecording) {
            gradient.addColorStop(0, '#EF4444');
            gradient.addColorStop(1, '#DC2626');
          } else {
            gradient.addColorStop(0, '#8B5CF6');
            gradient.addColorStop(1, '#7C3AED');
          }
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
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
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-15 rounded-lg"
    />
  );
};