"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useQuizzes,
  useQuestionsByQuizId,
  useCreateQuiz,
  SupabaseQuiz,
  SupabaseQuestion
} from '@/integrations/supabase/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { aiService, AIQuestionResponse } from '@/services/aiService';

// --- Type Definitions ---

// Map Supabase types to local context types
// Note: We omit snake_case fields that we map to camelCase to avoid type conflicts/requirements
export interface Question extends Omit<SupabaseQuestion, 'teacher_id' | 'created_at' | 'question_text' | 'correct_answer' | 'quiz_id' | 'time_limit_minutes' | 'marks'> {
  questionText: string;
  options: string[];
  correctAnswer: string;
  quizId: string;
  marks: number;
  timeLimitMinutes: number;
  explanation: string;
}

export interface Quiz extends Omit<SupabaseQuiz, 'teacher_id' | 'created_at' | 'course_name' | 'time_limit_minutes' | 'scheduled_date' | 'start_time' | 'end_time' | 'negative_marks_value' | 'status' | 'difficulty' | 'negative_marking' | 'competition_mode' | 'pass_mark_percentage' | 'total_questions' | 'required_correct_answers'> {
  quizId: string;
  courseName: string;
  questions: Question[];
  totalQuestions: number;
  passPercentage: number;
  requiredCorrectAnswers: number;
  startTime: string;
  endTime: string;
  status: 'draft' | 'published' | 'ACTIVE' | 'DELETED';
  createdAt: string;
  // Existing internal fields
  timeLimitMinutes: number;
  negativeMarking: boolean;
  competitionMode: boolean;
  scheduledDate: string;
  negativeMarksValue: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isInterview?: boolean;
  maxAttempts?: number; // New field
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  passed: boolean;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean; marksObtained: number }[];
  timestamp: number;
  timeTakenSeconds: number;
}

export interface ManagedUser {
  id: string;
  name: string;
  registerNumber: string;
  year: string;
  department: string;
  username: string;
  password: string;
  role: 'Student';
}

interface QuizContextType {
  quizzes: Quiz[];
  questions: Question[];
  quizAttempts: QuizAttempt[];
  isQuizzesLoading: boolean;
  isQuestionsLoading: boolean;
  availableCourses: string[];
  managedUsers: ManagedUser[];
  hasNewQuizzes: boolean;
  markQuizzesAsSeen: () => void;

