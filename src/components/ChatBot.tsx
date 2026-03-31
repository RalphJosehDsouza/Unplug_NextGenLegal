import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X, Bot } from 'lucide-react';

import api from '@/api/axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Sender = 'user' | 'bot';
type Message = {
  id: string;
  text: string;
  sender: Sender;
};

const STORAGE_KEY = 'nextgenlegal_chat_history_v1';

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: makeId(),
          sender: 'bot',
          text: 'Hello! Ask any question about Indian law statutes, case procedures, or compliance.',
        },
      ];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && typeof m.text === 'string' && (m.sender === 'user' || m.sender === 'bot'))
      .map((m) => ({ id: String(m.id || makeId()), sender: m.sender, text: m.text }));
  } catch {
    return [
      {
        id: makeId(),
        sender: 'bot',
        text: 'Hello! Ask any question about Indian law statutes, case procedures, or compliance.',
      },
    ];
  }
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadHistory());
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const lastUserMessageRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => inputMessage.trim().length > 0 && !isTyping, [inputMessage, isTyping]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore write errors (e.g. private mode)
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping, serviceError]);

  const sendMessage = async (rawText?: string) => {
    const text = String(rawText ?? inputMessage).trim();
    if (!text || isTyping) return;

    lastUserMessageRef.current = text;
    setServiceError(null);

    const userMsg: Message = { id: makeId(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const resp = await api.post('/api/chat', { message: text });
      const reply = resp?.data?.data?.reply;
      if (!reply) throw new Error('Empty reply');

      const botMsg: Message = { id: makeId(), sender: 'bot', text: reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setServiceError('Service unavailable. Try again.');
      toast.error('Service unavailable. Try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const onRetry = async () => {
    if (!lastUserMessageRef.current) return;
    await sendMessage(lastUserMessageRef.current);
  };

  return (
    <>
      <style>{`
        @keyframes ngl-slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/30 flex items-center justify-center transition-all hover:scale-110 z-50"
          aria-label="Open AI legal assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col"
          style={{ animation: 'ngl-slideUp 180ms ease-out' }}
        >
          <div className="bg-red-600 text-white px-4 pt-4 pb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">NextGenLegal AI Assistant</div>
                <div className="text-xs text-red-100 mt-1">
                  AI assistant — not a substitute for legal advice
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {serviceError && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-2xl text-sm text-gray-700 max-w-[85%]">
                  <div className="font-semibold">{serviceError}</div>
                  <div className="mt-3">
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onRetry}>
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask a legal question..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!canSend}
                className="bg-red-600 hover:bg-red-700 text-white"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              For general information only. Not legal advice.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
