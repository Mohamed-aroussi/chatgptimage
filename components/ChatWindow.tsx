
import React, { useState, useRef, useEffect, useCallback } from 'react';
// Fix: Import Chat type from @google/genai
import type { Chat } from '@google/genai';
import { startChat, sendMessageStream } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ChatMessage } from '../types';
import { SendIcon, MicrophoneIcon, StopIcon, UserIcon, BotIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening, error: speechError } = useSpeechRecognition();

  useEffect(() => {
    chatRef.current = startChat();
  }, []);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    stopListening(); // Stop listening if a message is sent manually

    try {
      if (!chatRef.current) {
        throw new Error('Chat not initialized');
      }
      
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMessageId, role: 'bot', text: '' }]);
      
      const stream = sendMessageStream(chatRef.current, messageText);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError('عذرًا، حدث خطأ أثناء التواصل مع المساعد. الرجاء المحاولة مرة أخرى.');
      setMessages(prev => prev.filter(m => m.role !== 'bot' || m.text !== ''));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, stopListening]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
      if(transcript) {
        handleSendMessage(transcript);
      }
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-gray-800/50 rounded-lg shadow-xl animate-fade-in">
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {message.role === 'bot' && (
              <div className="flex-shrink-0 bg-indigo-500 rounded-full p-2">
                <BotIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-md p-4 rounded-xl ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 bg-gray-600 rounded-full p-2">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4 justify-start">
             <div className="flex-shrink-0 bg-indigo-500 rounded-full p-2">
                <BotIcon className="w-6 h-6 text-white" />
              </div>
            <div className="bg-gray-700 rounded-xl p-4">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {(error || speechError) && (
        <div className="px-6 pb-2">
          <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
            {error || speechError}
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVoiceButtonClick}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {isListening ? <StopIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "جاري الاستماع..." : "اكتب رسالتك هنا..."}
            className="flex-1 w-full bg-gray-700 border border-gray-600 rounded-full py-3 px-5 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-full disabled:bg-indigo-900 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
