import * as Icons from 'lucide-react';
import { ContentType, Badge } from './types';

export const LEVELS = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500
];

export const DIFFICULTY_COLORS = {
  Beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export const CATEGORIES = [
  "Technology",
  "Science",
  "Arts",
  "Language",
  "Health",
  "Business",
  "Personal Development",
  "Math",
  "History"
];

export const CONTENT_TYPE_CONFIG: Record<ContentType, { icon: any, color: string, label: string }> = {
  Lesson: { icon: Icons.BookOpen, color: 'text-blue-400', label: 'Lesson' },
  Practice: { icon: Icons.Dumbbell, color: 'text-green-400', label: 'Practice' },
  Project: { icon: Icons.FlaskConical, color: 'text-purple-400', label: 'Project' },
  Game: { icon: Icons.Gamepad2, color: 'text-orange-400', label: 'Game' },
  Quiz: { icon: Icons.HelpCircle, color: 'text-pink-400', label: 'Quiz' },
};

export const BADGES: Badge[] = [
  { 
    id: 'novice', 
    title: 'Novice Learner', 
    description: 'Complete your first Unit', 
    iconName: 'Medal', 
    color: 'text-blue-400',
    criteria: { type: 'quests_completed', threshold: 1 } 
  },
  { 
    id: 'scholar', 
    title: 'Dedicated Scholar', 
    description: 'Earn 500 XP', 
    iconName: 'BookOpen', 
    color: 'text-indigo-400',
    criteria: { type: 'xp', threshold: 500 } 
  },
  { 
    id: 'streak_3', 
    title: 'Consistency Is Key', 
    description: 'Reach a 3-day learning streak', 
    iconName: 'Flame', 
    color: 'text-orange-400',
    criteria: { type: 'streak', threshold: 3 } 
  },
  { 
    id: 'expert', 
    title: 'Knowledge Master', 
    description: 'Earn 1500 XP', 
    iconName: 'Brain', 
    color: 'text-purple-400',
    criteria: { type: 'xp', threshold: 1500 } 
  },
  { 
    id: 'veteran', 
    title: 'Quest Veteran', 
    description: 'Complete 5 Units', 
    iconName: 'Swords', 
    color: 'text-red-400',
    criteria: { type: 'quests_completed', threshold: 5 } 
  },
  { 
    id: 'legend', 
    title: 'Legendary', 
    description: 'Reach Level 5 (5500 XP)', 
    iconName: 'Crown', 
    color: 'text-yellow-400',
    criteria: { type: 'xp', threshold: 5500 } 
  }
];

export const MOCK_QUESTS_IF_EMPTY = [];