"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, PlusCircle, Trash2, Eye, Save, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '@/context/QuizContext';

// Define a type for questions in local draft state
interface LocalQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number | null; // Index of the correct option, or null if none selected
  marks: number;
  timeLimitMinutes: number; // Added timeLimitMinutes for individual questions
}

// Define a type for the entire quiz data managed locally
interface LocalQuizData {
  quizTitle: string;
  totalQuestions: number;
  optionsPerQuestion: number;
  questions: LocalQuestion[];
}

// Define the structure for a quiz stored in session storage (compatible with QuizContext types for preview)
interface StoredQuiz {
  id: string;
  title: string;
  questionIds: string[];
  timeLimitMinutes: number;
  negativeMarking: boolean;
  competitionMode: boolean;
  _questionsData: {
    id: string;
    quizId: string;
    questionText: string;
    options: string[];
    correctAnswer: string; // Converted from index
    marks: number;
    timeLimitMinutes: number; // Added timeLimitMinutes for stored questions
  }[];
}

const QuizCreator = () => {
  const navigate = useNavigate();
  const { generateAIQuestions } = useQuiz();

  // Consolidated quiz data state
  const [quizData, setQuizData] = useState<LocalQuizData>({
    quizTitle: '',
    totalQuestions: 0,
    optionsPerQuestion: 4, // Default to 4 options as requested
    questions: [],
  });

  // Other quiz details not explicitly part of the 'Quiz' structure provided by user, but still needed
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(30);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);
  const [defaultTimePerQuestion, setDefaultTimePerQuestion] = useState<number | null>(null); // New state for optional default time

  const [isQuizStructureInitialized, setIsQuizStructureInitialized] = useState<boolean>(false);

  // AI Question Generation State (now local to QuizCreator)
  const [aiCoursePaperName, setAiCoursePaperName] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  // Calculate total marks dynamically
  const totalQuizMarks = quizData.questions.reduce((sum, q) => sum + q.marks, 0);

  // Helper validation function
  const validateQuizDraft = (): boolean => {
    if (!quizData.quizTitle.trim()) {
      toast.error("Please provide a quiz title.");
      return false;
    }
    if (quizTimeLimit <= 0) {
      toast.error("Please set a valid overall quiz time limit (at least 1 minute).");
      return false;
    }
    if (quizData.questions.length === 0) {
      toast.error("Please add at least one question to the quiz.");
      return false;
    }

    for (const [index, q] of quizData.questions.entries()) {
      if (!q.questionText.trim()) {
        toast.error(`Question ${index + 1}: Question text cannot be empty.`);
        return false;
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`Question ${index + 1}: All options must be filled.`);
        return false;
      }
      if (q.correctAnswerIndex === null || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        toast.error(`Question ${index + 1}: Please select a correct answer.`);
        return false;
      }
      if (q.marks <= 0) {
        toast.error(`Question ${index + 1}: Marks must be at least 1.`);
        return false;
      }
      if (q.timeLimitMinutes <= 0) { // New validation for individual question time
        toast.error(`Question ${index + 1}: Time limit must be at least 1 minute.`);
        return false;
      }
    }
    return true;
  };

  const handleInitializeQuizStructure = () => {
    if (!quizData.quizTitle.trim()) {
      toast.error("Please provide a quiz title before initializing structure.");
      return;
    }
    if (quizData.totalQuestions <= 0) {
      toast.error("Total questions must be at least 1.");
      return;
    }
    if (quizData.optionsPerQuestion < 2 || quizData.optionsPerQuestion > 6) {
      toast.error("Options per question must be between 2 and 6.");
      return;
    }

    const newDraftQuestions: LocalQuestion[] = Array.from({ length: quizData.totalQuestions }, () => ({
      questionText: '',
      options: Array(quizData.optionsPerQuestion).fill(''),
      correctAnswerIndex: null,
      marks: 1,
      timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1, // Use default or 1
    }));

    setQuizData((prev) => ({
      ...prev,
      questions: newDraftQuestions,
    }));
    setIsQuizStructureInitialized(true);
    toast.success(`Quiz structure initialized with ${quizData.totalQuestions} questions.`);
  };

  const handleAddQuestionToDraft = () => {
    setQuizData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: Array(prev.optionsPerQuestion).fill(''),
          correctAnswerIndex: null,
          marks: 1,
          timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1, // Use default or 1
        },
      ],
      totalQuestions: prev.totalQuestions + 1, // Update totalQuestions count
    }));
    toast.info("New question added to draft.");
  };

  const handleDeleteQuestionFromDraft = (questionIndex: number) => {
    setQuizData((prev) => {
      const newQuestions = prev.questions.filter((_, idx) => idx !== questionIndex);
      return {
        ...prev,
        questions: newQuestions,
        totalQuestions: newQuestions.length, // Update totalQuestions count
      };
    });
    toast.info("Question removed from draft.");
  };

  const handleUpdateQuizDetails = (field: keyof LocalQuizData, value: string | number) => {
    setQuizData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateDraftQuestion = (
    questionIndex: number,
    field: 'questionText' | 'marks' | 'timeLimitMinutes', // Added timeLimitMinutes
    value: string | number
  ) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleUpdateDraftOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleUpdateCorrectAnswerIndex = (
    questionIndex: number,
    selectedOptionValue: string // The string value of the selected option
  ) => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      const question = newQuestions[questionIndex];
      const newCorrectAnswerIndex = question.options.indexOf(selectedOptionValue);
      newQuestions[questionIndex] = { ...question, correctAnswerIndex: newCorrectAnswerIndex };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleGenerateAIQuestions = () => {
    if (!aiCoursePaperName.trim()) {
      toast.error("Please enter a course/paper name for AI generation.");
      return;
    }

    const generatedQuestions = generateAIQuestions(
      aiCoursePaperName,
      aiDifficulty,
      quizData.totalQuestions, // Use totalQuestions from quiz setup
      quizData.optionsPerQuestion // Use optionsPerQuestion from quiz setup
    );

    // Map generated questions to LocalQuestion format
    const newDraftQuestions: LocalQuestion[] = generatedQuestions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.options.indexOf(q.correctAnswer), // Find index of correct answer
      marks: 1, // Default marks, as per requirement for manual input
      timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1, // Use default or 1
    }));

    setQuizData((prev) => ({
      ...prev,
      questions: newDraftQuestions,
    }));
    toast.success("AI generated questions loaded into draft. Please review and set marks.");
  };

  // Helper to prepare quiz data for storage/logging
  const prepareQuizForOutput = (isForPreview: boolean = false): StoredQuiz | null => {
    if (!validateQuizDraft()) {
      return null;
    }

    const quizId = `qz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const questionsForOutput = quizData.questions.map((q, qIndex) => {
      const questionId = `q-${Date.now()}-${qIndex}-${Math.random().toString(36).substr(2, 4)}`;
      return {
        id: questionId,
        quizId: quizId, // Assign the quizId to questions
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : '',
        marks: q.marks,
        timeLimitMinutes: q.timeLimitMinutes, // Include timeLimitMinutes
      };
    });

    return {
      id: quizId,
      title: quizData.quizTitle,
      questionIds: questionsForOutput.map(q => q.id),
      timeLimitMinutes: quizTimeLimit,
      negativeMarking: negativeMarking,
      competitionMode: competitionMode,
      _questionsData: questionsForOutput, // Include full question data for easy retrieval
    };
  };

  const handleCreateQuizAndLog = () => {
    const finalQuiz = prepareQuizForOutput();
    if (finalQuiz) {
      console.log("Quiz Data (Logged to Console):", finalQuiz);
      toast.success("Quiz data logged to console (not persisted).");
      resetForm();
    }
  };

  const handleSaveQuizToSession = () => {
    const finalQuiz = prepareQuizForOutput();
    if (finalQuiz) {
      try {
        const existingSavedQuizzesString = sessionStorage.getItem('saved_quizzes_frontend_only');
        const existingSavedQuizzes: StoredQuiz[] = existingSavedQuizzesString ? JSON.parse(existingSavedQuizzesString) : [];
        
        existingSavedQuizzes.push(finalQuiz);
        sessionStorage.setItem('saved_quizzes_frontend_only', JSON.stringify(existingSavedQuizzes));
        
        toast.success("Quiz saved to session storage (frontend only)!");
        console.log("Saved Quizzes in Session Storage:", existingSavedQuizzes);
        resetForm();
      } catch (error) {
        console.error("Failed to save quiz to session storage:", error);
        toast.error("Failed to save quiz. Please try again.");
      }
    }
  };

  const handlePreviewQuiz = () => {
    const quizToPreview = prepareQuizForOutput(true);
    if (quizToPreview) {
      try {
        sessionStorage.setItem('preview_quiz_data', JSON.stringify(quizToPreview));
        toast.info("Loading quiz preview...");
        navigate(`/quiz-preview/${quizToPreview.id}`);
      } catch (error) {
        console.error("Failed to save quiz for preview:", error);
        toast.error("Failed to generate preview. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setQuizData({
      quizTitle: '',
      totalQuestions: 0,
      optionsPerQuestion: 4, // Reset to default 4 options
      questions: [],
    });
    setQuizTimeLimit(30);
    setNegativeMarking(false);
    setCompetitionMode(false);
    setDefaultTimePerQuestion(null); // Reset default time
    setIsQuizStructureInitialized(false);
    setAiCoursePaperName('');
    setAiDifficulty('Easy');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListChecks className="h-6 w-6" /> Create New Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isQuizStructureInitialized ? (
          <>
            <div>
              <Label htmlFor="quizTitle">Quiz Title</Label>
              <Input
                id="quizTitle"
                placeholder="e.g., 'Midterm Exam - Chapter 1'"
                value={quizData.quizTitle}
                onChange={(e) => handleUpdateQuizDetails('quizTitle', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="totalQuestions">Total Questions in Quiz</Label>
              <Input
                id="totalQuestions"
                type="number"
                min="1"
                value={quizData.totalQuestions}
                onChange={(e) => handleUpdateQuizDetails('totalQuestions', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div className="mt-3">
              <Label htmlFor="optionsPerQuestion">Options per Question (MCQ)</Label>
              <Input
                id="optionsPerQuestion"
                type="number"
                min="2"
                max="6"
                value={quizData.optionsPerQuestion}
                onChange={(e) => handleUpdateQuizDetails('optionsPerQuestion', parseInt(e.target.value) || 4)}
                className="mt-1"
              />
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Additional Quiz Settings</h3>
              <div>
                <Label htmlFor="quizTimeLimit">Overall Quiz Time Limit (minutes)</Label>
                <Input
                  id="quizTimeLimit"
                  type="number"
                  min="1"
                  value={quizTimeLimit}
                  onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div className="mt-3">
                <Label htmlFor="defaultTimePerQuestion">Default Time per Question (minutes, optional)</Label>
                <Input
                  id="defaultTimePerQuestion"
                  type="number"
                  min="1"
                  placeholder="e.g., 1 (will be overridden by question-specific time)"
                  value={defaultTimePerQuestion === null ? '' : defaultTimePerQuestion}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDefaultTimePerQuestion(value === '' ? null : parseInt(value) || 1);
                  }}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This sets a default for new questions. Individual questions can override this.
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
                <Switch
                  id="negativeMarking"
                  checked={negativeMarking}
                  onCheckedChange={setNegativeMarking}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <Label htmlFor="competitionMode">Enable Competition Mode</Label>
                <Switch
                  id="competitionMode"
                  checked={competitionMode}
                  onCheckedChange={setCompetitionMode}
                />
              </div>
            </div>
            <Button onClick={handleInitializeQuizStructure} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              Initialize Quiz Structure
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2">Questions for "{quizData.quizTitle || 'New Quiz'}"</h3>
            <div className="flex justify-between items-center mb-4 p-3 border rounded-md bg-blue-50 text-blue-800 font-semibold">
              <span>Total Questions: {quizData.questions.length}</span>
              <span>Total Marks: {totalQuizMarks}</span>
            </div>

            {/* AI Question Generation Section */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" /> Generate Questions with AI (Mock)
              </h3>
              <div>
                <Label htmlFor="aiCoursePaperName">Course / Paper Name</Label>
                <Input
                  id="aiCoursePaperName"
                  placeholder="e.g., 'Introduction to Quantum Physics'"
                  value={aiCoursePaperName}
                  onChange={(e) => setAiCoursePaperName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="aiDifficulty">Difficulty</Label>
                <Select onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setAiDifficulty(value)} value={aiDifficulty}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateAIQuestions} className="w-full bg-purple-600 hover:bg-purple-700">
                Generate Questions with AI
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                AI will generate {quizData.totalQuestions} questions with {quizData.optionsPerQuestion} options each.
                You will still need to manually set marks and time for each question.
              </p>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto p-3 border rounded-md bg-gray-50 mt-4">
              {quizData.questions.length === 0 ? (
                <p className="text-gray-500 text-center">No questions added yet. Click "Add Another Question" or "Generate Questions with AI".</p>
              ) : (
                quizData.questions.map((q, index) => (
                  <Card key={index} className="p-4 border rounded-md bg-white shadow-sm relative">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => handleDeleteQuestionFromDraft(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`q-text-${index}`}>Question {index + 1} Text</Label>
                        <Textarea
                          id={`q-text-${index}`}
                          placeholder="Enter your question here..."
                          value={q.questionText}
                          onChange={(e) => handleUpdateDraftQuestion(index, 'questionText', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      {q.options.map((option, optIndex) => (
                        <div key={optIndex}>
                          <Label htmlFor={`q-option-${index}-${optIndex}`}>Option {optIndex + 1}</Label>
                          <Input
                            id={`q-option-${index}-${optIndex}`}
                            placeholder={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) => handleUpdateDraftOption(index, optIndex, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      ))}
                      <div>
                        <Label>Correct Answer</Label>
                        <RadioGroup
                          onValueChange={(value) => handleUpdateCorrectAnswerIndex(index, value)}
                          value={q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : ''}
                          className="flex flex-col space-y-1 mt-2"
                        >
                          {q.options.filter(opt => opt.trim()).map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`q-correct-${index}-${optIndex}`} />
                              <Label htmlFor={`q-correct-${index}-${optIndex}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor={`q-marks-${index}`}>Marks</Label>
                        <Input
                          id={`q-marks-${index}`}
                          type="number"
                          min="1"
                          value={q.marks}
                          onChange={(e) => handleUpdateDraftQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`q-time-${index}`}>Time for this Question (minutes)</Label>
                        <Input
                          id={`q-time-${index}`}
                          type="number"
                          min="1"
                          value={q.timeLimitMinutes}
                          onChange={(e) => handleUpdateDraftQuestion(index, 'timeLimitMinutes', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            <Button onClick={handleAddQuestionToDraft} variant="outline" className="w-full mt-4">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Another Question
            </Button>
          </>
        )}
      </CardContent>
      {isQuizStructureInitialized && (
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <Button onClick={handlePreviewQuiz} variant="outline" className="w-full sm:w-auto">
            <Eye className="h-4 w-4 mr-2" /> Preview Quiz
          </Button>
          <Button onClick={handleSaveQuizToSession} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> Save Quiz (Frontend Only)
          </Button>
          <Button onClick={handleCreateQuizAndLog} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Create Quiz (Log to Console)
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuizCreator;