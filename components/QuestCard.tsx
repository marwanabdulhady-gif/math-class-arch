
import React from 'react';
import { Quest } from '../types';
import * as Icons from 'lucide-react';
import { DIFFICULTY_COLORS } from '../constants';

interface QuestCardProps {
  quest: Quest;
  onSelect: (quest: Quest) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onSelect }) => {
  const progress = Math.round((quest.earnedXp / quest.totalXp) * 100);

  return (
    <div 
      className="group relative flex flex-col h-full bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/5 p-1 hover:border-brand-500/30 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-brand-900/20 hover:-translate-y-1 overflow-hidden"
      onClick={() => onSelect(quest)}
    >
      {/* Inner Content Wrapper */}
      <div className="flex-1 flex flex-col bg-slate-950/50 rounded-[20px] p-6 overflow-hidden relative z-10">
          
          {/* Animated Background Gradient on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/0 group-hover:from-brand-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
          
          {/* Top Right Glow Orb */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-[40px] group-hover:bg-brand-500/20 transition-all duration-500"></div>

          {/* Header: Difficulty & Status */}
          <div className="flex justify-between items-start mb-5 relative z-10">
            <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${DIFFICULTY_COLORS[quest.difficulty]} backdrop-blur-md shadow-sm`}>
              {quest.difficulty}
            </span>
            {quest.isCompleted ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <Icons.Check size={14} strokeWidth={3} />
                </span>
            ) : (
                <span className="text-slate-600 group-hover:text-brand-400 transition-colors">
                    <Icons.ChevronRight size={20} />
                </span>
            )}
          </div>

          {/* Title & Desc */}
          <div className="flex-1 relative z-10">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-300 transition-colors leading-tight">
                {quest.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4 group-hover:text-slate-300 transition-colors">
                {quest.description}
              </p>
          </div>

          {/* Progress & Meta */}
          <div className="mt-auto space-y-4 relative z-10">
            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <span className="group-hover:text-white transition-colors">Progress</span>
                  <span className="text-brand-400">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-700 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2 group-hover:text-slate-300 transition-colors">
                    <Icons.Layers size={14} className="text-brand-500/70"/>
                    {quest.tasks.length} Modules
                </div>
                <div className="flex items-center gap-2 group-hover:text-slate-300 transition-colors">
                    <Icons.Zap size={14} className="text-yellow-500/70"/>
                    {quest.earnedXp}/{quest.totalXp} XP
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default QuestCard;
    