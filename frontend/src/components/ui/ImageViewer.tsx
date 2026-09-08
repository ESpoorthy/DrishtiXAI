/**
 * Medical image viewer — fundus image + Grad-CAM heatmap
 * Supports side-by-side view, zoom on click, graceful error fallback
 */
import { useState } from 'react';
import { ImageOff, ZoomIn, X, Eye, Sparkles, Download } from 'lucide-react';

interface SingleViewerProps {
  src: string | null;
  alt: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: 'eye' | 'sparkles';
  downloadName?: string;
}

export function MedicalImage({
  src, alt, title, subtitle, badge, footer, icon = 'eye', downloadName,
}: SingleViewerProps) {
  const [error,    setError]    = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const Icon = icon === 'sparkles' ? Sparkles : Eye;

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = downloadName ?? alt;
    a.click();
  };

  return (
    <>
      <div className="card space-y-4" id={`img-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Icon className="w-4 h-4 text-brand-500" />
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {badge}
            {src && !error && (
              <>
                <button
                  onClick={() => setLightbox(true)}
                  className="btn-ghost btn-sm btn-icon"
                  title="Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {downloadName && (
                  <button
                    onClick={handleDownload}
                    className="btn-ghost btn-sm btn-icon"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Image */}
        <div
          className={`rounded-2xl overflow-hidden bg-slate-900 border border-slate-200
                      min-h-[200px] flex items-center justify-center
                      ${src && !error ? 'cursor-zoom-in' : ''}`}
          onClick={() => src && !error && setLightbox(true)}
        >
          {error || !src ? (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
              <ImageOff className="w-10 h-10 opacity-30" />
              <p className="text-xs">Image unavailable</p>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full object-contain max-h-72 transition-opacity duration-300"
              onError={() => setError(true)}
              loading="lazy"
            />
          )}
        </div>

        {/* Subtitle */}
        {subtitle && <p className="text-xs text-slate-400 font-mono truncate">{subtitle}</p>}

        {/* Footer slot */}
        {footer}
      </div>

      {/* Lightbox */}
      {lightbox && src && !error && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setLightbox(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
