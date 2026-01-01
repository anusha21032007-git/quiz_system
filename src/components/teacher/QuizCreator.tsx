"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ListChecks, PlusCircle, Trash2, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Define a type for questions in local draft state
interface LocalQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number | null; // Index of the correct option, or null if none selected
  marks: number;
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
  _questionsData: { // Store actual question data for easy retrieval in preview
    id: string;
    quizId: string;
    questionText: string;
    options: string[];
    correctAnswer: string; // Converted from index
    marks: number;
  }[];
}

const QuizCreator = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  // Consolidated quiz data state
  const [quizData, setQuizData] = useState<LocalQuizData>({
    quizTitle: '',
    totalQuestions: 0,
    optionsPerQuestion: 0,
    questions: [],
  });

  // Other quiz details not explicitly part of the 'Quiz' structure provided by user, but still needed
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(30);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);

  const [isQuizStructureInitialized, setIsQuizStructureInitialized] = useState<boolean>(false);

  // Calculate total marks dynamically
  const totalQuizMarks = quizData.questions.reduce((sum, q) => sum + q.marks, 0);

  // Helper validation function
  const validateQuizDraft = (): boolean => {
    if (!quizData.quizTitle.trim()) {
      toast.error("Please provide a quiz title.");
      return false;
    }
    if (quizTimeLimit <= 0) {
      toast.error("Please set a valid time limit (at least 1 minute).");
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
    field: 'questionText' | 'marks',
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
      optionsPerQuestion: 0,
      questions: [],
    });
    setQuizTimeLimit(30);
    setNegativeMarking(false);
    setCompetitionMode(false);
    setIsQuizStructureInitialized(false);
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
              <Label htmlFor="quizTimeLimit">Time Limit (minutes)</Label>
              <Input
                id="quizTimeLimit"
                type="number"
                min="1"
                value={quizTimeLimit}
                onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
              <Switch
                id="negativeMarking"
                checked={negativeMarking}
                onCheckedChange={setNegativeMarking}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="competitionMode">Enable Competition Mode</Label>
              <Switch
                id="competitionMode"
                checked={competitionMode}
                onCheckedChange={setCompetitionMode}
              />
            </div>
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Quiz Structure</h3>
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
              <Button onClick={handleInitializeQuizStructure} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Initialize Quiz Structure
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2">Questions for "{quizData.quizTitle || 'New Quiz'}"</h3>
            <div className="flex justify-between items-center mb-4 p-3 border rounded-md bg-blue-50 text-blue-800 font-semibold">
              <span>Total Questions: {quizData.questions.length}</span>
              <span>Total Marks: {totalQuizMarks}</span>
            </div>
            <div className="space-y-6 max-h-96 overflow-y-auto p-3 border rounded-md bg-gray-50">
              {quizData.questions.length === 0 ? (
                <p className="text-gray-500 text-center">No questions added yet. Click "Add Question" below.</p>
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