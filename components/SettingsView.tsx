import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import Button from './Button';
import { setApiKey, hasApiKey } from '../services/geminiService';
import { AppData } from '../types';
import { getStandardCurriculum } from '../defaultCurriculum';

interface SettingsViewProps {
  currentRole: 'student' | 'teacher';
  onToggleRole: () => void;
  onOpenAdmin: () => void;
  onUpdateData: (data: AppData) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  currentRole, 
  onToggleRole, 
  onOpenAdmin,
  onUpdateData
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    setHasExistingKey(hasApiKey());
    const stored = localStorage.getItem('gemini_api_key_custom');
    if (stored) setKeyInput(stored);
  }, []);

  const handleSaveKey = () => {
    if (keyInput.trim().length > 5) {
      setApiKey(keyInput.trim());
      setIsKeySaved(true);
      setHasExistingKey(true);
      setTimeout(() => setIsKeySaved(false), 2000);
    }
  };

  const handleRemoveKey = () => {
    if(confirm("Remove API Key? AI features will stop working.")) {
        setApiKey('');
        setKeyInput('');
        setHasExistingKey(false);
    }
  };

  const handleResetData = () => {
      if(confirm("DANGER: This will wipe all your progress and custom quests. Are you sure?")) {
          const standard = getStandardCurriculum();
          onUpdateData(standard);
          alert("App reset to factory settings.");
      }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-fadeIn pb-24">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your preferences, connections, and data.</p>
      </div>

      {/* API Configuration */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
            <Icons.Cpu size={120} className="text-brand-500" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Icons.Key className="text-brand-400" /> AI Configuration
        </h2>
        
        <div className="space-y-4 relative z-10">
            <p className="text-sm text-slate-400">
                To enable the AI Tutor, Quest Generation, and Quiz creation, you must provide a Google Gemini API Key.
                <br/>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Get a key here</a>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="password" 
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter your API Key (AIza...)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                />
                <Button onClick={handleSaveKey} disabled={keyInput.length < 5}>
                    {isKeySaved ? <span className="flex items-center gap-2"><Icons.Check size={16}/> Saved</span> : 'Save Key'}
                </Button>
            </div>

            {hasExistingKey && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/20">
                    <Icons.ShieldCheck size={16} />
                    <span className="flex-1">API Key is active and secured locally.</span>
                    <button onClick={handleRemoveKey} className="text-slate-400 hover:text-red-400 text-xs underline">Remove</button>
                </div>
            )}
        </div>
      </section>

      {/* Role & Mode */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icons.UserCircle className="text-blue-400" /> Account Mode
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                  <h3 className="font-bold text-white">Teacher Mode</h3>
                  <p className="text-xs text-slate-500">Enables Curriculum Management and Admin Tools.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={currentRole === 'teacher'} onChange={onToggleRole} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
          </div>

          {currentRole === 'teacher' && (
              <div className="mt-4">
                  <Button variant="secondary" onClick={onOpenAdmin} className="w-full justify-between group">
                      <span>Open Curriculum Manager</span>
                      <Icons.ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
              </div>
          )}
      </section>

      {/* Data Management */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
           <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icons.Database className="text-red-400" /> Data Zone
          </h2>
          <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
               <h3 className="text-red-400 font-bold text-sm mb-2">Danger Zone</h3>
               <p className="text-slate-400 text-xs mb-4">Resetting will delete all progress, custom quests, and history. This cannot be undone.</p>
               <Button variant="danger" onClick={handleResetData} className="w-full">
                   Factory Reset App
               </Button>
          </div>
      </section>

      <div className="text-center text-xs text-slate-600 pt-8">
          Learning Quest Hub v2.1 • Built with Google Gemini
      </div>

    </div>
  );
};

export default SettingsView;