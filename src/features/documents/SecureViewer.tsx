import { useState, useEffect } from 'react';
import { EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SecureViewerProps {
  documentUrl?: string; // e.g. a blob URL from our loadSecureDocument
  fileName: string;
}

export function SecureViewer({ documentUrl, fileName }: SecureViewerProps) {
  const [isBlurred, setIsBlurred] = useState(false);

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
          <iframe 
            src={documentUrl + '#toolbar=0'} 
            className="w-full h-full border-none"
            title="Secure Document"
            sandbox="allow-same-origin allow-scripts"
          />
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
