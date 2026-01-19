
import React from 'react';
import * as Icons from 'lucide-react';
import { ViewType } from '../types';

interface NavigationProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  role: 'student' | 'teacher';
  onToggleRole: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView, role, onToggleRole }) => {
  
  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Home', icon: Icons.LayoutDashboard },
    { id: 'explore', label: 'Explore', icon: Icons.Compass },
    { id: 'vault', label: 'Vault', icon: Icons.Archive },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-24 flex-col items-center py-8 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 z-50 justify-between h-screen fixed left-0 top-0">
        <div className="flex flex-col items-center w-full gap-8">
            {/* Logo */}
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative p-3 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-2xl shadow-xl shadow-brand-500/10 ring-1 ring-white/10 cursor-pointer hover:scale-105 transition-transform">
                   <Icons.Compass className="text-white" size={28} />
                </div>
            </div>
            
            {/* Nav Items */}
            <div className="flex flex-col gap-4 w-full px-3">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onChangeView(item.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 group relative ${
                            currentView === item.id 
                            ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        <div className={`relative ${currentView === item.id ? 'text-brand-300' : ''}`}>
                            <item.icon 
                                size={24} 
                                strokeWidth={currentView === item.id ? 2.5 : 2} 
                                className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}
                            />
                            {currentView === item.id && (
                                <div className="absolute inset-0 bg-brand-400 blur-lg opacity-40"></div>
                            )}
                        </div>
                        <span className={`text-[10px] font-medium mt-1.5 transition-opacity ${currentView === item.id ? 'opacity-100 text-white' : 'opacity-70 group-hover:opacity-100'}`}>
                            {item.label}
                        </span>
                        
                        {currentView === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-r-full shadow-[0_0_15px_#6366f1]" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Role Switcher */}
        <div className="flex flex-col gap-6 items-center mb-4 w-full">
             <div className="w-12 h-[1px] bg-white/10"></div>
             
             <button 
                onClick={onToggleRole}
                className={`p-3 rounded-2xl transition-all relative group overflow-hidden ${role === 'teacher' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:border-brand-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'}`}
             >
                 {role === 'teacher' ? <Icons.GraduationCap size={24} /> : <Icons.User size={24} />}
                 
                 {/* Tooltip */}
                 <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0 shadow-xl z-50">
                     <span className="font-bold block mb-0.5 text-brand-200">{role === 'teacher' ? 'Teacher Mode' : 'Student Mode'}</span>
                     <span className="text-slate-400">Click to switch</span>
                 </div>
             </button>
             
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-slate-800 shadow-lg cursor-pointer hover:ring-brand-500/50 transition-all border border-white/5">
                 ME
             </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe shadow-2xl">
          <div className="flex justify-around items-center h-20 px-2">
             {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onChangeView(item.id)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-95 ${
                        currentView === item.id ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <div className={`p-2 rounded-xl transition-all relative ${currentView === item.id ? 'bg-brand-500/10 -translate-y-1' : 'bg-transparent'}`}>
                        <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
                        {currentView === item.id && <div className="absolute inset-0 bg-brand-400 blur opacity-20 rounded-xl"></div>}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 transition-all ${currentView === item.id ? 'opacity-100 text-white' : 'opacity-0 h-0'}`}>{item.label}</span>
                </button>
            ))}
            <button
                onClick={onToggleRole}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${role === 'teacher' ? 'text-purple-400' : 'text-slate-500'}`}
            >
                <div className={`p-2 rounded-xl bg-slate-800/50 border border-white/5`}>
                    {role === 'teacher' ? <Icons.GraduationCap size={24} /> : <Icons.UserCircle size={24} />}
                </div>
                <span className="text-[10px] font-medium mt-1 opacity-0 h-0">Role</span>
            </button>
          </div>
      </nav>
    </>
  );
};

export default Navigation;
    