import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type {
  CardTemplate,
  CardTheme,
  CardRenderOptions,
  JourneyMapView
} from './cardRenderer';
import {
  renderMumbaiCard,
  renderPostcardCard,
  renderJourneyCard
} from './cardRenderer';
import type { CityLocation } from './citiesData';
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
  mapView?: JourneyMapView;
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
      mapView = 'shine3d'
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [artworkImg, setArtworkImg] = useState<HTMLImageElement | null>(null);
    const [shineMapImg, setShineMapImg] = useState<HTMLImageElement | null>(null);
    const [globeMapImg, setGlobeMapImg] = useState<HTMLImageElement | null>(null);
    const [progress, setProgress] = useState(0.75);

    // Preload artwork & map textures
    useEffect(() => {
      const img = new Image();
      img.src = '/images/id-generator/mumbai-artwork.webp';
      img.onload = () => setArtworkImg(img);

      const sImg = new Image();
      sImg.src = '/assets/maps/journey-shine-map.webp';
      sImg.onload = () => setShineMapImg(sImg);

      const gImg = new Image();
      gImg.src = '/assets/maps/globe-india-highlight.webp';
      gImg.onload = () => setGlobeMapImg(gImg);
    }, []);

    // Animation loop for Journey flight path
    useEffect(() => {
      if (template !== 'journey') return;

      let rafId: number;
      let startTime = performance.now();
      const FLY_DURATION = 2400; // ms
      const HOLD_DURATION = 1200; // ms
      const TOTAL_CYCLE = FLY_DURATION + HOLD_DURATION;

      const animate = (time: number) => {
        const elapsed = (time - startTime) % TOTAL_CYCLE;
        if (elapsed < FLY_DURATION) {
          const t = elapsed / FLY_DURATION;
          // Ease-in-out quadratic
          const p = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          setProgress(Math.max(0.01, Math.min(1, p)));
        } else {
          setProgress(1); // Arrived in Mumbai
        }
        rafId = requestAnimationFrame(animate);
      };

      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }, [template]);

    // Canvas Dimensions based on template
    const canvasWidth = template === 'postcard' ? 1440 : 1080;
    const canvasHeight = 1080;

    // Redraw whenever parameters change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const options: CardRenderOptions = {
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
        progress,
        artworkImage: artworkImg,
        shineMapImage: shineMapImg,
        globeMapImage: globeMapImg,
        mapView
      };

      if (template === 'postcard') {
        renderPostcardCard(ctx, options, canvasWidth, canvasHeight);
      } else if (template === 'journey') {
        renderJourneyCard(ctx, options, canvasWidth, canvasHeight);
      } else {
        renderMumbaiCard(ctx, options, canvasWidth, canvasHeight);
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
      progress,
      artworkImg,
      shineMapImg,
      globeMapImg,
      mapView,
      canvasWidth,
      canvasHeight
    ]);

    // Expose export helpers
    useImperativeHandle(ref, () => ({
      getCanvasElement: () => canvasRef.current,
      exportPngBlob: () => {
        return new Promise<Blob | null>((resolve) => {
          if (!canvasRef.current) return resolve(null);
          canvasRef.current.toBlob(
            (blob) => resolve(blob),
            'image/png',
            1.0
          );
        });
      },
      exportGifBlob: async (onProgress) => {
        if (!canvasRef.current) return null;

        const gifSize = 640;
        const totalFrames = 24;
        const gif = GIFEncoder();

        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvasWidth;
        offCanvas.height = canvasHeight;
        const offCtx = offCanvas.getContext('2d');

        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = gifSize;
        smallCanvas.height = Math.round((gifSize * canvasHeight) / canvasWidth);
        const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true });

        if (!offCtx || !smallCtx) return null;

        for (let i = 0; i < totalFrames; i++) {
          const p = i / (totalFrames - 1);
          const options: CardRenderOptions = {
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
            progress: p,
            artworkImage: artworkImg
          };

          if (template === 'journey') {
            renderJourneyCard(offCtx, options, canvasWidth, canvasHeight);
          } else if (template === 'postcard') {
            renderPostcardCard(offCtx, options, canvasWidth, canvasHeight);
          } else {
            renderMumbaiCard(offCtx, options, canvasWidth, canvasHeight);
          }

          // Scale down to small canvas
          smallCtx.drawImage(offCanvas, 0, 0, smallCanvas.width, smallCanvas.height);
          const { data } = smallCtx.getImageData(0, 0, smallCanvas.width, smallCanvas.height);

          const palette = quantize(data, 256);
          const index = applyPalette(data, palette);

          gif.writeFrame(index, smallCanvas.width, smallCanvas.height, {
            palette,
            delay: 100 // ms
          });

          if (onProgress) onProgress(Math.round(((i + 1) / totalFrames) * 100));
        }

        gif.finish();
        const buffer = gif.bytes();
        return new Blob([buffer], { type: 'image/gif' });
      }
    }));

    const aspectRatioClass = template === 'postcard' ? 'aspect-[4/3]' : 'aspect-square';

    return (
      <div className="w-full flex items-center justify-center select-none">
        <div
          className={`relative w-full ${aspectRatioClass} max-w-[560px] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#5FE3D6]/30 bg-[#0B0A22] transform transition-transform duration-300 hover:scale-[1.01]`}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain block"
          />
        </div>
      </div>
    );
  }
);

CardCanvas.displayName = 'CardCanvas';
