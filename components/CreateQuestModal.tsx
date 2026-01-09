import React, { useState } from 'react';
import { CreateQuestPayload, LoadingState } from '../types';
import Button from './Button';
import * as Icons from 'lucide-react';
import { CATEGORIES } from '../constants';

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateQuestPayload) => Promise<void>;
  loadingState: LoadingState;
}

const CreateQuestModal: React.FC<CreateQuestModalProps> = ({ isOpen, onClose, onCreate, loadingState }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ topic, difficulty, additionalNotes: notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Icons.Sparkles className="text-brand-500" size={20} />
              Craft New Quest
            </h2>
            <p className="text-sm text-slate-400 mt-1">AI will generate a personalized learning path.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <Icons.X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              What do you want to learn?
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Advanced React Patterns, Ancient Roman History..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    difficulty === level
                      ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Additional Context (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., I prefer hands-on coding tasks, or I want to focus on theory."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all h-24 resize-none placeholder:text-slate-600"
            />
          </div>
          
          {loadingState === LoadingState.ERROR && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
               <Icons.AlertCircle size={16} />
               Failed to generate quest. Please verify API availability.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loadingState === LoadingState.LOADING}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            isLoading={loadingState === LoadingState.LOADING}
            className="w-32"
          >
            {loadingState === LoadingState.LOADING ? 'Generating...' : 'Start Quest'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestModal;