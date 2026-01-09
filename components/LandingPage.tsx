import React from 'react';
import * as Icons from 'lucide-react';
import Button from './Button';
import { hasApiKey } from '../services/geminiService';

interface LandingPageProps {
  onSelectRole: (role: 'student' | 'teacher') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  const isConfigured = hasApiKey();

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 overflow-x-hidden selection:bg-brand-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="bg-brand-600 p-1.5 rounded-lg">
                    <Icons.Compass className="text-white" size={24} />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white">QuestHub</span>
              </div>
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                  <a href="#features" className="hover:text-white transition-colors">Features</a>
                  <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                  <a href="#" className="hover:text-white transition-colors">Pricing</a>
              </div>
              <Button onClick={() => onSelectRole('student')} variant="primary" size="sm">
                  Launch App
              </Button>
          </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-brand-500/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-brand-400 mb-6 animate-fadeIn">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>
                  V2.0 is now live with Gemini AI
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                  Turn any topic into a <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400">Gamified Adventure</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Stop reading static textbooks. QuestHub uses AI to generate interactive lessons, quizzes, simulations, and roleplay scenarios instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => onSelectRole('student')}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all transform hover:scale-105 shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2"
                  >
                      Start Learning Now <Icons.ArrowRight size={20} />
                  </button>
                  <button 
                    onClick={() => onSelectRole('teacher')}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-xl border border-slate-800 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                      <Icons.LayoutDashboard size={20} /> Teacher Dashboard
                  </button>
              </div>

              {!isConfigured && (
                  <p className="mt-4 text-xs text-slate-500">
                      * Requires Gemini API Key (BYOK)
                  </p>
              )}
          </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-slate-950 relative border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                      { icon: Icons.BrainCircuit, title: "AI Tutor Personas", desc: "Chat with a Socratic guide, a cheerleader, or even a 'Roast Master' to check your understanding." },
                      { icon: Icons.Gamepad2, title: "Instant Simulations", desc: "Don't just read about gravity—interact with a physics simulation generated on the fly." },
                      { icon: Icons.Trophy, title: "RPG Progression", desc: "Earn XP, unlock badges, and maintain streaks. Learning feels like leveling up in a game." }
                  ].map((feature, i) => (
                      <div key={i} className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-brand-500/30 transition-colors group">
                          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-brand-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                              {React.createElement(feature.icon, { size: 24 })}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                          <p className="text-slate-400 leading-relaxed">
                              {feature.desc}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
              <Icons.Compass size={20} />
              <span className="font-bold">QuestHub</span>
          </div>
          <p className="text-slate-600 text-sm">
              &copy; {new Date().getFullYear()} Learning Quest Hub. Built with Gemini AI.
          </p>
      </footer>
    </div>
  );
};

export default LandingPage;