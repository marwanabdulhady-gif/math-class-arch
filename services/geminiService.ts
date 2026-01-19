
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Quest, Task, QuizQuestion, Flashcard, ChatMessage, AiPersona, Slide, WeeklyPlanBundle, ContentType, LessonPlan, StoryElement, Differentiation, CharacterProfile, GeneratedImage } from "../types";
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

// Initialize GenAI Client
let ai = new GoogleGenAI({ apiKey: getApiKey() });

// --- SYSTEM INSTRUCTIONS ---
const AETHER_ARCHITECT_INSTRUCTION = `
You are the AetherMath OS Architect. You specialize in creating cohesive educational units.

CRITICAL RULES:
1. **Grade Appropriateness**: Check the 'gradeLevel' in the context. 
   - Kindergarten: Use simple words, emojis, shapes, colors. NO complex algebra.
   - High School: Use rigorous academic language.
2. **Plan Alignment**: All content MUST teach the specific 'objectives' defined in the Lesson Plan.
3. **Sandbox vs Game**:
   - **Sandbox**: A tool to explore variables (e.g., a slider affecting a graph). NO WIN STATE. Pure exploration.
   - **Game**: A challenge with a score, lives, obstacles, levels, and a WIN/LOSS state.
`;

// --- SCHEMAS ---
const LESSON_PLAN_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        gradeLevel: { type: Type.STRING },
        objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
        standards: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific CCSS/NGSS codes" },
        timing: { type: Type.STRING },
        materials: { type: Type.ARRAY, items: { type: Type.STRING } },
        warmUp: { type: Type.STRING, description: "5-10 min hook activity" },
        mainActivity: { type: Type.STRING, description: "Core learning procedure" },
        wrapUp: { type: Type.STRING, description: "Closing assessment/reflection" },
        framework: { type: Type.STRING },
        slidesOutline: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detailed paragraph text for each lecture slide explaining the concept depth." }
    },
    required: ["topic", "gradeLevel", "objectives", "standards", "timing", "materials", "warmUp", "mainActivity", "wrapUp", "framework", "slidesOutline"]
} as const;

const STORY_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        theme: { type: Type.STRING, description: "Narrative theme" },
        scenes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sequential narrative beats" },
    },
    required: ["theme", "scenes"]
} as const;

const CHARACTER_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        characters: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    gender: { type: Type.STRING },
                    age: { type: Type.STRING },
                    role: { type: Type.STRING },
                    personality: { type: Type.STRING },
                    visualDescription: { type: Type.STRING }
                },
                required: ["name", "role", "personality", "visualDescription", "gender", "age"]
            }
        }
    },
    required: ["characters"]
} as const;

const DIFFERENTIATION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        support: { type: Type.STRING, description: "Scaffolding for students needing help" },
        core: { type: Type.STRING, description: "On-level instruction" },
        challenge: { type: Type.STRING, description: "Extension for advanced students" }
    },
    required: ["support", "core", "challenge"]
} as const;

const SLIDES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        slides: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.ARRAY, items: { type: Type.STRING } },
                    visualKeyword: { type: Type.STRING },
                    layout: { type: Type.STRING, enum: ['center', 'split', 'big-number'] },
                    script: { type: Type.STRING, description: "Detailed script for the teacher to say." },
                    imagePrompt: { type: Type.STRING, description: "A detailed prompt to generate an image for this slide." }
                },
                required: ["title", "content", "visualKeyword", "layout", "script", "imagePrompt"]
            }
        }
    },
    required: ["slides"]
} as const;

// --- API FUNCTIONS ---

