import React from 'react';
import * as Icons from 'lucide-react';
import { Badge } from '../types';
import { BADGES } from '../constants';

interface BadgeGridProps {
  earnedBadgeIds: string[];
}

const BadgeGrid: React.FC<BadgeGridProps> = ({ earnedBadgeIds }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icons.Award className="text-yellow-500" />
        Achievements
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {BADGES.map((badge) => {
          const isUnlocked = earnedBadgeIds.includes(badge.id);
          // Dynamically get icon component
          const IconComponent = (Icons as any)[badge.iconName] || Icons.Star;

          return (
            <div 
              key={badge.id}
              className={`relative group p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 ${
                isUnlocked 
                  ? 'bg-slate-800/50 border-slate-700 hover:border-brand-500/50 hover:bg-slate-800' 
                  : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale hover:opacity-75'
              }`}
            >
              <div className={`mb-3 p-3 rounded-full ${isUnlocked ? 'bg-slate-900 shadow-lg' : 'bg-slate-800'}`}>
                <IconComponent 
                  size={24} 
                  className={isUnlocked ? badge.color : 'text-slate-600'} 
                />
              </div>
              
              <h4 className={`text-xs font-bold mb-1 ${isUnlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                {badge.title}
              </h4>
              
              <div className="absolute inset-0 bg-slate-900/95 rounded-xl p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="text-[10px] text-slate-300">
                  {badge.description}
                  {!isUnlocked && <span className="block mt-1 text-slate-500 font-medium">Locked</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeGrid;