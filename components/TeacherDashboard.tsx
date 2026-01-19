
import React, { useState, useEffect } from 'react';
import { AppData, Quest, Task, Slide, CharacterProfile } from '../types';
import * as Icons from 'lucide-react';
import Button from './Button';
import { 
    generateLessonPlanSection,
    generateStorySection,
    generateCharacters,
    generateDifferentiationSection,
    generateSlides,
    generateSceneImage,
    generateInfographic,
    generateEducationalGame,
    generatePracticalActivity,
    generateMiniProject,
    generateExportMarkdown,
} from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import HTMLViewer from './HTMLViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import PptxGenJS from 'pptxgenjs';

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

interface Path {
    view: 'root' | 'class' | 'unit' | 'lesson';
    yearId?: string;
    classId?: string;
    unitId?: string;
    lessonId?: string;
}

const STORY_ARCHETYPES = ["Hero's Journey", "Mystery/Detective", "Scientific Discovery", "Survival", "Time Travel", "Building a Civilization", "Sports/Competition"];
const VISUAL_STYLES = ["Modern Minimalist", "Hand Drawn", "Cyberpunk/Neon", "Corporate Professional", "Playful Cartoon", "Realistic 3D Render", "Watercolor", "Pixel Art", "Cinematic"];

const ART_DIRECTIONS: Record<string, string> = {
    "Modern Minimalist": "Flat design, lots of whitespace, vector graphics, soft pastel color palette, clean lines, no gradients, corporate memphis style.",
    "Hand Drawn": "Sketchy graphite lines, rough paper texture background, imperfect organic shapes, black and white with one accent color, doodle aesthetic.",
    "Cyberpunk/Neon": "Dark background, glowing neon blue and pink lights, futuristic tech grids, chromatic aberration, high contrast, digital synthwave aesthetic.",
    "Corporate Professional": "Stock photo realistic style, clean blue and white corporate branding, sleek glass textures, professional lighting, shallow depth of field.",
    "Playful Cartoon": "Thick black outlines, vibrant primary colors, exaggerated proportions, cel-shaded lighting, fun and energetic atmosphere, 2D animation style.",
    "Realistic 3D Render": "Octane render, ray tracing, highly detailed materials (metal, wood, plastic), studio lighting, 4k resolution, photorealistic.",
    "Watercolor": "Soft edges, paint bleeds, paper texture visible, desaturated natural tones, artistic and dreamy, traditional media imitation.",
    "Pixel Art": "16-bit retro game style, limited color palette, blocky distinct pixels, dithering shading, nostalgic arcade aesthetic.",
    "Cinematic": "Wide aspect ratio composition, dramatic lighting (chiaroscuro), film grain, moody atmosphere, realistic textures, movie scene quality."
};

const TONES = ["Inspirational", "Serious/Academic", "Playful/Funny", "Urgent/Dramatic", "Mysterious"];
const FRAMEWORKS = ["5E Model", "Direct Instruction", "Inquiry-Based", "Project-Based Learning", "Workshop Model"];
const GRADES = ["Kindergarten", "Grade 1-2", "Grade 3-5", "Middle School (6-8)", "High School (9-12)"];