export const generateQuest = async (topic: string, difficulty: string, notes?: string): Promise<Quest> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Create a structured Unit (Quest) for: "${topic}". Difficulty: ${difficulty}. Context: ${notes || "None"}. Break down into 5-8 tasks. Explicitly mention CCSS/NGSS standards.`;
  try {
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json", systemInstruction: AETHER_ARCHITECT_INSTRUCTION }});
    const data = JSON.parse(response.text || "{}");
    return {
      id: uuidv4(), title: data.title || topic, description: data.description || "", category: data.category || "General", difficulty: data.difficulty as any || "Beginner",
      totalXp: data.tasks?.reduce((sum: number, t: any) => sum + (t.xp || 0), 0) || 0, earnedXp: 0,
      tasks: (data.tasks || []).map((t: any) => ({ ...t, id: uuidv4(), isCompleted: false, type: t.type || 'Lesson', resources: [] })),
      createdAt: new Date().toISOString(), status: 'active'
    };
  } catch (error) { return { id: uuidv4(), title: topic, description: "Error generating", category: "General", difficulty: "Beginner", totalXp: 0, earnedXp: 0, tasks: [], createdAt: new Date().toISOString(), status: 'active' }; }
};

export const generateSingleTask = async (title: string, type: ContentType, context: string): Promise<Task> => {
    return { id: uuidv4(), title, description: "Generated task", xp: 50, type, isCompleted: false, resources: [] };
}

// --- UPDATED GRANULAR GENERATORS ---

export const generateLessonPlanSection = async (title: string, gradeLevel: string, framework: string, notes: string, duration: string, slideCount: number): Promise<LessonPlan> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
    Generate a COMPLETE, STRUCTURED Lesson Plan for "${title}".
    
    PARAMETERS:
    - Grade Level: ${gradeLevel} (Use age-appropriate language and depth).
    - Framework: ${framework}.
    - Total Duration: ${duration}.
    - Slide Count Target: ${slideCount} slides.
    - Specific Context: ${notes || "Standard curriculum alignement"}.
    
    REQUIREMENTS:
    1. 'objectives' must be measurable (SWBAT).
    2. 'slidesOutline' must contain EXACTLY ${slideCount} strings. Each string is the specific text content for one slide in the lecture.
    3. 'mainActivity' must be detailed step-by-step.
    
    Return strictly JSON matching the schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: LESSON_PLAN_SCHEMA, systemInstruction: AETHER_ARCHITECT_INSTRUCTION }
        });
        const plan = JSON.parse(response.text || "{}");
        return {
            topic: title,
            gradeLevel: gradeLevel,
            objectives: plan.objectives || [],
            standards: plan.standards || [],
            timing: duration,
            materials: plan.materials || [],
            warmUp: plan.warmUp || "N/A",
            mainActivity: plan.mainActivity || "N/A",
            wrapUp: plan.wrapUp || "N/A",
            framework: framework,
            slidesOutline: plan.slidesOutline || [],
            duration: duration,
            customContext: notes,
            slideCount: slideCount
        };
    } catch (e) { 
        console.error(e);
        return { topic: title, gradeLevel, objectives: ["Error"], standards: [], timing: "", materials: [], warmUp: "", mainActivity: "", wrapUp: "", framework: "", slidesOutline: [], slideCount: 5 }; 
    }
};

export const generateStorySection = async (
    title: string, 
    plan: LessonPlan | undefined,
    archetype: string, 
    setting: string,
    tone: string,
    characters: CharacterProfile[],
    gradeLevel: string
): Promise<StoryElement> => {
    const model = "gemini-3-flash-preview";
    const objectivesStr = plan ? plan.objectives.join("; ") : title;
    
    const charContext = characters.map(c => `${c.name} (${c.gender}, ${c.age}): ${c.role}, ${c.personality}`).join('\n');

    const prompt = `
    Generate a narrative Story structure for lesson: "${title}".
    Target Audience Grade Level: ${gradeLevel}.
    
    Objectives to Metaphorize: ${objectivesStr}
    
    Archetype: ${archetype}
    Setting: ${setting}
    Tone: ${tone}
    
    CRITICAL: You MUST use these specific characters in the story:
    ${charContext}
    
    INSTRUCTIONS:
    1. Write a 3-5 scene story arc suitable for ${gradeLevel}.
    2. Embed the characters deeply in the plot.
    3. The plot must teach the lesson concept.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: STORY_SCHEMA, systemInstruction: AETHER_ARCHITECT_INSTRUCTION }
        });
        const data = JSON.parse(response.text || "{}");
        return { ...data, tone, setting, characters }; 
    } catch (e) { return { theme: archetype, tone, setting, scenes: ["Error generating scenes."], characters }; }
};

export const generateCharacters = async (
    storyTheme: string,
    count: number,
    archetype: string,
    customPrompt: string
): Promise<CharacterProfile[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
    Generate ${count} characters for a "${storyTheme}" story.
    Archetype: ${archetype}.
    Additional Context: ${customPrompt || "None"}.
    
    For each character:
    - Unique Name
    - Gender
    - Age (e.g. "10 years old", "Ancient")
    - Role in the story
    - Personality traits
    - Detailed Visual Description (for an artist).
    `;

    try {
        const response = await ai.models.generateContent({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: CHARACTER_SCHEMA, systemInstruction: AETHER_ARCHITECT_INSTRUCTION }
        });
        const data = JSON.parse(response.text || "{}");
        return (data.characters || []).map((c: any) => ({ ...c, id: uuidv4() }));
    } catch (e) { return []; }
};

// --- REAL IMAGE GENERATION ---
export const generateSceneImage = async (sceneDescription: string, artDirection: string, aspectRatio: string = "1:1", context: string = ""): Promise<string | null> => {
    const model = "gemini-2.5-flash-image"; 
    
    // Strict prompt engineering for consistency
    const prompt = `
    STRICT VISUAL DIRECTION: ${artDirection}
    
    SCENE CONTENT: ${sceneDescription}
    ${context ? `CONTEXT: ${context}` : ''}
    
    INSTRUCTIONS:
    - Adhere 100% to the STRICT VISUAL DIRECTION for style, lighting, and color palette.
    - Ensure character consistency based on CONTEXT if provided.
    - Do not add text to the image.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any
                }
            }
        });
        
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data; 
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
}

