import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Hello! I'm your AI legal assistant. I can help answer questions about Indian law, guide you through document generation, and connect you with lawyers. How can I help you today?",
    sender: 'bot',
    timestamp: new Date(),
  },
];

const sampleResponses = [
  "I can help you with that! For property-related matters in India, you'll need to consider the Registration Act, 1908 and the Transfer of Property Act, 1882. Would you like me to generate a rental agreement or connect you with a property lawyer?",
  "For GST compliance, the due dates are: GSTR-1 by the 11th, GSTR-3B by the 20th of each month. I can set up automated reminders for you. Would you like that?",
  "Starting a company in India involves several steps: DIN application, name reservation, incorporation filing with MCA, PAN/TAN, and bank account opening. Our document studio can help with partnership deeds and employment contracts. Shall I guide you through?",
];

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const randomResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      const botMessage: Message = {
        id: messages.length + 2,
        text: randomResponse + "\n\nThis is general information, not legal advice.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl w-full mx-auto p-4 flex-1 flex flex-col">
        <div className="bg-red-600 text-white p-6 rounded-t-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Legal AI Assistant</h1>
            <p className="text-red-100">Powered by Gemini - Trained on Indian Law</p>
          </div>
        </div>

        <div className="flex-1 bg-white border-x border-gray-200 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 max-w-[80%] ${message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-gray-200' : 'bg-red-100'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-5 h-5 text-gray-600" />
                ) : (
                  <Sparkles className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] leading-relaxed ${
                message.sender === 'user' 
                  ? 'bg-red-600 text-white rounded-tr-sm' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {message.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-3' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-red-600" />
              </div>
              <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-sm flex items-center">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-2xl shadow-sm">
          <div className="flex gap-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a legal question..."
              className="flex-1 text-base py-6 px-4 bg-gray-50 border-gray-200 focus-visible:ring-red-500 rounded-xl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-red-600 hover:bg-red-700 text-white h-auto px-8 rounded-xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-3 text-center">
            AI responses are for general information only, not legal advice. Always consult a qualified professional.
          </p>
        </div>
      </div>
    </div>
  );
}