const ACTIVITY_TYPES = ["Experiment", "Debate", "Roleplay", "Observation", "Build/Make", "Worksheet"];
const PROJECT_FORMATS = ["Presentation", "Physical Model", "Video", "Report", "Portfolio"];
const PROJECT_DURATIONS = ["Mini Project (1 Day)", "1 Week", "2 Weeks", "1 Month", "Term Long"];
const GAME_TYPES = ["Quiz Show", "Platformer", "Simulation", "Strategy", "Puzzle"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

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
  const [path, setPath] = useState<Path>({ view: 'root' });

  // Derived Data
  const currentClass = data.classes.find(c => c.id === path.classId);
  const currentUnit = data.quests.find(q => q.id === path.unitId);
  const currentLesson = currentUnit?.tasks.find(t => t.id === path.lessonId);
  const classUnits = currentClass ? data.quests.filter(q => q.yearId === currentClass.yearId) : [];

  // Local UI State
  const [activeClassTab, setActiveClassTab] = useState<'curriculum' | 'people'>('curriculum');
  const [activeLessonTab, setActiveLessonTab] = useState<'plan'|'story'|'slides'|'diff'|'activity'|'project'|'games'>('plan');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkList, setBulkList] = useState('');
  
  // Modal States
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  // Game Preview
  const [showGamePreview, setShowGamePreview] = useState(false);

  // Lesson Creation
  const [isGenerating, setIsGenerating] = useState(false);
  const [imgGeneratingIndex, setImgGeneratingIndex] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  
  // --- LESSON CONTEXT STATE ---
  const [gradeLevel, setGradeLevel] = useState(GRADES[2]); 
  const [tone, setTone] = useState(TONES[0]);
  const [framework, setFramework] = useState(FRAMEWORKS[0]);
  
  useEffect(() => {
      if (currentLesson?.plan?.gradeLevel) setGradeLevel(currentLesson.plan.gradeLevel);
  }, [currentLesson]);

  // Input States (Plan, Story, etc.)
  const [planNotes, setPlanNotes] = useState("");
  const [planDuration, setPlanDuration] = useState("45 mins");
  const [planSlideCount, setPlanSlideCount] = useState(5);
  const [storyArchetype, setStoryArchetype] = useState(STORY_ARCHETYPES[0]);
  const [storySetting, setStorySetting] = useState("A futuristic mars colony");
  
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState("Protagonist");
  const [newCharPersonality, setNewCharPersonality] = useState("Curious and brave");
  const [newCharLook, setNewCharLook] = useState("Red hoodie, wears glasses");
  
  const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0]); 
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const [customDiffPrompt, setCustomDiffPrompt] = useState("");
  const [customProjectPrompt, setCustomProjectPrompt] = useState("");
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [activityDuration, setActivityDuration] = useState("30 mins");
  const [activityMaterials, setActivityMaterials] = useState("Standard classroom supplies");
  const [projectFormat, setProjectFormat] = useState(PROJECT_FORMATS[0]);
  const [projectTime, setProjectTime] = useState(PROJECT_DURATIONS[1]);
  const [gameType, setGameType] = useState(GAME_TYPES[0]);
  const [gameDifficulty, setGameDifficulty] = useState(DIFFICULTIES[1]);
  const [gameMechanics, setGameMechanics] = useState("");

  const navigateTo = (newPath: Path) => setPath(newPath);

  const updateCurrentTask = (updates: Partial<Task>) => {
      if (!currentUnit || !currentLesson) return;
      const updatedTasks = currentUnit.tasks.map(t => t.id === currentLesson.id ? { ...t, ...updates } : t);
      const updatedQuest = { ...currentUnit, tasks: updatedTasks };
      onUpdateQuest(updatedQuest);
  };

  // --- DOWNLOAD HELPERS ---
  const downloadBase64Image = (base64: string, filename: string) => {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${base64}`;
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const downloadText = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
  };

  // --- ACTIONS ---
  const handleExportPPT = async () => {
      if (!currentLesson?.slides || currentLesson.slides.length === 0) { alert("No slides to export."); return; }
      try {
          const pres = new PptxGenJS();
          pres.layout = 'LAYOUT_16x9'; pres.author = 'QuestHub AI'; pres.company = 'Learning Quest Hub'; pres.title = currentLesson.title;
          
          // Title Slide
          const titleSlide = pres.addSlide(); titleSlide.background = { color: '0f172a' }; 
          titleSlide.addText(currentLesson.title, { x: 0.5, y: 2.0, w: '90%', fontSize: 54, color: 'FFFFFF', align: 'center', bold: true, fontFace: 'Arial' });
          titleSlide.addText(`Grade: ${gradeLevel} • ${framework}`, { x: 0.5, y: 3.5, w: '90%', fontSize: 24, color: '94a3b8', align: 'center', fontFace: 'Arial' });
          
          currentLesson.slides.forEach(slide => {
              const pptSlide = pres.addSlide(); pptSlide.background = { color: '0f172a' };
              
              if (slide.imageUrl) {
                  // Full Screen Image Layout (High Impact) with Overlay
                  pptSlide.addImage({ 
                      data: `data:image/png;base64,${slide.imageUrl}`, 
                      x: 0, y: 0, w: '100%', h: '100%',
                      sizing: { type: 'cover' }
                  });
                  
                  // Semi-transparent overlay box
                  pptSlide.addShape(pres.ShapeType.rect, { 
                      x: 0.5, y: 0.5, w: '40%', h: '85%', 
                      fill: { color: '000000', transparency: 30 },
                      line: { color: 'FFFFFF', width: 1, transparency: 80 }
                  });

                  // Content in overlay
                  pptSlide.addText(slide.title, { 
                      x: 0.7, y: 0.7, w: '36%', 
                      fontSize: 32, color: 'FFFFFF', bold: true, align: 'left', fontFace: 'Arial' 
                  });
                  
                  const bulletText = slide.content.map(c => ({ text: c, options: { fontSize: 18, color: 'e2e8f0', breakLine: true, bullet: true, fontFace: 'Arial' } }));
                  pptSlide.addText(bulletText, { 
                      x: 0.7, y: 1.8, w: '36%', h: 5, 
                      valign: 'top', align: 'left' 
                  });
              } else {
                  // Standard Layout
                  pptSlide.addText(slide.title, { x: 0.5, y: 0.5, w: '90%', fontSize: 36, color: 'FFFFFF', bold: true, fontFace: 'Arial' });
                  const bulletText = slide.content.map(c => ({ text: c, options: { fontSize: 20, color: 'e2e8f0', breakLine: true, bullet: true, fontFace: 'Arial' } }));
                  pptSlide.addText(bulletText, { x: 0.5, y: 1.5, w: '90%', h: 5, valign: 'top' });
              }
              
              if (slide.script) pptSlide.addNotes(slide.script);
              if (slide.overlayText) {
                   pptSlide.addText(slide.overlayText, { 
                       x: 0, y: '85%', w: '100%', 
                       fontSize: 36, color: 'fbbf24', align: 'center', bold: true,
                       fill: { color: '000000', transparency: 50 },
                       fontFace: 'Arial'
                   });
              }
          });
          await pres.writeFile({ fileName: `${currentLesson.title.replace(/[^a-z0-9]/gi, '_')}.pptx` });
      } catch (e) { console.error(e); alert("Failed to create PowerPoint."); }
  };

  const handleAutoGenerate = async (section: string) => {
      if (!currentLesson) return; setIsGenerating(true);
      try {
          if (section === 'plan') {
              const plan = await generateLessonPlanSection(currentLesson.title, gradeLevel, framework, planNotes, planDuration, planSlideCount);
              updateCurrentTask({ plan });
          } else if (section === 'characters') {
              const chars = await generateCharacters(storyArchetype, 3, tone, `Topic: ${currentLesson.title}. Setting: ${storySetting}`);
              const currentStory = currentLesson.story || { theme: storyArchetype, tone, setting: storySetting, scenes: [] };
              updateCurrentTask({ story: { ...currentStory, characters: [...(currentStory.characters || []), ...chars] } });
          } else if (section === 'story') {
              if (!currentLesson.plan) { alert("Generate Plan first."); setIsGenerating(false); return; }
              const story = await generateStorySection(currentLesson.title, currentLesson.plan, storyArchetype, storySetting, tone, currentLesson.story?.characters || [], gradeLevel);
              updateCurrentTask({ story });
          } else if (section === 'diff') {
              const diff = await generateDifferentiationSection(currentLesson.title, currentLesson.plan, customDiffPrompt, gradeLevel);
              updateCurrentTask({ differentiation: diff });
          } else if (section === 'slides') {
              const slides = await generateSlides(currentLesson.title, currentLesson.plan, planSlideCount, gradeLevel);
              updateCurrentTask({ slides }); if(slides.length > 0) setSelectedSlideId(slides[0].id);
          } else if (section === 'activity') {
              const md = await generatePracticalActivity(currentLesson.title, currentLesson.plan, activityType, activityDuration, activityMaterials, customDiffPrompt, gradeLevel);
              updateCurrentTask({ practicalContent: md });
          } else if (section === 'project') {
              const md = await generateMiniProject(currentLesson.title, currentLesson.plan, projectTime, projectFormat, customProjectPrompt, gradeLevel);
              updateCurrentTask({ projectContent: md });
          } else if (section === 'game') {
              const expandedType = `${gameType} (Mechanics: ${gameMechanics})`;
              const html = await generateEducationalGame(currentLesson.title, currentLesson.plan, expandedType, gameDifficulty, gradeLevel);
              updateCurrentTask({ htmlContent: html });
          }
      } catch (e) { console.error(e); alert("Failed."); } finally { setIsGenerating(false); }
  };

  const handleGenerateSlideImage = async (slide: Slide) => {
      const artDirection = ART_DIRECTIONS[visualStyle] || "Clean, modern educational style.";
      try {
          const prompt = slide.imagePrompt || `Educational slide: ${slide.title}. ${slide.content.join('. ')}`;
          return await generateSceneImage(prompt, visualStyle, slide.aspectRatio || '16:9', `Art Direction: ${artDirection}`);
      } catch (e) { return null; }
  };

  const handleBatchGenerateSlides = async () => {
      if (!currentLesson?.slides) return;
      const slides = currentLesson.slides;
      setBatchProgress({ current: 0, total: slides.length });
      const newSlides = [...slides];
      for (let i = 0; i < slides.length; i++) {
          if (!newSlides[i].imageUrl) {
              const base64 = await handleGenerateSlideImage(newSlides[i]);
              if (base64) { newSlides[i] = { ...newSlides[i], imageUrl: base64 }; updateCurrentTask({ slides: [...newSlides] }); }
          }
          setBatchProgress({ current: i + 1, total: slides.length });
      }
      setBatchProgress(null);
  };

  const handleBatchGenerateScenes = async () => {
      if (!currentLesson?.story?.scenes) return;
      const scenes = currentLesson.story.scenes;
      setBatchProgress({ current: 0, total: scenes.length });
      let currentImages = currentLesson.sceneImages || [];
      const artDirection = ART_DIRECTIONS[visualStyle];
      const charDesc = (currentLesson.story.characters || []).map(c => `${c.name} looks like: ${c.visualDescription}`).join('. ');
      const context = `Characters and their visuals: ${charDesc}. Setting: ${storySetting}. Art Direction: ${artDirection}`;
      for (let i = 0; i < scenes.length; i++) {
          if (!currentImages.find(img => img.sceneIndex === i)) {
              const base64 = await generateSceneImage(scenes[i], visualStyle, "16:9", context);
              if (base64) {
                  const newImage = { id: uuidv4(), sceneIndex: i, base64, prompt: scenes[i] };
                  currentImages = [...currentImages, newImage].sort((a,b) => a.sceneIndex - b.sceneIndex);
                  updateCurrentTask({ sceneImages: currentImages });
              }
          }
          setBatchProgress({ current: i + 1, total: scenes.length });
      }
      setBatchProgress(null);
  };

  const handleDownloadAllScenes = () => {
      if (!currentLesson?.sceneImages || currentLesson.sceneImages.length === 0) { alert("No images to download."); return; }
      currentLesson.sceneImages.forEach((img, idx) => { setTimeout(() => { downloadBase64Image(img.base64, `${currentLesson.title}_Scene_${idx + 1}.png`); }, idx * 500); });
  };

  const handleGenerateInfographic = async (type: 'activity' | 'project' | 'diff') => {
      if(!currentLesson) return; setIsGenerating(true);
      let content = "";
      if (type === 'activity') content = currentLesson.practicalContent || currentLesson.plan?.mainActivity || "No content";
      if (type === 'project') content = currentLesson.projectContent || "No content";
      if (type === 'diff') content = JSON.stringify(currentLesson.differentiation) || "No content";
      try {
          const base64 = await generateInfographic(content.substring(0, 1000), visualStyle);
          if(base64) {
              if (type === 'activity') updateCurrentTask({ activityInfographic: base64 });
              if (type === 'project') updateCurrentTask({ projectInfographic: base64 });
              if (type === 'diff') updateCurrentTask({ differentiationInfographic: base64 });
          } else { alert("Infographic generation returned empty. Try a different style."); }
      } catch (e) { alert("Failed to generate infographic."); } finally { setIsGenerating(false); }
  };

  const handleAddCharacter = () => {
        if (!newCharName || !currentLesson) return;
        const newChar: CharacterProfile = { id: uuidv4(), name: newCharName, gender: "Unknown", age: "Unknown", role: newCharRole, personality: newCharPersonality, visualDescription: newCharLook };
        const currentStory = currentLesson.story || { theme: storyArchetype, tone, setting: storySetting, scenes: [], characters: [] };
        updateCurrentTask({ story: { ...currentStory, characters: [...(currentStory.characters || []), newChar] } });
        setNewCharName(""); setNewCharLook(""); setNewCharPersonality("Curious and brave");
  };

  const handleDeleteCharacter = (charId: string) => {
      if (!currentLesson?.story?.characters) return;
      const updatedChars = currentLesson.story.characters.filter(c => c.id !== charId);
      updateCurrentTask({ story: { ...currentLesson.story, characters: updatedChars } });
  };

  const generateSceneImageInternal = async (scene: string, idx: number) => {
      if (!currentLesson?.story) return null;
      const artDirectionDesc = ART_DIRECTIONS[visualStyle];
      const charDesc = (currentLesson.story.characters || []).map(c => `${c.name} looks like: ${c.visualDescription}`).join('. ');
      const context = `Characters and visuals: ${charDesc}. Setting: ${storySetting}. Art Direction: ${artDirectionDesc}`;
      return await generateSceneImage(scene, visualStyle, "16:9", context);
  };

  const handleCreateClass = () => {
      if (newClassName && newClassYear) { onAddClass(newClassName, newClassYear); setNewClassName(''); setNewClassYear(''); setIsAddingClass(false); } 
      else { alert("Please enter a class name and select a year."); }
  };

  const handleCreateStudent = () => {
      if (newStudentName && currentClass) { onAddStudent(newStudentName, currentClass.id); setNewStudentName(''); setIsAddingStudent(false); }
  };

  // --- VIEW RENDERERS ---

  const renderInfographicPreview = (base64: string | undefined, title: string) => {
      if (!base64) return null;
      return (
          <div className="mb-6 p-4 bg-slate-900 rounded-2xl border border-slate-700/50 shadow-xl flex gap-6 items-center hover:border-brand-500/30 transition-all">
              <div className="h-40 w-32 shrink-0 bg-black rounded-xl overflow-hidden border border-slate-700/50 relative group cursor-pointer" onClick={() => downloadBase64Image(base64, `${title}_Infographic.png`)}>
                  <img src={`data:image/png;base64,${base64}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Icons.Download className="text-white" size={24}/>
                  </div>
              </div>
              <div className="flex-1">
                  <h4 className="text-white font-bold text-lg mb-1">{title} Infographic</h4>
                  <p className="text-slate-400 text-sm mb-4">Visual summary generated by AI.</p>
                  <Button size="sm" onClick={() => downloadBase64Image(base64, `${title}_Infographic.png`)} variant="secondary">
                      <Icons.Download size={16} className="mr-2"/> Download
                  </Button>
              </div>
          </div>
      );
  };

  // 1. ROOT DASHBOARD VIEW
  const renderRoot = () => (
      <div className="flex flex-col h-full bg-slate-950 p-8 overflow-y-auto animate-fadeIn relative ml-24">
          <header className="mb-10 flex justify-between items-end border-b border-white/5 pb-6">
              <div>
                  <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Teacher Dashboard</h1>
                  <p className="text-slate-400 font-medium">Manage curriculum, classes, and content generation.</p>
              </div>
              <Button onClick={() => {
                  if (data.years.length > 0) { setNewClassYear(data.years[0].id); setIsAddingClass(true); } else { alert("No academic years found."); }
              }} className="shadow-lg shadow-brand-500/20"><Icons.Plus size={18} className="mr-2"/> New Class</Button>
          </header>

          {/* ADD CLASS MODAL */}
          {isAddingClass && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl animate-scaleUp">
                      <h3 className="text-2xl font-bold text-white mb-6">Create New Class</h3>
                      <div className="space-y-5">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Class Name</label>
                              <input 
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                                  placeholder="e.g. 3rd Grade - Math A"
                                  autoFocus
                                  value={newClassName}
                                  onChange={e => setNewClassName(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Academic Year</label>
                              <select 
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                  value={newClassYear}
                                  onChange={e => setNewClassYear(e.target.value)}
                              >
                                  {data.years.map(y => <option key={y.id} value={y.id}>{y.title}</option>)}
                              </select>
                          </div>
                          <div className="flex gap-3 pt-4">
                              <Button variant="ghost" className="flex-1" onClick={() => setIsAddingClass(false)}>Cancel</Button>
                              <Button className="flex-1" onClick={handleCreateClass}>Create Class</Button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.classes.map(c => (
                  <div key={c.id} onClick={() => navigateTo({view: 'class', classId: c.id})} className="group bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-[24px] p-6 cursor-pointer hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[60px] -mr-20 -mt-20 transition-opacity opacity-0 group-hover:opacity-100"></div>
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="p-3.5 bg-slate-950 rounded-2xl text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner border border-slate-800 group-hover:border-brand-500">
                              <Icons.Users size={24} />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete class?')) onDeleteClass(c.id); }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-800 rounded-lg"><Icons.Trash2 size={18}/></button>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-200 transition-colors">{c.title}</h3>
                      <p className="text-slate-400 text-sm font-medium mb-6">{c.studentIds.length} Students Enrolled</p>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <span className="px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 group-hover:border-brand-500/30 transition-colors">
                              {data.years.find(y => y.id === c.yearId)?.title || 'Unknown Year'}
                          </span>
                      </div>
                  </div>
              ))}
              
              {data.classes.length === 0 && (
                  <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/30 flex flex-col items-center justify-center">
                      <div className="p-6 bg-slate-900 rounded-full mb-4 shadow-xl"><Icons.School size={48} className="text-slate-700" /></div>
                      <h3 className="text-xl font-bold text-white mb-2">No Classes Yet</h3>
                      <p className="text-slate-500 max-w-md mx-auto">Create your first class to start managing curriculum and students.</p>
                  </div>
              )}
          </div>
      </div>
  );

  // 2. LESSON EDITOR VIEW
  const renderLesson = () => {
      if (!currentLesson) return null;
      const tabs = [
          { id: 'plan', label: 'Lesson Plan', icon: Icons.FileText },
          { id: 'slides', label: 'Lecture Slides', icon: Icons.Presentation },
          { id: 'story', label: 'Story Arc', icon: Icons.BookOpen },
          { id: 'activity', label: 'Activity', icon: Icons.Scissors },
          { id: 'project', label: 'Project', icon: Icons.FlaskConical },
          { id: 'games', label: 'Game / Sim', icon: Icons.Gamepad2 },
          { id: 'diff', label: 'Differentiation', icon: Icons.Users },
      ];

      return (
          <div className="flex h-full bg-slate-950 overflow-hidden ml-24">
              {/* SIDEBAR NAVIGATION FOR LESSON */}
              <div className="w-64 bg-slate-900 border-r border-white/5 flex flex-col shrink-0 z-20">
                  <div className="p-6 border-b border-white/5">
                      <button onClick={() => navigateTo({ view: 'unit', unitId: path.unitId, classId: path.classId })} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium mb-4 transition-colors"><Icons.ArrowLeft size={16}/> Back to Unit</button>
                      <h2 className="font-bold text-white text-lg leading-tight line-clamp-2">{currentLesson.title}</h2>
                      <div className="mt-2 text-xs font-bold text-brand-400 uppercase tracking-wider bg-brand-900/20 px-2 py-1 rounded w-fit border border-brand-500/20">{currentLesson.type}</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
                      {tabs.map(tab => (
                          <button 
                            key={tab.id} 
                            onClick={() => setActiveLessonTab(tab.id as any)} 
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all relative group ${activeLessonTab === tab.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                          >
                              <tab.icon size={18} className={activeLessonTab === tab.id ? 'text-white' : 'group-hover:text-brand-300'} />
                              <span className="font-medium text-sm">{tab.label}</span>
                          </button>
                      ))}
                  </div>

                  <div className="p-4 border-t border-white/5 bg-slate-900">
                      <div className="mb-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Grade Level</label>
                          <select 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-500"
                            value={gradeLevel}
                            onChange={(e) => {
                                const newLevel = e.target.value; setGradeLevel(newLevel);
                                if(currentLesson.plan) updateCurrentTask({ plan: { ...currentLesson.plan, gradeLevel: newLevel } });
                            }}
                          >
                              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                      </div>
                      <Button size="sm" variant="secondary" className="w-full justify-center" onClick={() => downloadText(generateExportMarkdown(currentLesson), 'Full_Lesson.md')}><Icons.Download size={14} className="mr-2"/> Export Markdown</Button>
                  </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="flex-1 overflow-y-auto bg-slate-950 relative">
                  <div className="max-w-5xl mx-auto p-8 pb-32">
                      <AnimatePresence mode='wait'>
                          <motion.div 
                            key={activeLessonTab} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            transition={{ duration: 0.2 }}
                          >
                              {/* --- PLAN TAB --- */}
                              {activeLessonTab === 'plan' && (
                                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                                      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                                          <h3 className="text-2xl font-bold text-white">Lesson Plan</h3>
                                          <div className="flex gap-2">
                                              <Button size="sm" onClick={() => handleAutoGenerate('plan')} isLoading={isGenerating}><Icons.Sparkles size={16} className="mr-2"/> AI Generate</Button>
                                              {currentLesson.plan && <Button size="sm" variant="ghost" onClick={() => downloadText(JSON.stringify(currentLesson.plan, null, 2), 'Plan.json')}><Icons.Download size={16}/></Button>}
                                          </div>
                                      </div>
                                      
                                      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/30">
                                          <div className="space-y-2">
                                              <label className="text-xs font-bold text-slate-500 uppercase">Duration</label>
                                              <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none" value={planDuration} onChange={e => setPlanDuration(e.target.value)} />
                                          </div>
                                          <div className="space-y-2">
                                              <label className="text-xs font-bold text-slate-500 uppercase">Slide Count</label>
                                              <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none" value={planSlideCount} onChange={e => setPlanSlideCount(parseInt(e.target.value))} />
                                          </div>
                                          <div className="space-y-2">
                                              <label className="text-xs font-bold text-slate-500 uppercase">Framework</label>
                                              <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none" value={framework} onChange={e => setFramework(e.target.value)}>{FRAMEWORKS.map(f => <option key={f} value={f}>{f}</option>)}</select>
                                          </div>
                                          <div className="col-span-full space-y-2">
                                              <label className="text-xs font-bold text-slate-500 uppercase">Context / Focus</label>
                                              <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-500 outline-none min-h-[80px]" placeholder="Specific focus points..." value={planNotes} onChange={e => setPlanNotes(e.target.value)} />
                                          </div>
                                      </div>

                                      <div className="p-8 border-t border-white/5">
                                          <h4 className="text-sm font-bold text-brand-400 mb-6 uppercase tracking-wide flex items-center gap-2"><Icons.Eye size={16}/> Preview</h4>
                                          <div className="text-slate-300 leading-relaxed space-y-6">
                                              {currentLesson.plan?.mainActivity ? (
                                                  <>
                                                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                                          <h5 className="font-bold text-white mb-2">Objective</h5>
                                                          <p className="text-sm">{currentLesson.plan.objectives[0]}</p>
                                                      </div>
                                                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                                          <h5 className="font-bold text-white mb-2">Main Activity</h5>
                                                          <p className="text-sm">{currentLesson.plan.mainActivity}</p>
                                                      </div>
                                                      {currentLesson.plan.slidesOutline && (
                                                          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                                              <h5 className="font-bold text-white mb-4">Slide Outline</h5>
                                                              <ul className="space-y-3">
                                                                  {currentLesson.plan.slidesOutline.map((s,i) => (
                                                                      <li key={i} className="flex gap-3 text-sm">
                                                                          <span className="flex-shrink-0 w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">{i+1}</span>
                                                                          <span className="text-slate-300">{s}</span>
                                                                      </li>
                                                                  ))}
                                                              </ul>
                                                          </div>
                                                      )}
                                                  </>
                                              ) : (
                                                  <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50 border-2 border-dashed border-slate-800 rounded-2xl">
                                                      <Icons.FileText size={48} className="mb-4"/>
                                                      <span>No plan generated yet. Fill in details and click Generate.</span>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* --- SLIDES TAB --- */}
                              {activeLessonTab === 'slides' && (
                                  <div className="flex flex-col h-[80vh] gap-6">
                                      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                                          <div className="flex items-center gap-4">
                                               <select className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-500 outline-none" value={visualStyle} onChange={e => setVisualStyle(e.target.value)}>{VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                               <Button size="sm" onClick={() => handleAutoGenerate('slides')} isLoading={isGenerating}><Icons.Sparkles size={16} className="mr-2"/> Generate Slides</Button>
                                          </div>
                                          <div className="flex gap-2">
                                              <Button size="sm" variant="secondary" onClick={handleExportPPT}><Icons.MonitorPlay size={16} className="mr-2"/> Export PPTX</Button>
                                              <Button size="sm" onClick={handleBatchGenerateSlides} disabled={!!batchProgress} isLoading={!!batchProgress}>
                                                  {batchProgress ? `Generating ${batchProgress.current}/${batchProgress.total}` : 'Batch Gen Images'}
                                              </Button>
                                          </div>
                                      </div>

                                      <div className="flex-1 flex gap-6 min-h-0">
                                          {/* Slide List */}
                                          <div className="w-64 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shrink-0">
                                              <div className="p-4 border-b border-slate-800 font-bold text-white text-sm">Slides</div>
                                              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                                  {currentLesson.slides?.map((s, i) => (
                                                      <div key={s.id} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedSlideId === s.id ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`} onClick={() => setSelectedSlideId(s.id)}>
                                                          <span className="text-xs font-bold opacity-50 w-4">{i+1}</span>
                                                          <span className="text-xs font-medium truncate">{s.title}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          {/* Slide Editor */}
                                          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                                              {currentLesson.slides?.find(s => s.id === selectedSlideId) ? (
                                                  <div className="flex flex-col h-full">
                                                      <div className="p-6 border-b border-slate-800">
                                                          <input className="bg-transparent text-2xl font-bold text-white w-full outline-none placeholder:text-slate-700" value={currentLesson.slides.find(s => s.id === selectedSlideId)!.title} onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === selectedSlideId ? { ...s, title: e.target.value } : s) })} />
                                                      </div>
                                                      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-2 gap-8">
                                                          <div className="space-y-6">
                                                              <div>
                                                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Content Bullets</label>
                                                                  <textarea className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:border-brand-500 outline-none resize-none" value={currentLesson.slides.find(s => s.id === selectedSlideId)!.content.join('\n')} onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === selectedSlideId ? { ...s, content: e.target.value.split('\n') } : s) })} />
                                                              </div>
                                                              <div>
                                                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Speaker Script</label>
                                                                  <textarea className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-sm focus:border-brand-500 outline-none resize-none" value={currentLesson.slides.find(s => s.id === selectedSlideId)!.script || ''} onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === selectedSlideId ? { ...s, script: e.target.value } : s) })} />
                                                              </div>
                                                          </div>
                                                          <div className="flex flex-col gap-4">
                                                              <div className="flex-1 bg-black rounded-xl border border-slate-800 relative overflow-hidden group flex items-center justify-center min-h-[200px]">
                                                                  {currentLesson.slides.find(s => s.id === selectedSlideId)!.imageUrl ? (
                                                                      <img src={`data:image/png;base64,${currentLesson.slides.find(s => s.id === selectedSlideId)!.imageUrl}`} className="w-full h-full object-cover" />
                                                                  ) : <div className="text-slate-600 text-sm flex flex-col items-center"><Icons.Image size={32} className="mb-2 opacity-50"/>No Image</div>}
                                                              </div>
                                                              <Button size="sm" onClick={async () => { const s = currentLesson.slides!.find(x => x.id === selectedSlideId)!; setIsGenerating(true); const b64 = await handleGenerateSlideImage(s); if(b64) updateCurrentTask({slides: currentLesson.slides!.map(x => x.id === s.id ? {...x, imageUrl: b64} : x)}); setIsGenerating(false); }} isLoading={isGenerating}>Generate Single Image</Button>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ) : <div className="flex items-center justify-center h-full text-slate-500">Select a slide to edit</div>}
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* --- STORY TAB --- */}
                              {activeLessonTab === 'story' && (
                                  <div className="space-y-8">
                                      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                                          <div className="flex justify-between items-center mb-8">
                                              <div>
                                                  <h3 className="text-2xl font-bold text-white mb-1">Story Arc</h3>
                                                  <p className="text-slate-400 text-sm">Weave narrative into your lesson.</p>
                                              </div>
                                              <div className="flex gap-2">
                                                  <Button size="sm" onClick={handleDownloadAllScenes} variant="secondary"><Icons.Download size={16} className="mr-2"/> Save All Images</Button>
                                                  <Button size="sm" onClick={handleBatchGenerateScenes} disabled={!!batchProgress} isLoading={!!batchProgress}>
                                                      {batchProgress ? `Generating ${batchProgress.current}/${batchProgress.total}` : 'Batch Gen Images'}
                                                  </Button>
                                                  <Button size="sm" onClick={() => handleAutoGenerate('story')} isLoading={isGenerating}><Icons.Wand2 size={16} className="mr-2"/> Generate Story</Button>
                                              </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                              <div className="space-y-2">
                                                  <label className="text-xs font-bold text-slate-500 uppercase">Archetype</label>
                                                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-brand-500 outline-none" value={storyArchetype} onChange={e => setStoryArchetype(e.target.value)}>{STORY_ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}</select>
                                              </div>
                                              <div className="space-y-2">
                                                  <label className="text-xs font-bold text-slate-500 uppercase">Tone</label>
                                                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-brand-500 outline-none" value={tone} onChange={e => setTone(e.target.value)}>{TONES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                              </div>
                                              <div className="space-y-2">
                                                  <label className="text-xs font-bold text-slate-500 uppercase">Setting</label>
                                                  <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-brand-500 outline-none" value={storySetting} onChange={e => setStorySetting(e.target.value)} placeholder="e.g. Ancient Rome"/>
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                              {/* CAST LIST */}
                                              <div className="lg:col-span-1 flex flex-col gap-4">
                                                  <div className="flex justify-between items-center">
                                                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cast</h4>
                                                      <Button size="xs" variant="ghost" onClick={() => handleAutoGenerate('characters')} isLoading={isGenerating}><Icons.Sparkles size={12} className="mr-1"/> Auto-Populate</Button>
                                                  </div>
                                                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                                      {currentLesson.story?.characters?.map(c => (
                                                          <div key={c.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group hover:border-brand-500/30 transition-all">
                                                              <button onClick={() => handleDeleteCharacter(c.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.X size={14}/></button>
                                                              <div className="flex items-center gap-3 mb-2">
                                                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-white/5">{c.name[0]}</div>
                                                                  <div>
                                                                      <div className="font-bold text-white text-sm">{c.name}</div>
                                                                      <div className="text-xs text-brand-400 font-medium">{c.role}</div>
                                                                  </div>
                                                              </div>
                                                              <div className="text-xs text-slate-400 italic mb-2">"{c.personality}"</div>
                                                              <div className="text-[10px] text-slate-500 border-t border-white/5 pt-2 leading-snug">{c.visualDescription}</div>
                                                          </div>
                                                      ))}
                                                      
                                                      {/* Add Character Form */}
                                                      <div className="bg-slate-900 border border-dashed border-slate-700 p-4 rounded-xl mt-4">
                                                          <h5 className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Icons.UserPlus size={14}/> Add Character</h5>
                                                          <div className="space-y-2 mb-3">
                                                              <input className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white" placeholder="Name" value={newCharName} onChange={e => setNewCharName(e.target.value)} />
                                                              <select className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white" value={newCharRole} onChange={e => setNewCharRole(e.target.value)}><option>Protagonist</option><option>Antagonist</option><option>Mentor</option><option>Sidekick</option></select>
                                                              <textarea className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white h-16 resize-none" placeholder="Visual Description..." value={newCharLook} onChange={e => setNewCharLook(e.target.value)}/>
                                                          </div>
                                                          <Button size="sm" className="w-full" onClick={handleAddCharacter} disabled={!newCharName}>Add</Button>
                                                      </div>
                                                  </div>
                                              </div>

                                              {/* SCENES */}
                                              <div className="lg:col-span-2 space-y-6">
                                                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Scenes</h4>
                                                  {currentLesson.story?.scenes.map((scene, idx) => {
                                                      const imgData = currentLesson.sceneImages?.find(img => img.sceneIndex === idx);
                                                      return (
                                                          <div key={idx} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex gap-6 items-start hover:border-slate-700 transition-colors">
                                                              <div className="w-48 aspect-video bg-black rounded-xl border border-slate-800 shrink-0 relative overflow-hidden group">
                                                                  {imgData ? <img src={`data:image/png;base64,${imgData.base64}`} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-slate-700"><Icons.Image size={24}/></div>}
                                                                  <button onClick={() => { setImgGeneratingIndex(idx); generateSceneImageInternal(scene, idx).then(b64 => { if(b64) updateCurrentTask({sceneImages: [...(currentLesson.sceneImages||[]).filter(i=>i.sceneIndex!==idx), {id:uuidv4(), sceneIndex:idx, base64:b64, prompt:scene}].sort((a,b)=>a.sceneIndex-b.sceneIndex)}); setImgGeneratingIndex(null); }); }} className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><Icons.RefreshCw size={14}/></button>
                                                              </div>
                                                              <div className="flex-1">
                                                                  <div className="text-xs font-bold text-brand-400 mb-2 uppercase tracking-wider bg-brand-900/10 w-fit px-2 py-0.5 rounded">Scene {idx+1}</div>
                                                                  <p className="text-slate-300 leading-relaxed text-sm">{scene}</p>
                                                              </div>
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* --- OTHER TABS (Activity, Project, Games, Diff) --- */}
                              {['activity', 'project', 'diff', 'games'].includes(activeLessonTab) && (
                                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl min-h-[600px] flex flex-col">
                                      <div className="flex justify-between items-center mb-8">
                                          <h3 className="text-2xl font-bold text-white capitalize">{activeLessonTab === 'diff' ? 'Differentiation' : activeLessonTab}</h3>
                                          <div className="flex gap-2">
                                              {activeLessonTab !== 'games' && <Button size="sm" onClick={() => handleGenerateInfographic(activeLessonTab as any)} isLoading={isGenerating} variant="secondary"><Icons.Image size={16} className="mr-2"/> Generate Infographic</Button>}
                                              <Button size="sm" onClick={() => handleAutoGenerate(activeLessonTab === 'games' ? 'game' : activeLessonTab)} isLoading={isGenerating}><Icons.Sparkles size={16} className="mr-2"/> Generate Content</Button>
                                              
                                              {activeLessonTab === 'games' && currentLesson.htmlContent && (
                                                  <>
                                                    <Button size="sm" onClick={() => downloadText(currentLesson.htmlContent || '', `${currentLesson.title.replace(/\s+/g,'_')}_Game.html`)} variant="ghost"><Icons.Download size={16}/></Button>
                                                    <Button size="sm" onClick={() => setShowGamePreview(true)} className="bg-emerald-600 hover:bg-emerald-500 border-none"><Icons.Play size={16} className="mr-2"/> Preview Game</Button>
                                                  </>
                                              )}
                                          </div>
                                      </div>

                                      {/* Specific Settings Panels */}
                                      {activeLessonTab === 'activity' && (
                                          <div className="grid grid-cols-3 gap-6 mb-6 p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Type</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={activityType} onChange={e => setActivityType(e.target.value)}>{ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Duration</label><input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={activityDuration} onChange={e => setActivityDuration(e.target.value)} /></div>
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Materials</label><input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={activityMaterials} onChange={e => setActivityMaterials(e.target.value)} /></div>
                                          </div>
                                      )}

                                      {activeLessonTab === 'project' && (
                                          <div className="grid grid-cols-3 gap-6 mb-6 p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Format</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={projectFormat} onChange={e => setProjectFormat(e.target.value)}>{PROJECT_FORMATS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Time</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={projectTime} onChange={e => setProjectTime(e.target.value)}>{PROJECT_DURATIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Constraints</label><input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={customProjectPrompt} onChange={e => setCustomProjectPrompt(e.target.value)} /></div>
                                          </div>
                                      )}

                                      {activeLessonTab === 'games' && (
                                          <div className="mb-6 p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                                              <div className="grid grid-cols-2 gap-6 mb-4">
                                                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Type</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={gameType} onChange={e => setGameType(e.target.value)}>{GAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Difficulty</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none" value={gameDifficulty} onChange={e => setGameDifficulty(e.target.value)}>{DIFFICULTIES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                              </div>
                                              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Mechanics / Rules</label><textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm h-16 resize-none outline-none" placeholder="e.g. Collect stars, avoid spikes..." value={gameMechanics} onChange={e => setGameMechanics(e.target.value)} /></div>
                                          </div>
                                      )}

                                      {activeLessonTab === 'diff' && (
                                          <div className="mb-6"><textarea className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm h-24 resize-none outline-none focus:border-brand-500" placeholder="Specific student needs (e.g. ELL, Visual Learners)..." value={customDiffPrompt} onChange={e => setCustomDiffPrompt(e.target.value)}/></div>
                                      )}

                                      {/* Infographic Preview */}
                                      {activeLessonTab === 'activity' && renderInfographicPreview(currentLesson.activityInfographic, 'Activity')}
                                      {activeLessonTab === 'project' && renderInfographicPreview(currentLesson.projectInfographic, 'Project')}
                                      {activeLessonTab === 'diff' && renderInfographicPreview(currentLesson.differentiationInfographic, 'Differentiation')}

                                      <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-8 overflow-y-auto shadow-inner">
                                          {activeLessonTab === 'diff' ? (
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                                                  <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-900/30">
                                                      <h4 className="text-emerald-400 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2"><Icons.LifeBuoy size={14}/> Support</h4>
                                                      <p className="text-slate-300 text-sm leading-relaxed">{(currentLesson.differentiation as any)?.support || 'Content will appear here.'}</p>
                                                  </div>
                                                  <div className="bg-slate-900 p-5 rounded-2xl border border-blue-900/30">
                                                      <h4 className="text-blue-400 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2"><Icons.Target size={14}/> Core</h4>
                                                      <p className="text-slate-300 text-sm leading-relaxed">{(currentLesson.differentiation as any)?.core || 'Content will appear here.'}</p>
                                                  </div>
                                                  <div className="bg-slate-900 p-5 rounded-2xl border border-purple-900/30">
                                                      <h4 className="text-purple-400 font-bold mb-3 uppercase text-xs tracking-wider flex items-center gap-2"><Icons.Rocket size={14}/> Challenge</h4>
                                                      <p className="text-slate-300 text-sm leading-relaxed">{(currentLesson.differentiation as any)?.challenge || 'Content will appear here.'}</p>
                                                  </div>
                                              </div>
                                          ) : activeLessonTab === 'games' ? (
                                              <textarea className="w-full h-full bg-transparent border-none text-emerald-400 font-mono text-xs focus:ring-0 resize-none p-2" value={currentLesson.htmlContent || ''} onChange={e => updateCurrentTask({htmlContent: e.target.value})} placeholder="// Game code will appear here..." spellCheck={false} />
                                          ) : (
                                              <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white">
                                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                      {activeLessonTab === 'activity' ? (currentLesson.practicalContent || '') : 
                                                       activeLessonTab === 'project' ? (currentLesson.projectContent || '') : ''}
                                                  </ReactMarkdown>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </motion.div>
                      </AnimatePresence>
                  </div>
              </div>
              {showGamePreview && currentLesson.htmlContent && <HTMLViewer title={currentLesson.title} htmlContent={currentLesson.htmlContent} onClose={() => setShowGamePreview(false)} />}
          </div>
      );
  };

  if (path.view === 'class') return (
      <div className="flex flex-col h-full bg-slate-950 ml-24">
          <header className="px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                   <button onClick={() => navigateTo({ view: 'root' })} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><Icons.ArrowLeft size={20}/></button>
                   <div><h2 className="text-2xl font-bold text-white">{currentClass?.title}</h2></div>
               </div>
               <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                   <button onClick={() => setActiveClassTab('curriculum')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeClassTab === 'curriculum' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>Curriculum</button>
                   <button onClick={() => setActiveClassTab('people')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeClassTab === 'people' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>People</button>
               </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
              {activeClassTab === 'people' && (
                  <div className="max-w-4xl mx-auto">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white">Students</h3>
                          <div className="flex gap-2">
                              <Button size="sm" onClick={() => setIsAddingStudent(true)}><Icons.UserPlus size={16} className="mr-2"/> Add Student</Button>
                              <Button size="sm" variant="secondary" onClick={() => setIsBulkImporting(true)}><Icons.Users size={16} className="mr-2"/> Bulk Import</Button>
                          </div>
                      </div>

                      {/* Add Student Modal / Inline */}
                      {isAddingStudent && (
                          <div className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl animate-slideUp">
                              <h4 className="font-bold text-white mb-2">New Student</h4>
                              <div className="flex gap-2">
                                  <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" placeholder="Student Name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} autoFocus />
                                  <Button size="sm" onClick={handleCreateStudent}>Add</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setIsAddingStudent(false)}>Cancel</Button>
                              </div>
                          </div>
                      )}
                      
                      {isBulkImporting && (
                          <div className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl animate-slideUp">
                                <h4 className="font-bold text-white mb-2">Bulk Import (Names separated by newlines)</h4>
                                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white h-32 mb-2" value={bulkList} onChange={e => setBulkList(e.target.value)} placeholder="Alice&#10;Bob&#10;Charlie"></textarea>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => { if(currentClass && bulkList.trim()) { onAddStudentBulk(bulkList.split('\n').filter(n=>n.trim()), currentClass.id); setBulkList(''); setIsBulkImporting(false); } }}>Import</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsBulkImporting(false)}>Cancel</Button>
                                </div>
                          </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                          {data.students.filter(s => currentClass?.studentIds.includes(s.id)).map(s => (
                              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white">{s.name[0]}</div>
                                      <div>
                                          <div className="font-bold text-white">{s.name}</div>
                                          <div className="text-xs text-slate-500">{s.email}</div>
                                      </div>
                                  </div>
                                  <button onClick={() => onDeleteStudent(s.id, currentClass!.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-lg"><Icons.Trash2 size={16}/></button>
                              </div>
                          ))}
                          {currentClass?.studentIds.length === 0 && <div className="text-center text-slate-500 py-10">No students enrolled.</div>}
                      </div>
                  </div>
              )}

              {activeClassTab === 'curriculum' && (
                  <div className="max-w-5xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {classUnits.map(q => (
                              <div key={q.id} onClick={() => navigateTo({view: 'unit', unitId: q.id, classId: currentClass?.id})} className="bg-slate-900 border border-slate-800 hover:border-brand-500/50 p-6 rounded-2xl cursor-pointer group transition-all hover:shadow-xl">
                                  <div className="flex justify-between mb-4">
                                      <div className="p-2 bg-slate-950 rounded-lg text-brand-400 border border-slate-800"><Icons.BookOpen size={20}/></div>
                                      <div className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">{q.tasks.length} Lessons</div>
                                  </div>
                                  <h3 className="font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">{q.title}</h3>
                                  <p className="text-xs text-slate-500 line-clamp-2">{q.description}</p>
                              </div>
                          ))}
                           <div onClick={() => {}} className="border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-600 hover:text-white hover:border-brand-500/50 hover:bg-slate-900/50 transition-all cursor-pointer">
                                <Icons.Plus size={24} className="mb-2"/>
                                <span className="text-sm font-bold">Add Unit</span>
                           </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  if (path.view === 'unit') return (
      <div className="flex flex-col h-full bg-slate-950 ml-24">
           <header className="px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                   <button onClick={() => navigateTo({ view: 'class', classId: path.classId })} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><Icons.ArrowLeft size={20}/></button>
                   <div>
                       <h2 className="text-2xl font-bold text-white">{currentUnit?.title}</h2>
                       <p className="text-xs text-slate-500">Unit Overview</p>
                   </div>
               </div>
           </header>
           <div className="flex-1 overflow-y-auto p-8">
               <div className="max-w-4xl mx-auto space-y-4">
                   {currentUnit?.tasks.map((task, idx) => (
                       <div key={task.id} onClick={() => navigateTo({ view: 'lesson', lessonId: task.id, unitId: currentUnit.id, classId: currentClass?.id })} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-brand-500/50 hover:bg-slate-800 transition-all group">
                           <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-800 group-hover:border-brand-500/50 group-hover:text-brand-400">{idx + 1}</div>
                               <div>
                                   <div className="font-bold text-white group-hover:text-brand-300 transition-colors">{task.title}</div>
                                   <div className="text-xs text-slate-500">{task.type} • {task.xp} XP</div>
                               </div>
                           </div>
                           <Icons.ChevronRight size={16} className="text-slate-600 group-hover:text-white"/>
                       </div>
                   ))}
               </div>
           </div>
      </div>
  );

  if (path.view === 'lesson') return renderLesson();

  return renderRoot();
};

export default TeacherDashboard;
