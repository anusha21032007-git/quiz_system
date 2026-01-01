"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ListChecks, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Question } from '@/context/QuizContext';
import { useQuiz } from '@/context/QuizContext'; // Import useQuiz

// Define a type for questions in draft state (before being added to global pool)
interface DraftQuestion extends Omit<Question, 'id' | 'quizId'> {
  tempId: string; // Temporary ID for local management
}

interface QuizCreatorProps {
  // No longer needs questions or selectedQuestionIds as props
  // These will be managed internally or fetched from context
}

const QuizCreator = ({}: QuizCreatorProps) => {
  const { addQuestion, addQuiz } = useQuiz();

  // Quiz Structure Initialization State
  const [totalQuestionsToGenerate, setTotalQuestionsToGenerate] = useState<number>(5);
  const [mcqOptionsCount, setMcqOptionsCount] = useState<number>(4);
  const [isQuizStructureInitialized, setIsQuizStructureInitialized] = useState<boolean>(false);

  // Quiz Details State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(30);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false);
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);

  // Draft Questions State (questions being created for this quiz)
  const [quizQuestionsDraft, setQuizQuestionsDraft] = useState<DraftQuestion[]>([]);

  const handleInitializeQuizStructure = () => {
    if (totalQuestionsToGenerate <= 0) {
      toast.error("Total questions must be at least 1.");
      return;
    }
    if (mcqOptionsCount < 2 || mcqOptionsCount > 6) { // Reasonable range for MCQ options
      toast.error("MCQ options per question must be between 2 and 6.");
      return;
    }

    const newDraftQuestions: DraftQuestion[] = Array.from({ length: totalQuestionsToGenerate }, (_, i) => ({
      tempId: `temp-q-${Date.now()}-${i}`,
      questionText: '',
      options: Array(mcqOptionsCount).fill(''),
      correctAnswer: '',
      marks: 1,
    }));
    setQuizQuestionsDraft(newDraftQuestions);
    setIsQuizStructureInitialized(true);
    toast.success(`Quiz structure initialized with ${totalQuestionsToGenerate} questions.`);
  };

  const handleAddQuestionToDraft = () => {
    setQuizQuestionsDraft((prev) => [
      ...prev,
      {
        tempId: `temp-q-${Date.now()}-${prev.length}`,
        questionText: '',
        options: Array(mcqOptionsCount).fill(''),
        correctAnswer: '',
        marks: 1,
      },
    ]);
    toast.info("New question added to draft.");
  };

  const handleDeleteQuestionFromDraft = (tempId: string) => {
    setQuizQuestionsDraft((prev) => prev.filter((q) => q.tempId !== tempId));
    toast.info("Question removed from draft.");
  };

  const handleUpdateDraftQuestion = (
    tempId: string,
    field: 'questionText' | 'correctAnswer' | 'marks',
    value: string | number
  ) => {
    setQuizQuestionsDraft((prev) =>
      prev.map((q) =>
        q.tempId === tempId
          ? { ...q, [field]: value }
          : q
      )
    );
  };

  const handleUpdateDraftOption = (
    tempId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuizQuestionsDraft((prev) =>
      prev.map((q) =>
        q.tempId === tempId
          ? {
              ...q,
              options: q.options.map((opt, idx) => (idx === optionIndex ? value : opt)),
            }
          : q
      )
    );
  };

  const handleAddQuiz = () => {
    if (!quizTitle.trim()) {
      toast.error("Please provide a quiz title.");
      return;
    }
    if (quizTimeLimit <= 0) {
      toast.error("Please set a valid time limit (at least 1 minute).");
      return;
    }
    if (quizQuestionsDraft.length === 0) {
      toast.error("Please add at least one question to the quiz.");
      return;
    }

    const newQuestionIds: string[] = [];
    for (const draftQ of quizQuestionsDraft) {
      // Validate each draft question before adding to the global pool
      if (!draftQ.questionText.trim() || draftQ.options.some(opt => !opt.trim()) || !draftQ.correctAnswer.trim() || draftQ.marks <= 0) {
        toast.error(`Question "${draftQ.questionText.substring(0, 30) || 'Unnamed question'}" is incomplete or invalid.`);
        return; // Stop quiz creation if any question is invalid
      }
      if (!draftQ.options.includes(draftQ.correctAnswer)) {
        toast.error(`Correct answer for question "${draftQ.questionText.substring(0, 30) || 'Unnamed question'}" must be one of the provided options.`);
        return;
      }

      // Add question to global pool and get its new ID
      const newQuestionId = addQuestion({
        quizId: 'placeholder', // Temporary, will be updated by addQuiz
        questionText: draftQ.questionText,
        options: draftQ.options,
        correctAnswer: draftQ.correctAnswer,
        marks: draftQ.marks,
      });
      newQuestionIds.push(newQuestionId);
    }

    // Create the quiz with the IDs of the newly added questions
    addQuiz({
      title: quizTitle,
      timeLimitMinutes: quizTimeLimit,
      negativeMarking: negativeMarking,
      competitionMode: competitionMode,
    }, newQuestionIds);

    // Reset all local states after successful quiz creation
    setQuizTitle('');
    setQuizTimeLimit(30);
    setNegativeMarking(false);
    setCompetitionMode(false);
    setTotalQuestionsToGenerate(5);
    setMcqOptionsCount(4);
    setIsQuizStructureInitialized(false);
    setQuizQuestionsDraft([]);
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
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
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
                <Label htmlFor="totalQuestionsToGenerate">Total Questions in Quiz</Label>
                <Input
                  id="totalQuestionsToGenerate"
                  type="number"
                  min="1"
                  value={totalQuestionsToGenerate}
                  onChange={(e) => setTotalQuestionsToGenerate(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div className="mt-3">
                <Label htmlFor="mcqOptionsCount">Options per Question (MCQ)</Label>
                <Input
                  id="mcqOptionsCount"
                  type="number"
                  min="2"
                  max="6"
                  value={mcqOptionsCount}
                  onChange={(e) => setMcqOptionsCount(parseInt(e.target.value) || 4)}
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
            <h3 className="text-lg font-semibold mb-2">Questions for "{quizTitle || 'New Quiz'}"</h3>
            <div className="space-y-6 max-h-96 overflow-y-auto p-3 border rounded-md bg-gray-50">
              {quizQuestionsDraft.length === 0 ? (
                <p className="text-gray-500 text-center">No questions added yet. Click "Add Question" below.</p>
              ) : (
                quizQuestionsDraft.map((q, index) => (
                  <Card key={q.tempId} className="p-4 border rounded-md bg-white shadow-sm relative">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => handleDeleteQuestionFromDraft(q.tempId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`q-text-${q.tempId}`}>Question {index + 1} Text</Label>
                        <Textarea
                          id={`q-text-${q.tempId}`}
                          placeholder="Enter your question here..."
                          value={q.questionText}
                          onChange={(e) => handleUpdateDraftQuestion(q.tempId, 'questionText', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      {q.options.map((option, optIndex) => (
                        <div key={optIndex}>
                          <Label htmlFor={`q-option-${q.tempId}-${optIndex}`}>Option {optIndex + 1}</Label>
                          <Input
                            id={`q-option-${q.tempId}-${optIndex}`}
                            placeholder={`Option ${optIndex + 1}`}
                            value={option}
                            onChange={(e) => handleUpdateDraftOption(q.tempId, optIndex, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      ))}
                      <div>
                        <Label>Correct Answer</Label>
                        <RadioGroup
                          onValueChange={(value) => handleUpdateDraftQuestion(q.tempId, 'correctAnswer', value)}
                          value={q.correctAnswer}
                          className="flex flex-col space-y-1 mt-2"
                        >
                          {q.options.filter(opt => opt.trim()).map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`q-correct-${q.tempId}-${optIndex}`} />
                              <Label htmlFor={`q-correct-${q.tempId}-${optIndex}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor={`q-marks-${q.tempId}`}>Marks</Label>
                        <Input
                          id={`q-marks-${q.tempId}`}
                          type="number"
                          min="1"
                          value={q.marks}
                          onChange={(e) => handleUpdateDraftQuestion(q.tempId, 'marks', parseInt(e.target.value) || 1)}
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
        <CardFooter>
          <Button onClick={handleAddQuiz} className="w-full bg-blue-600 hover:bg-blue-700">Create Quiz</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuizCreator;