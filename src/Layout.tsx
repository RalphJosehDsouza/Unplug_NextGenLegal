import { useState } from 'react';
import { Shield } from 'lucide-react';

import { ChatBot } from './components/ChatBot';
import { WomensHelpModal } from './components/WomensHelpModal';

export function Layout({ children }: { children: React.ReactNode }) {
  const [womensOpen, setWomensOpen] = useState(false);

  return (
    <>
      {children}

      <WomensHelpModal open={womensOpen} onOpenChange={setWomensOpen} />

      <button
        type="button"
        onClick={() => setWomensOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-110 z-50"
        aria-label="Open Women’s Emergency help"
        title="Women’s Emergency"
      >
        <Shield className="w-6 h-6" />
      </button>

      <ChatBot />
    </>
  );
}

