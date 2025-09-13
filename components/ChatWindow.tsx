
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { sendMessageStream, startChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { SendIcon, MicrophoneIcon, StopIcon } from './IconComponents';

const ChatWindow: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { transcript, isListening, startListening, stopListening, error: speechError } = useSpeechRecognition();

  useEffect(() => {
    const initChat = () => {
      const newChat = startChat();
      setChat(newChat);
      setMessages([
        { id: 'initial', role: 'bot', text: 'مرحبًا! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' }
      ]);
    };
    initChat();
  }, []);
  
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);
  
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !chat || isBotTyping) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsBotTyping(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMessageId, role: 'bot', text: '' }]);

    try {
      const stream = await sendMessageStream(chat, messageText);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
       setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessageId ? { ...msg, text: 'عفوًا، حدث خطأ ما. الرجاء المحاولة مرة أخرى.' } : msg
          )
        );
    } finally {
      setIsBotTyping(false);
    }
  }, [chat, isBotTyping]);


  return (
    <div className="flex flex-col h-[75vh] bg-gray-800/50 rounded-lg shadow-xl animate-fade-in">
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{message.text}{isBotTyping && message.role === 'bot' && index === messages.length - 1 ? '...' : ''}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        {speechError && <p className="text-xs text-red-400 text-center mb-2">{speechError}</p>}
        <div className="flex items-center bg-gray-900 rounded-full p-2">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-700'}`}
            aria-label={isListening ? 'إيقاف الاستماع' : 'بدء الاستماع'}
          >
            {isListening ? <StopIcon /> : <MicrophoneIcon />}
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-grow bg-transparent px-4 text-white placeholder-gray-500 focus:outline-none"
            disabled={isBotTyping}
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isBotTyping}
            className="p-3 bg-indigo-600 rounded-full text-white disabled:bg-indigo-900 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            aria-label="إرسال"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
