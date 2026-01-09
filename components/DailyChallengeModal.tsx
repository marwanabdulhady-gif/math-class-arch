import React from 'react';
import { Task } from '../types';
import * as Icons from 'lucide-react';
import Button from './Button';

interface DailyChallengeModalProps {
  task: Task;
  onAccept: () => void;
  onClose: () => void;
}

const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ task, onAccept, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(99,102,241,0.3)] overflow-hidden relative animate-bounce-short">
        
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Icons.Zap size={120} className="text-white transform rotate-12" />
        </div>

        <div className="p-6 text-center relative z-10">
          <div className="inline-block p-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/40 mb-4 animate-pulse-slow">
             <Icons.Flame size={32} className="text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Daily Challenge!</h2>
          <p className="text-indigo-200 text-sm mb-6">Complete this quick task to keep your streak alive and earn bonus XP.</p>
          
          <div className="bg-slate-950/50 rounded-xl p-4 border border-indigo-500/20 mb-6 text-left">
              <h3 className="font-bold text-white mb-1">{task.title}</h3>
              <p className="text-sm text-slate-400 mb-3">{task.description}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-400/10 w-fit px-2 py-1 rounded border border-amber-400/20">
                  <Icons.Trophy size={12} /> {task.xp} XP Bonus
              </div>
          </div>

          <div className="flex gap-3">
             <Button variant="ghost" onClick={onClose} className="flex-1">Maybe Later</Button>
             <Button onClick={onAccept} className="flex-1 bg-indigo-500 hover:bg-indigo-400 border-none">Accept Challenge</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengeModal;