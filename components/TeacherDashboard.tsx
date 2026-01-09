
import React, { useState } from 'react';
import { AppData, LessonPlan, Quest, Task, ContentType } from '../types';
import * as Icons from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, Tooltip } from 'recharts';
import Button from './Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateWeeklyLessonPlan, generateQuest, generateSingleTask, generateSimulation } from '../services/geminiService';
import CreateQuestModal from './CreateQuestModal';
import { CONTENT_TYPE_CONFIG } from '../constants';

interface TeacherDashboardProps {
  data: AppData;
  onAddClass: (title: string, yearId: string) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: (name: string, classId: string) => void;
  onAddStudentBulk: (names: string[], classId: string) => void;
  onDeleteStudent: (id: string, classId: string) => void;
  onUpdateQuest: (quest: Quest) => void;
  onAddQuest: (quest: Quest) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
    data, 
    onAddClass, 
    onDeleteClass, 
    onAddStudent,
    onAddStudentBulk, 
    onDeleteStudent,
    onUpdateQuest,
    onAddQuest
}) => {
  const [activeTab, setActiveTab] = useState<'command' | 'curriculum' | 'studio' | 'planner'>('command');
  
  // COMMAND STATE
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedYearId, setSelectedYearId] = useState<string>(data.years[0]?.id || '');
  const [newStudentName, setNewStudentName] = useState('');
  const [bulkList, setBulkList] = useState('');

  // CURRICULUM STATE
  const [currYearId, setCurrYearId] = useState<string>(data.years[0]?.id || '');
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<ContentType>('Lesson');

  // STUDIO STATE
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // PLANNER STATE
  const [planGrade, setPlanGrade] = useState('6');
  const [planUnit, setPlanUnit] = useState('1');
  const [planWeek, setPlanWeek] = useState('1');
  const [planTopic, setPlanTopic] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [activePlanTab, setActivePlanTab] = useState<'student' | 'tickets' | 'teacher'>('student');

  // Derived State
  const activeClass = data.classes.find(c => c.id === viewingClassId);
  const activeStudents = activeClass ? data.students.filter(s => activeClass.studentIds.includes(s.id)) : [];
  const activeQuest = data.quests.find(q => q.id === editingQuestId);
  
  // Handlers
  const handleCreateClass = (e: React.FormEvent) => {
      e.preventDefault();
      if(newClassName && selectedYearId) {
          onAddClass(newClassName, selectedYearId);
          setNewClassName('');
      }
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
      e.preventDefault();
      if(newStudentName && viewingClassId) {
          onAddStudent(newStudentName, viewingClassId);
          setNewStudentName('');
      }
  };

  const handleBulkImport = () => {
      if(bulkList.trim() && viewingClassId) {
          const names = bulkList.split('\n').filter(n => n.trim().length > 0);
          onAddStudentBulk(names, viewingClassId);
          setBulkList('');
          setIsBulkImporting(false);
      }
  };

  const handleGeneratePlan = async () => {
      if(!planTopic) return;
      setIsGeneratingPlan(true);
      try {
          const plan = await generateWeeklyLessonPlan(planGrade, planUnit, planWeek, planTopic);
          setGeneratedPlan(plan);
      } catch (e) {
          alert("Failed to generate plan. Check API Key.");
      } finally {
          setIsGeneratingPlan(false);
      }
  };

  const handleAddTaskToQuest = async () => {
      if(!newTaskTitle || !activeQuest) return;
      setLoadingState('LOADING');
      try {
         const newTask = await generateSingleTask(newTaskTitle, newTaskType, activeQuest.title);
         const updatedQuest = { ...activeQuest, tasks: [...activeQuest.tasks, newTask], totalXp: activeQuest.totalXp + newTask.xp };
         onUpdateQuest(updatedQuest);
         setIsAddingTask(false);
         setNewTaskTitle('');
         setLoadingState('SUCCESS');
      } catch (e) {
          setLoadingState('ERROR');
          alert("Failed to generate task.");
      } finally {
          setTimeout(() => setLoadingState('IDLE'), 1000);
      }
  };

  const handleCreateStandaloneSim = async () => {
      const topic = prompt("What simulation do you want to create? (e.g. Orbit Visualizer)");
      if(!topic) return;
      setLoadingState('LOADING');
      try {
          const simHtml = await generateSimulation(topic, "Create a standalone educational simulation.");
          // Create a wrapper quest for it
          const quest: Quest = {
              id: crypto.randomUUID(),
              title: `Sim: ${topic}`,
              description: "Interactive simulation generated from Studio.",
              category: "Science",
              difficulty: "Intermediate",
              totalXp: 100,
              earnedXp: 0,
              createdAt: new Date().toISOString(),
              status: 'active',
              tasks: [{
                  id: crypto.randomUUID(),
                  title: topic,
                  description: "Explore the simulation.",
                  xp: 100,
                  isCompleted: false,
                  type: "Game",
                  htmlContent: simHtml,
                  resources: []
              }]
          };
          onAddQuest(quest);
          alert("Simulation created! Check the Curriculum tab (Unassigned).");
      } catch(e) {
          alert("Failed.");
      } finally {
          setLoadingState('IDLE');
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Content copied to clipboard!");
  }

  // --- RENDER SECTIONS ---

  // 1. COMMAND CENTER (Roster & Analytics)
  const renderCommandCenter = () => (
    <div className="flex flex-col h-full overflow-hidden">
        {!viewingClassId ? (
            <div className="max-w-7xl mx-auto w-full p-6 animate-slideUp overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
                         <div className="absolute right-0 top-0 opacity-10"><Icons.Users size={120} /></div>
                         <div className="relative z-10">
                            <div className="text-indigo-300 text-xs font-bold uppercase mb-2">Total Students</div>
                            <div className="text-4xl font-bold text-white">{data.students.length}</div>
                            <div className="mt-4 text-xs text-indigo-200">Across {data.classes.length} Active Classes</div>
                         </div>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-2">Quests Completed</div>
                         <div className="text-4xl font-bold text-brand-400">{data.students.reduce((acc, s) => acc + s.completedTasks, 0)}</div>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                          <div className="text-slate-500 text-xs font-bold uppercase mb-2">Avg. Class Level</div>
                          <div className="text-4xl font-bold text-emerald-400">
                             {data.students.length > 0 ? Math.round(data.students.reduce((a,s)=>a+s.level,0)/data.students.length) : 1}
                          </div>
                     </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icons.School className="text-slate-400"/> Active Classrooms</h2>
                     <form onSubmit={handleCreateClass} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                         <select className="bg-slate-800 text-slate-300 text-sm px-2 py-1.5 rounded outline-none" value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)}>
                             {data.years.map(y => <option key={y.id} value={y.id}>{y.title}</option>)}
                         </select>
                         <input className="bg-slate-950 text-white text-sm px-3 py-1.5 rounded border border-slate-700 w-32 sm:w-48 focus:border-brand-500 outline-none" placeholder="Class Name..." value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                         <Button size="sm" type="submit" disabled={!newClassName}><Icons.Plus size={16}/></Button>
                     </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                     {data.classes.map(cls => (
                         <div key={cls.id} onClick={() => setViewingClassId(cls.id)} className="group relative bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icons.LayoutGrid size={64} className="text-brand-500" /></div>
                             <div className="mb-4">
                                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{data.years.find(y => y.id === cls.yearId)?.title || 'Unknown Grade'}</span>
                                 <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors truncate">{cls.title}</h3>
                             </div>
                             <div className="flex items-center gap-4 text-sm text-slate-400">
                                 <div className="flex items-center gap-1.5"><Icons.User size={16} /> {cls.studentIds.length} Students</div>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete class?')) onDeleteClass(cls.id); }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-800 text-red-400 hover:bg-red-900/50 rounded-lg">
                                 <Icons.Trash2 size={16} />
                             </button>
                         </div>
                     ))}
                </div>
            </div>
        ) : (
            <div className="flex flex-col h-full animate-fadeIn p-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setViewingClassId(null)} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors"><Icons.ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{activeClass?.title}</h2>
                        <p className="text-slate-400 text-sm">{activeStudents.length} Students Enrolled</p>
                    </div>
                    <div className="ml-auto"><Button variant="secondary" onClick={() => setIsBulkImporting(true)}><Icons.UploadCloud size={16} className="mr-2" /> Bulk Import</Button></div>
                </div>

                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900 flex gap-4">
                        <form onSubmit={handleAddSingleStudent} className="flex-1 flex gap-2">
                            <input className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Add student by name..." value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                            <Button size="sm" type="submit" disabled={!newStudentName}>Add</Button>
                        </form>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                         <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-950 text-slate-500 uppercase font-bold text-xs sticky top-0">
                                <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Level</th><th className="px-6 py-3 text-right">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {activeStudents.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-white flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>{s.name}</td>
                                        <td className="px-6 py-3">{s.email}</td>
                                        <td className="px-6 py-3"><span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded border border-brand-500/20 text-xs font-bold">Lvl {s.level}</span></td>
                                        <td className="px-6 py-3 text-right"><button onClick={() => { if(confirm('Remove student?')) onDeleteStudent(s.id, activeClass!.id); }} className="text-slate-600 hover:text-red-400"><Icons.Trash2 size={16} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
        
        {isBulkImporting && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-8 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Icons.UploadCloud className="text-brand-400" /> Bulk Import Students</h3>
                    <textarea className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm outline-none resize-none mb-4" placeholder={"John Doe\nJane Smith"} value={bulkList} onChange={e => setBulkList(e.target.value)} autoFocus />
                    <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsBulkImporting(false)}>Cancel</Button><Button onClick={handleBulkImport}>Import</Button></div>
                </div>
            </div>
        )}
    </div>
  );

  // 2. CURRICULUM (Editing)
  const renderCurriculum = () => (
      <div className="flex flex-col h-full animate-fadeIn overflow-hidden">
          {!editingQuestId ? (
              // List View
              <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Icons.Library className="text-brand-400"/> Curriculum Manager</h2>
                      <Button size="sm" onClick={() => setIsQuestModalOpen(true)}><Icons.Plus size={16} className="mr-2"/> New Unit</Button>
                  </div>
                  
                  {/* Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-slate-800 scrollbar-hide">
                      {data.years.map(y => (
                          <button 
                            key={y.id} 
                            onClick={() => setCurrYearId(y.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${currYearId === y.id ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                          >
                              {y.title}
                          </button>
                      ))}
                  </div>

                  {/* Grid */}
                  <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                          {data.quests.filter(q => q.yearId === currYearId || (!q.yearId && currYearId === 'all')).map(q => (
                              <div key={q.id} onClick={() => setEditingQuestId(q.id)} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-brand-500/50 cursor-pointer transition-all hover:shadow-lg group">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-bold text-slate-500 uppercase">{q.category}</span>
                                      <Icons.Edit2 size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                                  </div>
                                  <h3 className="font-bold text-white text-lg mb-1 group-hover:text-brand-400">{q.title}</h3>
                                  <p className="text-sm text-slate-400 line-clamp-2">{q.description}</p>
                                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4 text-xs font-mono text-slate-500">
                                      <span>{q.tasks.length} Lessons</span>
                                      <span>{q.totalXp} XP</span>
                                  </div>
                              </div>
                          ))}
                          {data.quests.filter(q => q.yearId === currYearId).length === 0 && (
                              <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                  No units found for this grade. Create one in the Studio!
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              // Detail/Edit View
              <div className="flex flex-col h-full bg-slate-950">
                  <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-4">
                      <button onClick={() => setEditingQuestId(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Icons.ArrowLeft size={20}/></button>
                      <div>
                          <h2 className="font-bold text-white text-lg">{activeQuest?.title}</h2>
                          <div className="text-xs text-slate-500">Editing Unit Content</div>
                      </div>
                      <div className="ml-auto">
                          <Button size="sm" onClick={() => setIsAddingTask(true)}><Icons.Plus size={16} className="mr-2"/> Add Lesson</Button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                      {isAddingTask && (
                          <div className="mb-6 bg-slate-900 border border-brand-500/50 rounded-xl p-6 animate-slideUp shadow-xl">
                              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Icons.Sparkles className="text-brand-400" size={18}/> Create New Lesson</h3>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                  {['Lesson', 'Project', 'Game', 'Practice'].map((type) => {
                                      const Config = CONTENT_TYPE_CONFIG[type as ContentType];
                                      return (
                                          <button 
                                            key={type} 
                                            onClick={() => setNewTaskType(type as ContentType)}
                                            className={`p-3 rounded-lg border text-left transition-all ${newTaskType === type ? 'bg-brand-900/20 border-brand-500 ring-1 ring-brand-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                          >
                                              <Config.icon size={20} className={`mb-2 ${Config.color}`} />
                                              <div className="text-xs font-bold text-white">{type}</div>
                                          </button>
                                      );
                                  })}
                              </div>

                              <div className="mb-4">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic / Title</label>
                                  <input 
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 outline-none"
                                    placeholder="e.g. Introduction to Variables"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                  />
                              </div>
                              
                              <div className="flex gap-3">
                                  <Button onClick={handleAddTaskToQuest} isLoading={loadingState === 'LOADING'} disabled={!newTaskTitle}>
                                      {loadingState === 'LOADING' ? 'AI Generating...' : 'Generate & Add'}
                                  </Button>
                                  <Button variant="ghost" onClick={() => setIsAddingTask(false)}>Cancel</Button>
                              </div>
                          </div>
                      )}

                      <div className="space-y-3">
                          {activeQuest?.tasks.map((task, idx) => {
                               const Config = CONTENT_TYPE_CONFIG[task.type];
                               return (
                                  <div key={task.id} className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl group hover:border-slate-700">
                                      <div className="font-mono text-slate-600 text-sm w-6">{idx + 1}</div>
                                      <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${Config.color}`}>
                                          <Config.icon size={18} />
                                      </div>
                                      <div className="flex-1">
                                          <h4 className="font-bold text-slate-200">{task.title}</h4>
                                          <div className="text-xs text-slate-500 flex gap-2">
                                              <span>{task.xp} XP</span>
                                              {task.htmlContent && <span className="text-emerald-500">• Interactive</span>}
                                              {task.quizContent && <span className="text-pink-500">• Quiz</span>}
                                          </div>
                                      </div>
                                      <button className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Icons.Trash2 size={16} />
                                      </button>
                                  </div>
                               );
                          })}
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  // 3. STUDIO (Visual Creator)
  const renderStudio = () => (
      <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto animate-fadeIn">
          <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-white mb-4">Curriculum Studio</h2>
              <p className="text-slate-400 text-lg">Use AI to generate comprehensive learning materials.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Standard Lesson */}
              <div onClick={() => setIsQuestModalOpen(true)} className="group bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl p-8 cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20">
                  <div className="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                      <Icons.BookOpen size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400">Interactive Unit</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      Generate a comprehensive unit with reading materials, quizzes, and automated slides. Best for core concepts.
                  </p>
                  <Button variant="secondary" className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent">Start Builder</Button>
              </div>

              {/* Card 2: Gamified Project */}
              <div onClick={() => setIsQuestModalOpen(true)} className="group bg-slate-900 border border-slate-800 hover:border-purple-500 rounded-2xl p-8 cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="w-16 h-16 bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                      <Icons.Rocket size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400">Quest Project</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      Create a multi-step project with XP rewards, milestones, and rubric-based assessment. Best for deep learning.
                  </p>
                  <Button variant="secondary" className="w-full group-hover:bg-purple-600 group-hover:text-white group-hover:border-transparent">Design Quest</Button>
              </div>

              {/* Card 3: Simulation */}
              <div onClick={handleCreateStandaloneSim} className="group bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl p-8 cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/20">
                  <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                      <Icons.Gamepad2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400">Live Simulation</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                      Generate a physics engine, math visualizer, or historical map using HTML5 Canvas. Best for "Aha!" moments.
                  </p>
                  <Button variant="secondary" className="w-full group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent">Generate Sim</Button>
              </div>
          </div>
      </div>
  );

  // 4. PLANNER (The Prompt Implementation) - No changes needed, existing code is good
  const renderPlanner = () => (
      <div className="flex flex-col h-full">
          {!generatedPlan ? (
             <div className="max-w-3xl mx-auto w-full p-8 animate-fadeIn">
                 <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Weekly Lesson Planner</h2>
                      <p className="text-slate-400">Generate a complete CCSS-aligned packet with Student Edition, Exit Tickets, and Teacher Scripts.</p>
                 </div>

                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Grade Level</label>
                              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-brand-500" value={planGrade} onChange={e => setPlanGrade(e.target.value)}>
                                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit #</label>
                              <input className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-brand-500" value={planUnit} onChange={e => setPlanUnit(e.target.value)} type="number" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Week #</label>
                              <input className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-brand-500" value={planWeek} onChange={e => setPlanWeek(e.target.value)} type="number" />
                          </div>
                      </div>

                      <div className="mb-8">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic / Standard</label>
                          <input 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-brand-500 placeholder:text-slate-600"
                            placeholder="e.g. Ratios and Proportional Relationships (6.RP.A.1)"
                            value={planTopic}
                            onChange={e => setPlanTopic(e.target.value)}
                          />
                      </div>

                      <Button 
                        onClick={handleGeneratePlan} 
                        disabled={!planTopic || isGeneratingPlan} 
                        className="w-full py-4 text-lg bg-gradient-to-r from-brand-600 to-accent-600 border-none"
                        isLoading={isGeneratingPlan}
                      >
                          {isGeneratingPlan ? 'Constructing Lesson Plan...' : 'Generate Weekly Pack'}
                      </Button>
                      
                      <div className="mt-4 text-center text-xs text-slate-500">
                          * Includes Guild Narrative, 9-Block Missions, 5E Scripts, and Akhlaq Integration.
                      </div>
                 </div>
             </div>
          ) : (
             <div className="flex flex-col h-full">
                 <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md z-10">
                     <div className="flex items-center gap-4">
                         <button onClick={() => setGeneratedPlan(null)} className="text-slate-400 hover:text-white"><Icons.ArrowLeft size={20}/></button>
                         <div>
                             <h2 className="font-bold text-white text-lg">Unit {planUnit} Week {planWeek}: {planTopic}</h2>
                             <div className="flex gap-2 text-xs text-slate-500">
                                 <span>Grade {planGrade}</span>
                                 <span>•</span>
                                 <span>CCSS Aligned</span>
                             </div>
                         </div>
                     </div>
                     <div className="flex bg-slate-800 rounded-lg p-1">
                         <button onClick={() => setActivePlanTab('student')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${activePlanTab === 'student' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>Student Ed</button>
                         <button onClick={() => setActivePlanTab('tickets')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${activePlanTab === 'tickets' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>Exit Tickets</button>
                         <button onClick={() => setActivePlanTab('teacher')} className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${activePlanTab === 'teacher' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>Teacher Pack</button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto bg-slate-950 p-8">
                     <div className="max-w-4xl mx-auto bg-white text-slate-900 p-12 rounded-lg shadow-2xl min-h-[800px]">
                         <div className="flex justify-between mb-8 pb-4 border-b border-slate-200">
                             <div className="text-sm font-mono text-slate-400 uppercase">
                                 Generated Content Preview
                             </div>
                             <button 
                                onClick={() => copyToClipboard(activePlanTab === 'student' ? generatedPlan.studentEdition : activePlanTab === 'tickets' ? generatedPlan.exitTickets : generatedPlan.teacherPack)}
                                className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold text-sm"
                             >
                                 <Icons.Copy size={16} /> Copy Text for Word
                             </button>
                         </div>
                         <div className="prose max-w-none prose-slate">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                 {activePlanTab === 'student' ? generatedPlan.studentEdition : activePlanTab === 'tickets' ? generatedPlan.exitTickets : generatedPlan.teacherPack}
                             </ReactMarkdown>
                         </div>
                     </div>
                 </div>
             </div>
          )}
      </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 animate-fadeIn">
        
        {/* Main Nav */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-4">
                <div className="bg-brand-600 p-1.5 rounded-lg"><Icons.Command className="text-white" size={20} /></div>
                <h1 className="text-lg font-bold text-white tracking-tight">Curriculum Command</h1>
            </div>
            
            <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
                <button onClick={() => setActiveTab('command')} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'command' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    <Icons.LayoutDashboard size={14}/> Command
                </button>
                <button onClick={() => setActiveTab('curriculum')} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'curriculum' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    <Icons.Library size={14}/> Curriculum
                </button>
                <button onClick={() => setActiveTab('studio')} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'studio' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    <Icons.Palette size={14}/> Studio
                </button>
                <button onClick={() => setActiveTab('planner')} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'planner' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    <Icons.CalendarRange size={14}/> Planner
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'command' && renderCommandCenter()}
            {activeTab === 'curriculum' && renderCurriculum()}
            {activeTab === 'studio' && renderStudio()}
            {activeTab === 'planner' && renderPlanner()}
        </div>

        <CreateQuestModal 
            isOpen={isQuestModalOpen} 
            onClose={() => setIsQuestModalOpen(false)} 
            loadingState={loadingState} 
            onCreate={async (payload) => {
                setLoadingState('LOADING');
                try {
                    const newQuest = await generateQuest(payload.topic, payload.difficulty, payload.additionalNotes);
                    onAddQuest(newQuest);
                    setLoadingState('SUCCESS');
                    setIsQuestModalOpen(false);
                } catch {
                    setLoadingState('ERROR');
                } finally {
                    setTimeout(() => setLoadingState('IDLE'), 2000);
                }
            }} 
        />
    </div>
  );
};

export default TeacherDashboard;
