
import { GoogleGenAI, Type } from "@google/genai";
import { Quest, Task, QuizQuestion, Flashcard, ChatMessage, AiPersona, Slide, LessonPlan, ContentType } from "../types";
import { v4 as uuidv4 } from 'uuid';

// --- API KEY MANAGEMENT ---
const API_KEY_STORAGE_KEY = 'gemini_api_key_custom';

const getApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || process.env.API_KEY || '';
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

export const setApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
  // Re-initialize client
  ai = new GoogleGenAI({ apiKey: key });
};

// Initialize GenAI Client with whatever key we have available
let ai = new GoogleGenAI({ apiKey: getApiKey() });

// --- MOCK DATA FOR FAILOVER ---
const MOCK_QUEST_DATA = {
  title: "Foundations of Artificial Intelligence",
  description: "Explore the basics of AI, machine learning, and how neural networks mimic the human brain. (Offline/Demo Mode)",
  category: "Technology",
  difficulty: "Beginner",
  tasks: [
    { title: "What is AI?", description: "Learn the definition and history of AI.", xp: 50, type: "Lesson", resources: [] },
    { title: "Neural Networks Interactive", description: "Visualize a simple neural network.", xp: 100, type: "Game", resources: [] },
    { title: "Ethics in AI", description: "Discuss the moral implications.", xp: 150, type: "Project", resources: [] },
    { title: "Quiz: AI Basics", description: "Test your knowledge.", xp: 25, type: "Practice", resources: [] }
  ]
};

const MOCK_LESSON_CONTENT = `
# Interactive Lesson: The Topic You Requested (Offline)

**Note:** We couldn't connect to the AI Tutor right now (Check your API Key), but here is a primer on the subject!

## 1. Core Concepts
*   **Definition:** Understanding the fundamental building blocks.
*   **Significance:** Why this matters in the real world.
*   **Application:** How professionals use this knowledge.

## 2. Deep Dive
Imagine this concept like a **bicycle**. 
*   The *frame* is the main theory.
*   The *wheels* are the practical applications that move you forward.
*   The *handlebars* are the controls you have over the outcome.

## 3. Summary
Mastering this topic opens doors to advanced fields. Keep practicing!
`;

const MOCK_QUIZ = [
  { question: "What is the primary goal of this topic?", options: ["To confuse you", "To solve problems", "To waste time", "None of the above"], correctIndex: 1, explanation: "Solving problems is the core purpose." },
  { question: "Which is a key component?", options: ["Magic", "Logic", "Luck", "Chaos"], correctIndex: 1, explanation: "Logic is essential." },
  { question: "How do you apply this?", options: ["Randomly", "Systematically", "Never", "Once"], correctIndex: 1, explanation: "Systematic application yields results." }
];

const MOCK_FLASHCARDS = [
  { front: "Key Term 1", back: "Definition of the first key term." },
  { front: "Important Date", back: "The year this concept was discovered." },
  { front: "Main Formula", back: "A + B = C" },
  { front: "Key Figure", back: "The person who invented this." },
  { front: "Application", back: "A real world example." }
];

const QUEST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the learning unit." },
    description: { type: Type.STRING, description: "A brief inspiring description of what will be learned." },
    category: { type: Type.STRING, description: "The category of the topic." },
    difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of the learning task." },
          description: { type: Type.STRING, description: "Detailed instruction for the task." },
          xp: { type: Type.INTEGER, description: "XP value for completing this task (10-50)." },
          type: { type: Type.STRING, enum: ['Lesson', 'Practice', 'Project', 'Game'], description: "The type of activity." },
          resources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Suggested search terms or types of resources to find."
          }
        },
        required: ["title", "description", "xp", "type"]
      }
    }
  },
  required: ["title", "description", "category", "difficulty", "tasks"]
};

const QUIZ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 4 possible answers." },
          correctIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)." },
          explanation: { type: Type.STRING, description: "Why this answer is correct." }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    }
  },
  required: ["questions"]
};

const FLASHCARD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING, description: "The question or term." },
          back: { type: Type.STRING, description: "The answer or definition." }
        },
        required: ["front", "back"]
      }
    }
  },
  required: ["cards"]
};