export const generateInfographic = async (contentSummary: string, style: string): Promise<string | null> => {
    const model = "gemini-2.5-flash-image";
    const prompt = `Create a visually rich Educational Infographic. Style: ${style}. Topic Summary: ${contentSummary}. Ensure it looks professional, clean, and informative.`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                imageConfig: {
                    aspectRatio: '3:4' // Portrait for infographics
                }
            }
        });
        
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data; 
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Infographic generation failed", e);
        return null;
    }
}

export const enhanceImagePrompt = async (originalPrompt: string): Promise<string> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
    Rewrite the following image prompt to be highly detailed, artistic, and suitable for a high-quality generative AI model. 
    Focus on lighting, composition, texture, and mood. Keep it under 50 words.
    Original: "${originalPrompt}"
    `;
    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text?.trim() || originalPrompt;
    } catch(e) { return originalPrompt; }
};

export const generateDifferentiationSection = async (title: string, plan: LessonPlan | undefined, customPrompt: string, gradeLevel: string): Promise<Differentiation> => {
    const model = "gemini-3-flash-preview";
    const objectivesStr = plan ? plan.objectives.join("; ") : title;

    const prompt = `Generate a 3-tier Differentiation matrix for "${title}". 
    Grade: ${gradeLevel}.
    Objectives: ${objectivesStr}.
    Special Needs Focus: ${customPrompt || "General inclusion"}.
    Return strictly JSON.`;
    
    try {
        const response = await ai.models.generateContent({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: DIFFERENTIATION_SCHEMA, systemInstruction: AETHER_ARCHITECT_INSTRUCTION }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return { support: "N/A", core: "N/A", challenge: "N/A" }; }
};

export const generateSlides = async (title: string, plan: LessonPlan | undefined, count: number, gradeLevel: string): Promise<Slide[]> => {
    const model = "gemini-3-flash-preview";
    const objectivesStr = plan ? plan.objectives.join("; ") : title;
    // Use the generated outline if available, otherwise just the topic
    const outline = plan?.slidesOutline && plan.slidesOutline.length > 0 ? JSON.stringify(plan.slidesOutline) : "Create content based on objectives.";

    const prompt = `
    Generate exactly ${count} TEXT-BASED LECTURE slides for: "${title}".
    Target Audience Grade: ${gradeLevel}.
    Objectives: ${objectivesStr}.
    Detailed Content Source: ${outline}.
    
    This is for the 'Lecture' portion only.
    For each slide, also provide a 'imagePrompt' that describes a visual suitable for that slide.
    Ensure tone and vocabulary are appropriate for ${gradeLevel}.
    `;

    try {
        const response = await ai.models.generateContent({
            model, contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: SLIDES_SCHEMA }
        });
        const data = JSON.parse(response.text || "{}");
        return data.slides.map((s: any) => ({ ...s, id: uuidv4(), aspectRatio: '16:9' })); // Default 16:9
    } catch (e) { return []; }
}

export const generateSimulation = async (
    title: string, 
    plan: LessonPlan | undefined, 
    complexity: string, 
    variables: string,
    gradeLevel: string
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Create a "SANDBOX" HTML5/Canvas tool for: "${title}".
    Complexity Level: ${complexity}.
    Focus Variables: ${variables}.
    Grade Level: ${gradeLevel}.
    
    CRITICAL: THIS IS A SANDBOX.
    - NO "You Win" messages. NO Score.
    - YES Sliders, Inputs, Real-time Graphs.
    - Style: Dark Mode, Modern UI.
    
    Output: Single file HTML/CSS/JS.
    `;

  try {
    const response = await ai.models.generateContent({
      model, contents: prompt,
      config: { systemInstruction: AETHER_ARCHITECT_INSTRUCTION, thinkingConfig: { thinkingBudget: 0 } }
    });
    let html = response.text || "";
    html = html.replace(/```html/g, '').replace(/```/g, '');
    return html;
  } catch (e) { return `<!DOCTYPE html><html><body>Error</body></html>`; }
};

