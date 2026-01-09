import React, { useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Badge } from '../types';
import Button from './Button';

interface CelebrationModalProps {
  badge: Badge;
  onClose: () => void;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({ badge, onClose }) => {
  // Simple icon resolver
  const IconComponent = (Icons as any)[badge.iconName] || Icons.Star;

  useEffect(() => {
    // Optional: Add simple sound effect or additional confetti library trigger here
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-slate-900 border border-brand-500/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(79,70,229,0.3)] p-8 text-center animate-bounce-short">
        
        {/* Confetti Decoration (CSS only for simplicity) */}
        <div className="absolute -top-10 -left-10 text-yellow-400 animate-pulse delay-100"><Icons.Sparkles size={40} /></div>
        <div className="absolute -bottom-5 -right-5 text-brand-400 animate-pulse delay-300"><Icons.Sparkles size={32} /></div>
        <div className="absolute top-10 right-0 text-accent-400 animate-pulse delay-75"><Icons.Star size={24} /></div>

        <div className="mb-6 flex justify-center">
            <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border-4 border-brand-500 shadow-xl">
                <IconComponent size={64} className={badge.color} />
            </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Badge Unlocked!</h2>
        <h3 className={`text-xl font-bold mb-4 ${badge.color}`}>{badge.title}</h3>
        <p className="text-slate-400 mb-8">{badge.description}</p>

        <Button onClick={onClose} className="w-full bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 border-none">
            Awesome!
        </Button>
      </div>
    </div>
  );
};

export default CelebrationModal;