const SLIDES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        slides: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 3-4 bullet points" },
                    visualKeyword: { type: Type.STRING, description: "A single noun representing the concept (e.g. 'rocket', 'brain', 'atom') for icon selection" },
                    layout: { type: Type.STRING, enum: ['center', 'split', 'big-number'] }
                },
                required: ["title", "content", "visualKeyword", "layout"]
            }
        }
    },
    required: ["slides"]
}

const DAILY_CHALLENGE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A fun, short daily learning task title." },
        description: { type: Type.STRING, description: "Instructions for the task." },
        xp: { type: Type.INTEGER, description: "XP Reward (50-100)" },
    },
    required: ["title", "description", "xp"]
};

const LESSON_PLAN_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        studentEdition: { type: Type.STRING, description: "The full text content for the Student Edition document (Narrative hook, missions, practice, reflections)." },
        exitTickets: { type: Type.STRING, description: "The full text content for the Exit Tickets document (5 cards, Sun-Thu)." },
        teacherPack: { type: Type.STRING, description: "The full text content for the Teacher Pack (5E scripts, differentiation, misconceptions, dojo plan)." }
    },
    required: ["studentEdition", "exitTickets", "teacherPack"]
};

const SINGLE_TASK_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        xp: { type: Type.INTEGER },
    },
    required: ["title", "description", "xp"]
};

// --- API FUNCTIONS ---

export const generateQuest = async (topic: string, difficulty: string, notes?: string): Promise<Quest> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Create a structured learning unit (Quest) for the topic: "${topic}".
    Difficulty Level: ${difficulty}.
    Additional Context: ${notes || "None"}.
    
    The unit should break down the topic into 5-8 actionable learning items.
    Mix different types of activities: Lessons, Practice, Projects, and Games.
    Each task should have a clear goal and an XP reward suitable for the effort.
    Ensure the content is educational and structured logically.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUEST_SCHEMA,
        systemInstruction: "You are an expert curriculum designer and gamification specialist. You create engaging learning paths.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Transform into app internal format
    const totalXp = data.tasks.reduce((sum: number, t: any) => sum + (t.xp || 0), 0);
    
    const newQuest: Quest = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      totalXp,
      earnedXp: 0,
      tasks: data.tasks.map((t: any) => ({
        ...t,
        id: uuidv4(),
        isCompleted: false,
        type: t.type || 'Lesson', 
        resources: t.resources || []
      })),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    return newQuest;

  } catch (error) {
    console.error("Gemini Quest Generation Error:", error);
    // Return mock data
    return {
        id: uuidv4(),
        title: `${topic} (Offline/Demo)`,
        description: MOCK_QUEST_DATA.description,
        category: MOCK_QUEST_DATA.category,
        difficulty: difficulty as any,
        totalXp: 325,
        earnedXp: 0,
        tasks: MOCK_QUEST_DATA.tasks.map(t => ({...t, id: uuidv4(), isCompleted: false, type: t.type as any})),
        createdAt: new Date().toISOString(),
        status: 'active'
    };
  }
};

export const generateSingleTask = async (title: string, type: ContentType, context: string): Promise<Task> => {
    const model = "gemini-3-flash-preview";
    const prompt = `Generate a single ${type} task metadata for the topic: "${title}". Context: "${context}".`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: SINGLE_TASK_SCHEMA
            }
        });
        const data = JSON.parse(response.text || "{}");
        const task: Task = {
            id: uuidv4(),
            title: data.title || title,
            description: data.description || "Learn this concept.",
            xp: data.xp || 50,
            type: type,
            isCompleted: false,
            resources: []
        };
        
        // Pre-fill content based on type
        if (type === 'Lesson') {
            task.markdownContent = await generateLessonContent(task.title, task.description);
        } else if (type === 'Game') {
            task.htmlContent = await generateSimulation(task.title, task.description);
        } else if (type === 'Practice') {
            task.quizContent = await generateQuiz(task.title);
        }

        return task;
    } catch (e) {
        // Fallback
        return {
            id: uuidv4(),
            title: title,
            description: `Generated ${type} for ${title}`,
            xp: 50,
            type: type,
            isCompleted: false,
            resources: []
        }
    }
}

