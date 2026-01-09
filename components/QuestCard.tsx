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
      className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-brand-500/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-brand-900/20 hover:-translate-y-1 group relative overflow-hidden"
      onClick={() => onSelect(quest)}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-brand-500/10 transition-colors duration-500"></div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-wider font-bold ${DIFFICULTY_COLORS[quest.difficulty]}`}>
          {quest.difficulty}
        </span>
        <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
          <Icons.Tag size={12} /> {quest.category}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors line-clamp-1 pr-4">
        {quest.title}
      </h3>
      <p className="text-slate-400 text-sm mb-5 line-clamp-2 h-10 leading-relaxed">
        {quest.description}
      </p>

      <div className="space-y-2.5">
        <div className="flex justify-between text-xs font-medium text-slate-400">
          <span>Progress</span>
          <span className="text-brand-300">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
          <div 
            className="h-full bg-gradient-to-r from-brand-600 to-accent-500 transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Icons.ListTodo size={14} />
                {quest.tasks.filter(t => t.isCompleted).length}/{quest.tasks.length}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">
                <Icons.Trophy size={12} />
                <span>{quest.earnedXp} XP</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuestCard;