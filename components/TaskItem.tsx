import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task, ChatMessage, AiPersona } from '../types';
import * as Icons from 'lucide-react';
import { generateLessonContent, generateQuiz, generateSimulation, getAiTutorResponse, generateFlashcards, generateSlides } from '../services/geminiService';
import Button from './Button';
import { CONTENT_TYPE_CONFIG } from '../constants';
import HTMLViewer from './HTMLViewer';
import CarouselViewer from './CarouselViewer';
import { v4 as uuidv4 } from 'uuid';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onUpdate: (updatedTask: Task) => void;
  yearTitle?: string; // NEW: Passed down to control Sim availability
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onUpdate, yearTitle = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<AiPersona>('socratic');
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flashcard State
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Quiz State
  const [quizState, setQuizState] = useState<{
      active: boolean;
      currentQuestion: number;
      score: number;
      completed: boolean;
      selectedOption: number | null;
  }>({ active: false, currentQuestion: 0, score: 0, completed: false, selectedOption: null });

  const typeConfig = CONTENT_TYPE_CONFIG[task.type || 'Lesson'];
  const Icon = typeConfig.icon;

  // Determine if Simulations are allowed (Grade 8+)
  const isHighSchool = ['Grade 8', 'Algebra', 'Geometry', 'Calculus', 'Pre-Calculus'].some(k => yearTitle.includes(k));
  const allowSim = isHighSchool;

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, showChat]);

  // Generators
  const handleGenerateContent = async (mode: 'full' | 'slides_only' | 'simulation_only' | 'flashcards_only' | 'activity_only') => {
      setIsGenerating(true);
      try {
          let updates: Partial<Task> = {};
          
          if (mode === 'full') {
              if (!task.markdownContent) {
                  updates.markdownContent = await generateLessonContent(task.title, task.description);
              }
              if (!task.quizContent && (task.type === 'Lesson' || task.type === 'Practice')) {
                  updates.quizContent = await generateQuiz(task.title);
              }
          }

          if (mode === 'slides_only' || (mode === 'full' && !task.slides)) {
               updates.slides = await generateSlides(task.title);
               if (mode === 'slides_only') setShowSlides(true);
          }
          
          if (mode === 'simulation_only' || (mode === 'full' && task.type === 'Game' && allowSim)) {
               updates.htmlContent = await generateSimulation(task.title, task.description);
               if (mode === 'simulation_only') setShowHtml(true);
          }
          
          // For K-7, "Game" maps to HTML Activity
          if (mode === 'activity_only' || (mode === 'full' && task.type === 'Game' && !allowSim)) {
                // We use the same generator but prompt it differently internally or just accept HTML
               updates.htmlContent = await generateSimulation(task.title, `Create a simple, colorful, click-based interactive educational game for ${yearTitle || 'elementary students'}. ${task.description}`);
               if (mode === 'activity_only') setShowHtml(true);
          }

          if (mode === 'flashcards_only' || (mode === 'full' && task.type === 'Practice')) {
               updates.flashcards = await generateFlashcards(task.title);
          }

          onUpdate({ ...task, ...updates });
          
      } catch (e) {
          console.error("Generation failed", e);
          alert("Failed to generate content. Try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              setImageAttachment(e.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => (prev ? prev + ' ' : '') + transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  const handleSendMessage = async () => {
      if (!chatInput.trim() && !imageAttachment) return;
      const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text: chatInput, timestamp: Date.now(), image: imageAttachment || undefined };
      const newHistory = [...chatHistory, userMsg];
      setChatHistory(newHistory);
      setChatInput('');
      setImageAttachment(null);
      setChatLoading(true);
      try {
          const responseText = await getAiTutorResponse(newHistory, task.title, selectedPersona);
          const botMsg: ChatMessage = { id: uuidv4(), role: 'model', text: responseText, timestamp: Date.now() };
          setChatHistory([...newHistory, botMsg]);
      } catch (e) { console.error(e); } finally { setChatLoading(false); }
  };

  const startQuiz = () => setQuizState({ active: true, currentQuestion: 0, score: 0, completed: false, selectedOption: null });
  const handleQuizAnswer = (optionIndex: number) => {
      if (quizState.selectedOption !== null) return;
      const currentQ = task.quizContent![quizState.currentQuestion];
      setQuizState(prev => ({ ...prev, selectedOption: optionIndex, score: optionIndex === currentQ.correctIndex ? prev.score + 1 : prev.score }));
  };
  const nextQuestion = () => {
      if (!task.quizContent) return;
      if (quizState.currentQuestion < task.quizContent.length - 1) {
          setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1, selectedOption: null }));
      } else {
          setQuizState(prev => ({ ...prev, completed: true }));
          if (quizState.score === task.quizContent.length && !task.isCompleted) onToggle(task.id);
      }
  };

  const PERSONA_LABELS: Record<AiPersona, { label: string, icon: any }> = {
      'socratic': { label: 'Socratic Guide', icon: Icons.BrainCircuit },
      'encouraging': { label: 'Cheerleader', icon: Icons.HeartHandshake },
      'roast': { label: 'Roast Master', icon: Icons.Flame },
      'eli5': { label: 'Explain Like I\'m 5', icon: Icons.Baby },
  };

  const hasContent = task.markdownContent || task.htmlContent || task.slides || task.flashcards || task.quizContent;

  return (
    <>
    <div className={`rounded-xl border transition-all duration-300 ${task.isCompleted ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-900 border-slate-700 hover:border-slate-600 shadow-sm hover:shadow-md'}`}>
      <div className="p-4 flex items-start gap-4">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.isCompleted ? 'bg-accent-500 border-accent-500 text-white scale-110' : 'border-slate-600 hover:border-accent-500 bg-slate-950/50 text-transparent'
          }`}
        >
          <Icons.Check size={14} strokeWidth={3} />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="cursor-pointer group" onClick={() => setShowDetails(!showDetails)}>
            {/* ... [Header: Tags, Title, XP] same as before ... */}
            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 ${typeConfig.color} flex items-center gap-1`}>
                       <Icon size={10} /> {task.type || 'Lesson'}
                    </span>
                    {task.slides && <span className="text-[10px] uppercase font-bold bg-blue-900/30 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full flex gap-1"><Icons.Presentation size={10}/> Slides</span>}
                    {task.htmlContent && <span className="text-[10px] uppercase font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex gap-1"><Icons.Gamepad2 size={10}/> Interactive</span>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${task.isCompleted ? 'bg-slate-800 text-slate-500' : 'bg-brand-500/10 text-brand-300 border border-brand-500/20'}`}>{task.xp} XP</span>
            </div>
            <h4 className={`text-base font-semibold truncate transition-colors ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-white'}`}>{task.title}</h4>
            {!showDetails && <p className="text-sm text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-400">{task.description}</p>}
          </div>

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-slate-800 animate-fadeIn">
              
              {!hasContent && (
                  <div className="bg-slate-950 p-6 rounded-xl border border-dashed border-slate-700 text-center mb-4">
                      <Icons.Sparkles size={32} className="mx-auto text-brand-400 mb-2" />
                      <h4 className="text-white font-bold mb-1">Generate Content</h4>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        <Button size="sm" onClick={() => handleGenerateContent('full')} isLoading={isGenerating}><Icons.Wand2 size={14} className="mr-2"/> Auto-Generate</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleGenerateContent('slides_only')} isLoading={isGenerating}><Icons.Presentation size={14} className="mr-2"/> Slides</Button>
                        
                        {/* CONDITIONAL BUTTONS BASED ON GRADE */}
                        {allowSim ? (
                            <Button size="sm" variant="secondary" onClick={() => handleGenerateContent('simulation_only')} isLoading={isGenerating}><Icons.Atom size={14} className="mr-2"/> Physics Sim</Button>
                        ) : (
                            <Button size="sm" variant="secondary" onClick={() => handleGenerateContent('activity_only')} isLoading={isGenerating}><Icons.Gamepad2 size={14} className="mr-2"/> Activity/Game</Button>
                        )}
                        
                        <Button size="sm" variant="secondary" onClick={() => handleGenerateContent('flashcards_only')} isLoading={isGenerating}><Icons.Copy size={14} className="mr-2"/> Mini-Project</Button>
                      </div>
                  </div>
              )}

              {/* Action Bar */}
              {hasContent && (
                  <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-950 rounded-lg border border-slate-800">
                      {task.slides ? (
                         <Button size="sm" onClick={() => setShowSlides(true)} className="bg-blue-600 hover:bg-blue-500"><Icons.Presentation size={14} className="mr-2" /> Slides</Button>
                      ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleGenerateContent('slides_only')} isLoading={isGenerating}><Icons.Plus size={12}/> Slides</Button>
                      )}

                      {task.htmlContent ? (
                          <Button size="sm" onClick={() => setShowHtml(true)} className="bg-emerald-600 hover:bg-emerald-500"><Icons.Gamepad2 size={14} className="mr-2" /> {allowSim ? 'Sim' : 'Activity'}</Button>
                      ) : (
                         <Button size="sm" variant="ghost" onClick={() => handleGenerateContent(allowSim ? 'simulation_only' : 'activity_only')} isLoading={isGenerating}><Icons.Plus size={12}/> {allowSim ? 'Sim' : 'Game'}</Button>
                      )}
                      
                      <div className="ml-auto">
                        <Button size="sm" variant={showChat ? "primary" : "secondary"} onClick={() => setShowChat(!showChat)}><Icons.MessageCircle size={14} className="mr-2" /> AI Tutor</Button>
                      </div>
                  </div>
              )}

              {/* Chat, Flashcards, Quiz Rendering... (Same as before) */}
              {showChat && (
                  <div className="mb-6 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-96 animate-slideUp relative">
                      {/* ... Chat UI ... */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {chatHistory.map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  {msg.image && <img src={msg.image} className="w-20 h-20 object-cover rounded mb-1"/>}
                                  <div className={`px-4 py-2 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{msg.text}</div>
                              </div>
                          ))}
                      </div>
                      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                           <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Ask anything..."/>
                           <button onClick={handleSendMessage} className="bg-brand-600 text-white p-2 rounded-lg"><Icons.Send size={18}/></button>
                      </div>
                  </div>
              )}
              
              {/* Markdown Content */}
              {task.markdownContent && !task.slides && (
                  <div className="prose prose-invert prose-sm max-w-none mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.markdownContent}</ReactMarkdown>
                  </div>
              )}
              
              {/* Quiz Rendering */}
              {task.quizContent && task.quizContent.length > 0 && (
                  <div className="mb-6">
                      {!quizState.active ? (
                          <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex justify-between items-center"><span className="text-white font-bold">Quiz Available</span><Button size="sm" onClick={startQuiz}>Start</Button></div>
                      ) : (
                          <div className="bg-slate-950 p-6 rounded-xl border border-slate-700">
                              <h4 className="text-white font-bold mb-4">{task.quizContent[quizState.currentQuestion].question}</h4>
                              <div className="space-y-2">
                                  {task.quizContent[quizState.currentQuestion].options.map((opt, i) => (
                                      <button key={i} onClick={() => handleQuizAnswer(i)} disabled={quizState.selectedOption !== null} className={`w-full text-left p-3 rounded border ${quizState.selectedOption === i ? 'border-brand-500 bg-brand-900/20' : 'border-slate-700 bg-slate-800'}`}>{opt}</button>
                                  ))}
                              </div>
                              {quizState.selectedOption !== null && <Button onClick={nextQuestion} className="mt-4 w-full">Next</Button>}
                          </div>
                      )}
                  </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
    
    {showHtml && task.htmlContent && <HTMLViewer title={task.title} htmlContent={task.htmlContent} onClose={() => setShowHtml(false)} />}
    {showSlides && task.slides && <CarouselViewer slides={task.slides} onClose={() => setShowSlides(false)} onComplete={() => { setShowSlides(false); if (!task.isCompleted) onToggle(task.id); }} />}
    </>
  );
};

export default TaskItem;