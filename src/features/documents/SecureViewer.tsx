import { useState, useEffect } from 'react';
import { EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface SecureViewerProps {
  documentUrl?: string; // e.g. a blob URL from our loadSecureDocument
  fileName: string;
}

GlobalWorkerOptions.workerSrc = pdfWorker;

export function SecureViewer({ documentUrl, fileName }: SecureViewerProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Basic anti-screenshot / anti-snooping measures
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // disable right click
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault(); // disable copy
    };

    const handleKeydown = (e: KeyboardEvent) => {
      // Catch PrintScreen or 'Cmd/Ctrl + P'
      if (e.key === 'PrintScreen' || ((e.ctrlKey || e.metaKey) && e.key === 'p')) {
        e.preventDefault();
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderPdfToImages = async () => {
      if (!documentUrl) {
        setPageImages([]);
        setLoadError(null);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        setPageImages([]);

        const response = await fetch(documentUrl, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Unable to load protected document.');
        }

        const buffer = await response.arrayBuffer();
        const loadingTask = getDocument({ data: buffer });
        const pdf = await loadingTask.promise;

        const images: string[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });

          if (!context) {
            throw new Error('Canvas rendering failed.');
          }

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise;

          images.push(canvas.toDataURL('image/png'));
        }

        if (!cancelled) {
          setPageImages(images);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to open document');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void renderPdfToImages();

    return () => {
      cancelled = true;
    };
  }, [documentUrl]);

  return (
    <div className="relative w-full h-[600px] bg-gray-900 rounded-xl overflow-hidden select-none" style={{ userSelect: 'none' }}>
      {/* Anti-Screenshot Overlay (Watermark) */}
      <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center opacity-[0.05]">
        <div className="text-white text-3xl font-bold transform tracking-[1em] -rotate-45 whitespace-nowrap">
          CONFIDENTIAL - DO NOT SHARE
        </div>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-800 text-gray-200 border-b border-gray-700 z-40 relative">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold">{fileName}</span>
        </div>
        <div className="text-xs bg-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
          <EyeOff className="w-3 h-3" />
          Protected View
        </div>
      </div>
      
      <div className={`w-full h-[calc(100%-60px)] relative transition-all duration-300 ${isBlurred ? 'blur-3xl' : ''}`}>
        {isBlurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-white">
            <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
            <p className="font-semibold text-lg">Display Obscured</p>
            <p className="text-gray-400 text-sm">Action blocked for security reasons.</p>
          </div>
        )}
        
        {documentUrl ? (
          <div className="w-full h-full overflow-auto bg-neutral-900 p-4 space-y-4" style={{ userSelect: 'none' }}>
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                Loading protected document...
              </div>
            ) : loadError ? (
              <div className="w-full h-full flex items-center justify-center text-red-300 text-sm text-center px-6">
                {loadError}
              </div>
            ) : (
              pageImages.map((src, idx) => (
                <img
                  key={`${fileName}-page-${idx + 1}`}
                  src={src}
                  alt={`Page ${idx + 1}`}
                  draggable={false}
                  className="w-full max-w-3xl mx-auto rounded-md shadow-xl select-none"
                  style={{ userSelect: 'none' }}
                />
              ))
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-emerald-100 mb-2 p-2 bg-emerald-50 rounded-full" />
              <p>Document content is protected.</p>
              <p className="text-xs text-gray-400 max-w-[250px] mt-2">The file is securely loaded in memory and not permanently accessible from the OS file system.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
