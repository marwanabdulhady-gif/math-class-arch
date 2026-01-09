import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { AppData, ClassGroup, Student } from '../types';
import Button from './Button';

interface AdminPanelProps {
  data: AppData;
  onUpdate: (newData: Partial<AppData>) => void;
  onAddClass: (title: string, yearId: string) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: (name: string, classId: string) => void;
  onDeleteStudent: (id: string, classId: string) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  data, 
  onUpdate, 
  onAddClass, 
  onDeleteClass, 
  onAddStudent, 
  onDeleteStudent, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'data'>('roster');
  
  // Selection
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Initialize selection defaults safely
  useEffect(() => {
    if (!selectedYearId && data.years.length > 0) {
        setSelectedYearId(data.years[0].id);
    }
  }, [data.years, selectedYearId]);

  // Form State
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // --- HANDLERS ---
  const submitClass = (e: React.FormEvent) => {
      e.preventDefault();
      if (newClassName.trim() && selectedYearId) {
          onAddClass(newClassName.trim(), selectedYearId);
          setNewClassName('');
          setIsAddingClass(false);
      }
  };

  const submitStudent = (e: React.FormEvent) => {
      e.preventDefault();
      if (newStudentName.trim() && selectedClassId) {
          onAddStudent(newStudentName.trim(), selectedClassId);
          setNewStudentName('');
          setIsAddingStudent(false);
      }
  };

