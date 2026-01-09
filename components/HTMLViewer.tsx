import React, { useState } from 'react';
import * as Icons from 'lucide-react';

interface HTMLViewerProps {
  title: string;
  htmlContent: string;
  onClose: () => void;
}

const HTMLViewer: React.FC<HTMLViewerProps> = ({ title, htmlContent, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); // To force iframe reload

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const reload = () => setKey(prev => prev + 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp transition-all duration-300 ${isFullscreen ? 'fixed inset-0 w-full h-full rounded-none z-[110]' : 'w-full max-w-6xl h-[85vh]'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shadow-sm relative z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-3 truncate">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Icons.Gamepad2 size={20} />
            </div>
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={reload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Reload Activity">
                <Icons.RefreshCw size={18} />
            </button>
            <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block" title="Toggle Fullscreen">
                {isFullscreen ? <Icons.Minimize size={18} /> : <Icons.Maximize size={18} />}
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors" title="Close">
                <Icons.X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white relative overflow-hidden">
             <iframe 
                key={key}
                srcDoc={htmlContent}
                title="Interactive Content"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-pointer-lock"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
             />
        </div>
      </div>
    </div>
  );
};

export default HTMLViewer;