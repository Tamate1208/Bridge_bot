
import React, { useState, useRef, useEffect } from 'react';
import { FileItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  files: FileItem[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  isFileLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, files, onUpload, onRemove, isFileLoading }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <i className="fa-solid fa-file-pdf text-red-500"></i>;
    if (type.includes('image')) return <i className="fa-solid fa-file-image text-green-500"></i>;
    if (type.includes('text') || type.includes('plain')) return <i className="fa-solid fa-file-lines text-blue-500"></i>;
    return <i className="fa-solid fa-file text-gray-400"></i>;
  };

  return (
    <aside className="w-80 h-full border-r border-gray-200 bg-gray-50 flex flex-col z-10 animate-fade-in shrink-0">
      <div className="p-4 border-b border-gray-200">
        <div className="relative" ref={menuRef}>
          <button 
            disabled={isFileLoading}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition-all ${
              isFileLoading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isFileLoading ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                読み込み中...
              </>
            ) : (
              <>
                <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-plus'}`}></i>
                資料を追加
              </>
            )}
          </button>

          {isMenuOpen && !isFileLoading && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-2 animate-fade-in-down">
              <button 
                onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <i className="fa-solid fa-file-circle-plus"></i>
                </div>
                <div className="text-left">
                  <p className="font-bold">ファイルを選択</p>
                  <p className="text-[10px] text-gray-400">個別の資料をアップロード</p>
                </div>
              </button>
              
              <button 
                onClick={() => { folderInputRef.current?.click(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <i className="fa-solid fa-folder-tree"></i>
                </div>
                <div className="text-left">
                  <p className="font-bold">フォルダを指定</p>
                  <p className="text-[10px] text-gray-400">ドライブから落としたフォルダを丸ごと</p>
                </div>
              </button>
              
              <div className="mx-4 my-1 border-t border-gray-100"></div>
              
              <div className="px-4 py-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                  <i className="fa-brands fa-google-drive text-blue-400"></i>
                  Google Drive フォルダに対応
                </div>
              </div>
            </div>
          )}

          {/* Hidden Inputs */}
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            multiple 
            onChange={onUpload}
            accept=".pdf,image/*,text/*"
          />
          <input 
            ref={folderInputRef}
            type="file" 
            className="hidden" 
            // @ts-ignore
            webkitdirectory=""
            directory=""
            onChange={onUpload}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <i className="fa-solid fa-layer-group"></i>
            Current Sources ({files.length})
          </h2>
        </div>

        {isFileLoading && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-blue-600 font-bold">フォルダを解析中...</p>
            <p className="text-[10px] text-gray-400 mt-2">大量のファイルがある場合、<br/>少し時間がかかります。</p>
          </div>
        )}

        {files.length === 0 && !isFileLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 border-dashed">
              <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-300"></i>
            </div>
            <p className="text-xs text-gray-400 font-medium px-6 leading-relaxed">
              上のボタンから講座資料を<br/>読み込ませてください。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id} className="group bg-white rounded-xl p-3 border border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all relative">
                <div className="flex items-start gap-3">
                  <div className="text-xl mt-0.5">
                    {getIcon(file.type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-700 truncate pr-6" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] text-gray-400 font-bold">
                        {formatSize(file.size)}
                      </p>
                      {file.path && (
                        <span className="text-[9px] text-gray-300 truncate max-w-[100px]">
                          in {file.path.split('/')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(file.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-300 rounded-lg transition-all"
                  title="削除"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${isFileLoading ? 'bg-amber-500' : 'bg-green-500'} rounded-full`}></span>
            {isFileLoading ? 'Processing Files...' : 'System Ready'}
          </div>
          <div className="font-mono">v1.2.6</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
