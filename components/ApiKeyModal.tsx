import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import Button from './Button';
import { setApiKey, hasApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceRequired?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, forceRequired }) => {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Determine initial state if key exists
    if (hasApiKey()) {
        const stored = localStorage.getItem('gemini_api_key_custom');
        if (stored) setKey(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (key.trim().length > 10) {
      setApiKey(key.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
      setApiKey('');
      setKey('');
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden">
        
        <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
                <Icons.Key size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Unlock AI Features</h2>
                <p className="text-slate-400 text-sm">Enter your Gemini API Key to continue.</p>
            </div>
        </div>

        <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm text-slate-400">
                <p className="mb-2">This app requires a Google Gemini API key to generate quests, quizzes, and tutoring.</p>
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
                >
                    Get a free API Key <Icons.ExternalLink size={12}/>
                </a>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    API Key
                </label>
                <input 
                    type="password" 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                />
            </div>

            <div className="flex gap-3 pt-2">
                {!forceRequired && (
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                )}
                {hasApiKey() && (
                    <Button variant="danger" onClick={handleClear} className="px-3">
                        <Icons.Trash2 size={16} />
                    </Button>
                )}
                <Button 
                    onClick={handleSave} 
                    disabled={key.length < 10}
                    className={`flex-1 ${saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
                >
                    {saved ? <span className="flex items-center gap-2"><Icons.Check size={16}/> Saved</span> : 'Save Key'}
                </Button>
            </div>
        </div>
        
        {forceRequired && (
             <p className="text-center text-xs text-slate-600 mt-4">
                 A key is required to start the demo.
             </p>
        )}
      </div>
    </div>
  );
};

export default ApiKeyModal;