  // Mutations/Actions
  addQuestion: (question: Omit<Question, 'id'>) => string;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => void;
  addCourse: (courseName: string) => void;
  addManagedUser: (user: Omit<ManagedUser, 'id' | 'username' | 'password' | 'role'>) => void;
  editCourse: (oldName: string, newName: string) => void;
  deleteCourse: (courseName: string) => void;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => void;
  getQuestionsForQuiz: (quizId: string) => Promise<Question[]>;
  getQuizById: (quizId: string) => Quiz | undefined;
  generateAIQuestions: (coursePaperName: string, difficulty: 'Easy' | 'Medium' | 'Hard', numQuestions: number, numOptions: number, marksPerQuestion: number, timePerQuestionSeconds: number) => Promise<Question[]>;
  deleteQuiz: (quizId: string) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// --- Helpers ---

const mapSupabaseQuizToLocal = (sQuiz: SupabaseQuiz): Quiz => ({
  id: sQuiz.id,
  quizId: sQuiz.id,
  title: sQuiz.title,
  courseName: sQuiz.course_name,
  questions: [], // Questions will be fetched separately for Supabase quizzes
  timeLimitMinutes: sQuiz.time_limit_minutes,
  negativeMarking: sQuiz.negative_marking,
  competitionMode: sQuiz.competition_mode,
  scheduledDate: sQuiz.scheduled_date,
  startTime: sQuiz.start_time,
  endTime: sQuiz.end_time,
  negativeMarksValue: sQuiz.negative_marks_value,
  status: sQuiz.status === 'published' ? 'ACTIVE' : sQuiz.status as any,
  difficulty: sQuiz.difficulty,
  passPercentage: sQuiz.pass_mark_percentage || 0,
  totalQuestions: sQuiz.total_questions || 0,
  requiredCorrectAnswers: sQuiz.required_correct_answers || 0,
  createdAt: sQuiz.created_at,
  isInterview: sQuiz.title.startsWith('INT:') || sQuiz.course_name.includes('Interview'),
});

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Fetch Quizzes using Supabase hook
  const { data: supabaseQuizzes = [], isLoading: isQuizzesLoading } = useQuizzes();
  const createQuizMutation = useCreateQuiz(); // Initialize mutation hook
  // --- Centralized Local Storage ---
  const [localData, setLocalData] = useState<{
    quizzes: Quiz[];
    questions: Question[];
    attempts: QuizAttempt[];
    courses: string[];
    users: ManagedUser[];
  }>(() => {
    try {
      const stored = localStorage.getItem('ALL_QUIZZES');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: If it was just an array (from my previous step), wrap it
        if (Array.isArray(parsed)) {
          return {
            quizzes: parsed,
            questions: JSON.parse(localStorage.getItem('local_questions') || '[]'),
            attempts: JSON.parse(localStorage.getItem('quiz_attempts') || '[]'),
            courses: JSON.parse(localStorage.getItem('manual_courses') || '[]'),
            users: JSON.parse(localStorage.getItem('managed_users') || '[]'),
          };
        }
        return {
          quizzes: parsed.quizzes || [],
          questions: parsed.questions || [],
          attempts: parsed.attempts || [],
          courses: parsed.courses || [],
          users: parsed.users || [],
        };
      }

      // Legacy fallout migration (if ALL_QUIZZES didn't exist yet but others did)
      return {
        quizzes: JSON.parse(localStorage.getItem('local_quizzes') || '[]'),
        questions: JSON.parse(localStorage.getItem('local_questions') || '[]'),
        attempts: JSON.parse(localStorage.getItem('quiz_attempts') || '[]'),
        courses: JSON.parse(localStorage.getItem('manual_courses') || '[]'),
        users: JSON.parse(localStorage.getItem('managed_users') || '[]'),
      };
    } catch (error) {
      console.error("Failed to load global quiz data", error);
      return { quizzes: [], questions: [], attempts: [], courses: [], users: [] };
    }
  });

  const { quizzes: localQuizzes, questions: localQuestionPool, attempts: quizAttempts, courses: manualCourses, users: managedUsers } = localData;

  const setLocalQuizzes = (updater: Quiz[] | ((prev: Quiz[]) => Quiz[])) => {
    setLocalData(prev => ({
      ...prev,
      quizzes: typeof updater === 'function' ? updater(prev.quizzes) : updater
    }));
  };

  const setLocalQuestionPool = (updater: Question[] | ((prev: Question[]) => Question[])) => {
    setLocalData(prev => ({
      ...prev,
      questions: typeof updater === 'function' ? updater(prev.questions) : updater
    }));
  };

  const setQuizAttempts = (updater: QuizAttempt[] | ((prev: QuizAttempt[]) => QuizAttempt[])) => {
    setLocalData(prev => ({
      ...prev,
      attempts: typeof updater === 'function' ? updater(prev.attempts) : updater
    }));
  };

  const setManualCourses = (updater: string[] | ((prev: string[]) => string[])) => {
    setLocalData(prev => ({
      ...prev,
      courses: typeof updater === 'function' ? updater(prev.courses) : updater
    }));
  };

  const setManagedUsers = (updater: ManagedUser[] | ((prev: ManagedUser[]) => ManagedUser[])) => {
    setLocalData(prev => ({
      ...prev,
      users: typeof updater === 'function' ? updater(prev.users) : updater
    }));
  };

  // Merge Supabase quizzes with Local Quizzes
  const quizzes = useMemo(() => [...supabaseQuizzes.map(mapSupabaseQuizToLocal), ...localQuizzes], [supabaseQuizzes, localQuizzes]);

  // State for student notification
  const [hasNewQuizzes, setHasNewQuizzes] = useState<boolean>(() => {
    return localStorage.getItem('NEW_QUIZ_AVAILABLE') === 'true';
  });

  const markQuizzesAsSeen = useCallback(() => {
    setHasNewQuizzes(false);
    localStorage.setItem('NEW_QUIZ_AVAILABLE', 'false');
  }, []);

  const availableCourses = manualCourses;

  // Persistence Effect
  useEffect(() => {
    const dataToSave = {
      quizzes: localQuizzes,
      questions: localQuestionPool,
      attempts: quizAttempts,
      courses: manualCourses,
      users: managedUsers,
    };
    localStorage.setItem('ALL_QUIZZES', JSON.stringify(dataToSave));
  }, [localQuizzes, localQuestionPool, quizAttempts, manualCourses]);

  const addQuestion = (question: Omit<Question, 'id'>) => {
    const newId = `q-local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newQuestion = { ...question, id: newId };
    setLocalQuestionPool((prev) => [...prev, newQuestion]);
    return newId;
  };

  const addCourse = (courseName: string) => {
    if (!manualCourses.includes(courseName)) {
      setManualCourses((prev) => [...prev, courseName]);
    }
  };

  const addManagedUser = (userData: Omit<ManagedUser, 'id' | 'username' | 'password' | 'role'>) => {
    const id = `user-${Date.now()}`;
    const newUser: ManagedUser = {
      ...userData,
      id,
      username: `student_${userData.registerNumber || Date.now()}`,
      password: `pass${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'Student'
    };
    setManagedUsers(prev => [newUser, ...prev]);
    toast.success("User added successfully!");
  };

  const editCourse = (oldName: string, newName: string) => {
    if (manualCourses.includes(oldName)) {
      setManualCourses(prev => prev.map(c => c === oldName ? newName : c));

      // Update local quizzes associated with this course
      setLocalQuizzes(prev => prev.map(q => q.courseName === oldName ? { ...q, courseName: newName } : q));

      toast.success(`Course renamed to "${newName}"`);
    }
  };

  const deleteCourse = (courseName: string) => {
    setManualCourses(prev => prev.filter(c => c !== courseName));
    toast.success("Course deleted successfully.");
  };

  const addQuiz = (quiz: Omit<Quiz, 'id' | 'status'>, questionsData: Omit<Question, 'id'>[]) => {
    // ... (existing addQuiz logic) ...
    const localId = `qz-local-${Date.now()}`;
    const newLocalQuestions = questionsData.map((q, index) => ({
      ...q,
      id: `q-local-${localId}-${index}`,
      quizId: localId,
    }));

    const newLocalQuiz: Quiz = {
      ...quiz,
      id: localId,
      quizId: localId,
      questions: newLocalQuestions,
      passPercentage: (quiz as any).passPercentage || (quiz as any).passMarkPercentage || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      maxAttempts: (quiz as any).maxAttempts || 1, // Default to 1 if not specified
    };

    // Update Local State immediately
    setLocalQuizzes(prev => [...prev, newLocalQuiz]);
    setLocalQuestionPool(prev => [...prev, ...newLocalQuestions]);

    // Also add the course to manual courses to ensure it persists immediately
    addCourse(quiz.courseName);

    // Set NEW_QUIZ_AVAILABLE flag
    localStorage.setItem('NEW_QUIZ_AVAILABLE', 'true');
    setHasNewQuizzes(true);

    // Dispatch event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'NEW_QUIZ_AVAILABLE',
      newValue: 'true'
    }));

    toast.success("Quiz created locally! (Syncing to cloud...)");

    // 2. Try Sync to Supabase
    createQuizMutation.mutate({
      quizData: {
        title: quiz.title,
        course_name: quiz.courseName,
        time_limit_minutes: quiz.timeLimitMinutes,
        negative_marking: quiz.negativeMarking,
        competition_mode: quiz.competitionMode,
        scheduled_date: quiz.scheduledDate,
        start_time: quiz.startTime,
        end_time: quiz.endTime,
        negative_marks_value: quiz.negativeMarksValue,
        difficulty: quiz.difficulty,
        pass_mark_percentage: quiz.passPercentage,
        total_questions: quiz.totalQuestions,
        required_correct_answers: quiz.requiredCorrectAnswers,
      },
      questionsData: questionsData.map(q => ({
        quiz_id: 'temp',
        question_text: q.questionText,
        options: q.options,
        correct_answer: q.correctAnswer,
        marks: q.marks,
        time_limit_minutes: q.timeLimitMinutes,
        explanation: q.explanation || '',
      }))
    }, {
      onSuccess: () => {
        toast.success("Quiz synced to cloud successfully!");
      },
      onError: (err) => {
        console.error("Cloud sync failed (using local copy):", err);
        toast.info("Offline Mode: Quiz saved to this device only.");
      }
    });
  };

  const deleteQuiz = async (quizId: string) => {
    // 1. Soft Delete in Local State (preserve history)
    setLocalQuizzes(prev => {
      return prev.map(q => {
        if (q.id === quizId) {
          // Log deletion to history
          const historyItem = {
            questionSetId: quizId,
            paperName: q.courseName || q.title, // Use course/paper name
            totalQuestions: q.questions.length,
            action: 'Deleted',
            timestamp: Date.now()
          };
          const currentHistory = JSON.parse(localStorage.getItem('questionActionHistory') || '[]');
          localStorage.setItem('questionActionHistory', JSON.stringify([historyItem, ...currentHistory]));

          return { ...q, status: 'DELETED' };
        }
        return q;
      });
    });

    // 2. Delete from Supabase if it's a cloud quiz
    if (!quizId.startsWith('qz-')) {
      try {
        const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
        if (error) throw error;
        toast.success("Quiz deleted from cloud.");
        queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      } catch (error) {
        console.error("Failed to delete from cloud:", error);
        toast.error("Failed to delete quiz from cloud.");
      }
    } else {
      toast.success("Quiz deleted from active view.");
    }
  };

  const submitQuizAttempt = (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: QuizAttempt = { ...attempt, id: `att-${Date.now()}`, timestamp: Date.now() };
    setQuizAttempts((prev) => [...prev, newAttempt]);
    toast.success("Quiz submitted!");
  };

  const getQuestionsForQuiz = useCallback(async (quizId: string): Promise<Question[]> => {
    // 1. Check local pool
    // Note: We use the localQuestionPool state here.
    const localQuestions = localQuestionPool.filter(q => q.quizId === quizId);
    if (localQuestions.length > 0) return localQuestions;

    // 2. Fallback: Check localStorage directly in case state hasn't synced yet (e.g. across tabs)
    try {
      const stored = localStorage.getItem('ALL_QUIZZES');
      if (stored) {
        const parsed = JSON.parse(stored);
        const questions = parsed.questions || [];
        const found = questions.filter((q: Question) => q.quizId === quizId);
        if (found.length > 0) return found;
      }
    } catch (e) {
      console.error("Manual localStorage check failed", e);
    }

    // 3. If it's a local ID and not found, it's truly empty
    if (quizId.startsWith('qz-local-')) return [];

    // 4. Fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(sQ => ({
        id: sQ.id,
        quizId: sQ.quiz_id,
        questionText: sQ.question_text,
        options: sQ.options,
        correctAnswer: sQ.correct_answer,
        marks: sQ.marks,
        timeLimitMinutes: sQ.time_limit_minutes,
        explanation: (sQ as any).explanation || '', // Safety check for new field
      }));
    } catch (error) {
      console.error("Error fetching questions for quiz:", quizId, error);
      return [];
    }
  }, [localQuestionPool]);

  const getQuizById = (quizId: string): Quiz | undefined => {
    return quizzes.find(q => q.id === quizId);
  };

  const generateAIQuestions = async (
    coursePaperName: string,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    numQuestions: number,
    numOptions: number,
    marksPerQuestion: number,
    timePerQuestionSeconds: number
  ): Promise<Question[]> => {
    // 1. Try real Gemini API first
    try {
      const prompt = aiService.generatePrompt({
        subjectName: coursePaperName,
        totalQuestions: numQuestions,
        mcqOptions: numOptions,
        difficulty: difficulty,
        marksPerQuestion: marksPerQuestion,
        timePerQuestionSeconds: timePerQuestionSeconds
      });

      const response = await aiService.callGeminiAPI(prompt);

      if (response && response.questions && response.questions.length > 0) {
        // 2. Second Stage: Validation and Correction
        toast.info("Refining and validating questions...");
        const validationPrompt = aiService.generateValidationPrompt(
          JSON.stringify(response),
          coursePaperName,
          difficulty
        );

        const validatedResponse = await aiService.callGeminiAPI(validationPrompt);

        const finalResponse = validatedResponse || response;

        if (finalResponse.questions && finalResponse.questions.length > 0) {
          toast.success(`Generated and validated ${finalResponse.questions.length} questions from Gemini AI!`);
          return aiService.mapResponseToQuestions(
            finalResponse.questions,
            'ai-generated',
            marksPerQuestion,
            timePerQuestionSeconds
          );
        }
      }
    } catch (error) {
      console.error("Gemini API failed, falling back to templates:", error);
    }

    // 2. Fallback to templates if API fails or is missing
    toast.info("Using template-based generation (API unavailable)");

    // Basic Keyword Validation Heuristic
    const VALID_TOPICS = [
      "Math", "Algebra", "Geometry", "Calculus", "Statistics",
      "Science", "Physics", "Chemistry", "Biology", "Astronomy",
      "History", "Geography", "Civics", "Economics", "Social Studies",
      "Literature", "English", "Grammar", "Language", "Writing",
      "Computer", "Programming", "Coding", "Java", "Python", "React", "Web Development", "AI", "Data Science",
      "Art", "Music", "General Knowledge", "GK", "Quiz",
      "Business", "Marketing", "Finance", "Management",
      "Psychology", "Sociology", "Philosophy",
      "Engineering", "Medical", "Law",
      "Sports", "Movies", "Technology" // Broad categories
    ];

    const lowerCaseInput = coursePaperName.toLowerCase();

    const isRelevant = VALID_TOPICS.some(topic =>
      lowerCaseInput.includes(topic.toLowerCase()) || topic.toLowerCase().includes(lowerCaseInput)
    );

    // If completely unrelated (e.g. random gibberish), we still generate but with a generic warning
    // This prevents the user from being stuck with empty questions.
    const effectiveTopic = isRelevant ? coursePaperName : `Topic: ${coursePaperName} (Unrecognized Category)`;

    const CATEGORY_TEMPLATES: Record<string, { questions: string[], options: string[][], explanations: string[] }> = {
      Biology: {
        questions: [
          "Basics: Identify the primary structural components of {topic} at the cellular level.",
          "Concepts: Discuss the homeostatic mechanisms that regulate {topic} within a multicellular system.",
          "Applications: Evaluate how {topic} biotechnology is applied in contemporary pharmacotherapy.",
          "Problem Solving: Predict the physiological consequences of a 50% reduction in {topic} efficiency.",
          "Real World: Analyze the impact of environmental pollutants on {topic} functionality in urban biomes.",
          "Theoretical: Critically analyze the evolutionary divergence of {topic} across phylogenetic lineages.",
          "Systems: Synthesize the relationship between {topic} and the systemic metabolic rate.",
          "Genetics: Determine the repercussion of epigenetic silencing on {topic} expression."
        ],
        options: [
          ["Mitochondrial sequestration", "Nuclear translocation", "Ribosomal ubiquitination", "Golgi apparatus secretion", "Cytoplasmic streaming", "Vacuolar autophagy"],
          ["Aerobic glycolysis", "Anaerobic fermentation", "Oxidative phosphorylation", "Photolytic water splitting", "Substrate-level phosphorylation", "Chemiosmotic coupling"],
          ["Enzymatic catalysis", "Hormonal signal transduction", "Structural protein synthesis", "Lipid membrane fluidization", "Carbohydrate catabolism", "Nucleic acid hybridization"],
          ["Trophic level optimization", "Competitive niche exclusion", "Symbiotic mutualism", "Ecological succession", "Biogeochemical cycling", "Population density regulation"]
        ],
        explanations: [
          "This represents the core metabolic adaptation necessary for homeostatic maintenance in the given biological context.",
          "The cellular mechanism described directly moderates the efficiency of localized physiological responses.",
          "Biochemical pathways are optimized to ensure minimal energy expenditure while maximizing systemic output."
        ]
      },
      Physics: {
        options: [
          ["Gravitational field strength", "Electromagnetic induction", "Strong nuclear coupling", "Weak interaction theory", "Centripetal acceleration", "Angular momentum conservation"],
          ["Kinetic energy distribution", "Elastic potential energy", "Internal thermal energy", "Rotational inertia", "Linear momentum vector", "Gravitational potential well"],
          ["Wavefront interference", "Diffraction pattern analysis", "Photoelectric emission", "Compton scattering effect", "Quantum tunnel probability", "Heisenberg uncertainty limit"],
          ["Thermal conductivity", "Convective heat transfer", "Radiative flux density", "Specific heat capacity", "Latent heat of fusion", "Thermal expansion coefficient"]
        ],
        explanations: [
          "The fundamental principles of physics mandate this behavioral pattern within a closed systemic environment.",
          "Mathematical derivation from first principles confirms this relationship between energy and matter states.",
          "Experimental validation consistently highlights this quantitative variance across multiple reference frames."
        ],
        questions: [
          "Basics: Define the fundamental properties of {topic} in a Newtonian reference frame.",
          "Concepts: Explain the wave-particle duality and diffraction patterns observed in {topic}.",
          "Applications: Evaluate the role of {topic} in the development of semiconductor technology.",
          "Problem Solving: Calculate the net force required to stabilize {topic} in a non-inertial system.",
          "Real World: Assess the engineering challenges of containing {topic} in high-pressure environments.",
          "Theoretical: Synthesize the unified field theory implications for {topic} in higher dimensions.",
          "Dynamics: Derive the terminal velocity of {topic} using fluid dynamics principles.",
          "Energy: Analyze the thermodynamic efficiency of energy conversion in {topic} systems."
        ]
      },
      Chemistry: {
        questions: [
          "Determine the electronegativity variance in the covalent bonding of {topic}.",
          "Predict the stoichiometric yield of {topic} in a complex redox reaction.",
          "Analyze the enthalpy change and activation energy threshold for {topic} decomposition.",
          "Calculate the pKa value and titration curve characteristics of {topic}.",
          "Identify the organometallic catalyst required to optimize the {topic} synthesis.",
          "Describe the hybridisation states of the carbon atoms in the {topic} structure.",
          "Evaluate the lattice energy and crystalline stability of {topic} isotopes.",
          "Discuss the role of ligand field theory in explaining the color of {topic} complexes."
        ],
        options: [
          ["Covalent network lattice", "Ionic crystalline structure", "Metallic lattice bonding", "Hydrogen bridge interaction", "London dispersion forces", "Induced dipole-dipole"],
          ["Arrhenius acid dissociation", "Brønsted-Lowry protonation", "Lewis acid electron-pair", "Amphiprotic behavior", "Buffer solution capacity", "Indicators of pH variance"],
          ["Stoichiometric ratio", "Molar concentration", "Average isotopic mass", "Macromolecular chain", "Monomeric structural unit", "Allotropic modification"],
          ["Isothermal expansion", "Adiabatic compression", "Exothermic enthalpy change", "Endothermic heat absorption", "Gibbs free energy delta", "Entropy maximization"]
        ],
        explanations: [
          "Molecular geometry and electronegativity differences dictate the polarity and reactivity of the resulting complex.",
          "Thermodynamic stability is achieved through the minimization of potential energy within the crystalline lattice.",
          "Kinetic analysis reveal that activation energy thresholds are the primary rate-limiting factors in this reaction."
        ]
      },
      History: {
        questions: [
          "Critique the historiographical interpretations of {topic} during the Enlightenment.",
          "Evaluate the geopolitical repercussions of {topic} on the balance of power in Europe.",
          "Synthesize the sociopolitical causes leading to the escalation of {topic}.",
          "Analyze the shift in subaltern perspectives regarding the {topic} revolution.",
          "Deconstruct the diplomatic nuances of the treaty that concluded the {topic} era.",
          "Assess the long-term demographic shifts resulting from the {topic} diaspora.",
          "Identify the primary archival evidence that challenges the narrative of {topic}.",
          "Discuss the manifestation of national identity through the lens of {topic}."
        ],
        options: [
          ["Renaissance Humanism", "Baroque Absolutism", "Industrial Capitalism", "Cold War Brinkmanship", "Age of Enlightenment", "Feudal Decentralization"],
          ["National Sovereignty", "Imperial Colonialism", "Hegemonic Power", "Democratic Populism", "Monarchical Autocracy", "Republican Ideology"],
          ["Diplomatic Treaty", "Strategic Alliance", "Military Armistice", "Political Campaign", "Popular Rebellion", "Foreign Invasion"],
          ["Primary Document", "Historical Archive", "Material Artifact", "Oral Chronicle", "Cultural Legend", "Foundational Myth"]
        ],
        explanations: [
          "The confluence of economic pressure and shifting social paradigms was the primary catalyst for this historical transition.",
          "Archival analysis reveals that diplomatic negotiations were heavily influenced by regional power dynamics.",
          "Long-term outcomes were dictated by the intersection of national identity and strategic resource management."
        ]
      },
      Programming: {
        questions: [
          "Basics: Elaborate on the core syntax and data types required to implement {topic}.",
          "Concepts: Discuss the architectural trade-offs of {topic} in distributed systems.",
          "Applications: Implement {topic} to optimize asynchronous data processing in web apps.",
          "Problem Solving: Evaluate the asymptotic complexity of {topic} in worst-case scenarios.",
          "Real World: Analyze the security vulnerabilities and mitigation strategies for {topic}.",
          "Logic: Deconstruct the multi-threaded execution flow of {topic} to avoid deadlocks.",
          "Patterns: Compare {topic} with alternative design patterns for scalable software.",
          "Lifecycle: Describe the memory footprint and garbage collection behavior for {topic}."
        ],
        options: [
          ["Linear complexity O(n)", "Logarithmic O(log n)", "Quadratic O(n^2)", "Constant O(1)", "Quasilinear O(n log n)", "Exponential O(2^n)"],
          ["Static Array", "Key-Value Pair", "Pure Function", "Primitive Variable", "Boolean Logic", "Template String"],
          ["Unit Debugging", "Modular Refactoring", "Lazy Initialization", "CI/CD Deployment", "Regression Testing", "Code Optimization"],
          ["Lexical Syntax", "Runtime Exception", "Business Logic", "Static Compilation", "Dynamic Linker", "Binary Loader"]
        ],
        explanations: [
          "Algorithmic efficiency is optimized here to minimize resource overhead during large-scale data processing.",
          "The structural pattern implemented ensures maximum modularity and ease of maintenance in distributed environments.",
          "Security protocols require this specific implementation to prevent potential unauthorized access and injection."
        ]
      },
      Math: {
        questions: [
          "Solve the non-homogeneous differential equation in the context of {topic}.",
          "Apply the Fundamental Theorem of Calculus to evaluate the definite integral of {topic}.",
          "Derive the Taylor series expansion for the function representing {topic}.",
          "Analyze the topological properties and manifold structure of {topic}.",
          "Calculate the Bayesian probability density function for the {topic} distribution.",
          "Evaluate the convergence criteria for the infinite series related to {topic}.",
          "Determine the singular value decomposition (SVD) for the {topic} matrix.",
          "Discuss the group theory applications in the symmetry of {topic} structures."
        ],
        options: [
          ["Quadratic equation", "Linear transformation", "Polynomial regression", "Exponential decay", "Logarithmic growth", "Trigonometric identity"],
          ["Composite Integer", "Rational coefficient", "Irrational number", "Complex manifold", "Real-valued function", "Natural logarithm"],
          ["Riemann Sum", "Dot Product", "Vector Difference", "Newtonian Quotient", "Remainder theorem", "Factorial growth"],
          ["Acute Angle", "Vector Slope", "Curvature Radius", "Matrix Diameter", "Circular Chord", "Geometric Tangent"]
        ],
        explanations: [
          "The application of advanced calculus principles allows for the precise derivation of the system's behavioral model.",
          "Statistical convergence is guaranteed by the Law of Large Numbers within this theoretical framework.",
          "Topological invariants provide a robust classification of the system's geometric properties."
        ]
      },
      General: {
        questions: [
          "Critically synthesize the overarching theoretical framework governing the use of {topic}.",
          "Identify the multifaceted variables that modulate the long-term trajectory of {topic}.",
          "Establish the empirical correlation between {topic} and industry-standard best practices.",
          "Evaluate the systemic impact of {topic} across diverse academic and professional disciplines.",
          "Analyze the chronological progression of {topic} research from inception to present-day utility.",
          "Determine the primary methodological approach used to validate the efficacy of {topic}.",
          "Assess the contemporary paradigm shifts that are currently reshaping the application of {topic}.",
          "Summarize the ethical considerations and core values intrinsic to the development of {topic}."
        ],
        options: [
          ["Conceptual Framework", "Theoretical Paradigm", "Analytical Model", "Internal Metric", "External Variable", "Neutral Axiom"],
          ["Natural Resource", "Human Capital", "Intellectual Labor", "Knowledge Economy", "Infrastructure Asset", "Emerging Technology"],
          ["Public Policy", "Regulatory Mandate", "Technical Standard", "Operational Guideline", "Methodological Framework", "Security Protocol"],
          ["Micro-trend", "Economic Cycle", "Statistical Pattern", "Structural Shift", "Project Phase", "Lifecycle Stage"]
        ],
        explanations: [
          "Comprehensive analysis highlights the intersection of theoretical models and practical industry requirements.",
          "Systemic factors contribute to the evolution of this field within the broader academic discourse.",
          "Standardization of methodologies ensures consistency and reliability across diverse professional sectors."
        ]
      }
    };

    // Determine Category with refined keyword matching
    let category = "General";
    const lowerInput = lowerCaseInput;

    // Programming/Tech
    if (lowerInput.match(/react|hook|coding|programming|java|python|javascript|typescript|c\+\+|html|css|web|api|backend|frontend/)) {
      category = "Programming";
    }
    // Biology
    else if (lowerInput.match(/biology|bio|heart|cell|organ|evolution|plant|animal|genetics|dna|body/)) {
      category = "Biology";
    }
    // Physics
    else if (lowerInput.match(/physics|phys|motion|gravity|energy|relativity|quantum|matter|force|atom/)) {
      category = "Physics";
    }
    // Chemistry
    else if (lowerInput.match(/chemistry|chem|reaction|periodic|acid|base|molecular|bond|atom/)) {
      category = "Chemistry";
    }
    // Math
    else if (lowerInput.match(/math|algebra|geometry|calculus|statistics|trig|number|logic/)) {
      category = "Math";
    }
    // History
    else if (lowerInput.match(/history|era|war|revolution|ancient|medieval|modern|century|civilization/)) {
      category = "History";
    }

    const templates = CATEGORY_TEMPLATES[category as keyof typeof CATEGORY_TEMPLATES] || CATEGORY_TEMPLATES.General;

    const generated: Question[] = [];
    const baseMarks = marksPerQuestion;
    const baseTimeLimit = timePerQuestionSeconds / 60;
    const usedQuestions = new Set<string>();

    let attempts = 0;
    const maxGlobalAttempts = numQuestions * 5; // Allow for some retries

    while (generated.length < numQuestions && attempts < maxGlobalAttempts) {
      attempts++;
      const questionId = `ai-q-${Date.now()}-${generated.length}-${Math.random().toString(36).substr(2, 4)}`;

      // Select templates
      const questionTemplate = templates.questions[Math.floor(Math.random() * templates.questions.length)];
      const baseOptionsPool = templates.options[Math.floor(Math.random() * templates.options.length)];
      const explanationTemplate = templates.explanations[Math.floor(Math.random() * templates.explanations.length)];

      const rawQuestionText = questionTemplate.replace('{topic}', effectiveTopic);

      // Rule: No duplicate questions
      if (usedQuestions.has(rawQuestionText)) continue;

      // Select correct answer and distractors
      const currentCorrectAnswer = baseOptionsPool[Math.floor(Math.random() * baseOptionsPool.length)];
      const distractors = baseOptionsPool.filter(opt => opt !== currentCorrectAnswer);

      // Shuffle and pick distractors
      const selectedDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, numOptions - 1);

      // Rule: Options are not repeated
      if (new Set([currentCorrectAnswer, ...selectedDistractors]).size !== numOptions) continue;

      const finalOptions = [currentCorrectAnswer, ...selectedDistractors].sort(() => 0.5 - Math.random());
      const correctIndex = finalOptions.indexOf(currentCorrectAnswer);

      // Simulate the structured AI response format (Now matches the new array-based schema)
      const aiResponse: AIQuestionResponse = {
        id: generated.length + 1,
        question: difficulty === 'Hard' ? "Advanced: " + rawQuestionText : difficulty === 'Easy' ? "Fundamental: " + rawQuestionText : rawQuestionText,
        options: finalOptions,
        correctIndex: correctIndex,
        marks: baseMarks,
        rationale: explanationTemplate
      };

      // Use the service to validate the response format and content
      const { valid } = aiService.validateQuestions([aiResponse], effectiveTopic);

      if (valid.length === 0) {
        console.warn("AI Question failed verification, retrying...", aiResponse);
        continue;
      }

      // Use the service to map it back to Question interface
      // Note: Passing marks and timeLimit per updated service signature
      const mapped = aiService.mapResponseToQuestions([aiResponse], 'ai-generated', baseMarks, timePerQuestionSeconds)[0];

      generated.push(mapped);
      usedQuestions.add(rawQuestionText);
    }
    return generated;
  };

  return (
    <QuizContext.Provider
      value={{
        questions: localQuestionPool,
        quizzes,
        quizAttempts,
        isQuizzesLoading,
        isQuestionsLoading: false,
        availableCourses,
        managedUsers,
        hasNewQuizzes,
        markQuizzesAsSeen,
        addQuestion,
        addQuiz,
        addCourse,
        addManagedUser,
        editCourse,
        deleteCourse,
        deleteQuiz,
        submitQuizAttempt,
        getQuestionsForQuiz,
        getQuizById,
        generateAIQuestions,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};