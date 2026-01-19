
import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Quest, UserStats, LoadingState, CreateQuestPayload, Task, Year, AppData, Badge, ViewType, ClassGroup, Student } from './types';
import { LEVELS, BADGES } from './constants';
import { generateQuest, generateDailyChallenge, hasApiKey } from './services/geminiService';
import StatsOverview from './components/StatsOverview';
import TeacherDashboard from './components/TeacherDashboard';
import QuestCard from './components/QuestCard';
import CreateQuestModal from './components/CreateQuestModal';
import TaskItem from './components/TaskItem';
import Button from './components/Button';
import CelebrationModal from './components/CelebrationModal';
import LandingPage from './components/LandingPage';
import DailyChallengeModal from './components/DailyChallengeModal';
import ApiKeyModal from './components/ApiKeyModal';
import Navigation from './components/Navigation';
import SettingsView from './components/SettingsView';
import GradeSelector from './components/GradeSelector';
import VaultView from './components/VaultView'; 
import { getStandardCurriculum } from './defaultCurriculum';
import { motion, AnimatePresence } from 'framer-motion';

// Utility for persistence - UPDATED TO V18 TO FORCE RESET
const STORAGE_KEY = 'learning_quest_hub_data_v18'; 
const DAILY_CHALLENGE_KEY = 'daily_challenge_date';

// Simple Toast Notification Component
const ToastNotification: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 z-[200] backdrop-blur-md ${type === 'success' ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-400' : 'bg-slate-900/90 border-red-500/30 text-red-400'}`}
        >
            {type === 'success' ? <Icons.CheckCircle size={20} /> : <Icons.AlertCircle size={20} />}
            <span className="font-medium text-sm text-white">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><Icons.X size={16} /></button>
        </motion.div>
    );
};