  const currentClasses = data.classes.filter(c => c.yearId === selectedYearId);
  const currentClass = data.classes.find(c => c.id === selectedClassId);
  const studentsInClass = currentClass 
      ? data.students.filter(s => currentClass.studentIds.includes(s.id))
      : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-200 overflow-hidden animate-fadeIn font-sans">
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shadow-md z-10">
            <h1 className="font-bold text-white text-lg flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-lg"><Icons.Settings className="text-brand-500" size={20}/></div>
                Admin Dashboard
            </h1>
            <Button variant="secondary" size="sm" onClick={onClose}>Done</Button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-800 bg-slate-900/50">
                <button onClick={() => setActiveTab('roster')} className={`px-8 py-3 text-sm font-bold tracking-wide transition-all ${activeTab === 'roster' ? 'text-white border-b-2 border-brand-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Icons.Users size={16} className="inline mr-2 mb-1"/> Class & Roster
                </button>
                <button onClick={() => setActiveTab('data')} className={`px-8 py-3 text-sm font-bold tracking-wide transition-all ${activeTab === 'data' ? 'text-white border-b-2 border-brand-500 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Icons.Database size={16} className="inline mr-2 mb-1"/> System Data
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'roster' && (
                    <div className="flex h-full">
                        {/* LEFT PANE: Years & Classes */}
                        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
                            {/* Year Dropdown */}
                            <div className="p-4 border-b border-slate-800">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Academic Year</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={selectedYearId || ''}
                                    onChange={(e) => { setSelectedYearId(e.target.value); setSelectedClassId(null); }}
                                >
                                    {data.years.map(y => <option key={y.id} value={y.id}>{y.title}</option>)}
                                </select>
                            </div>

                            {/* Class List */}
                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="flex justify-between items-center px-2 mb-2 mt-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Classes</span>
                                    <button onClick={() => setIsAddingClass(true)} className="text-brand-400 hover:text-white p-1 hover:bg-slate-800 rounded"><Icons.Plus size={16}/></button>
                                </div>
                                
                                {isAddingClass && (
                                    <form onSubmit={submitClass} className="p-2 mb-2 bg-slate-800 rounded-lg border border-brand-500/30 animate-slideUp">
                                        <input 
                                            autoFocus
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white mb-2"
                                            placeholder="Class Name..."
                                            value={newClassName}
                                            onChange={e => setNewClassName(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 bg-brand-600 text-white text-xs py-1 rounded">Add</button>
                                            <button type="button" onClick={() => setIsAddingClass(false)} className="flex-1 bg-slate-700 text-slate-300 text-xs py-1 rounded">Cancel</button>
                                        </div>
                                    </form>
                                )}

                                {currentClasses.length === 0 && !isAddingClass && <div className="text-sm text-slate-600 px-4 italic py-4 text-center">No classes created for this year.</div>}

                                <div className="space-y-1">
                                    {currentClasses.map(c => (
                                        <div key={c.id} className="group relative">
                                            <button 
                                                onClick={() => setSelectedClassId(c.id)}
                                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${selectedClassId === c.id ? 'bg-brand-900/20 text-white border border-brand-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
                                            >
                                                <div className="font-bold">{c.title}</div>
                                                <div className="text-xs opacity-60 mt-0.5">{c.studentIds.length} Students</div>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if(confirm('Delete class?')) onDeleteClass(c.id); }}
                                                className="absolute right-2 top-3 text-slate-600 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Icons.Trash2 size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANE: Student Roster */}
                        <div className="flex-1 bg-slate-950 flex flex-col">
                            {selectedClassId ? (
                                <>
                                    <div className="p-6 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">{currentClass?.title}</h2>
                                            <p className="text-slate-400 text-sm flex items-center gap-2"><Icons.Users size={14}/> {studentsInClass.length} Students Enrolled</p>
                                        </div>
                                        <Button onClick={() => setIsAddingStudent(true)} disabled={isAddingStudent}><Icons.UserPlus size={16} className="mr-2"/> Enroll Student</Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6">
                                        {isAddingStudent && (
                                            <form onSubmit={submitStudent} className="mb-4 bg-slate-900 p-4 rounded-xl border border-brand-500/30 flex items-center gap-4 animate-slideUp shadow-lg">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><Icons.User size={20} className="text-brand-400"/></div>
                                                <div className="flex-1">
                                                    <input 
                                                        autoFocus
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                                        placeholder="Full Name (e.g. Alice Wonderland)"
                                                        value={newStudentName}
                                                        onChange={e => setNewStudentName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="submit" size="sm">Save</Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingStudent(false)}>Cancel</Button>
                                                </div>
                                            </form>
                                        )}

                                        <div className="grid grid-cols-1 gap-3">
                                            {studentsInClass.map(s => (
                                                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${s.status === 'at-risk' ? 'bg-red-900 text-red-200' : 'bg-slate-700'}`}>
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white">{s.name}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                {s.email}
                                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                                <span className={s.status === 'at-risk' ? 'text-red-400' : 'text-emerald-400'}>{s.status === 'active' ? 'Active' : 'At Risk'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right hidden sm:block">
                                                            <div className="text-xs text-slate-500 uppercase font-bold">XP Earned</div>
                                                            <div className="text-sm font-mono text-brand-400">{s.xp.toLocaleString()}</div>
                                                        </div>
                                                        <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>
                                                        <button 
                                                            onClick={() => { if(confirm(`Remove ${s.name} from class?`)) onDeleteStudent(s.id, selectedClassId!); }} 
                                                            className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
                                                            title="Expel Student"
                                                        >
                                                            <Icons.UserMinus size={18}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {studentsInClass.length === 0 && !isAddingStudent && (
                                                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                                    <div className="p-4 bg-slate-900 rounded-full mb-4"><Icons.Users size={32} /></div>
                                                    <p>This class is empty.</p>
                                                    <button onClick={() => setIsAddingStudent(true)} className="text-brand-400 hover:underline mt-2">Add the first student</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/50">
                                    <Icons.ArrowLeft size={48} className="mb-4 opacity-20 text-brand-500" />
                                    <p className="text-lg">Select a Class from the sidebar to manage enrollment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                     <div className="p-8 max-w-2xl mx-auto">
                         <h2 className="text-2xl font-bold text-white mb-6">System Management</h2>
                         
                         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                             <h3 className="font-bold text-white mb-2">Export Data</h3>
                             <p className="text-slate-400 text-sm mb-4">Download a JSON backup of all current curriculum, classes, and student progress.</p>
                             <Button onClick={() => {
                                 const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = 'questhub_backup.json';
                                 a.click();
                             }}>Download Backup</Button>
                         </div>

                         <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                             <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2"><Icons.AlertTriangle size={18}/> Danger Zone</h3>
                             <p className="text-slate-400 text-sm mb-4">Wipe all local data and reload the standard K-12 Reveal Math curriculum.</p>
                             <Button variant="danger" className="w-full" onClick={() => { if(confirm("This will delete all custom classes and students. Are you sure?")) { localStorage.clear(); location.reload(); } }}>Factory Reset Application</Button>
                         </div>
                     </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;