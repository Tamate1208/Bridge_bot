
import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          aria-label="サイドバーを切り替え"
        >
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <i className="fa-solid fa-robot text-white text-lg"></i>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-700 tracking-tight truncate">実践へのBridge講座_Bot</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Gemini 3 接続中
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100">
          <img src="https://picsum.photos/32/32" alt="ユーザーアバター" />
        </div>
      </div>
    </header>
  );
};

export default Header;
