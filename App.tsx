
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
import { getStandardCurriculum } from './defaultCurriculum';

// Utility for persistence - UPDATED TO V18 TO FORCE RESET
const STORAGE_KEY = 'learning_quest_hub_data_v18'; 
const DAILY_CHALLENGE_KEY = 'daily_challenge_date';

// Simple Toast Notification Component
const ToastNotification: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-slideUp z-[200] ${type === 'success' ? 'bg-slate-900 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-red-500/50 text-red-400'}`}>
            {type === 'success' ? <Icons.CheckCircle size={20} /> : <Icons.AlertCircle size={20} />}
            <span className="font-medium text-sm text-white">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><Icons.X size={16} /></button>
        </div>
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests, stats, years, classes, students }));
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
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-8 pb-24 animate-fadeIn">
          {role === 'student' && (
              <>
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                        <p className="text-slate-400">
                            {selectedYearFilter 
                                ? `Viewing content for ${years.find(y => y.id === selectedYearFilter)?.title}` 
                                : "Ready to continue your learning journey?"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setHasSelectedGrade(false)} className="hidden sm:flex">Change Grade</Button>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex"><Icons.Plus size={18} className="mr-2"/> New Quest</Button>
                    </div>
                </header>
                
                <StatsOverview stats={stats} />
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Icons.Clock className="text-brand-400" /> Recent Activity</h2>
                    {quests.filter(q => q.earnedXp > 0 && q.earnedXp < q.totalXp).slice(0, 3).map(q => (
                        <div key={q.id} onClick={() => { setSelectedQuestId(q.id); setCurrentView('explore'); }} className="cursor-pointer border-b border-slate-800 last:border-0 py-3 hover:bg-slate-800/50 rounded px-2 transition-colors">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">{q.title}</span>
                                <span className="text-xs text-brand-400 font-bold">{Math.round((q.earnedXp/q.totalXp)*100)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-brand-500 h-full" style={{ width: `${(q.earnedXp/q.totalXp)*100}%` }}></div></div>
                        </div>
                    ))}
                    {quests.filter(q => q.earnedXp > 0).length === 0 && <p className="text-slate-500 text-sm italic">Start a quest to see activity here!</p>}
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
              <div className="h-full flex flex-col bg-slate-950 animate-fadeIn">
                  {/* Quest Header with ENHANCED BACK BUTTON */}
                  <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-3 sticky top-0 z-20 shadow-md">
                      <button 
                        onClick={() => setSelectedQuestId(null)} 
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white border border-slate-700 hover:border-brand-500 transition-colors group flex items-center gap-2 pr-4"
                      >
                          <Icons.ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                          <span className="text-sm font-bold">Back</span>
                      </button>
                      <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-white text-lg truncate">{quest.title}</h2>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                             <span>{quest.tasks.length} Steps</span>
                             <span>•</span>
                             <span className={quest.isCompleted ? "text-emerald-400" : "text-brand-400"}>{quest.isCompleted ? "Completed" : "In Progress"}</span>
                          </div>
                      </div>
                      <div className="text-xs font-bold text-brand-400 bg-brand-900/20 px-3 py-1.5 rounded-lg border border-brand-500/20 hidden sm:block">{quest.earnedXp}/{quest.totalXp} XP</div>
                  </div>
                  
                  {/* Quest Body */}
                  <div className="flex-1 overflow-y-auto p-4 pb-24 max-w-4xl mx-auto w-full">
                      <div className="mb-6 p-6 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                           <h3 className="font-bold text-white mb-2">About this Unit</h3>
                           <p className="text-slate-400 leading-relaxed">{quest.description}</p>
                      </div>

                      <div className="space-y-4">
                          {quest.tasks.map(task => (
                              <TaskItem 
                                  key={task.id} 
                                  task={task} 
                                  onToggle={() => handleTaskToggle(quest.id, task.id)}
                                  onUpdate={(t) => setQuests(prev => prev.map(q => q.id === quest.id ? {...q, tasks: q.tasks.map(ot => ot.id === t.id ? t : ot)} : q))}
                                  yearTitle={currentYear?.title} // Pass Grade context for Sim restrictions
                              />
                          ))}
                      </div>
                  </div>
              </div>
          );
      }

      // List View
      return (
          <div className="h-full flex flex-col bg-slate-950 animate-fadeIn">
               <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Curriculum Explorer</h2>
                        <button onClick={() => setHasSelectedGrade(false)} className="text-xs text-brand-400 hover:text-white underline">Change Grade</button>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                        <button onClick={() => setSelectedYearFilter(null)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${!selectedYearFilter ? 'bg-brand-600 text-white border-brand-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>All Units</button>
                        {years.map(y => (
                            <button key={y.id} onClick={() => setSelectedYearFilter(y.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${selectedYearFilter === y.id ? 'bg-brand-600 text-white border-brand-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {y.title}
                            </button>
                        ))}
                    </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 pb-24">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       <div onClick={() => setIsCreateModalOpen(true)} className="border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-brand-500/50 hover:bg-slate-900/50 transition-all group min-h-[200px]">
                           <div className="p-4 bg-slate-900 rounded-full mb-3 group-hover:scale-110 transition-transform"><Icons.Plus size={24} className="text-brand-500" /></div>
                           <span className="font-bold text-slate-400 group-hover:text-white">Create New Unit</span>
                       </div>
                       {filteredQuests.map(q => <QuestCard key={q.id} quest={q} onSelect={(quest) => setSelectedQuestId(quest.id)} />)}
                       {filteredQuests.length === 0 && <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl"><Icons.BookOpen size={48} className="mx-auto mb-4 opacity-20" /><p>No units found.</p></div>}
                   </div>
               </div>
          </div>
      );
  };

  // --- MAIN RENDER ---

  if (appView === 'landing') return <LandingPage onSelectRole={(r) => { setRole(r); if(!hasApiKey()) setIsKeyModalOpen(true); setAppView('app'); }} />;

  if (role === 'student' && !hasSelectedGrade) return <GradeSelector years={years} onSelect={handleGradeSelection} />;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <Navigation currentView={currentView} onChangeView={(v) => { setCurrentView(v); setSelectedQuestId(null); }} role={role} onToggleRole={handleToggleRole} />
        <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="lg:hidden h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur z-10 shrink-0">
                <span className="font-bold text-white flex items-center gap-2"><Icons.Compass className="text-brand-500" size={20}/> QuestHub</span>
                <div className="text-xs font-bold text-brand-400 border border-brand-500/20 bg-brand-900/20 px-2 py-1 rounded">Lvl {stats.level}</div>
            </div>
            <main className="flex-1 overflow-hidden relative bg-slate-950">
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
                {currentView === 'settings' && <SettingsView currentRole={role} onToggleRole={handleToggleRole} onOpenAdmin={() => {}} onUpdateData={handleAdminUpdate} />}
            </main>
        </div>
        
        {currentView === 'dashboard' && role === 'student' && <button onClick={() => setIsCreateModalOpen(true)} className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-brand-600 rounded-full shadow-lg shadow-brand-500/40 flex items-center justify-center text-white z-40 active:scale-95 transition-transform"><Icons.Plus size={28} /></button>}
        
        <CreateQuestModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateQuest} loadingState={loadingState} />
        
        {newlyUnlockedBadge && <CelebrationModal badge={newlyUnlockedBadge} onClose={() => setNewlyUnlockedBadge(null)} />}
        {showDailyModal && dailyChallenge && <DailyChallengeModal task={dailyChallenge} onAccept={acceptDailyChallenge} onClose={() => setShowDailyModal(false)} />}
        <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
        
        {notification && <ToastNotification message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default App;
