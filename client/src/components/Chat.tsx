import { Send, Bot, User } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m AlertRAG AI. I can help you understand incidents, analyze telemetry data, and provide recommendations. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');

  const suggestedPrompts = [
    'Why did checkout fail?',
    'What should I fix first?',
    'Show me the database connection metrics',
    'How can I prevent this in the future?',
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = '';
      
      if (input.toLowerCase().includes('checkout') || input.toLowerCase().includes('fail')) {
        aiResponse = 'The checkout failures are caused by elevated latency in the payment service. The root cause is database connection pool exhaustion (50/50 connections at capacity), which started at 10:12 AM. This led to cascading timeouts affecting approximately 30% of checkout requests.';
      } else if (input.toLowerCase().includes('fix')) {
        aiResponse = 'I recommend addressing these issues in priority order:\n\n1. **Immediate**: Increase the database connection pool from 50 to 100 connections\n2. **Short-term**: Implement exponential backoff for retries to prevent retry storms\n3. **Medium-term**: Scale payment-service horizontally to distribute load\n\nThe first action should restore service within 2-3 minutes.';
      } else if (input.toLowerCase().includes('database') || input.toLowerCase().includes('connection')) {
        aiResponse = 'Database connection metrics show:\n\n- 10:12 AM: 45/50 connections (90%)\n- 10:14 AM: 50/50 connections (100%) ← Exhaustion point\n- 10:15 AM: 50/50 connections with 23 requests queued\n\nConnection pool has been at maximum capacity for the past 3 minutes, causing new requests to timeout after 5 seconds.';
      } else if (input.toLowerCase().includes('prevent') || input.toLowerCase().includes('future')) {
        aiResponse = 'To prevent similar incidents:\n\n1. Set up connection pool utilization alerts at 80% capacity\n2. Implement circuit breakers for database calls\n3. Configure auto-scaling rules for connection pools\n4. Add SLO monitoring for P95 latency (threshold: 500ms)\n5. Enable connection pool metrics in your observability dashboard';
      } else {
        aiResponse = 'I can help you with incident analysis, root cause investigation, and remediation recommendations. Try asking about the checkout failures, what to fix first, or how to prevent future incidents.';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-gray-900 mb-2">Chat with AlertRAG</h1>
        <p className="text-gray-600">Ask questions about incidents and get AI-powered insights</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-blue-600 to-purple-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`flex-1 max-w-2xl ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <div className="text-sm text-gray-500 mb-3">Suggested questions:</div>
            <div className="grid grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors border border-gray-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about the incident..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
