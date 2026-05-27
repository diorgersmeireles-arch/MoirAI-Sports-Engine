// MADev Core - Renderizador de Alta Performance utilizando HTML5 Canvas
// Renderiza em tempo real os atletas (25 FPS) com base em coordenadas espaciais
'use client';
import React, { useRef, useEffect } from 'react';
import { useLiveMatchStore } from '../../store/useLiveMatchStore';

export const SpatialPitchRender: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { spatialCoordinates } = useLiveMatchStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const player of spatialCoordinates.players) {
      ctx.beginPath();
      ctx.arc(player.xPos * canvas.width, player.yPos * canvas.height, 6, 0, 2 * Math.PI);
      ctx.fillStyle = player.teamSide === 'home' ? '#1d4ed8' : '#b91c1c';
      ctx.fill();

      if (player.shirtNumber) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(player.shirtNumber), player.xPos * canvas.width, player.yPos * canvas.height + 2.5);
      }

      ctx.closePath();
    }

    if (spatialCoordinates.ball) {
      const ball = spatialCoordinates.ball;
      ctx.beginPath();
      const zOffset = (ball.zPos ?? 0) * 2;
      ctx.arc(ball.xPos * canvas.width, ball.yPos * canvas.height, 4 + zOffset, 0, 2 * Math.PI);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.closePath();
    }
  }, [spatialCoordinates]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      className="rounded-lg shadow-2xl border border-slate-800"
    />
  );
};
