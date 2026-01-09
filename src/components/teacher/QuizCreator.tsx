"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ListChecks, PlusCircle, Trash2, Eye, Save, Brain } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuiz, Quiz, Question } from '@/context/QuizContext';

interface LocalQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number | null;
  marks: number | '';
  timeLimitMinutes: number | '';
}

interface LocalQuizData {
  quizTitle: string;
  courseName: string;
  totalQuestions: number | '';
  optionsPerQuestion: number;
  questions: LocalQuestion[];
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

interface StoredQuiz {
  id: string;
  title: string;
  courseName: string;
  questionIds: string[];
  timeLimitMinutes: number;
  negativeMarking: boolean;
<<<<<<< HEAD
  negativeMarksValue: number; // Updated field name for consistency
  competitionMode: boolean;
  scheduledDate: string; // ADDED
  startTime: string;     // ADDED
  endTime: string;       // ADDED
  difficulty: 'Easy' | 'Medium' | 'Hard'; // ADDED DIFFICULTY
=======
  negativeMarks: string | number; // Added negativeMarks to stored quiz
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
  _questionsData: {
    id: string;
    quizId: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    marks: number;
    timeLimitMinutes: number;
  }[];
}

const QuizCreator = () => {
  const navigate = useNavigate();
  const { generateAIQuestions, addQuiz } = useQuiz(); // Removed addQuestion

  const [quizData, setQuizData] = useState<LocalQuizData>({
    quizTitle: '',
    courseName: '',
    totalQuestions: 0,
    optionsPerQuestion: 4,
    questions: [],
    scheduledDate: '',
    startTime: '',
    endTime: '',
  });

  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
<<<<<<< HEAD
  const [negativeMarksValue, setNegativeMarksValue] = useState<string | number>(''); // State for negative marks value
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);
=======
  const [negativeMarks, setNegativeMarks] = useState<string | number>(''); // State for negative marks value
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
  const [defaultTimePerQuestion, setDefaultTimePerQuestion] = useState<number | null>(null); // New state for optional default time
  const [enableTimePerQuestion, setEnableTimePerQuestion] = useState<boolean>(false); // Toggle for time per question
  const [totalCalculatedQuizTime, setTotalCalculatedQuizTime] = useState<number>(0); // New state for total quiz time
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium'); // NEW: Quiz Difficulty

  // AI Question Generation State (now local to QuizCreator)
  const [aiCoursePaperName, setAiCoursePaperName] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    const draftData = sessionStorage.getItem('draft_quiz_params');
    if (draftData) {
      try {
        const { questions, source } = JSON.parse(draftData);
        if (questions && Array.isArray(questions)) {
          const mappedQuestions: LocalQuestion[] = questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.options.indexOf(q.correctAnswer),
            marks: typeof q.marks === 'number' ? q.marks : 1,
            timeLimitMinutes: typeof q.timeLimitMinutes === 'number' ? q.timeLimitMinutes : 1
          }));

          setQuizData(prev => ({
            ...prev,
            questions: mappedQuestions,
            totalQuestions: mappedQuestions.length,
            // optional: infer options count
            optionsPerQuestion: mappedQuestions[0]?.options?.length || 4
          }));