const App: React.FC = () => {
  // --- STATE ---
  const [appView, setAppView] = useState<'landing' | 'app'>('landing');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  // Data
  const [quests, setQuests] = useState<Quest[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<UserStats>({
    level: 1, currentXp: 0, nextLevelXp: LEVELS[1], totalQuestsCompleted: 0, streakDays: 1, earnedBadges: [], dailyHistory: []
  });

  // UI Selection State
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string | null>(null);
  const [hasSelectedGrade, setHasSelectedGrade] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Async State
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [dailyChallenge, setDailyChallenge] = useState<Task | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.quests || parsed.quests.length === 0 || !parsed.years || parsed.years.length < 5) {
            loadStandard();
        } else {
            setQuests(parsed.quests || []);
            setYears(parsed.years || []);
            setClasses(parsed.classes || []);
            setStudents(parsed.students || []);
            setStats(parsed.stats || getStandardCurriculum().stats);
        }
      } catch (e) { loadStandard(); }
    } else {
        loadStandard();
    }
  }, []);

  const loadStandard = () => {
      const standard = getStandardCurriculum();
      setQuests(standard.quests);
      setYears(standard.years);
      setClasses(standard.classes);
      setStudents(standard.students);
      setStats(standard.stats);
  };

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests, stats, years, classes, students }));
    } catch (e) {
        console.error("Storage limit reached or error saving data", e);
    }
  }, [quests, stats, years, classes, students]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setNotification({ msg, type });
  };

  // --- BUSINESS LOGIC: CRUD ---

  const addClass = (title: string, yearId: string) => {
      const newClass: ClassGroup = {
          id: uuidv4(),
          title,
          yearId,
          studentIds: []
      };
      setClasses(prev => [...prev, newClass]);
      showToast(`Class "${title}" created`);
  };

  const deleteClass = (id: string) => {
      setClasses(prev => prev.filter(c => c.id !== id));
      showToast('Class deleted');
  };

  const addStudent = (name: string, classId: string) => {
      const newStudent: Student = {
          id: uuidv4(),
          name,
          email: `${name.toLowerCase().replace(/\s/g,'.')}@school.edu`,
          xp: 0, level: 1, streak: 0, completedTasks: 0, lastActive: new Date().toISOString(), status: 'active'
      };
      
      setStudents(prev => [...prev, newStudent]);
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentIds: [...c.studentIds, newStudent.id] } : c));
      showToast(`Student ${name} enrolled`);
  };

  const addStudentBulk = (names: string[], classId: string) => {
      const newStudents: Student[] = names.map(name => ({
          id: uuidv4(),
          name: name.trim(),
          email: `${name.toLowerCase().replace(/\s/g,'.')}@school.edu`,
          xp: 0, level: 1, streak: 0, completedTasks: 0, lastActive: new Date().toISOString(), status: 'active'
      }));

      setStudents(prev => [...prev, ...newStudents]);
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentIds: [...c.studentIds, ...newStudents.map(s => s.id)] } : c));
      showToast(`${newStudents.length} students enrolled`);
  };

  const deleteStudent = (id: string, classId: string) => {
      setStudents(prev => prev.filter(s => s.id !== id));
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentIds: c.studentIds.filter(sid => sid !== id) } : c));
      showToast('Student removed from roster');
  };

  const handleUpdateQuest = (updated: Quest) => {
    setQuests(prev => prev.map(q => q.id === updated.id ? updated : q));
    showToast('Curriculum updated');
  };

  const handleAddQuest = (newQuest: Quest) => {
    setQuests(prev => [newQuest, ...prev]);
    showToast('New Unit added');
  };
  
  const handleDeleteQuest = (id: string) => {
      setQuests(prev => prev.filter(q => q.id !== id));
      showToast('Unit removed from Vault');
  }

  // --- NAVIGATION LOGIC ---

  const handleGradeSelection = (yearId: string) => {
      setSelectedYearFilter(yearId);
      setHasSelectedGrade(true);
      setCurrentView('explore'); 
  };

  const handleToggleRole = () => {
      const newRole = role === 'student' ? 'teacher' : 'student';
      setRole(newRole);
      setCurrentView('dashboard');
      setSelectedQuestId(null);
      showToast(`Switched to ${newRole === 'student' ? 'Student' : 'Teacher'} View`);
  }

  const handleAdminUpdate = (d: Partial<AppData>) => {
      if(d.quests) setQuests([...d.quests]);
      if(d.years) setYears([...d.years]);
      if(d.stats) setStats({...d.stats});
      if(d.classes) setClasses([...d.classes]);
      if(d.students) setStudents([...d.students]);
  };

  // Daily Challenge logic ...
  useEffect(() => {
      if (appView === 'app' && role === 'student' && hasApiKey() && hasSelectedGrade) {
          const lastDate = localStorage.getItem(DAILY_CHALLENGE_KEY);
          const today = new Date().toISOString().split('T')[0];
          
          if (lastDate !== today) {
              const topics = quests.map(q => q.title);
              generateDailyChallenge(topics).then(challenge => {
                  setDailyChallenge(challenge);
                  setShowDailyModal(true);
              });
          }
      }
  }, [appView, role, hasSelectedGrade]);

  const acceptDailyChallenge = () => {
      if (!dailyChallenge) return;
      let dailyQuest = quests.find(q => q.title === "Daily Challenges");
      if (!dailyQuest) {
          dailyQuest = {
              id: uuidv4(), title: "Daily Challenges", description: "Quick tasks to keep your streak alive!",
              category: "General", difficulty: "Beginner", totalXp: dailyChallenge.xp, earnedXp: 0,
              tasks: [dailyChallenge], createdAt: new Date().toISOString(), status: 'active'
          };
          setQuests([dailyQuest, ...quests]);
          setSelectedQuestId(dailyQuest.id);
      } else {
          const updatedQuest = { ...dailyQuest, tasks: [dailyChallenge, ...dailyQuest.tasks], totalXp: dailyQuest.totalXp + dailyChallenge.xp };
          setQuests(quests.map(q => q.id === dailyQuest!.id ? updatedQuest : q));
          setSelectedQuestId(dailyQuest.id);
      }
      localStorage.setItem(DAILY_CHALLENGE_KEY, new Date().toISOString().split('T')[0]);
      setShowDailyModal(false);
      setCurrentView('explore');
      showToast('Daily Challenge Accepted!');
  };

  const handleCreateQuest = async (payload: CreateQuestPayload) => {
    setLoadingState(LoadingState.LOADING);
    try {
      const newQuest = await generateQuest(payload.topic, payload.difficulty, payload.additionalNotes);
      if (selectedYearFilter) newQuest.yearId = selectedYearFilter;
      handleAddQuest(newQuest);
      setLoadingState(LoadingState.SUCCESS);
      setIsCreateModalOpen(false);
      setSelectedQuestId(newQuest.id);
      setCurrentView('explore'); 
    } catch (error) {
      setLoadingState(LoadingState.ERROR);
      showToast('Failed to generate Quest', 'error');
    }
  };

  const handleTaskToggle = (questId: string, taskId: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id !== questId) return q;
      const task = q.tasks.find(t => t.id === taskId);
      if (!task) return q;
      const isCompleting = !task.isCompleted;
      const xpChange = isCompleting ? task.xp : -task.xp;
      if(isCompleting) updateStats(xpChange, 1);
      else updateStats(xpChange, -1);
      return { ...q, tasks: q.tasks.map(t => t.id === taskId ? { ...t, isCompleted: isCompleting } : t), earnedXp: q.earnedXp + xpChange };
    }));
  };

  const updateStats = (xpChange: number, questCountChange: number) => {
      setStats(prev => {
          const newXp = Math.max(0, prev.currentXp + xpChange);
          let newLevel = prev.level;
          while(newXp >= (LEVELS[newLevel] || Infinity)) newLevel++;
          const newHistory = [...prev.dailyHistory];
          if(xpChange > 0) {
              const today = new Date().toISOString().split('T')[0];
              const idx = newHistory.findIndex(h => h.date === today);
              if(idx >= 0) newHistory[idx].xpEarned += xpChange;
              else newHistory.push({ date: today, xpEarned: xpChange });
          }
          const newStats = { ...prev, currentXp: newXp, level: newLevel, nextLevelXp: LEVELS[newLevel] || LEVELS[LEVELS.length-1], dailyHistory: newHistory };
          return checkBadges(newStats);
      });
  };

  const checkBadges = (s: UserStats) => {
      const earned = new Set(s.earnedBadges);
      BADGES.forEach(b => {
          if(!earned.has(b.id)) {
              if ((b.criteria.type === 'xp' && s.currentXp >= b.criteria.threshold) ||
                  (b.criteria.type === 'streak' && s.streakDays >= b.criteria.threshold)) {
                  earned.add(b.id);
                  setNewlyUnlockedBadge(b);
              }
          }
      });
      return { ...s, earnedBadges: Array.from(earned) };
  };

  // --- RENDER HELPERS ---

  const renderDashboard = () => (
      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8 pb-32">
          {role === 'student' && (
              <>
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
                        <p className="text-slate-400 font-medium">
                            {selectedYearFilter 
                                ? `${years.find(y => y.id === selectedYearFilter)?.title}` 
                                : "Your Learning Hub"}
                        </p>
                    </div>
                    <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setHasSelectedGrade(false)} className="hidden sm:flex shadow-none border-slate-700 bg-slate-800/50">Change Grade</Button>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex shadow-lg shadow-brand-500/20"><Icons.Plus size={18} className="mr-2"/> New Unit</Button>
                    </div>
                </header>
                
                <StatsOverview stats={stats} />
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Icons.Clock className="text-brand-400" /> Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {quests.filter(q => q.earnedXp > 0 && q.earnedXp < q.totalXp).slice(0, 3).map(q => (
                            <div key={q.id} onClick={() => { setSelectedQuestId(q.id); setCurrentView('explore'); }} className="group cursor-pointer border border-slate-800 bg-slate-800/20 hover:bg-slate-800/50 hover:border-slate-700 rounded-2xl p-4 transition-all duration-300">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">{q.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Last updated just now</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-brand-400 bg-brand-900/20 px-2 py-1 rounded border border-brand-500/20">{Math.round((q.earnedXp/q.totalXp)*100)}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/50">
                                    <div className="bg-gradient-to-r from-brand-600 to-indigo-500 h-full rounded-full" style={{ width: `${(q.earnedXp/q.totalXp)*100}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {quests.filter(q => q.earnedXp > 0).length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                                <Icons.BookOpen className="mx-auto text-slate-700 mb-2" size={32} />
                                <p className="text-slate-500 text-sm italic">Start a quest to see activity here!</p>
                            </div>
                        )}
                    </div>
                </div>
              </>
          )}
      </div>
  );

  const renderExplorer = () => {
      const filteredQuests = selectedYearFilter ? quests.filter(q => q.yearId === selectedYearFilter) : quests;
      const currentYear = years.find(y => y.id === selectedYearFilter);

      // Detail View (Quest Open)
      if (selectedQuestId) {
          const quest = quests.find(q => q.id === selectedQuestId);
          if (!quest) return null;
          return (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col bg-slate-950">
                  {/* Quest Header */}
                  <div className="p-4 lg:p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-20 shadow-lg">
                      <button 
                        onClick={() => setSelectedQuestId(null)} 
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white border border-white/5 hover:border-brand-500/30 transition-all group flex items-center gap-2 pr-4 shrink-0"
                      >
                          <Icons.ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-white"/>
                          <span className="text-sm font-bold hidden sm:inline">Back</span>
                      </button>
                      <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-white text-lg sm:text-xl truncate">{quest.title}</h2>
                          <div className="flex items-center gap-3 text-xs font-medium text-slate-400 mt-0.5">
                             <span className="flex items-center gap-1"><Icons.ListTodo size={12}/> {quest.tasks.length} Steps</span>
                             <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                             <span className={quest.isCompleted ? "text-emerald-400 flex items-center gap-1" : "text-brand-400 flex items-center gap-1"}>
                                 {quest.isCompleted ? <Icons.CheckCircle size={12}/> : <Icons.Loader2 size={12} className={!quest.isCompleted ? "animate-spin-slow" : ""}/>}
                                 {quest.isCompleted ? "Completed" : "In Progress"}
                             </span>
                          </div>
                      </div>
                      <div className="text-xs font-bold text-brand-300 bg-brand-900/30 px-3 py-1.5 rounded-lg border border-brand-500/20 hidden sm:block shadow-inner shadow-brand-500/10">
                          {quest.earnedXp}/{quest.totalXp} XP
                      </div>
                  </div>
                  
                  {/* Quest Body */}
                  <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32 max-w-5xl mx-auto w-full">
                      <div className="mb-8 p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                           <h3 className="font-black text-2xl text-white mb-3 tracking-tight relative z-10">Mission Briefing</h3>
                           <p className="text-slate-400 leading-relaxed text-lg relative z-10 max-w-3xl">{quest.description}</p>
                      </div>

                      <div className="space-y-4">
                          {quest.tasks.map(task => (
                              <TaskItem 
                                  key={task.id} 
                                  task={task} 
                                  onToggle={() => handleTaskToggle(quest.id, task.id)}
                                  onUpdate={(t) => setQuests(prev => prev.map(q => q.id === quest.id ? {...q, tasks: q.tasks.map(ot => ot.id === t.id ? t : ot)} : q))}
                                  yearTitle={currentYear?.title} 
                              />
                          ))}
                      </div>
                  </div>
              </motion.div>
          );
      }

      // List View
      return (
          <div className="h-full flex flex-col bg-slate-950">
               <div className="p-6 lg:p-8 border-b border-white/5 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Explorer</h2>
                            <p className="text-slate-400 text-sm mt-1">Discover new learning paths</p>
                        </div>
                        <button onClick={() => setHasSelectedGrade(false)} className="text-xs font-bold text-brand-400 hover:text-brand-300 border border-brand-500/20 px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-colors">
                            Change Grade
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                        <button onClick={() => setSelectedYearFilter(null)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${!selectedYearFilter ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}`}>All Units</button>
                        {years.map(y => (
                            <button key={y.id} onClick={() => setSelectedYearFilter(y.id)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${selectedYearFilter === y.id ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}`}>
                                {y.title}
                            </button>
                        ))}
                    </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 lg:p-8 pb-32">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                       <div onClick={() => setIsCreateModalOpen(true)} className="border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-brand-500/50 hover:bg-slate-900/50 transition-all group min-h-[240px]">
                           <div className="p-5 bg-slate-900 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-brand-500/20"><Icons.Plus size={32} className="text-brand-500" /></div>
                           <span className="font-bold text-slate-400 group-hover:text-white">Create New Unit</span>
                           <span className="text-xs text-slate-600 mt-2">AI Generated</span>
                       </div>
                       {filteredQuests.map(q => <QuestCard key={q.id} quest={q} onSelect={(quest) => setSelectedQuestId(quest.id)} />)}
                       {filteredQuests.length === 0 && <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl"><Icons.BookOpen size={48} className="mx-auto mb-4 opacity-20" /><p>No units found for this selection.</p></div>}
                   </div>
               </div>
          </div>
      );
  };

  // --- MAIN RENDER ---

  if (appView === 'landing') return <LandingPage onSelectRole={(r) => { setRole(r); if(!hasApiKey()) setIsKeyModalOpen(true); setAppView('app'); }} />;

  if (role === 'student' && !hasSelectedGrade) return <GradeSelector years={years} onSelect={handleGradeSelection} />;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-brand-500/30">
        <Navigation currentView={currentView} onChangeView={(v) => { setCurrentView(v); setSelectedQuestId(null); }} role={role} onToggleRole={handleToggleRole} />
        
        <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-xl z-20 shrink-0 sticky top-0">
                <span className="font-bold text-white flex items-center gap-2 text-lg"><Icons.Compass className="text-brand-500" size={24}/> QuestHub</span>
                <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-brand-400 bg-brand-900/20 px-3 py-1.5 rounded-full border border-brand-500/20">Lvl {stats.level}</div>
                    {role === 'student' && <button onClick={() => setIsCreateModalOpen(true)} className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg"><Icons.Plus size={20} /></button>}
                </div>
            </div>

            <main className="flex-1 overflow-hidden relative bg-slate-950">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentView + (role === 'teacher' ? 't' : 's')}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {currentView === 'dashboard' && (
                            role === 'teacher' 
                            ? <TeacherDashboard 
                                data={{ quests, years, classes, students, stats }} 
                                onAddClass={addClass}
                                onDeleteClass={deleteClass}
                                onAddStudent={addStudent}
                                onAddStudentBulk={addStudentBulk}
                                onDeleteStudent={deleteStudent}
                                onUpdateQuest={handleUpdateQuest}
                                onAddQuest={handleAddQuest}
                              /> 
                            : renderDashboard()
                        )}
                        {currentView === 'explore' && renderExplorer()}
                        {currentView === 'vault' && (
                            <VaultView 
                                quests={quests} 
                                onSelectQuest={(q) => { setSelectedQuestId(q.id); setCurrentView('explore'); }}
                                onDeleteQuest={handleDeleteQuest}
                            />
                        )}
                        {currentView === 'settings' && <SettingsView currentRole={role} onToggleRole={handleToggleRole} onOpenAdmin={() => {}} onUpdateData={handleAdminUpdate} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
        
        <CreateQuestModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateQuest} loadingState={loadingState} />
        
        <AnimatePresence>
            {newlyUnlockedBadge && <CelebrationModal badge={newlyUnlockedBadge} onClose={() => setNewlyUnlockedBadge(null)} />}
            {showDailyModal && dailyChallenge && <DailyChallengeModal task={dailyChallenge} onAccept={acceptDailyChallenge} onClose={() => setShowDailyModal(false)} />}
            {isKeyModalOpen && <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />}
            {notification && <ToastNotification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
        </AnimatePresence>
    </div>
  );
};

export default App;
