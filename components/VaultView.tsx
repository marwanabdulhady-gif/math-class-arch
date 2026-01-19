
import React, { useState } from 'react';
import { Quest } from '../types';
import * as Icons from 'lucide-react';
import { CATEGORIES } from '../constants';

interface VaultViewProps {
  quests: Quest[];
  onSelectQuest: (quest: Quest) => void;
  onDeleteQuest: (id: string) => void;
}

const VaultView: React.FC<VaultViewProps> = ({ quests, onSelectQuest, onDeleteQuest }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter Logic
  const filteredQuests = quests.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
      return matchesSearch && matchesCategory;
  });

  // Sort Logic
  const sortedQuests = [...filteredQuests].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'az') return a.title.localeCompare(b.title);
      return 0;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Icons.Archive className="text-brand-500" size={32} /> The Vault
        </h1>
        <p className="text-slate-400">Your secure library of saved Lesson DNA and Learning Quests.</p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-900 border border-slate-800 p-4 rounded-xl items-center">
          <div className="relative flex-1 w-full">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:border-brand-500 outline-none"
                placeholder="Search units..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
              <select 
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
              >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="az">A-Z</option>
              </select>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedQuests.map(quest => (
            <div 
                key={quest.id} 
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-hidden cursor-pointer"
                onClick={() => onSelectQuest(quest)}
            >
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur-lg"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-brand-500/30 transition-colors">
                            <Icons.BookOpen size={24} className="text-brand-400" />
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm('Delete this unit?')) onDeleteQuest(quest.id); }}
                                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                             >
                                 <Icons.Trash2 size={16} />
                             </button>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-brand-300 transition-colors">{quest.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{quest.description}</p>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-500 border-t border-slate-800 pt-4">
                        <div className="flex items-center gap-1.5">
                            <Icons.ListTodo size={14} /> {quest.tasks.length} Lessons
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Icons.Tag size={14} /> {quest.category}
                        </div>
                    </div>
                </div>
            </div>
        ))}
        
        {quests.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                <Icons.Archive size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500">Your vault is empty. Create or generate quests to save them here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default VaultView;
