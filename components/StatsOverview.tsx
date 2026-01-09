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
  { name: 'You', xp: 0, avatar: 'bg-brand-500' }, // Will be updated with real XP
  { name: 'Jordan T.', xp: 3200, avatar: 'bg-green-500' },
  { name: 'Casey R.', xp: 2900, avatar: 'bg-yellow-500' },
];

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const progressToNextLevel = ((stats.currentXp / stats.nextLevelXp) * 100).toFixed(1);

  // Prepare chart data (ensure today is included)
  const history = stats.dailyHistory || [];
  
  // Create last 7 days array
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

  // Inject user into leaderboard and sort
  const leaderboard = LEADERBOARD_DATA.map(u => u.name === 'You' ? { ...u, xp: stats.currentXp } : u)
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Level Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-900 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Icons.Zap size={150} className="text-brand-400 transform rotate-12" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div>
              <p className="text-brand-300 font-medium mb-1 flex items-center gap-2">
                <Icons.Crown size={16} /> Level {stats.level}
              </p>
              <h2 className="text-3xl font-bold text-white mb-2">Master Learner</h2>
              <p className="text-slate-400 text-sm">Keep up the streak! You are unstoppable.</p>
            </div>

            <div className="hidden sm:block">
              <div className="w-20 h-20 rounded-full border-4 border-slate-800 bg-slate-700 flex items-center justify-center shadow-lg relative">
                <span className="text-2xl font-bold text-white">{stats.level}</span>
                <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin-slow" />
              </div>
            </div>
          </div>

          <div className="relative z-10">
             <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">XP Progress</span>
                  <span className="text-brand-200">{stats.currentXp} / {stats.nextLevelXp}</span>
             </div>
             <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
             </div>
          </div>
        </div>

        {/* Analytics & Streak */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
               <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2"><Icons.Activity size={16}/> Weekly Activity</h3>
               <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded text-amber-500 text-xs font-bold border border-amber-500/20">
                   <Icons.Flame size={12} fill="currentColor" /> {stats.streakDays} Day Streak
               </div>
           </div>
           
           {/* CRITICAL FIX: Explicit height, min-width, and NO padding on the container to prevent Recharts calculation errors */}
           <div className="h-[200px] w-full min-w-0 bg-slate-900/50">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#818cf8' }}
                        cursor={{ stroke: '#64748b', strokeWidth: 1 }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorXp)" />
                  </AreaChart>
               </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gamification Badge Grid */}
        <BadgeGrid earnedBadgeIds={stats.earnedBadges || []} />
        
        {/* Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Icons.TrendingUp className="text-emerald-400" /> Global Leaderboard
            </h3>
            <div className="space-y-3">
                {leaderboard.map((user, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${user.name === 'You' ? 'bg-brand-900/20 border-brand-500/30' : 'bg-slate-800/50 border-slate-800'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${idx < 3 ? 'text-slate-900 bg-yellow-400' : 'text-slate-500 bg-slate-800'}`}>
                                {idx + 1}
                            </div>
                            <div className={`w-8 h-8 rounded-full ${user.avatar} flex items-center justify-center text-xs font-bold text-white`}>
                                {user.name.charAt(0)}
                            </div>
                            <span className={`font-medium text-sm ${user.name === 'You' ? 'text-white' : 'text-slate-400'}`}>{user.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{user.xp} XP</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;