export const generateWeeklyLessonPlan = async (grade: string, unit: string, week: string, topic: string): Promise<LessonPlan> => {
    const model = "gemini-3-pro-preview"; // Use Pro for complex reasoning
    
    const prompt = `
    Generate three detailed deliverables for Grade ${grade} Math (CCSS-aligned): Unit ${unit}, Week ${week}, Topic: "${topic}".
    
    Follow these strict requirements:

    1. STUDENT EDITION CONTENT:
       - Clear narrative hook with guild characters.
       - Learning Targets ("I can..." + CCSS codes).
       - 2-4 Missions following the 9-block anatomy (Target, Checklist, Idea, Lab, Spark, Warning, Shield, Write, Brain).
       - Mixed Practice: 6-10 items (blend current + spiral).
       - Project: Driving question, steps, checklist, rubric.
       - Reflections: Daily "Muhasabat al-Nafs" (Self-Accountability) + "Al-Hamd" (Gratitude) prompts.

    2. EXIT TICKETS CONTENT:
       - 5 cards (Sun-Thu).
       - Each card = 1 CCSS-aligned Question + reflection + mastery band (1-4).
       - Micro-reflections link to Akhlaq (honesty, gratitude, fixing mistakes).

    3. TEACHER PACK CONTENT:
       - Weekly Overview: Standards, big idea, vocab.
       - Daily 5E Scripts (Engage, Explore, Explain, Elaborate, Evaluate).
       - Misconceptions & Reteach strategies (CRA).
       - Differentiation grid (Support/On-Level/Challenge).
       - ClassDojo plan (positive-only points tied to behaviors).
       - Tomorrow Decisions criteria.

    Guardrails:
    - One new concept per Mission.
    - Tag CCSS accurately.
    - Embed Akhlaq naturally (Sidiq, Amanah, Rahmah, Itqan).
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: LESSON_PLAN_SCHEMA,
                systemInstruction: "You are an expert K-12 Curriculum Architect specializing in CCSS Math and Character Education (Akhlaq).",
                thinkingConfig: { thinkingBudget: 4096 } // Give it budget to think through the 5E scripts
            }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Lesson Plan Gen Error", e);
        throw e;
    }
}

export const generateLessonContent = async (taskTitle: string, taskDescription: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Write a comprehensive, engaging educational lesson for the topic: "${taskTitle}".
    Context: ${taskDescription}.
    
    Format: Markdown.
    Style: Engaging, easy to understand, use emojis, use bolding for key terms.
    Structure:
    1. Introduction (Hook)
    2. Key Concepts (Bullet points)
    3. Deep Dive (Explanation)
    4. Real-world Application
    5. Summary
    
    Keep it under 500 words.
  `;

  try {
      const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
              systemInstruction: "You are a world-class teacher who explains complex topics simply and engagingly.",
          }
      });
      return response.text || MOCK_LESSON_CONTENT;
  } catch (e) {
      console.error(e);
      return MOCK_LESSON_CONTENT;
  }
};

export const generateSlides = async (taskTitle: string): Promise<Slide[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = `Generate a visually engaging 5-7 slide presentation for: "${taskTitle}".
    Each slide needs a 'visualKeyword' (a simple noun like 'sun', 'tree', 'atom') that represents the core concept of that slide.
    Keep content bullet points short and punchy.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: SLIDES_SCHEMA,
                systemInstruction: "You are a visual communication expert. You break complex topics into bite-sized, visual cards."
            }
        });
        const data = JSON.parse(response.text || "{}");
        return data.slides.map((s: any) => ({ ...s, id: uuidv4() }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

export const generateQuiz = async (taskTitle: string): Promise<QuizQuestion[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = `Generate a 3-question multiple choice quiz to test knowledge about: "${taskTitle}".`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: QUIZ_SCHEMA
            }
        });
        const data = JSON.parse(response.text || "{}");
        return data.questions.map((q: any) => ({ ...q, id: uuidv4() }));
    } catch (e) {
        console.error(e);
        return MOCK_QUIZ.map(q => ({...q, id: uuidv4()}));
    }
};

export const generateFlashcards = async (taskTitle: string): Promise<Flashcard[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate 5 flashcards for active recall practice on the topic: "${taskTitle}".`;

  try {
      const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: FLASHCARD_SCHEMA
          }
      });
      const data = JSON.parse(response.text || "{}");
      return data.cards.map((c: any) => ({ ...c, id: uuidv4() }));
  } catch (e) {
      console.error(e);
      return MOCK_FLASHCARDS.map(c => ({...c, id: uuidv4()}));
  }
};

