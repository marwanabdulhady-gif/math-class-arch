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
    { id: 'dashboard', label: 'Dashboard', icon: Icons.LayoutDashboard },
    { id: 'explore', label: 'Explore', icon: Icons.Compass },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-20 flex-col items-center py-6 bg-slate-900 border-r border-slate-800 z-50 justify-between">
        <div className="flex flex-col items-center w-full">
            <div className="mb-8 p-2.5 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl shadow-lg shadow-brand-500/20">
               <Icons.Compass className="text-white" size={28} />
            </div>
            
            <div className="flex flex-col gap-6 w-full px-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onChangeView(item.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group relative ${
                            currentView === item.id 
                            ? 'bg-slate-800 text-brand-400 shadow-inner' 
                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                        title={item.label}
                    >
                        <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-1">{item.label}</span>
                        
                        {currentView === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-r-full shadow-[0_0_10px_#6366f1]" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* User / Role Switcher */}
        <div className="flex flex-col gap-4 items-center mb-4">
             <button 
                onClick={onToggleRole}
                className={`p-2 rounded-lg transition-all relative group ${role === 'teacher' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'}`}
                title={`Current Mode: ${role.charAt(0).toUpperCase() + role.slice(1)}. Click to Switch.`}
             >
                 {role === 'teacher' ? <Icons.GraduationCap size={24} /> : <Icons.User size={24} />}
                 <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-slate-700 pointer-events-none transition-opacity">
                     Switch to {role === 'teacher' ? 'Student' : 'Teacher'}
                 </div>
             </button>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                 ME
             </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 pb-safe">
          <div className="flex justify-around items-center h-16 px-2">
             {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onChangeView(item.id)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                        currentView === item.id ? 'text-brand-400' : 'text-slate-500'
                    }`}
                >
                    <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} className={currentView === item.id ? 'animate-bounce-short' : ''} />
                    <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </button>
            ))}
            <button
                onClick={onToggleRole}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${role === 'teacher' ? 'text-purple-400' : 'text-slate-500'}`}
            >
                {role === 'teacher' ? <Icons.GraduationCap size={24} /> : <Icons.UserCircle size={24} />}
                <span className="text-[10px] font-medium mt-1">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
            </button>
          </div>
      </nav>
    </>
  );
};

export default Navigation;