export const generateEducationalGame = async (
    title: string, 
    plan: LessonPlan | undefined, 
    gameType: string, 
    difficulty: string,
    gradeLevel: string
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Create an EDUCATIONAL GAME for: "${title}".
    Game Type: ${gameType}.
    Difficulty: ${difficulty}.
    Target Audience Grade: ${gradeLevel}.
    
    CRITICAL: THIS IS A GAME.
    - MUST have a Win/Loss condition.
    - MUST have a Score display.
    - MUST have a "Game Over" screen.
    - Style: Dark Mode, Colorful, Fun.
    
    Output: Single file HTML/CSS/JS.
  `;

  try {
    const response = await ai.models.generateContent({
      model, contents: prompt,
      config: { systemInstruction: AETHER_ARCHITECT_INSTRUCTION, thinkingConfig: { thinkingBudget: 0 } }
    });
    let html = response.text || "";
    html = html.replace(/```html/g, '').replace(/```/g, '');
    return html;
  } catch (e) { return `<!DOCTYPE html><html><body>Error</body></html>`; }
};

export const generatePracticalActivity = async (
    title: string, 
    plan: LessonPlan | undefined, 
    activityType: string, 
    duration: string, 
    materials: string,
    customPrompt: string,
    gradeLevel: string
): Promise<string> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
    Create a Hands-On Offline Activity for: "${title}".
    Activity Type: ${activityType}.
    Target Duration: ${duration}.
    Target Audience Grade: ${gradeLevel}.
    Materials Constraint: ${materials}.
    Context: ${customPrompt}.
    
    Format: Markdown. Use H2 for sections.
    `;
    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text || "No activity generated.";
    } catch (e) { return "Error generating activity."; }
}

export const generateMiniProject = async (
    title: string, 
    plan: LessonPlan | undefined, 
    scope: string, 
    format: string,
    customPrompt: string,
    gradeLevel: string
): Promise<string> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
    Design a Class Project for: "${title}".
    Target Audience Grade: ${gradeLevel}.
    Time Scope: ${scope}.
    Output Format: ${format}.
    Context: ${customPrompt}.
    
    Format: Markdown. Use H2 for sections.
    `;
    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text || "No project generated.";
    } catch (e) { return "Error generating project."; }
}

export const generateExportMarkdown = (task: Task): string => {
    return `
# ${task.title}
**Grade Level**: ${task.plan?.gradeLevel || 'N/A'}
**Duration**: ${task.plan?.duration || 'N/A'}
**Context**: ${task.plan?.customContext || 'N/A'}

## Lesson Plan
**Objectives**:
${task.plan?.objectives.map(o => `- ${o}`).join('\n') || '- N/A'}

**Procedure**:
**Warm Up**: ${task.plan?.warmUp}
**Main**: ${task.plan?.mainActivity}
**Wrap Up**: ${task.plan?.wrapUp}

---
## Lecture Slides
${task.slides?.map((s, i) => `### Slide ${i+1}: ${s.title}\n${s.content.join('\n')}\n*Script*: ${s.script}\n*[Image Generated]*`).join('\n\n') || "No slides."}

---
## Narrative: ${task.story?.theme || 'None'}
**Characters**:
${task.story?.characters?.map(c => `- ${c.name} (${c.gender}, ${c.age}): ${c.role}`).join('\n') || "No characters."}

**Scenes**:
${task.story?.scenes.map((s, i) => `${i+1}. ${s}`).join('\n') || ''}

---
## Differentiation
**Support**: ${task.differentiation?.support}
**Core**: ${task.differentiation?.core}
**Challenge**: ${task.differentiation?.challenge}

---
## Practical Activity
${task.practicalContent || 'N/A'}

---
## Project
${task.projectContent || 'N/A'}
    `;
}

// ... Legacy ...
export const serializeLessonDNA = (quest: Quest): string => { return JSON.stringify(quest, null, 2); }
export const getAiTutorResponse = async (history: ChatMessage[], taskTitle: string, persona: AiPersona): Promise<string> => { return "Thinking..."; };
export const generateDailyChallenge = async (topics: string[]): Promise<Task> => { return { id: uuidv4(), title: "Daily Review", description: "Review your recent notes.", xp: 50, type: 'Practice', isCompleted: false, resources: [] }; }
export const generateQuiz = async (taskTitle: string): Promise<QuizQuestion[]> => { return []; };
export const generateFlashcards = async (taskTitle: string): Promise<Flashcard[]> => { return []; };
export const generateLessonContent = async (taskTitle: string, taskDescription: string): Promise<string> => { return "Content"; };
