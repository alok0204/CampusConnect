import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const ImageViewerModal = ({ isOpen, imageUrl, title, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Image Viewer'}
    >
      {/* Top action bar */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
          title="Close (Escape)"
          aria-label="Close image viewer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={title || 'Full-screen preview'}
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
        />
      </div>

      {/* Title / Caption bar */}
      {title && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm font-medium text-center max-w-[90vw] truncate shadow-lg">
          {title}
        </div>
      )}
    </div>
  );
};

export default ImageViewerModal;
