import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type {
  CardTemplate,
  CardTheme,
  CardRenderOptions
} from './cardRenderer';
import {
  renderMumbaiCard,
  renderPostcardCard,
  renderJourneyCard
} from './cardRenderer';
import type { CityLocation } from './citiesData';
import type { CityMetadata } from './geoEngine';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface CardCanvasRef {
  exportPngBlob: () => Promise<Blob | null>;
  exportGifBlob: (onProgress?: (p: number) => void) => Promise<Blob | null>;
  getCanvasElement: () => HTMLCanvasElement | null;
}

interface CardCanvasProps {
  template: CardTemplate;
  theme: CardTheme;
  handle: string;
  displayName: string;
  tagline: string;
  message: string;
  idNumber: number;
  avatarImage: HTMLImageElement | null;
  photoZoom: number;
  city: CityLocation;
  cityMetadata?: CityMetadata;
  travelMode?: 'flight' | 'train';
  customProgress?: number;
}

export const CardCanvas = forwardRef<CardCanvasRef, CardCanvasProps>(
  (
    {
      template,
      theme,
      handle,
      displayName,
      tagline,
      message,
      idNumber,
      avatarImage,
      photoZoom,
      city,
      cityMetadata,
      travelMode = 'flight',
      customProgress
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [artworkImg, setArtworkImg] = useState<HTMLImageElement | null>(null);
    const [progress, setProgress] = useState(0.72);

    // Preload artwork
    useEffect(() => {
      const img = new Image();
      img.src = '/images/id-generator/mumbai-artwork.webp';
      img.onload = () => setArtworkImg(img);
    }, []);

    // Animation Loop for Journey vehicle movement
    useEffect(() => {
      if (template !== 'journey' || customProgress !== undefined) return;
      let frameId: number;
      let current = 0;

      const loop = () => {
        current = (current + 0.0035) % 1;
        setProgress(current);
        frameId = requestAnimationFrame(loop);
      };

      frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
    }, [template, customProgress]);

    // Redraw Canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const opts: CardRenderOptions = {
        template,
        theme,
        handle,
        displayName,
        tagline,
        message,
        idNumber,
        avatarImage,
        photoZoom,
        city,
        cityMetadata,
        travelMode,
        progress: customProgress !== undefined ? customProgress : progress,
        artworkImage: artworkImg
      };

      if (template === 'classic') {
        renderMumbaiCard(ctx, opts, 1080, 1080);
      } else if (template === 'postcard') {
        renderPostcardCard(ctx, opts, 1080, 1080);
      } else if (template === 'journey') {
        renderJourneyCard(ctx, opts, 1080, 1080);
      }
    }, [
      template,
      theme,
      handle,
      displayName,
      tagline,
      message,
      idNumber,
      avatarImage,
      photoZoom,
      city,
      cityMetadata,
      travelMode,
      progress,
      customProgress,
      artworkImg
    ]);

    // Imperative Exporter API
    useImperativeHandle(ref, () => ({
      getCanvasElement: () => canvasRef.current,

      exportPngBlob: () => {
        return new Promise((resolve) => {
          const canvas = canvasRef.current;
          if (!canvas) return resolve(null);
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
      },

      exportGifBlob: async (onProgress) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const offscreen = document.createElement('canvas');
        offscreen.width = 540;
        offscreen.height = 540;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return null;

        const gif = GIFEncoder();
        const totalFrames = 24;
        const delayMs = 65;

        for (let i = 0; i < totalFrames; i++) {
          const p = i / totalFrames;
          const opts: CardRenderOptions = {
            template,
            theme,
            handle,
            displayName,
            tagline,
            message,
            idNumber,
            avatarImage,
            photoZoom,
            city,
            cityMetadata,
            travelMode,
            progress: p,
            artworkImage: artworkImg
          };

          if (template === 'classic') {
            renderMumbaiCard(ctx, opts, 540, 540);
          } else if (template === 'postcard') {
            renderPostcardCard(ctx, opts, 540, 540);
          } else {
            renderJourneyCard(ctx, opts, 540, 540);
          }

          const imgData = ctx.getImageData(0, 0, 540, 540);
          const palette = quantize(imgData.data, 128);
          const index = applyPalette(imgData.data, palette);

          gif.writeFrame(index, 540, 540, {
            palette,
            delay: delayMs
          });

          if (onProgress) {
            onProgress(Math.round(((i + 1) / totalFrames) * 100));
          }
        }

        gif.finish();
        const bytes = gif.bytes();
        return new Blob([bytes], { type: 'image/gif' });
      }
    }));

    return (
      <div className="relative group w-full max-w-[540px] mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#5FE3D6] via-[#B59CF2] to-[#F6A067] rounded-3xl blur-xl opacity-35 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#0A091E] shadow-2xl aspect-square flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1080}
            className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>
      </div>
    );
  }
);
