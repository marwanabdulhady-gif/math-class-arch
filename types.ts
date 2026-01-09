

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
}

export type AiPersona = 'socratic' | 'encouraging' | 'roast' | 'eli5';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string; // Base64 string for multimodal inputs
}

export interface Task {
  id: string;
  title: string;
  description: string;
  xp: number;
  isCompleted: boolean;
  resources?: string[];
  type: ContentType;
  htmlContent?: string;     // For custom HTML5 games/simulations
  markdownContent?: string; // For AI generated reading material
  quizContent?: QuizQuestion[]; // For AI generated quizzes
  flashcards?: Flashcard[]; // For AI generated flashcards
  slides?: Slide[]; // NEW: For Visual Carousels
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
  tasks: Task[];
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

export interface LessonPlan {
    studentEdition: string;
    exitTickets: string;
    teacherPack: string;
}

// NEW: Navigation Types
export type ViewType = 'dashboard' | 'explore' | 'settings';