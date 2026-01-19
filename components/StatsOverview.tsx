
import React from 'react';
import { UserStats } from '../types';
import * as Icons from 'lucide-react';
import BadgeGrid from './BadgeGrid';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsOverviewProps {
  stats: UserStats;
}

const LEADERBOARD_DATA = [
  { name: 'Alex M.', xp: 5400, avatar: 'bg-blue-500' },
  { name: 'Sarah J.', xp: 4850, avatar: 'bg-purple-500' },
  { name: 'You', xp: 0, avatar: 'bg-brand-500' }, 
  { name: 'Jordan T.', xp: 3200, avatar: 'bg-green-500' },
  { name: 'Casey R.', xp: 2900, avatar: 'bg-yellow-500' },
];

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const progressToNextLevel = ((stats.currentXp / stats.nextLevelXp) * 100).toFixed(1);

  // Prepare chart data 
  const history = stats.dailyHistory || [];
  const chartData = [];
  for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = history.find(h => h.date === dateStr);
      chartData.push({
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          xp: entry ? entry.xpEarned : 0
      });
  }

  // Inject user into leaderboard
  const leaderboard = LEADERBOARD_DATA.map(u => u.name === 'You' ? { ...u, xp: stats.currentXp } : u)
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-8 mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Level Hero Card */}
        <div className="lg:col-span-2 relative rounded-[32px] p-8 md:p-10 overflow-hidden shadow-2xl group border border-white/10">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none group-hover:bg-brand-500/30 transition-colors duration-700"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-indigo-200 mb-6 backdrop-blur-md shadow-lg">
                <Icons.Crown size={14} className="text-yellow-400 drop-shadow-md" /> 
                Level {stats.level} Scholar
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-sm">
                  Keep the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-300">Momentum</span>
              </h2>
              <p className="text-indigo-200/80 text-base max-w-md leading-relaxed font-medium">
                You're on a roll! Earn <span className="text-white font-bold">{stats.nextLevelXp - stats.currentXp} more XP</span> to reach Level {stats.level + 1} and unlock new gear.
              </p>
              
              <div className="mt-10">
                 <div className="flex justify-between text-xs font-bold text-indigo-200/60 mb-3 tracking-widest uppercase">
                      <span>XP Progress</span>
                      <span className="text-white">{stats.currentXp} <span className="text-indigo-500 mx-1">/</span> {stats.nextLevelXp}</span>
                 </div>
                 <div className="h-5 bg-slate-950/50 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-white/10 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] relative transition-all duration-1000 ease-out"
                        style={{ width: `${progressToNextLevel}%` }}
                      >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                 </div>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center shrink-0">
              <div className="w-36 h-36 rounded-full border border-white/10 bg-slate-900/50 backdrop-blur-xl flex items-center justify-center shadow-2xl relative">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full"></div>
                
                <div className="text-center relative z-10">
                    <span className="block text-5xl font-black text-white drop-shadow-lg tracking-tighter">{stats.level}</span>
                    <span className="block text-[10px] uppercase font-bold text-indigo-300 mt-1 tracking-widest">Level</span>
                </div>
                {/* Circular Progress Spinner decorative */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-2">
                    <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-800/50" />
                    <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="6" fill="none" className="text-brand-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)] transition-all duration-1000 ease-out" strokeDasharray="280" strokeDashoffset={280 - (280 * Number(progressToNextLevel)) / 100} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] flex flex-col overflow-hidden shadow-2xl hover:border-slate-700 transition-colors">
           <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl">
               <h3 className="font-bold text-white text-base flex items-center gap-2"><Icons.Activity size={18} className="text-emerald-400"/> Activity</h3>
               <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-xl text-orange-400 text-xs font-bold border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                   <Icons.Flame size={14} fill="currentColor" /> {stats.streakDays} Day Streak
               </div>
           </div>
           
           <div className="flex-1 w-full min-w-0 bg-slate-950/50 relative p-2">
               <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: '12px' }}
                        itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                  </AreaChart>
               </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BadgeGrid earnedBadgeIds={stats.earnedBadges || []} />
        
        {/* Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Icons.TrendingUp size={20} /></div>
                    Leaderboard
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">Weekly Top</span>
            </div>
            
            <div className="space-y-4">
                {leaderboard.map((user, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${user.name === 'You' ? 'bg-brand-500/10 border-brand-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)] translate-x-2' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/60'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 flex items-center justify-center font-black text-sm rounded-lg shadow-inner ${idx < 3 ? 'text-slate-900 bg-gradient-to-br from-yellow-300 to-yellow-500' : 'text-slate-500 bg-slate-800 border border-slate-700'}`}>
                                {idx + 1}
                            </div>
                            <div className={`w-10 h-10 rounded-full ${user.avatar} flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white/10`}>
                                {user.name.charAt(0)}
                            </div>
                            <span className={`font-bold text-sm ${user.name === 'You' ? 'text-white' : 'text-slate-300'}`}>{user.name}</span>
                        </div>
                        <span className={`text-sm font-mono font-bold ${user.name === 'You' ? 'text-brand-300' : 'text-slate-500'}`}>{user.xp.toLocaleString()} XP</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
    