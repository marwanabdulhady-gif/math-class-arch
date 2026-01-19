
import React, { useState, useEffect } from 'react';
import { AppData, Quest, Task, ContentType, CharacterProfile, Slide } from '../types';
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
    enhanceImagePrompt,
    generateSimulation,
    generateEducationalGame,
    generatePracticalActivity,
    generateMiniProject,
    generateExportMarkdown,
    generateSingleTask,
} from '../services/geminiService';
import { CONTENT_TYPE_CONFIG } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import HTMLViewer from './HTMLViewer';
import CarouselViewer from './CarouselViewer';
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

// --- PRESETS & CONSTANTS ---
const STORY_ARCHETYPES = ["Hero's Journey", "Mystery/Detective", "Scientific Discovery", "Survival", "Time Travel", "Building a Civilization", "Sports/Competition"];
const VISUAL_STYLES = ["Modern Minimalist", "Hand Drawn", "Cyberpunk/Neon", "Corporate Professional", "Playful Cartoon", "Realistic 3D Render", "Watercolor", "Pixel Art", "Cinematic"];

// STYLISTIC CONSISTENCY ENGINE
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
  const [direction, setDirection] = useState(1); 

  // Derived Data
  const currentClass = data.classes.find(c => c.id === path.classId);
  const currentUnit = data.quests.find(q => q.id === path.unitId);
  const currentLesson = currentUnit?.tasks.find(t => t.id === path.lessonId);
  const classStudents = currentClass ? data.students.filter(s => currentClass.studentIds.includes(s.id)) : [];
  const classUnits = currentClass ? data.quests.filter(q => q.yearId === currentClass.yearId) : [];

  // Local UI State
  const [activeClassTab, setActiveClassTab] = useState<'curriculum' | 'people'>('curriculum');
  const [activeLessonTab, setActiveLessonTab] = useState<'plan'|'story'|'slides'|'diff'|'activity'|'project'|'games'>('plan');
  const [showNewLessonModal, setShowNewLessonModal] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkList, setBulkList] = useState('');
  
  // Game Preview
  const [showGamePreview, setShowGamePreview] = useState(false);

  // Lesson Creation
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imgGeneratingIndex, setImgGeneratingIndex] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  
  // --- LESSON CONTEXT STATE (Global for Lesson) ---
  const [gradeLevel, setGradeLevel] = useState(GRADES[2]); 
  const [tone, setTone] = useState(TONES[0]);
  const [framework, setFramework] = useState(FRAMEWORKS[0]);
  
  // Initialize grade from existing plan if available
  useEffect(() => {
      if (currentLesson?.plan?.gradeLevel) {
          setGradeLevel(currentLesson.plan.gradeLevel);
      }
  }, [currentLesson]);

  // Plan Inputs
  const [planNotes, setPlanNotes] = useState("");
  const [planDuration, setPlanDuration] = useState("45 mins");
  const [planSlideCount, setPlanSlideCount] = useState(5);

  // Story & Character Inputs
  const [storyArchetype, setStoryArchetype] = useState(STORY_ARCHETYPES[0]);
  const [storySetting, setStorySetting] = useState("A futuristic mars colony");
  const [newCharName, setNewCharName] = useState("");
  const [newCharGender, setNewCharGender] = useState("Female");
  const [newCharAge, setNewCharAge] = useState("12");
  const [newCharLook, setNewCharLook] = useState("Glasses, blue hoodie");
  
  // Visuals Inputs
  const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0]); 
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  // Activity / Project / Diff Inputs
  const [customDiffPrompt, setCustomDiffPrompt] = useState("");
  const [customProjectPrompt, setCustomProjectPrompt] = useState("");
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [activityDuration, setActivityDuration] = useState("30 mins");
  const [activityMaterials, setActivityMaterials] = useState("Standard classroom supplies");
  const [projectFormat, setProjectFormat] = useState(PROJECT_FORMATS[0]);
  const [gameType, setGameType] = useState(GAME_TYPES[0]);
  const [gameDifficulty, setGameDifficulty] = useState(DIFFICULTIES[1]);

  const navigateTo = (newPath: Path) => {
      setPath(newPath);
  };

  const updateCurrentTask = (updates: Partial<Task>) => {
      if (!currentUnit || !currentLesson) return;
      const updatedTasks = currentUnit.tasks.map(t => t.id === currentLesson.id ? { ...t, ...updates } : t);
      const updatedQuest = { ...currentUnit, tasks: updatedTasks };
      onUpdateQuest(updatedQuest);
  };

  // --- HELPER: Image Download ---
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

  // --- PPT EXPORT ---
  const handleExportPPT = async () => {
      if (!currentLesson?.slides || currentLesson.slides.length === 0) {
          alert("No slides to export.");
          return;
      }

      try {
          const pres = new PptxGenJS();
          pres.layout = 'LAYOUT_16x9';
          pres.author = 'QuestHub AI';
          pres.company = 'Learning Quest Hub';
          pres.title = currentLesson.title;

          // Title Slide
          const titleSlide = pres.addSlide();
          titleSlide.background = { color: '0f172a' }; // Slate 900
          titleSlide.addText(currentLesson.title, { x: 0.5, y: 2.5, w: '90%', fontSize: 44, color: 'FFFFFF', align: 'center', bold: true });
          titleSlide.addText(`Grade: ${gradeLevel}`, { x: 0.5, y: 3.5, w: '90%', fontSize: 24, color: '94a3b8', align: 'center' });

          currentLesson.slides.forEach(slide => {
              const pptSlide = pres.addSlide();
              pptSlide.background = { color: '0f172a' };

              // Add Image Background if exists
              if (slide.imageUrl) {
                  // Add slightly transparent overlay
                  pptSlide.addImage({ data: `data:image/png;base64,${slide.imageUrl}`, x: 0, y: 0, w: '100%', h: '100%' });
                  pptSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 70 } });
              }

              // Title
              pptSlide.addText(slide.title, { x: 0.5, y: 0.5, w: '90%', fontSize: 32, color: 'FFFFFF', bold: true });

              // Content Bullets
              const bulletText = slide.content.map(c => ({ text: c, options: { fontSize: 18, color: 'e2e8f0', breakLine: true, bullet: true } }));
              pptSlide.addText(bulletText, { x: 0.5, y: 1.5, w: '50%', h: 4, valign: 'top' });

              // Script in Notes
              if (slide.script) {
                  pptSlide.addNotes(slide.script);
              }
              
              // Overlay Text
              if (slide.overlayText) {
                   pptSlide.addText(slide.overlayText, { x: 0, y: '40%', w: '100%', fontSize: 36, color: 'FFFFFF', align: 'center', bold: true, glow: {size: 10, color: '000000'} });
              }
          });

          await pres.writeFile({ fileName: `${currentLesson.title.replace(/[^a-z0-9]/gi, '_')}.pptx` });
      } catch (e) {
          console.error(e);
          alert("Failed to create PowerPoint. Ensure your browser supports this feature.");
      }
  };

  // --- GENERATION HANDLERS ---
  const handleAutoGenerate = async (section: string) => {
      if (!currentLesson) return;
      setIsGenerating(true);
      try {
          if (section === 'plan') {
              const plan = await generateLessonPlanSection(currentLesson.title, gradeLevel, framework, planNotes, planDuration, planSlideCount);
              updateCurrentTask({ plan });
          } else if (section === 'characters') {
              const chars = await generateCharacters(storyArchetype, 2, tone, `Auto-generated for ${gradeLevel}. Topic: ${currentLesson.title}`);
              const currentStory = currentLesson.story || { theme: storyArchetype, tone, setting: storySetting, scenes: [] };
              updateCurrentTask({ story: { ...currentStory, characters: [...(currentStory.characters || []), ...chars] } });
          } else if (section === 'story') {
              if (!currentLesson.plan) { alert("Generate the Plan first."); setIsGenerating(false); return; }
              const existingChars = currentLesson.story?.characters || [];
              
              const story = await generateStorySection(currentLesson.title, currentLesson.plan, storyArchetype, storySetting, tone, existingChars, gradeLevel);
              updateCurrentTask({ story });
          } else if (section === 'diff') {
              const differentiation = await generateDifferentiationSection(currentLesson.title, currentLesson.plan, customDiffPrompt, gradeLevel);
              updateCurrentTask({ differentiation });
          } else if (section === 'slides') {
              const slides = await generateSlides(currentLesson.title, currentLesson.plan, planSlideCount, gradeLevel);
              updateCurrentTask({ slides });
              if(slides.length > 0) setSelectedSlideId(slides[0].id);
          } else if (section === 'activity') {
              const md = await generatePracticalActivity(currentLesson.title, currentLesson.plan, activityType, activityDuration, activityMaterials, customDiffPrompt, gradeLevel);
              updateCurrentTask({ practicalContent: md });
          } else if (section === 'project') {
              const md = await generateMiniProject(currentLesson.title, currentLesson.plan, "1 Week", projectFormat, customProjectPrompt, gradeLevel);
              updateCurrentTask({ projectContent: md });
          } else if (section === 'game') {
              const html = await generateEducationalGame(currentLesson.title, currentLesson.plan, gameType, gameDifficulty, gradeLevel);
              updateCurrentTask({ htmlContent: html });
          }
      } catch (e) {
          console.error(e);
          alert("Generation failed.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGenerateSlideImage = async (slide: Slide) => {
      // CONSISTENCY: Inject Art Direction
      const artDirection = ART_DIRECTIONS[visualStyle] || "Clean, modern educational style.";
      try {
          const promptToUse = slide.imagePrompt || `Educational slide background for: ${slide.title}. ${slide.content.join('. ')}`;
          const base64 = await generateSceneImage(promptToUse, visualStyle, slide.aspectRatio || '16:9', `Art Direction: ${artDirection}`);
          return base64;
      } catch (e) { console.error(e); return null; }
  };

  const handleGenerateSingleSlideImageUI = async (slide: Slide) => {
      setIsGenerating(true);
      const base64 = await handleGenerateSlideImage(slide);
      if (base64) {
          const newSlides = currentLesson?.slides?.map(s => s.id === slide.id ? { ...s, imageUrl: base64 } : s);
          updateCurrentTask({ slides: newSlides });
      } else {
          alert("Image Gen Failed");
      }
      setIsGenerating(false);
  };

  const handleBatchGenerateSlides = async () => {
      if (!currentLesson?.slides) return;
      const slides = currentLesson.slides;
      setBatchProgress({ current: 0, total: slides.length });
      
      const newSlides = [...slides];
      
      for (let i = 0; i < slides.length; i++) {
          // Skip if already has image
          if (!newSlides[i].imageUrl) {
              const base64 = await handleGenerateSlideImage(newSlides[i]);
              if (base64) {
                  newSlides[i] = { ...newSlides[i], imageUrl: base64 };
                  // Update state incrementally so user sees progress
                  updateCurrentTask({ slides: [...newSlides] });
              }
          }
          setBatchProgress({ current: i + 1, total: slides.length });
      }
      setBatchProgress(null);
  };

  const handleEnhancePrompt = async (slide: Slide) => {
      if(!slide.imagePrompt) return;
      setIsGenerating(true);
      try {
          const improved = await enhanceImagePrompt(slide.imagePrompt);
          const newSlides = currentLesson?.slides?.map(s => s.id === slide.id ? { ...s, imagePrompt: improved } : s);
          updateCurrentTask({ slides: newSlides });
      } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  // Internal helper for scenes
  const generateSceneImageInternal = async (sceneDesc: string, idx: number) => {
      // CONSISTENCY: Collect character descriptions & Art Direction
      const chars = currentLesson?.story?.characters || [];
      const charContext = chars.map(c => `${c.name}: ${c.visualDescription}`).join('. ');
      const artDirection = ART_DIRECTIONS[visualStyle] || "Cinematic style.";
      const context = `Characters: ${charContext}. Setting: ${storySetting}. Art Direction: ${artDirection}`;
      
      return await generateSceneImage(sceneDesc, visualStyle, "16:9", context);
  };

  const handleGenerateSceneImage = async (sceneIndex: number, sceneDesc: string) => {
      setImgGeneratingIndex(sceneIndex);
      try {
          const base64 = await generateSceneImageInternal(sceneDesc, sceneIndex);
          if (base64) {
              const newImage = { id: uuidv4(), sceneIndex, base64, prompt: sceneDesc };
              const existingImages = currentLesson?.sceneImages || [];
              const updatedImages = existingImages.filter(img => img.sceneIndex !== sceneIndex);
              updateCurrentTask({ sceneImages: [...updatedImages, newImage].sort((a,b) => a.sceneIndex - b.sceneIndex) });
          }
      } catch(e) { console.error(e); alert("Failed"); } finally { setImgGeneratingIndex(null); }
  };

  const handleBatchGenerateScenes = async () => {
      if (!currentLesson?.story?.scenes) return;
      const scenes = currentLesson.story.scenes;
      setBatchProgress({ current: 0, total: scenes.length });

      let currentImages = currentLesson.sceneImages || [];

      for (let i = 0; i < scenes.length; i++) {
          // Check if image exists
          if (!currentImages.find(img => img.sceneIndex === i)) {
              const base64 = await generateSceneImageInternal(scenes[i], i);
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

  const handleGenerateInfographic = async (type: 'activity' | 'project' | 'diff') => {
      if(!currentLesson) return;
      setIsGenerating(true);
      let content = "";
      if (type === 'activity') content = currentLesson.practicalContent || "";
      if (type === 'project') content = currentLesson.projectContent || "";
      if (type === 'diff') content = JSON.stringify(currentLesson.differentiation) || "";
      
      try {
          const base64 = await generateInfographic(content.substring(0, 800), visualStyle); // Limit text length
          if(base64) {
              if (type === 'activity') updateCurrentTask({ activityInfographic: base64 });
              if (type === 'project') updateCurrentTask({ projectInfographic: base64 });
              if (type === 'diff') updateCurrentTask({ differentiationInfographic: base64 });
          }
      } catch (e) { console.error(e); alert("Infographic Gen Failed"); } finally { setIsGenerating(false); }
  };

  const handleMoveSlide = (index: number, direction: -1 | 1) => {
      if (!currentLesson?.slides) return;
      const newSlides = [...currentLesson.slides];
      if (direction === -1 && index > 0) {
          [newSlides[index], newSlides[index-1]] = [newSlides[index-1], newSlides[index]];
      } else if (direction === 1 && index < newSlides.length - 1) {
          [newSlides[index], newSlides[index+1]] = [newSlides[index+1], newSlides[index]];
      }
      updateCurrentTask({ slides: newSlides });
  };
  
  const handleAddCharacter = () => {
        if (!newCharName || !currentLesson) return;
        const newChar: CharacterProfile = {
            id: uuidv4(),
            name: newCharName,
            gender: newCharGender,
            age: newCharAge,
            role: "Supporting Character",
            personality: "Friendly",
            visualDescription: newCharLook
        };
        
        const currentStory = currentLesson.story || { theme: storyArchetype, tone, setting: storySetting, scenes: [], characters: [] };
        const updatedChars = [...(currentStory.characters || []), newChar];
        
        updateCurrentTask({ story: { ...currentStory, characters: updatedChars } });
        
        setNewCharName("");
        setNewCharLook("");
  };

  // ---------------- VIEW RENDERERS ----------------
  
  const renderRoot = () => (
      <div className="flex flex-col h-full bg-slate-950 p-8 overflow-y-auto animate-fadeIn">
          {/* ... (Previous Root Render Code) ... */}
          <header className="mb-8 flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
                  <p className="text-slate-400">Manage your classes and curriculum.</p>
              </div>
              <Button onClick={() => {
                  const title = prompt("Class Name:");
                  if (title && data.years.length > 0) {
                      onAddClass(title, data.years[0].id);
                  } else if (title) {
                      alert("No academic years defined. Please reset data in settings.");
                  }
              }}><Icons.Plus size={16} className="mr-2"/> New Class</Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.classes.map(c => (
                  <div key={c.id} onClick={() => navigateTo({view: 'class', classId: c.id})} className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-brand-500/50 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-slate-950 rounded-xl text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                              <Icons.Users size={24} />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete class?')) onDeleteClass(c.id); }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash2 size={18}/></button>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{c.title}</h3>
                      <p className="text-slate-400 text-sm">{c.studentIds.length} Students</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                          <span className="px-2 py-1 bg-slate-950 rounded border border-slate-800">{data.years.find(y => y.id === c.yearId)?.title || 'Unknown Year'}</span>
                      </div>
                  </div>
              ))}
              {data.classes.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                      <Icons.School size={48} className="mx-auto text-slate-700 mb-4" />
                      <p className="text-slate-500">No classes found. Create your first class to get started.</p>
                  </div>
              )}
          </div>
      </div>
  );

  const renderClass = () => {
      if (!currentClass) return null;
      return (
          <div className="flex flex-col h-full bg-slate-950">
              <div className="px-8 py-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-4">
                       <button onClick={() => navigateTo({ view: 'root' })} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><Icons.ArrowLeft size={20}/></button>
                       <div><h2 className="text-2xl font-bold text-white">{currentClass.title}</h2></div>
                   </div>
                   <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                       <button onClick={() => setActiveClassTab('curriculum')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeClassTab === 'curriculum' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Curriculum</button>
                       <button onClick={() => setActiveClassTab('people')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeClassTab === 'people' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Students</button>
                   </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                  {activeClassTab === 'curriculum' && (
                      <div className="absolute inset-0 overflow-y-auto p-8 animate-fadeIn">
                           <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
                               <h3 className="font-bold text-white text-lg flex items-center gap-2"><Icons.Map className="text-brand-400"/> Learning Path</h3>
                               <Button size="sm" onClick={() => { 
                                  const newQuest: Quest = { id: uuidv4(), title: "New Unit", description: "Description", category: "General", difficulty: "Beginner", totalXp: 0, earnedXp: 0, tasks: [], createdAt: new Date().toISOString(), status: 'active', yearId: currentClass.yearId };
                                  onAddQuest(newQuest);
                               }}><Icons.Plus size={16} className="mr-2"/> New Unit</Button>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                               {classUnits.map(q => (
                                   <div key={q.id} onClick={() => navigateTo({ view: 'unit', unitId: q.id, classId: currentClass.id })} className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-brand-500 cursor-pointer">
                                       <h4 className="text-lg font-bold text-white">{q.title}</h4>
                                       <p className="text-sm text-slate-400">{q.tasks.length} Lessons</p>
                                   </div>
                               ))}
                           </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderLesson = () => {
      if (!currentLesson) return null;
      const tabs = [
          { id: 'plan', label: 'Plan', icon: Icons.FileText },
          { id: 'slides', label: 'Slides', icon: Icons.Presentation },
          { id: 'story', label: 'Story', icon: Icons.BookOpen },
          { id: 'activity', label: 'Activity', icon: Icons.Scissors },
          { id: 'project', label: 'Project', icon: Icons.FlaskConical },
          { id: 'games', label: 'Games', icon: Icons.Gamepad2 },
          { id: 'diff', label: 'Diff.', icon: Icons.Users },
      ];

      const activeSlide = currentLesson.slides?.find(s => s.id === selectedSlideId);

      return (
          <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
              <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur flex flex-col justify-center px-6 py-4 shrink-0 z-20">
                  <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => navigateTo({ view: 'unit', unitId: path.unitId, classId: path.classId })} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><Icons.ArrowLeft size={20}/></button>
                      <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-white text-lg flex items-center gap-2 truncate">{currentLesson.title}</h2>
                      </div>
                      
                      {/* GLOBAL GRADE SELECTOR */}
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                          <span className="text-xs font-bold text-slate-500 uppercase">Level:</span>
                          <select 
                            className="bg-transparent text-white text-xs font-medium outline-none"
                            value={gradeLevel}
                            onChange={(e) => {
                                const newLevel = e.target.value;
                                setGradeLevel(newLevel);
                                if(currentLesson.plan) {
                                    updateCurrentTask({ plan: { ...currentLesson.plan, gradeLevel: newLevel } });
                                }
                            }}
                          >
                              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                      </div>

                      <Button size="sm" variant="secondary" onClick={() => downloadText(generateExportMarkdown(currentLesson), 'Full_Lesson.md')}><Icons.Download size={16} className="mr-2"/> Export All</Button>
                  </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                  <div className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col py-6 shrink-0">
                      {tabs.map(tab => (
                          <button key={tab.id} onClick={() => setActiveLessonTab(tab.id as any)} className={`w-full text-left px-0 lg:px-6 py-4 flex flex-col lg:flex-row items-center lg:gap-3 transition-colors relative group ${activeLessonTab === tab.id ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                              <tab.icon size={20} className={activeLessonTab === tab.id ? 'text-brand-400' : ''} />
                              <span className="font-medium text-[10px] lg:text-sm mt-1 lg:mt-0">{tab.label}</span>
                              {activeLessonTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950 relative">
                      <AnimatePresence mode='wait'>
                          <motion.div key={activeLessonTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto h-full flex flex-col">
                              
                              {/* 1. PLAN TAB */}
                              {activeLessonTab === 'plan' && (
                                  <div className="space-y-6">
                                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                          <div className="flex justify-between items-center mb-6">
                                              <h3 className="text-xl font-bold text-white">Lesson Plan</h3>
                                              <div className="flex gap-2">
                                                  <Button size="sm" onClick={() => handleAutoGenerate('plan')} isLoading={isGenerating}><Icons.Sparkles size={16} className="mr-2"/> Generate Plan</Button>
                                                  {currentLesson.plan && <Button size="sm" variant="secondary" onClick={() => downloadText(JSON.stringify(currentLesson.plan, null, 2), 'Plan.json')}><Icons.Download size={16}/></Button>}
                                              </div>
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                              <div><label className="text-xs text-slate-500 uppercase font-bold">Duration</label><input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={planDuration} onChange={e => setPlanDuration(e.target.value)} /></div>
                                              <div><label className="text-xs text-slate-500 uppercase font-bold">Slides</label><input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={planSlideCount} onChange={e => setPlanSlideCount(parseInt(e.target.value))} /></div>
                                              <div><label className="text-xs text-slate-500 uppercase font-bold">Framework</label><select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={framework} onChange={e => setFramework(e.target.value)}>{FRAMEWORKS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                                              {/* Grade selector is now in header, but display read-only here for clarity */}
                                              <div><label className="text-xs text-slate-500 uppercase font-bold">Grade (Global)</label><div className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-400 text-sm">{gradeLevel}</div></div>
                                          </div>
                                          <div className="mb-4">
                                              <label className="text-xs text-slate-500 uppercase font-bold">Context / Prompt</label>
                                              <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24" placeholder="Specific focus..." value={planNotes} onChange={e => setPlanNotes(e.target.value)} />
                                          </div>
                                          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                              <h4 className="text-sm font-bold text-blue-400 mb-2">Procedure Preview</h4>
                                              <div className="text-sm text-slate-300">
                                                  {currentLesson.plan?.mainActivity ? (
                                                      <div>
                                                          <div className="mb-2"><span className="text-slate-500 font-bold">Objective:</span> {currentLesson.plan.objectives[0]}</div>
                                                          <div className="mb-2"><span className="text-slate-500 font-bold">Main:</span> {currentLesson.plan.mainActivity}</div>
                                                          {currentLesson.plan.slidesOutline && (
                                                              <div className="mt-4 border-t border-slate-800 pt-4">
                                                                  <span className="text-slate-500 font-bold">Generated Slide Outline:</span>
                                                                  <ul className="list-disc pl-5 mt-1 space-y-1">
                                                                      {currentLesson.plan.slidesOutline.map((s,i) => <li key={i}>{s}</li>)}
                                                                  </ul>
                                                              </div>
                                                          )}
                                                      </div>
                                                  ) : (
                                                      <span className="italic opacity-50">No plan generated yet. Fill in details and click Generate.</span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* 2. SLIDES EDITOR TAB */}
                              {activeLessonTab === 'slides' && (
                                  <div className="flex gap-6 h-full min-h-[600px]">
                                      {/* Left: Slide List */}
                                      <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0">
                                          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                              <h3 className="font-bold text-white text-sm">Slides</h3>
                                              <Button size="sm" onClick={() => handleAutoGenerate('slides')} isLoading={isGenerating}><Icons.Sparkles size={14}/></Button>
                                          </div>
                                          <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                              {currentLesson.slides?.map((s, i) => (
                                                  <div key={s.id} className={`p-3 rounded-lg cursor-pointer flex items-center gap-2 group ${selectedSlideId === s.id ? 'bg-brand-900/30 border border-brand-500/50' : 'bg-slate-950 border border-slate-800 hover:border-slate-600'}`} onClick={() => setSelectedSlideId(s.id)}>
                                                      <span className="text-xs font-bold text-slate-500">{i+1}</span>
                                                      <span className="text-xs text-white truncate flex-1">{s.title}</span>
                                                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                                                          <button onClick={(e) => { e.stopPropagation(); handleMoveSlide(i, -1); }} className="text-slate-500 hover:text-white"><Icons.ChevronUp size={12}/></button>
                                                          <button onClick={(e) => { e.stopPropagation(); handleMoveSlide(i, 1); }} className="text-slate-500 hover:text-white"><Icons.ChevronDown size={12}/></button>
                                                      </div>
                                                  </div>
                                              ))}
                                              {(!currentLesson.slides || currentLesson.slides.length === 0) && <div className="text-xs text-slate-500 text-center py-4">No slides generated.</div>}
                                          </div>
                                      </div>

                                      {/* Right: Slide Editor */}
                                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                                          {activeSlide ? (
                                              <div className="flex flex-col h-full">
                                                  {/* Editor Header */}
                                                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                                                      <div className="flex items-center gap-4">
                                                          <input 
                                                            className="bg-transparent text-white font-bold text-lg outline-none w-64" 
                                                            value={activeSlide.title}
                                                            onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === activeSlide.id ? { ...s, title: e.target.value } : s) })}
                                                          />
                                                          <select className="bg-slate-950 border border-slate-700 rounded text-xs text-white" value={visualStyle} onChange={e => setVisualStyle(e.target.value)}>{VISUAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                                      </div>
                                                      <div className="flex gap-2">
                                                          <Button size="sm" variant="secondary" onClick={handleExportPPT}><Icons.MonitorPlay size={14} className="mr-2"/> PPTX</Button>
                                                          <Button size="sm" onClick={handleBatchGenerateSlides} disabled={!!batchProgress} isLoading={!!batchProgress}>
                                                              {batchProgress ? `Gen ${batchProgress.current}/${batchProgress.total}` : 'Gen All Images'}
                                                          </Button>
                                                      </div>
                                                  </div>
                                                  
                                                  {/* Editor Body */}
                                                  <div className="flex-1 p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
                                                      {/* Text Content */}
                                                      <div className="flex-1 space-y-4">
                                                          <div>
                                                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Content (Bullet Points)</label>
                                                              <textarea 
                                                                className="w-full h-40 bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                                                value={activeSlide.content.join('\n')}
                                                                onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === activeSlide.id ? { ...s, content: e.target.value.split('\n') } : s) })}
                                                              />
                                                          </div>
                                                          <div>
                                                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Speaker Script</label>
                                                              <textarea 
                                                                className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-slate-300 text-sm"
                                                                value={activeSlide.script || ''}
                                                                onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === activeSlide.id ? { ...s, script: e.target.value } : s) })}
                                                              />
                                                          </div>
                                                          {/* OVERLAY TEXT INPUT */}
                                                          <div>
                                                              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Overlay Text (Optional)</label>
                                                              <input 
                                                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm"
                                                                placeholder="Text to appear ON TOP of image..."
                                                                value={activeSlide.overlayText || ''}
                                                                onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === activeSlide.id ? { ...s, overlayText: e.target.value } : s) })}
                                                              />
                                                          </div>
                                                      </div>

                                                      {/* Image Content & Settings */}
                                                      <div className="flex-1 flex flex-col space-y-4">
                                                          <div className="flex justify-between items-center">
                                                              <label className="text-xs font-bold text-slate-500 uppercase block">Slide Visual</label>
                                                              <select 
                                                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                                value={activeSlide.aspectRatio || '16:9'}
                                                                onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === activeSlide.id ? { ...s, aspectRatio: e.target.value as any } : s) })}
                                                              >
                                                                  <option value="16:9">16:9 (Wide)</option>
                                                                  <option value="4:3">4:3 (Standard)</option>
                                                                  <option value="1:1">1:1 (Square)</option>
                                                              </select>
                                                          </div>
                                                          
                                                          <div className="flex-1 bg-black rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center group min-h-[200px]">
                                                              {activeSlide.imageUrl ? (
                                                                  <>
                                                                      <img src={`data:image/png;base64,${activeSlide.imageUrl}`} className="w-full h-full object-contain" />
                                                                      {activeSlide.overlayText && (
                                                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                              <span className="bg-black/60 px-4 py-2 rounded text-white font-bold text-lg">{activeSlide.overlayText}</span>
                                                                          </div>
                                                                      )}
                                                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                                          <button onClick={() => downloadBase64Image(activeSlide.imageUrl!, `Slide_${activeSlide.title}.png`)} className="p-2 bg-white/20 rounded-full hover:bg-white/40"><Icons.Download size={20} className="text-white"/></button>
                                                                      </div>
                                                                  </>
                                                              ) : (
                                                                  <div className="text-slate-600 text-sm">Preview Area</div>
                                                              )}
                                                          </div>

                                                          <div>
                                                              <div className="flex justify-between items-center mb-2">
                                                                  <label className="text-xs font-bold text-slate-500 uppercase">Image Prompt</label>
                                                                  <button onClick={() => handleEnhancePrompt(activeSlide)} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1" disabled={isGenerating}>
                                                                      <Icons.Sparkles size={12}/> Magic Enhance
                                                                  </button>
                                                              </div>
                                                              <textarea 
                                                                className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs resize-none"
                                                                value={activeSlide.imagePrompt || ''}
                                                                onChange={(e) => updateCurrentTask({ slides: currentLesson.slides!.map(s => s.id === activeSlide.id ? { ...s, imagePrompt: e.target.value } : s) })}
                                                                placeholder="Describe the image..."
                                                              />
                                                              <Button size="sm" onClick={() => handleGenerateSingleSlideImageUI(activeSlide)} isLoading={isGenerating} className="w-full mt-2">Generate Slide Image</Button>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="flex items-center justify-center h-full text-slate-500">Select a slide to edit.</div>
                                          )}
                                      </div>
                                  </div>
                              )}

                              {/* 3. ACTIVITY TAB */}
                              {activeLessonTab === 'activity' && (
                                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                      <div className="flex justify-between items-center mb-6">
                                          <h3 className="text-xl font-bold text-white">Practical Activity</h3>
                                          <div className="flex gap-2">
                                              <Button size="sm" onClick={() => handleGenerateInfographic('activity')} isLoading={isGenerating} variant="ghost"><Icons.Image size={16} className="mr-2"/> Infographic</Button>
                                              <Button size="sm" onClick={() => handleAutoGenerate('activity')} isLoading={isGenerating}>Generate</Button>
                                              <Button size="sm" variant="secondary" onClick={() => currentLesson.practicalContent && downloadText(currentLesson.practicalContent, 'Activity.md')}><Icons.Download size={16}/></Button>
                                          </div>
                                      </div>
                                      
                                      <div className="flex gap-6">
                                          <div className="flex-1">
                                              <div className="grid grid-cols-4 gap-4 mb-4">
                                                  <select className="bg-slate-950 border border-slate-700 rounded p-2 text-white" value={activityType} onChange={e => setActivityType(e.target.value)}>{ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                                  <div className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 text-sm">{gradeLevel}</div>
                                                  <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white" value={activityDuration} onChange={e => setActivityDuration(e.target.value)} placeholder="Duration" />
                                                  <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white" value={activityMaterials} onChange={e => setActivityMaterials(e.target.value)} placeholder="Materials" />
                                              </div>
                                              <div className="prose prose-invert max-w-none bg-slate-950 p-4 rounded-xl border border-slate-800 h-96 overflow-y-auto"><ReactMarkdown remarkPlugins={[remarkGfm]}>{currentLesson.practicalContent || "*No activity generated yet.*"}</ReactMarkdown></div>
                                          </div>
                                          {currentLesson.activityInfographic && (
                                              <div className="w-64 bg-black rounded-lg border border-slate-800 shrink-0">
                                                  <img src={`data:image/png;base64,${currentLesson.activityInfographic}`} className="w-full h-auto rounded-lg"/>
                                                  <div className="p-2 text-center text-xs text-slate-500">Activity Summary</div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}

                              {/* 4. STORY TAB */}
                              {activeLessonTab === 'story' && (
                                  <div className="space-y-6">
                                      {/* Characters Section */}
                                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                          <div className="flex justify-between items-center mb-4">
                                              <h3 className="text-xl font-bold text-white">1. Characters</h3>
                                              <Button size="sm" variant="secondary" onClick={() => handleAutoGenerate('characters')} isLoading={isGenerating}>Auto-Generate</Button>
                                          </div>
                                          
                                          {/* Manual Add */}
                                          <div className="grid grid-cols-4 gap-2 mb-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                                              <input className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Name" value={newCharName} onChange={e => setNewCharName(e.target.value)} />
                                              <input className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Gender" value={newCharGender} onChange={e => setNewCharGender(e.target.value)} />
                                              <input className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Age" value={newCharAge} onChange={e => setNewCharAge(e.target.value)} />
                                              <div className="flex gap-2">
                                                  <input className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs" placeholder="Look (e.g. Blue hat)" value={newCharLook} onChange={e => setNewCharLook(e.target.value)} />
                                                  <Button size="sm" onClick={handleAddCharacter}>+</Button>
                                              </div>
                                          </div>

                                          {/* Character List */}
                                          <div className="flex flex-wrap gap-2">
                                              {currentLesson.story?.characters?.map(c => (
                                                  <div key={c.id} className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-2">
                                                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">{c.name[0]}</div>
                                                      <div className="text-xs text-white">
                                                          <span className="font-bold">{c.name}</span> <span className="text-slate-400">({c.gender}, {c.age})</span>
                                                      </div>
                                                  </div>
                                              ))}
                                              {(!currentLesson.story?.characters || currentLesson.story.characters.length === 0) && <span className="text-slate-500 text-sm italic">No characters added.</span>}
                                          </div>
                                      </div>

                                      {/* Story Section */}
                                      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                          <div className="flex justify-between items-center mb-6">
                                              <h3 className="text-xl font-bold text-white">2. Story Arc</h3>
                                              <div className="flex gap-2">
                                                  <Button size="sm" onClick={handleBatchGenerateScenes} disabled={!!batchProgress} isLoading={!!batchProgress}>
                                                      {batchProgress ? `Gen ${batchProgress.current}/${batchProgress.total}` : 'Generate All Images'}
                                                  </Button>
                                                  <Button size="sm" onClick={() => handleAutoGenerate('story')} isLoading={isGenerating}><Icons.Wand2 size={16} className="mr-2"/> Generate Story</Button>
                                                  {currentLesson.story && <Button size="sm" variant="secondary" onClick={() => downloadText(JSON.stringify(currentLesson.story, null, 2), 'Story.json')}><Icons.Download size={16}/></Button>}
                                              </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-4 mb-6">
                                              <div><label className="text-xs text-slate-500 uppercase font-bold">Archetype</label><select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={storyArchetype} onChange={e => setStoryArchetype(e.target.value)}>{STORY_ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                                              <div><label className="text-xs text-slate-500 uppercase font-bold">Setting</label><input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={storySetting} onChange={e => setStorySetting(e.target.value)} /></div>
                                          </div>

                                          <div className="space-y-6">
                                              {currentLesson.story?.scenes.map((scene, idx) => {
                                                  const imgData = currentLesson.sceneImages?.find(img => img.sceneIndex === idx);
                                                  return (
                                                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex gap-4">
                                                          <div className="w-40 bg-black rounded-lg border border-slate-800 shrink-0 flex flex-col">
                                                              {imgData ? (
                                                                  <div className="relative group flex-1">
                                                                      <img src={`data:image/png;base64,${imgData.base64}`} className="w-full h-full object-cover rounded-t-lg"/>
                                                                      <button onClick={() => downloadBase64Image(imgData.base64, `Scene${idx+1}.png`)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Download size={14}/></button>
                                                                  </div>
                                                              ) : (
                                                                  <div className="flex-1 flex items-center justify-center text-slate-600 text-xs p-4">No Image</div>
                                                              )}
                                                              <button 
                                                                onClick={() => handleGenerateSceneImage(idx, scene)}
                                                                className="p-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border-t border-slate-700 rounded-b-lg flex items-center justify-center gap-2"
                                                                disabled={imgGeneratingIndex === idx || !!batchProgress}
                                                              >
                                                                  {imgGeneratingIndex === idx ? <Icons.Loader size={12} className="animate-spin"/> : <Icons.Image size={12}/>}
                                                                  {imgData ? 'Regenerate' : 'Generate'}
                                                              </button>
                                                          </div>
                                                          <div>
                                                              <div className="text-xs font-bold text-brand-400 mb-1">Scene {idx+1}</div>
                                                              <p className="text-sm text-white">{scene}</p>
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  </div>
                              )}

                              {/* 5. PROJECT TAB */}
                              {activeLessonTab === 'project' && (
                                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                      <div className="flex justify-between items-center mb-6">
                                          <h3 className="text-xl font-bold text-white">Class Project</h3>
                                          <div className="flex gap-2">
                                              <Button size="sm" onClick={() => handleGenerateInfographic('project')} isLoading={isGenerating} variant="ghost"><Icons.Image size={16} className="mr-2"/> Infographic</Button>
                                              <Button size="sm" onClick={() => handleAutoGenerate('project')} isLoading={isGenerating}>Generate</Button>
                                              <Button size="sm" variant="secondary" onClick={() => currentLesson.projectContent && downloadText(currentLesson.projectContent, 'Project.md')}><Icons.Download size={16}/></Button>
                                          </div>
                                      </div>
                                      <div className="flex gap-6">
                                          <div className="flex-1">
                                              <div className="grid grid-cols-3 gap-4 mb-4">
                                                  <select className="bg-slate-950 border border-slate-700 rounded p-2 text-white" value={projectFormat} onChange={e => setProjectFormat(e.target.value)}>{PROJECT_FORMATS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                                  <div className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 text-sm">{gradeLevel}</div>
                                                  <input className="bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="Custom constraints..." value={customProjectPrompt} onChange={e => setCustomProjectPrompt(e.target.value)} />
                                              </div>
                                              <div className="prose prose-invert max-w-none bg-slate-950 p-4 rounded-xl border border-slate-800 h-96 overflow-y-auto"><ReactMarkdown remarkPlugins={[remarkGfm]}>{currentLesson.projectContent || "*No project generated yet.*"}</ReactMarkdown></div>
                                          </div>
                                          {currentLesson.projectInfographic && (
                                              <div className="w-64 bg-black rounded-lg border border-slate-800 shrink-0">
                                                  <img src={`data:image/png;base64,${currentLesson.projectInfographic}`} className="w-full h-auto rounded-lg"/>
                                                  <div className="p-2 text-center text-xs text-slate-500">Project Infographic</div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}

                              {/* 6. GAMES TAB */}
                              {activeLessonTab === 'games' && (
                                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col h-full">
                                      <div className="flex justify-between items-center mb-6">
                                          <h3 className="text-xl font-bold text-white">Interactive Game</h3>
                                          <div className="flex gap-2">
                                              <Button size="sm" onClick={() => handleAutoGenerate('game')} isLoading={isGenerating}>Generate Game</Button>
                                              {currentLesson.htmlContent && <Button size="sm" onClick={() => setShowGamePreview(true)}><Icons.Play size={16} className="mr-2"/> Preview</Button>}
                                              {currentLesson.htmlContent && <Button size="sm" variant="secondary" onClick={() => downloadText(currentLesson.htmlContent!, 'Game.html')}><Icons.Download size={16}/></Button>}
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-4 mb-4">
                                          <select className="bg-slate-950 border border-slate-700 rounded p-2 text-white" value={gameType} onChange={e => setGameType(e.target.value)}>{GAME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                          <select className="bg-slate-950 border border-slate-700 rounded p-2 text-white" value={gameDifficulty} onChange={e => setGameDifficulty(e.target.value)}>{DIFFICULTIES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                          <div className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 text-sm">{gradeLevel}</div>
                                      </div>
                                      <textarea className="flex-1 bg-slate-950 border border-slate-800 rounded p-4 font-mono text-sm text-emerald-400 outline-none resize-none" value={currentLesson.htmlContent || ""} onChange={(e) => updateCurrentTask({ htmlContent: e.target.value })} placeholder="// Game code will appear here..." />
                                  </div>
                              )}

                              {/* 7. DIFF TAB */}
                              {activeLessonTab === 'diff' && (
                                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                      <div className="flex justify-between items-center mb-4">
                                          <h3 className="text-xl font-bold text-white">Differentiation</h3>
                                          <div className="flex gap-2">
                                              <Button size="sm" onClick={() => handleGenerateInfographic('diff')} isLoading={isGenerating} variant="ghost"><Icons.Image size={16} className="mr-2"/> Infographic</Button>
                                              <Button size="sm" onClick={() => handleAutoGenerate('diff')} isLoading={isGenerating}>Generate</Button>
                                              <Button size="sm" variant="secondary" onClick={() => currentLesson.differentiation && downloadText(JSON.stringify(currentLesson.differentiation, null, 2), 'Diff.json')}><Icons.Download size={16}/></Button>
                                          </div>
                                      </div>
                                      <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm mb-4" placeholder="Custom Focus (e.g. ESL students)..." value={customDiffPrompt} onChange={e => setCustomDiffPrompt(e.target.value)}/>
                                      
                                      <div className="flex gap-6">
                                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                              {['Support', 'Core', 'Challenge'].map((lvl) => (
                                                  <div key={lvl} className="bg-slate-950 p-4 rounded-xl border border-slate-700">
                                                      <h4 className="font-bold text-brand-400 mb-2">{lvl}</h4>
                                                      <p className="text-sm text-slate-300">{(currentLesson.differentiation as any)?.[lvl.toLowerCase()] || "N/A"}</p>
                                                  </div>
                                              ))}
                                          </div>
                                          {currentLesson.differentiationInfographic && (
                                              <div className="w-64 bg-black rounded-lg border border-slate-800 shrink-0">
                                                  <img src={`data:image/png;base64,${currentLesson.differentiationInfographic}`} className="w-full h-auto rounded-lg"/>
                                                  <div className="p-2 text-center text-xs text-slate-500">Diff. Matrix</div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </motion.div>
                      </AnimatePresence>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
        {path.view === 'root' && renderRoot()}
        {path.view === 'class' && (data.classes.find(c => c.id === path.classId) ? (
            <div className="flex flex-col h-full">{renderClass()}</div>
        ) : null)} 
        {path.view === 'unit' && (data.quests.find(q => q.id === path.unitId) ? (
             <div className="flex flex-col h-full">
                 <div className="p-4 border-b border-slate-800"><Button onClick={() => setPath({view:'class', classId: path.classId})}>Back</Button></div>
                 <div className="p-8 space-y-4">
                     {data.quests.find(q => q.id === path.unitId)?.tasks.map(t => (
                         <div key={t.id} onClick={() => navigateTo({view:'lesson', lessonId: t.id, unitId: path.unitId, classId: path.classId})} className="p-4 bg-slate-900 border border-slate-800 rounded cursor-pointer hover:border-brand-500 text-white">{t.title}</div>
                     ))}
                 </div>
             </div>
        ) : null)}
        {path.view === 'lesson' && renderLesson()}
        
        {isBulkImporting && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Icons.UploadCloud className="text-brand-400" /> Bulk Import Students</h3>
                    <textarea className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm outline-none resize-none mb-4" placeholder={"John Doe\nJane Smith"} value={bulkList} onChange={e => setBulkList(e.target.value)} autoFocus />
                    <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsBulkImporting(false)}>Cancel</Button><Button onClick={() => { if(bulkList.trim() && path.classId) { onAddStudentBulk(bulkList.split('\n'), path.classId!); setIsBulkImporting(false); }}}>Import</Button></div>
                </div>
            </div>
        )}
        
        {showNewLessonModal && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-8">
                 <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-8 animate-scaleUp">
                      <div className="flex justify-between items-start mb-6">
                          <div><h2 className="text-2xl font-bold text-white mb-2">Create New Lesson</h2></div>
                          <button onClick={() => setShowNewLessonModal(false)} className="text-slate-500 hover:text-white"><Icons.X size={24}/></button>
                      </div>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white mb-6" placeholder="Lesson Title" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} autoFocus />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button onClick={() => { if(currentUnit && newLessonTitle) { const task: Task = { id: uuidv4(), title: newLessonTitle, description: "New lesson", type: 'Lesson', xp: 50, isCompleted: false, resources: [] }; onUpdateQuest({...currentUnit, tasks: [...currentUnit.tasks, task]}); setShowNewLessonModal(false); setNewLessonTitle(''); }}} className="p-6 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all text-left"><h3 className="font-bold text-white">Create</h3></button>
                      </div>
                 </div>
            </div>
        )}

        {showGamePreview && currentLesson?.htmlContent && (
            <HTMLViewer 
                title={`${currentLesson.title} (Game Preview)`} 
                htmlContent={currentLesson.htmlContent} 
                onClose={() => setShowGamePreview(false)} 
            />
        )}
    </div>
  );
};

export default TeacherDashboard;
