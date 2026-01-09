import React from 'react';
import { Year } from '../types';
import * as Icons from 'lucide-react';

interface GradeSelectorProps {
  years: Year[];
  onSelect: (yearId: string) => void;
}

interface GradeButtonProps {
  year: Year;
  onSelect: (yearId: string) => void;
  colorClass: string;
}

const GradeButton: React.FC<GradeButtonProps> = ({ year, onSelect, colorClass }) => {
  return (
      <button
          onClick={() => onSelect(year.id)}
          className={`relative overflow-hidden group p-6 rounded-2xl border border-slate-700 bg-gradient-to-br ${colorClass} hover:scale-105 transition-all duration-300 shadow-xl`}
      >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <Icons.BookOpen size={64} />
          </div>
          <div className="relative z-10 text-left">
              <h3 className="text-2xl font-bold text-white mb-1">{year.title}</h3>
              <p className="text-white/80 text-sm font-medium">Click to Enter</p>
          </div>
      </button>
  );
};

const GradeSelector: React.FC<GradeSelectorProps> = ({ years, onSelect }) => {
  // Group years for better visual layout
  const elementary = years.filter(y => y.title.includes('Kindergarten') || y.title.includes('Grade 1') || y.title.includes('Grade 2') || y.title.includes('Grade 3') || y.title.includes('Grade 4') || y.title.includes('Grade 5'));
  const middle = years.filter(y => y.title.includes('Grade 6') || y.title.includes('Grade 7') || y.title.includes('Grade 8'));
  const high = years.filter(y => !elementary.includes(y) && !middle.includes(y));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn">
        <div className="max-w-6xl w-full">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-full mb-6 border border-slate-800">
                    <Icons.GraduationCap size={48} className="text-brand-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Select Your Grade Level</h1>
                <p className="text-xl text-slate-400">Where would you like to start your learning journey?</p>
            </div>

            <div className="space-y-12">
                {/* Elementary */}
                <div>
                    <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Elementary School</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {elementary.map(y => (
                            <GradeButton 
                                key={y.id} 
                                year={y} 
                                onSelect={onSelect} 
                                colorClass="from-emerald-600 to-teal-800" 
                            />
                        ))}
                    </div>
                </div>

                {/* Middle */}
                <div>
                    <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Middle School</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {middle.map(y => (
                            <GradeButton 
                                key={y.id} 
                                year={y} 
                                onSelect={onSelect} 
                                colorClass="from-blue-600 to-indigo-800" 
                            />
                        ))}
                    </div>
                </div>

                {/* High */}
                <div>
                    <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">High School</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {high.map(y => (
                            <GradeButton 
                                key={y.id} 
                                year={y} 
                                onSelect={onSelect} 
                                colorClass="from-purple-600 to-fuchsia-800" 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default GradeSelector;