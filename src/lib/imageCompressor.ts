/**
 * Browser-side image optimization and compression utility for Snaps.
 * Safely scales down high-resolution camera photos to optimized WebP/JPEG,
 * creates low-overhead thumbnails, and protects LocalStorage from quota errors.
 */

export interface CompressedImageResult {
  dataUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export async function compressAndOptimizeImage(
  fileOrDataUrl: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 1. Calculate aspect-ratio-preserved dimensions for main image
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Draw main image on canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context is not available');
        }

        // Enhance rendering quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // 2. Generate lightweight thumbnail (~320px)
        const thumbCanvas = document.createElement('canvas');
        const thumbMax = 320;
        let tWidth = width;
        let tHeight = height;
        if (tWidth > thumbMax || tHeight > thumbMax) {
          const tRatio = Math.min(thumbMax / tWidth, thumbMax / tHeight);
          tWidth = Math.round(tWidth * tRatio);
          tHeight = Math.round(tHeight * tRatio);
        }
        thumbCanvas.width = tWidth;
        thumbCanvas.height = tHeight;
        const tCtx = thumbCanvas.getContext('2d');
        if (tCtx) {
          tCtx.imageSmoothingEnabled = true;
          tCtx.imageSmoothingQuality = 'medium';
          tCtx.drawImage(canvas, 0, 0, tWidth, tHeight);
        }
        let thumbnailUrl = thumbCanvas.toDataURL('image/webp', 0.7);
        if (!thumbnailUrl.startsWith('data:image/webp')) {
          thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
        }

        // Approximate byte size
        const sizeBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          thumbnailUrl,
          width,
          height,
          sizeBytes,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0]?.replace('data:', '') || 'image/jpeg';
  const byteCharacters = atob(parts[1] || '');
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

