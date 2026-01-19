
export type ContentType = 'Lesson' | 'Practice' | 'Project' | 'Game' | 'Quiz';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Slide {
  id: string;
  title: string;
  content: string[]; // Bullet points
  visualKeyword: string; // For icon selection
  layout: 'center' | 'split' | 'big-number';
  script?: string; // Detailed speaker notes/script
  imageUrl?: string; // Base64 image specific to this slide
  imagePrompt?: string; // NEW: The specific prompt used to generate the image
  aspectRatio?: '16:9' | '4:3' | '1:1'; // NEW: Slide specific ratio
  overlayText?: string; // NEW: Text to display over the image
}

export interface GeneratedImage {
    id: string;
    sceneIndex: number;
    base64: string;
    prompt: string;
}

export type AiPersona = 'socratic' | 'encouraging' | 'roast' | 'eli5';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string; // Base64 string for multimodal inputs
}

// NEW: Rich Lesson Structure for Plan Overhaul
export interface LessonPlan {
    topic: string;
    gradeLevel: string;
    objectives: string[];
    standards: string[]; // CCSS/NGSS
    timing: string;
    materials: string[];
    warmUp: string;
    mainActivity: string;
    wrapUp: string;
    framework: string; // e.g. "5E Model"
    slidesOutline?: string[]; // Detailed text for slides
    duration?: string; // NEW
    customContext?: string; // NEW
    slideCount?: number; // NEW
}

export interface CharacterProfile {
    id: string;
    name: string;
    gender: string; // NEW
    age: string; // NEW
    role: string;
    personality: string;
    visualDescription: string; // "Look"
}

export interface StoryElement {
    theme: string;
    tone: string;
    setting: string;
    scenes: string[]; // Narrative beats
    characters?: CharacterProfile[];
}

export interface Differentiation {
    support: string; // Scaffolding for students needing help
    core: string;    // On-level instruction
    challenge: string; // Extension for advanced students
}

export interface Task {
  id: string;
  title: string;
  description: string;
  xp: number;
  isCompleted: boolean;
  resources?: string[];
  type: ContentType;
  
  // Legacy/Simple Fields
  htmlContent?: string;     // For custom HTML5 games/simulations (Sandbox/Game)
  markdownContent?: string; // For AI generated reading material
  quizContent?: QuizQuestion[]; // For AI generated quizzes
  flashcards?: Flashcard[]; // For AI generated flashcards
  
  // Visuals
  slides?: Slide[]; // Standard Lecture Slides (Text + Image)
  sceneImages?: GeneratedImage[]; // NEW: Actual AI Generated Images for Story

  // Infographics
  activityInfographic?: string; // Base64
  projectInfographic?: string; // Base64
  differentiationInfographic?: string; // Base64

  // New Rich Hierarchical Fields
  plan?: LessonPlan;
  story?: StoryElement;
  differentiation?: Differentiation;
  sandbox?: string; // Raw HTML/JS code for "Sandbox" tab (can map to htmlContent)
  
  // New Activity Fields
  practicalContent?: string; // For offline/hands-on activities (Markdown)
  projectContent?: string; // For mini-project specs (Markdown)
}

export interface Year {
  id: string;
  title: string;
  description?: string;
}

// NEW: Class Management
export interface Student {
    id: string;
    name: string;
    email?: string;
    xp: number;
    level: number;
    streak: number;
    completedTasks: number;
    lastActive: string;
    status: 'active' | 'idle' | 'at-risk'; 
}

export interface ClassGroup {
    id: string;
    title: string;
    yearId: string; // Links to a curriculum year
    studentIds: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalXp: number;
  earnedXp: number;
  tasks: Task[]; // These are "Lessons" in the new hierarchy
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
  yearId?: string; // Link to a Year
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon name
  color: string;
  criteria: {
    type: 'xp' | 'quests_completed' | 'streak';
    threshold: number;
  };
}

export interface DailyProgress {
  date: string; // ISO Date string (YYYY-MM-DD)
  xpEarned: number;
}

export interface UserStats {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  totalQuestsCompleted: number;
  streakDays: number;
  earnedBadges: string[]; // Array of Badge IDs
  dailyHistory: DailyProgress[]; // For Analytics Chart
}

export interface CreateQuestPayload {
  topic: string;
  difficulty: string;
  additionalNotes?: string;
  yearId?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AppData {
  quests: Quest[];
  years: Year[];
  classes: ClassGroup[]; // NEW
  students: Student[]; // NEW
  stats: UserStats;
}

export interface WeeklyPlanBundle {
    studentEdition: string;
    exitTickets: string;
    teacherPack: string;
}

export type ViewType = 'dashboard' | 'explore' | 'vault' | 'settings';
