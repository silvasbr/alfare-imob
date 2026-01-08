
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { PropertyData, ImageFitMode, SequenceItem } from '../types';
import { COLORS, FORMAT_DIMENSIONS } from '../constants';

interface Props {
  property: PropertyData;
  isRecording?: boolean;
  onRecordingComplete?: (blob: Blob) => void;
}

export interface VideoReelsHandle {
  restart: () => void;
}

export const VideoReels = forwardRef<VideoReelsHandle, Props>(({ property, isRecording, onRecordingComplete }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameIdRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const animationStartTimeRef = useRef<number>(0);
  
  const assetsRef = useRef<{ 
    sequence: { item: SequenceItem, img: HTMLImageElement }[]
  }>({
    sequence: []
  });

  // Configurações de Tempo
  const PHOTO_DURATION = 4500; 
  const COVER_DURATION = 3500; 
  const CLOSING_DURATION = 8000; // 8 segundos garantidos para a arte de contato
  const TRANSITION_DURATION = 700; 

  const getDuration = (type: string) => {
    if (type === 'closing') return CLOSING_DURATION;
    if (type === 'cover') return COVER_DURATION;
    return PHOTO_DURATION;
  };

  useImperativeHandle(ref, () => ({
    restart: () => {
      animationStartTimeRef.current = performance.now();
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { width, height } = FORMAT_DIMENSIONS.REELS;
    canvas.width = width;
    canvas.height = height;

    const drawPropertyOverlay = (context: CanvasRenderingContext2D, opacity: number) => {
      if (opacity <= 0) return;
      context.save();
      context.globalAlpha = opacity;
      
      // Gradiente de fundo para legibilidade, agora mais sutil
      const gradient = context.createLinearGradient(0, height * 0.45, 0, height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      context.fillStyle = gradient;
      context.fillRect(0, height * 0.4, width, height * 0.6);

      const sideMargin = 110; 
      const topSafeZone = 320; // Mais para baixo para evitar ícones do Reels

      // Tags Superiores
      context.font = '900 32px Montserrat';
      context.textAlign = 'center';
      
      const negText = property.negotiation.toUpperCase();
      const negW = context.measureText(negText).width + 50;
      context.fillStyle = COLORS.primary;
      context.beginPath(); context.roundRect(sideMargin, topSafeZone, negW, 75, 16); context.fill();
      context.fillStyle = 'black';
      context.fillText(negText, sideMargin + negW/2, topSafeZone + 48);

      const priceText = property.price;
      const priceW = context.measureText(priceText).width + 60;
      context.fillStyle = 'white';
      context.beginPath(); context.roundRect(width - priceW - sideMargin, topSafeZone, priceW, 75, 16); context.fill();
      context.fillStyle = COLORS.priceRed;
      context.fillText(priceText, width - priceW/2 - sideMargin, topSafeZone + 50);

      // Rodapé Informativo (Tipografia Reposicionada)
      const footerY = height - 580; // Reposicionado para equilíbrio visual
      context.textAlign = 'left';
      
      // Chip Cidade
      context.fillStyle = COLORS.primary;
      const locText = `📍 ${property.city.toUpperCase()}`;
      context.font = '800 24px Montserrat';
      const locW = context.measureText(locText).width + 40;
      context.beginPath(); context.roundRect(sideMargin, footerY, locW, 50, 10); context.fill();
      context.fillStyle = 'black';
      context.fillText(locText, sideMargin + 20, footerY + 34);

      // Prefixo
      context.fillStyle = 'white';
      context.font = '600 40px Montserrat';
      context.fillText((property.locationPrefix || '').toUpperCase(), sideMargin, footerY + 115);

      // Bairro Principal
      let nameSize = 92;
      const nameText = (property.neighborhood || '').toUpperCase();
      const maxW = width - (sideMargin * 2);
      do {
        context.font = `900 ${nameSize}px Montserrat`;
        nameSize--;
      } while (context.measureText(nameText).width > maxW && nameSize > 35);
      context.fillText(nameText, sideMargin, footerY + 215);
      
      // Dados Técnicos
      context.font = '700 32px Montserrat';
      context.fillStyle = 'rgba(255,255,255,0.9)';
      context.fillText(`${property.area}m² • ${property.beds} Qts • ${property.parking} Vagas`, sideMargin, footerY + 285);
      
      context.restore();
    };

    const drawAssetImage = (img: HTMLImageElement, type: string, progress: number, opacity: number) => {
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Ajustes de Brilho, Contraste e Saturação (Mais Claras e Vívidas)
      ctx.filter = 'brightness(1.15) contrast(1.08) saturate(1.1)';
      
      const fitMode = (type === 'image') ? (property.imageFitMode || ImageFitMode.FILL) : ImageFitMode.FILL;
      
      if (fitMode === ImageFitMode.FIT) {
        ctx.save();
        ctx.filter = 'blur(60px) brightness(0.4)'; 
        ctx.drawImage(img, -150, -150, width + 300, height + 300);
        ctx.restore();

        const imgAspect = img.width / img.height;
        let rH = height * 0.86;
        let rW = rH * imgAspect;
        if (rW > width * 0.94) {
          rW = width * 0.94;
          rH = rW / imgAspect;
        }
        ctx.drawImage(img, (width - rW) / 2, (height - rH) / 2, rW, rH);
      } else {
        const scale = 1.0 + (progress * 0.08); 
        const imgAspect = img.width / img.height;
        let renderW = width * scale;
        let renderH = (width / imgAspect) * scale;
        if (renderH < height) {
            renderH = height * scale;
            renderW = (height * imgAspect) * scale;
        }
        ctx.drawImage(img, (width - renderW) / 2, (height - renderH) / 2, renderW, renderH);
      }
      ctx.restore();
      
      if (type === 'image') drawPropertyOverlay(ctx, opacity);
    };

    const startAnimation = () => {
      const seq = assetsRef.current.sequence;
      if (seq.length === 0) return;
      
      const totalDuration = seq.reduce((acc, curr) => acc + getDuration(curr.item.type), 0);
      animationStartTimeRef.current = performance.now();

      const drawLoop = (now: number) => {
        const elapsed = (now - animationStartTimeRef.current) % totalDuration;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        let currentSum = 0;
        let currentIdx = 0;
        for(let i=0; i<seq.length; i++) {
          const dur = getDuration(seq[i].item.type);
          if (elapsed < currentSum + dur) {
            currentIdx = i;
            break;
          }
          currentSum += dur;
        }

        const currentItem = seq[currentIdx];
        const itemDuration = getDuration(currentItem.item.type);
        const itemElapsed = elapsed - currentSum;
        const itemProgress = itemElapsed / itemDuration;

        let currentOpacity = 1;
        // Não faz transição no último item (Arte Final) para não piscar a capa no final do loop
        const isLastItem = currentIdx === seq.length - 1;
        const isAtTransition = !isLastItem && itemElapsed > (itemDuration - TRANSITION_DURATION);

        if (isAtTransition) {
          currentOpacity = 1 - (itemElapsed - (itemDuration - TRANSITION_DURATION)) / TRANSITION_DURATION;
          const nextItem = seq[currentIdx + 1];
          drawAssetImage(nextItem.img, nextItem.item.type, 0, 1 - currentOpacity);
        }

        drawAssetImage(currentItem.img, currentItem.item.type, itemProgress, currentOpacity);
        
        frameIdRef.current = requestAnimationFrame(drawLoop);
      };

      frameIdRef.current = requestAnimationFrame(drawLoop);
    };

    const loadAssets = async () => {
      try {
        const loadImg = (url: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const i = new Image();
            i.crossOrigin = "anonymous";
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("Erro ao carregar asset"));
            i.src = url;
          });
        };

        const targetSequence = property.reelsSequence || property.images.map(img => ({ id: Math.random().toString(), type: 'image', url: img }));
        
        const loadedSequence = await Promise.all(targetSequence.map(async (item) => {
           const img = await loadImg(item.url);
           return { item, img };
        }));

        assetsRef.current.sequence = loadedSequence;
        setIsReady(true);
        startAnimation();
      } catch (err) {
        console.error("Erro no processamento do vídeo:", err);
      }
    };

    loadAssets();
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [property]);

  useEffect(() => {
    if (isRecording && canvasRef.current && isReady) {
      animationStartTimeRef.current = performance.now();
      const audioUrl = property.audioUrl || 'https://assets.mixkit.co/music/preview/mixkit-house-deep-atmosphere-246.mp3';
      
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = audioUrl;
      audio.loop = true;
      audioRef.current = audio;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sourceNode = audioCtx.createMediaElementSource(audio);
      const gainNode = audioCtx.createGain();
      const destNode = audioCtx.createMediaStreamDestination();
      
      sourceNode.connect(gainNode);
      gainNode.connect(destNode);
      gainNode.connect(audioCtx.destination);

      const canvasStream = canvasRef.current.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destNode.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 16000000 
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        audio.pause();
        audioCtx.close();
        const fullBlob = new Blob(chunks, { type: 'video/webm' });
        onRecordingComplete?.(fullBlob);
      };
      
      const totalTimeMs = assetsRef.current.sequence.reduce((acc, curr) => acc + getDuration(curr.item.type), 0);

      audio.play().then(() => {
        recorder.start();
        // Grava exatamente o tempo da sequência sem o loop
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, totalTimeMs - 50); // Pequena margem para evitar frame da capa
      }).catch(() => {
        recorder.start();
        setTimeout(() => recorder.stop(), totalTimeMs - 50);
      });
    }
  }, [isRecording, property.audioUrl, isReady]);

  return (
    <div className="relative w-full max-w-[280px] aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-gray-900 mx-auto">
      <canvas ref={canvasRef} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 text-center z-10">
           <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">Sincronizando cenas...</p>
        </div>
      )}
      {isRecording && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse z-20 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full" /> GRAVANDO REELS
        </div>
      )}
    </div>
  );
});
