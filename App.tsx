
import React, { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import ChatWindow from './components/ChatWindow';
import { EditIcon, ChatIcon } from './components/IconComponents';

type Tab = 'editor' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return <ImageEditor />;
      case 'chat':
        return <ChatWindow />;
      default:
        return null;
    }
  };

  // Fix: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center justify-center gap-2 px-4 py-3 w-1/2 text-lg font-semibold transition-colors duration-300 focus:outline-none ${
        activeTab === tab
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg p-4 z-10">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          محرر الصور والمحادثة الذكي
        </h1>
        <p className="text-center text-gray-400 mt-1">مدعوم بواسطة Gemini API</p>
      </header>

      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-shrink-0 w-full max-w-4xl mx-auto border-b border-gray-700">
          <div className="flex rounded-t-lg overflow-hidden">
            <TabButton tab="editor" label="تعديل الصور" icon={<EditIcon />} />
            <TabButton tab="chat" label="محادثة ذكية" icon={<ChatIcon />} />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 md:p-8">
          <div className="w-full max-w-4xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;