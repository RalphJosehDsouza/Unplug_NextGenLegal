import { ChatBot } from './components/ChatBot';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatBot />
    </>
  );
}