export const generateSimulation = async (taskTitle: string, taskDescription: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Create a highly visual, interactive HTML5/Canvas simulation to demonstrate: "${taskTitle}".
    Context: "${taskDescription}".
    
    CRITICAL DESIGN REQUIREMENTS:
    1.  **Visuals:** Use HTML5 Canvas or SVG for graphics. Do NOT just use text inputs. Make it look like a video game or a high-end physics demo.
    2.  **Theme:** Dark Mode (background #0f172a, text #f8fafc). Use neon accents (cyan #22d3ee, purple #a855f7).
    3.  **Interactivity:** Users MUST be able to click, drag, or control something.
    4.  **No External Libraries:** Use vanilla JS only.
    5.  **Self-Contained:** Return ONLY the raw HTML code starting with <!DOCTYPE html>.
    
    Example ideas:
    - If math: A graphing tool or visual shape manipulator.
    - If history: An interactive timeline or map where things light up.
    - If science: A particle simulation, orbit visualizer, or chemical reaction animator.
    - If coding: A visual algorithm sorter.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let html = response.text || "";
    // Clean up markdown code blocks if present
    html = html.replace(/```html/g, '').replace(/```/g, '');
    return html;
  } catch (e) {
    console.error("Simulation Generation Error:", e);
    return `<!DOCTYPE html><html><body style="color:white; font-family:sans-serif; text-align:center; padding:2rem;"><h1>Simulation Unavailable</h1><p>We couldn't generate the simulation at this time.</p></body></html>`;
  }
};

export const getAiTutorResponse = async (history: ChatMessage[], taskContext: string, persona: AiPersona = 'socratic'): Promise<string> => {
    const model = "gemini-3-flash-preview";
    const recentHistory = history.slice(-6); 
    
    let parts: any[] = [];
    
    const conversationText = recentHistory.slice(0, -1).map(msg => 
      `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.text} ${msg.image ? '[User attached an image]' : ''}`
    ).join('\n');

    const lastMsg = recentHistory[recentHistory.length - 1];

    let systemInstruction = "You are a helpful learning mentor.";
    switch (persona) {
        case 'socratic': 
            systemInstruction = "You are a Socratic Tutor. Never give the direct answer. Ask guiding questions to lead the student to the solution.";
            break;
        case 'encouraging':
            systemInstruction = "You are an ultra-supportive cheerleader. Use emojis, praise every effort, and be very gentle with corrections.";
            break;
        case 'roast':
            systemInstruction = "You are a snarky, funny, slightly mean tutor. Roast the student playfully if they are wrong, but still help them learn. Use gen-z slang.";
            break;
        case 'eli5':
            systemInstruction = "Explain everything like the student is 5 years old. Use simple analogies (like pizzas or lego).";
            break;
    }

    const promptText = `
      Context: Task "${taskContext}".
      Conversation History:
      ${conversationText}
      
      Student's New Input: "${lastMsg.text}"
      
      Respond to the student based on your persona.
    `;

    parts.push({ text: promptText });
    
    if (lastMsg.role === 'user' && lastMsg.image) {
        const base64Data = lastMsg.image.split(',')[1];
        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png'
            }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                systemInstruction,
            }
        });
        return response.text || "I'm listening...";
    } catch (e) {
        console.error(e);
        return "I'm having trouble connecting to the AI. Check your API Key in Settings.";
    }
}

export const generateDailyChallenge = async (topics: string[]): Promise<Task> => {
    const model = "gemini-3-flash-preview";
    const topic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : "General Knowledge";
    
    const prompt = `Generate a quick, 5-minute daily challenge task for a student learning about: ${topic}.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: DAILY_CHALLENGE_SCHEMA
            }
        });
        const data = JSON.parse(response.text || "{}");
        
        return {
            id: uuidv4(),
            title: `Daily: ${data.title}`,
            description: data.description,
            xp: data.xp || 50,
            isCompleted: false,
            type: 'Practice',
            resources: []
        };
    } catch (e) {
        // Fallback
        return {
            id: uuidv4(),
            title: "Daily: Quick Review",
            description: "Review your notes from the last lesson for 5 minutes.",
            xp: 50,
            isCompleted: false,
            type: 'Practice',
            resources: []
        };
    }
}
