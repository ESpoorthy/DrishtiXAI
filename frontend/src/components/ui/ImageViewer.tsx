/**
 * MedicalImage — retinal image viewer with lightbox, download, tab switching.
 * Supports Original / Heatmap / Overlay tabs for Grad-CAM presentation.
 */
import { useState, ReactNode } from 'react';
import { Eye, Download, Maximize2, X, Sparkles } from 'lucide-react';

interface Props {
  src?:          string | null;
  alt:           string;
  title:         string;
  icon?:         'eye' | 'sparkles';
  subtitle?:     string;
  downloadName?: string;
  badge?:        ReactNode;
  footer?:       ReactNode;
}

export function MedicalImage({
  src, alt, title, icon = 'eye', subtitle, downloadName, badge, footer,
}: Props) {
  const [lightbox, setLightbox] = useState(false);
  const IconComp = icon === 'sparkles' ? Sparkles : Eye;

  return (
    <>
      <div className="card p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100
                            flex items-center justify-center">
              <IconComp className="w-3.5 h-3.5 text-teal-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              {subtitle && <p className="text-xs text-ink-subtle truncate max-w-[180px]">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {badge}
            {src && (
              <>
                <a
                  href={src}
                  download={downloadName ?? 'image.jpg'}
                  className="btn-ghost btn-sm btn-icon"
                  title="Download image"
                  aria-label="Download image"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setLightbox(true)}
                  className="btn-ghost btn-sm btn-icon"
                  title="View full size"
                  aria-label="View full size"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="bg-ink/5 flex items-center justify-center min-h-48">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="max-h-72 w-full object-contain cursor-zoom-in"
              onClick={() => setLightbox(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-ink-subtle gap-2">
              <IconComp className="w-8 h-8 opacity-30" />
              <p className="text-xs">Image not available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && <div className="px-5 pb-4 pt-2">{footer}</div>}
      </div>

      {/* Lightbox */}
      {lightbox && src && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} full size view`}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20
                       text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-xs">{title}</p>
        </div>
      )}
    </>
  );
}