          toast.success("Loaded questions from Question Bank!");
          // Clean up
          sessionStorage.removeItem('draft_quiz_params');
        }
      } catch (e) {
        console.error("Failed to load draft quiz", e);
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    setQuizData((prev) => {
      // If we have questions loaded from draft (length > 0) and totalMatches, don't wipe them out.
      // Only regenerate if the lengths mismatch significantly or if it's a fresh init.
      // Logic: If user manually changes 'totalQuestions', we adjust. 

      const currentCount = prev.questions.length;
      const targetCount = prev.totalQuestions === '' ? 0 : prev.totalQuestions;

      if (currentCount === targetCount && currentCount > 0) return prev; // Stability check

      const newQuestions = [...prev.questions];

      while (newQuestions.length < targetCount) {
        newQuestions.push({
          questionText: '',
          options: Array(prev.optionsPerQuestion).fill(''),
          correctAnswerIndex: null,
          marks: 1,
          timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1,
        });
      }

      // If reducing count
      const slicedQuestions = newQuestions.slice(0, targetCount);

      const updatedQuestions = slicedQuestions.map(q => {
        // Ensure options count matches config
        const newOptions = [...q.options];
        while (newOptions.length < prev.optionsPerQuestion) {
          newOptions.push('');
        }
        return {
          ...q,
          options: newOptions.slice(0, prev.optionsPerQuestion),
        };
      });

      return { ...prev, questions: updatedQuestions };
    });
  }, [quizData.totalQuestions, quizData.optionsPerQuestion, defaultTimePerQuestion]);

  useEffect(() => {
    const sumOfTimes = quizData.questions.reduce((sum, q) => {
      return sum + (typeof q.timeLimitMinutes === 'number' && q.timeLimitMinutes > 0 ? q.timeLimitMinutes : 0);
    }, 0);
    setTotalCalculatedQuizTime(sumOfTimes);
  }, [quizData.questions]);

  const totalQuizMarks = quizData.questions.reduce((sum, q) => sum + (typeof q.marks === 'number' ? q.marks : 0), 0);

  const validateQuizDraft = (): boolean => {
    if (!quizData.quizTitle.trim()) { toast.error("Please provide a quiz title."); return false; }
    if (!quizData.courseName.trim()) { toast.error("Please provide a course name."); return false; }
    if (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime) { toast.error("Please set the full schedule."); return false; }
    return true;
  };

  const handleUpdateQuizDetails = (field: keyof LocalQuizData, value: string | number) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateCorrectAnswerIndex = (questionIndex: number, selectedOptionValue: string) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const question = newQuestions[questionIndex];
      const newIndex = question.options.findIndex(opt => opt === selectedOptionValue);

      newQuestions[questionIndex] = {
        ...question,
        correctAnswerIndex: newIndex !== -1 ? newIndex : null
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleUpdateDraftQuestion = (questionIndex: number, field: any, value: any) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleGenerateAIQuestions = () => {
    if (!aiCoursePaperName.trim()) { toast.error("Enter a topic."); return; }
    const generated = generateAIQuestions(aiCoursePaperName, aiDifficulty, quizData.totalQuestions as number || 5, quizData.optionsPerQuestion);
    setQuizData(prev => ({
      ...prev,
      questions: generated.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.options.indexOf(q.correctAnswer),
        marks: 1,
        timeLimitMinutes: 1
      })),
      totalQuestions: generated.length
    }));
  };

  const prepareQuizForOutput = (): StoredQuiz | null => {
    if (!validateQuizDraft()) return null;
    const quizId = `qz-${Date.now()}`;
    return {
      id: quizId,
      title: quizData.quizTitle,
      courseName: quizData.courseName,
      questionIds: [],
      timeLimitMinutes: totalCalculatedQuizTime,
      negativeMarking: negativeMarking,
<<<<<<< HEAD
      negativeMarksValue: negativeMarking ? Number(negativeMarksValue) : 0, // Use negativeMarksValue
      competitionMode: competitionMode,
      scheduledDate: quizData.scheduledDate,
      startTime: quizData.startTime,
      endTime: quizData.endTime,
      difficulty: quizDifficulty, // Include difficulty
=======
      negativeMarks: negativeMarking ? negativeMarks : 0, // Store negative marks if enabled
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
      _questionsData: questionsForOutput, // Include full question data for easy retrieval
    };
  };

  const handleCreateQuiz = () => {
    const finalQuizData = prepareQuizForOutput();
    if (finalQuizData) {

      // 1. Prepare data for QuizContext's addQuiz (which handles Supabase insertion)
      const quizToAdd: Omit<Quiz, 'id' | 'status'> = {
        title: finalQuizData.title,
        courseName: finalQuizData.courseName,
        timeLimitMinutes: finalQuizData.timeLimitMinutes,
        negativeMarking: finalQuizData.negativeMarking,
        competitionMode: finalQuizData.competitionMode,
        scheduledDate: finalQuizData.scheduledDate,
        startTime: finalQuizData.startTime,
        endTime: finalQuizData.endTime,
        negativeMarksValue: finalQuizData.negativeMarksValue,
        difficulty: finalQuizData.difficulty, // Pass difficulty
      };

      // 2. Prepare questions data (Omit<Question, 'id'>)
      const questionsToAdd: Omit<Question, 'id'>[] = finalQuizData._questionsData.map(q => ({
        quizId: q.quizId, // Placeholder, will be overwritten by mutation
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        timeLimitMinutes: q.timeLimitMinutes,
      }));

      // 3. Add the quiz to the global pool (triggers Supabase mutation)
      addQuiz(quizToAdd, questionsToAdd);

      // Reset form regardless of immediate success (mutation handles success/error toast)
      resetForm();
    }
  };

  const handlePreviewQuiz = () => {
    const quizToPreview = prepareQuizForOutput(true);
    if (quizToPreview) {
      try {
        // We use the StoredQuiz structure for preview, which includes question data
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
      courseName: '',
      totalQuestions: 0,
      optionsPerQuestion: 4,
      questions: [],
      scheduledDate: '',
      startTime: '',
      endTime: '',
    });
    setNegativeMarking(false);
<<<<<<< HEAD
    setNegativeMarksValue('');
    setCompetitionMode(false);
=======
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49
    setDefaultTimePerQuestion(null);
    setTotalCalculatedQuizTime(0);
    setAiCoursePaperName('');
    setAiDifficulty('Easy');
    setQuizDifficulty('Medium'); // Reset difficulty
    setStep(1); // Reset step to 1
  };

  const handleProceed = () => {
    if (!quizData.quizTitle.trim()) {
      toast.error("Please enter Course / Paper Name");
      return;
    }
    if (!quizData.totalQuestions || quizData.totalQuestions <= 0) {
      toast.error("Please enter number of questions");
      return;
    }
    if (quizData.optionsPerQuestion === 0) {
      toast.error("Please select MCQ options (1 to 6)");
      return;
    }
    if (!quizData.scheduledDate || !quizData.startTime || !quizData.endTime) {
      toast.error("Please set the scheduled date, start time, and end time.");
      return;
    }
    setStep(2);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListChecks className="h-6 w-6" /> {step === 1 ? 'Configure Quiz' : 'Manage Questions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="quizTitle">Course / Paper Name</Label>
          <Input
            id="quizTitle"
            placeholder="e.g., 'Introduction to Quantum Physics'"
            value={quizData.quizTitle}
            disabled={step === 2} // Lock
            onChange={(e) => {
              handleUpdateQuizDetails('quizTitle', e.target.value);
              setAiCoursePaperName(e.target.value);
            }}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="courseName">Course Name (for Student Dashboard)</Label>
          <Input
            id="courseName"
            placeholder="e.g., 'CS 101: Introduction to Programming'"
            value={quizData.courseName}
            disabled={step === 2} // Lock
            onChange={(e) => handleUpdateQuizDetails('courseName', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Scheduling Inputs */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Quiz Scheduling</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={quizData.scheduledDate}
                disabled={step === 2}
                onChange={(e) => handleUpdateQuizDetails('scheduledDate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={quizData.startTime}
                disabled={step === 2}
                onChange={(e) => handleUpdateQuizDetails('startTime', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={quizData.endTime}
                disabled={step === 2}
                onChange={(e) => handleUpdateQuizDetails('endTime', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Question Count and Options */}
        <div className="grid gap-4 md:grid-cols-2 border-t pt-4 mt-4">
          <div>
            <Label htmlFor="totalQuestions">Total Questions in Quiz</Label>
            <Input
              id="totalQuestions"
              type="number"
              min="0"
              value={quizData.totalQuestions}
              disabled={step === 2} // Lock
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateQuizDetails('totalQuestions', val === '' ? '' : parseInt(val));
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="optionsPerQuestion">Options per Question (MCQ)</Label>
            <Input
              id="optionsPerQuestion"
              type="number"
              min="0"
              max="6"
              value={quizData.optionsPerQuestion}
              disabled={step === 2} // Lock
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (val >= 0 && val <= 6) {
                  handleUpdateQuizDetails('optionsPerQuestion', val);
                }
              }}
              className="mt-1"
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Additional Quiz Settings</h3>

          {/* NEW: Difficulty Selection */}
          <div className="mb-4">
            <Label htmlFor="quizDifficulty">Quiz Difficulty Level</Label>
            <Select onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setQuizDifficulty(value)} value={quizDifficulty} disabled={step === 2}>
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

          <div className="flex items-center justify-between mt-3">
            <Label htmlFor="enableTimePerQuestion">Enable Time per Question</Label>
            <Switch
              id="enableTimePerQuestion"
              checked={enableTimePerQuestion}
              onCheckedChange={setEnableTimePerQuestion}
              disabled={step === 2} // Lock
            />
          </div>
          {enableTimePerQuestion && (
            <div className="mt-3">
              <Label htmlFor="defaultTimePerQuestion">Default Time per Question (minutes, optional)</Label>
              <Input
                id="defaultTimePerQuestion"
                type="number"
                min="1"
                placeholder="e.g., 1 (will be overridden by question-specific time)"
                value={defaultTimePerQuestion === null ? '' : defaultTimePerQuestion}
                disabled={step === 2} // Lock
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
          )}
          <div className="flex items-center justify-between mt-3">
            <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
            <Switch
              id="negativeMarking"
              checked={negativeMarking}
              onCheckedChange={setNegativeMarking}
              disabled={step === 2} // Lock
            />
          </div>
          {negativeMarking && (
            <div className="mt-2 pl-2 border-l-2 border-red-200">
              <Label htmlFor="negativeMarksValue">Negative marks for wrong answer</Label>
              <Input
                id="negativeMarksValue"
                type="number"
                placeholder="e.g. 0.25"
                value={negativeMarksValue}
                disabled={step === 2}
                onChange={(e) => setNegativeMarksValue(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Step 2 Content */}
        {
          step === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-2">Questions for "{quizData.quizTitle || 'New Quiz'}"</h3>
              <div className="flex justify-between items-center mb-4 p-3 border rounded-md bg-blue-50 text-blue-800 font-semibold">
                <span>Total Questions: {quizData.questions.length}</span>
                <span>Total Marks: {totalQuizMarks}</span>
                <span>Total Quiz Time: {totalCalculatedQuizTime} minutes</span>
              </div>

              {/* AI Question Generation Section */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Generate Questions with AI (Mock)
                </h3>
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
                  <p className="text-gray-500 text-center">No questions added yet. Click "Generate Questions with AI" to begin.</p>
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
                          <Label>Question {index + 1}</Label>
                          <div className="p-3 bg-gray-50 border rounded-md min-h-[60px] text-sm mt-1">
                            {q.questionText || <span className="text-gray-400 italic">Example Question Text from AI</span>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2 p-2 border rounded-md bg-white text-sm">
                              <span className="font-semibold text-gray-500 w-6">{String.fromCharCode(65 + optIndex)}.</span>
                              <span>{option || <span className="text-gray-400 italic">Option Text</span>}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <Label>Select the correct option</Label>
                          <RadioGroup
                            onValueChange={(value) => handleUpdateCorrectAnswerIndex(index, value)}
                            value={q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : ''}
                            className="flex flex-col space-y-2 mt-2"
                          >
                            {q.options.map((option, optIndex) => (
                              option && (
                                <div key={optIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`q-correct-${index}-${optIndex}`} />
                                  <Label htmlFor={`q-correct-${index}-${optIndex}`} className="font-normal cursor-pointer">
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </Label>
                                </div>
                              )
                            ))}
                          </RadioGroup>
                        </div>
                        <div>
                          <Label htmlFor={`q-marks-${index}`}>Marks (1-10)</Label>
                          <Input
                            id={`q-marks-${index}`}
                            type="number"
                            min="0"
                            max="10"
                            value={q.marks}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value);
                              if (val === '' || (val >= 0 && val <= 10)) {
                                handleUpdateDraftQuestion(index, 'marks', val === '' ? '' : val);
                              }
                            }}
                            className="mt-1"
                          />
                        </div>
<<<<<<< HEAD
                      )}
                    </div >
                  </Card >
                ))
              )}
            </div >
          </>
        )}
      </CardContent >
=======
                        {enableTimePerQuestion && (
                          <div>
                            <Label htmlFor={`q-time-${index}`}>Time for this Question (minutes)</Label>
                            <Input
                              id={`q-time-${index}`}
                              type="number"
                              min="1"
                              value={q.timeLimitMinutes}
                              onChange={(e) => handleUpdateDraftQuestion(index, 'timeLimitMinutes', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
              {/* Manual 'Add Question' removed per requirement */}
            </>
          )
        }
      </CardContent >
>>>>>>> 17bbe4ee1cb839a767eff48d901361d1bfb78b49

  <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
    {step === 1 ? (
      <Button onClick={handleProceed} className="w-full bg-blue-600 hover:bg-blue-700">
        Proceed
      </Button>
    ) : (
      <>
        <Button variant="outline" onClick={() => setStep(1)} className="w-[100px]">
          Back
        </Button>
        <Button onClick={handlePreviewQuiz} variant="outline" className="w-full sm:w-auto">
          <Eye className="h-4 w-4 mr-2" /> Preview Quiz
        </Button>
        <Button onClick={handleCreateQuiz} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" /> Create & Schedule Quiz
        </Button>
      </>
    )}
  </CardFooter>
    </Card >
  );
};

export default QuizCreator;