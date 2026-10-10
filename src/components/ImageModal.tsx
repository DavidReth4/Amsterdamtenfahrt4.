import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const aspect = dims ? dims.w / dims.h : 1;
  const isPortrait = aspect < 1;
  const maxWidth = isPortrait ? 'auto' : '90vw';
  const maxHeight = isPortrait ? '85vh' : 'auto';
  const width = isPortrait ? `${Math.min(85 * aspect, 90)}vw` : '90vw';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, maxHeight, width }}
      >
        <img
          src={src}
          alt={alt ?? ''}
          className="w-full h-full object-contain rounded-lg"
          style={{ maxHeight: '85vh' }}
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white text-black rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
