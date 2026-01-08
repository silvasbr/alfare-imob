
import React, { useRef, useEffect } from 'react';
import { PropertyData, PostFormat, SequenceItem } from '../types';
import { COLORS, FORMAT_DIMENSIONS } from '../constants';

interface Props {
  property: PropertyData;
  format: PostFormat;
  imageIndex?: number;
  sequenceItem?: SequenceItem;
  isFirstInCarousel?: boolean;
  onExport?: (dataUrl: string) => void;
}

export const PostCanvas: React.FC<Props> = ({ 
  property, 
  format, 
  imageIndex = 0,
  sequenceItem,
  isFirstInCarousel = true, 
  onExport 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = FORMAT_DIMENSIONS[format];
    canvas.width = width;
    canvas.height = height;

    const item = sequenceItem || { 
      id: 'fallback',
      type: 'image', 
      url: property.images[imageIndex] 
    } as SequenceItem;

    const render = async () => {
      ctx.clearRect(0, 0, width, height);

      if (item.type === 'image') {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = item.url || `https://picsum.photos/seed/rsi-${imageIndex}/1080/1350`;
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let renderW, renderH, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
          renderH = height;
          renderW = img.width * (height / img.height);
          offsetX = (width - renderW) / 2;
          offsetY = 0;
        } else {
          renderW = width;
          renderH = img.height * (width / img.width);
          offsetX = 0;
          offsetY = (height - renderH) / 2;
        }
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

        const gradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.5, width, height * 0.5);

        const margin = 60;
        const tagY = 130;

        // TAG NEGOCIAÇÃO
        ctx.font = '900 34px Montserrat';
        const negText = property.negotiation.toUpperCase();
        const negMetrics = ctx.measureText(negText);
        const negW = negMetrics.width + 36;
        const negH = 64;
        
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.roundRect(margin, tagY, negW, negH, 12);
        ctx.fill();
        
        ctx.fillStyle = COLORS.black;
        ctx.textAlign = 'center';
        ctx.fillText(negText, margin + negW/2, tagY + 44);

        // TAG PREÇO
        ctx.font = '900 38px Montserrat';
        const priceText = property.price;
        const priceMetrics = ctx.measureText(priceText);
        const priceW = priceMetrics.width + 40;
        
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.roundRect(width - priceW - margin, tagY, priceW, negH, 12);
        ctx.fill();
        
        ctx.fillStyle = COLORS.priceRed;
        ctx.fillText(priceText, width - priceW/2 - margin, tagY + 46);

        const footerBottom = height - 120;
        const maxTextWidth = width - (margin * 2);

        // CHIP CIDADE
        ctx.font = '800 20px Montserrat';
        const locationText = `📍 ${property.city.toUpperCase()}`;
        const locMetrics = ctx.measureText(locationText);
        const locChipW = locMetrics.width + 20; 
        const locChipH = 38; 
        
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.roundRect(margin, footerBottom - 260, locChipW, locChipH, 8);
        ctx.fill();
        
        ctx.fillStyle = COLORS.black;
        ctx.textAlign = 'center';
        ctx.fillText(locationText, margin + locChipW/2, footerBottom - 234);

        // PREFIXO
        let prefixSize = 36;
        ctx.textAlign = 'left';
        const prefixText = (property.locationPrefix || '').toUpperCase();
        do {
          ctx.font = `600 ${prefixSize}px Montserrat`;
          prefixSize--;
        } while (ctx.measureText(prefixText).width > maxTextWidth && prefixSize > 12);
        
        ctx.fillStyle = COLORS.white;
        ctx.fillText(prefixText, margin, footerBottom - 165);
        
        // BAIRRO
        let nameSize = 78;
        const nameText = (property.neighborhood || '').toUpperCase();
        do {
          ctx.font = `900 ${nameSize}px Montserrat`;
          nameSize--;
        } while (ctx.measureText(nameText).width > maxTextWidth && nameSize > 24);
        
        ctx.fillStyle = COLORS.white;
        ctx.fillText(nameText, margin, footerBottom - 85);

        // INFO TÉCNICA
        ctx.font = '700 28px Montserrat';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(`${property.area}m²  •  ${property.beds} Quartos  •  ${property.parking} Vagas`, margin, footerBottom - 25);

        if (isFirstInCarousel) {
          ctx.font = '900 24px Montserrat';
          const ctaLabel = "CONFIRA";
          const ctaLabelMetrics = ctx.measureText(ctaLabel);
          const arrowWidth = 35;
          const ctaW = ctaLabelMetrics.width + arrowWidth + 50;
          const ctaH = 65;
          const ctaX = width - ctaW - margin;
          const ctaY = footerBottom - 75;

          ctx.fillStyle = COLORS.primary;
          ctx.beginPath();
          ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 12);
          ctx.fill();

          ctx.fillStyle = COLORS.black;
          ctx.textAlign = 'left';
          ctx.fillText(ctaLabel, ctaX + 20, ctaY + 41);

          const arrowX = ctaX + 20 + ctaLabelMetrics.width + 12;
          const arrowY = ctaY + 33;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.strokeStyle = COLORS.black;
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX + arrowWidth, arrowY); 
          ctx.lineTo(arrowX + arrowWidth - 10, arrowY - 7);
          ctx.moveTo(arrowX + arrowWidth, arrowY);
          ctx.lineTo(arrowX + arrowWidth - 10, arrowY + 7);
          ctx.stroke();
        }

      } else {
        const artUrl = item.url;
        if (artUrl) {
          const artImg = new Image();
          artImg.crossOrigin = "anonymous";
          artImg.src = artUrl;
          await new Promise((resolve) => {
            artImg.onload = resolve;
            artImg.onerror = resolve;
          });
          const imgRatio = artImg.width / artImg.height;
          const canvasRatio = width / height;
          let rW, rH, oX, oY;
          if (imgRatio > canvasRatio) {
            rH = height; rW = artImg.width * (height / artImg.height);
            oX = (width - rW) / 2; oY = 0;
          } else {
            rW = width; rH = artImg.height * (width / artImg.width);
            oX = 0; oY = (height - rH) / 2;
          }
          ctx.drawImage(artImg, oX, oY, rW, rH);
        }
      }
      if (onExport) onExport(canvas.toDataURL('image/png'));
    };
    render();
  }, [property, format, imageIndex, sequenceItem, isFirstInCarousel]);

  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        className="max-w-full shadow-2xl rounded-[2rem] border border-gray-100 dark:border-gray-800"
        style={{ width: '300px' }}
      />
    </div>
  );
};
