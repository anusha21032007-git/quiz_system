"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuiz, Question, Quiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { Switch } from '@/components/ui/switch'; // Import Switch component
import { toast } from 'sonner';
import { PlusCircle, Brain, ListChecks, Trophy, Clock, MinusCircle } from 'lucide-react';

const TeacherDashboard = () => {
  const { questions, quizzes, addQuestion, addQuiz, generateAIQuestions } = useQuiz();

  // Question Creation State
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionMarks, setQuestionMarks] = useState<number>(1); // New state for marks

  // AI Question Generation State
  const [aiCoursePaperName, setAiCoursePaperName] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy'); // New state for difficulty
  const [aiNumQuestions, setAiNumQuestions] = useState<number>(3); // New state for number of questions
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);

  // Quiz Creation State
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(30); // New state for time limit
  const [negativeMarking, setNegativeMarking] = useState<boolean>(false); // New state for negative marking

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    if (!questionText || options.some(opt => !opt) || !correctAnswer || questionMarks <= 0) {
      toast.error("Please fill all question fields, select a correct answer, and set valid marks.");
      return;
    }
    if (!options.includes(correctAnswer)) {
      toast.error("Correct answer must be one of the provided options.");
      return;
    }

    addQuestion({
      quizId: 'unassigned', // Questions are initially unassigned to a specific quiz
      questionText,
      options,
      correctAnswer,
      marks: questionMarks, // Include marks
    });

    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setQuestionMarks(1);
  };

  const handleAddQuiz = () => {
    if (!quizTitle || selectedQuestionIds.length === 0 || quizTimeLimit <= 0) {
      toast.error("Please provide a quiz title, select at least one question, and set a valid time limit.");
      return;
    }

    addQuiz({
      title: quizTitle,
      timeLimitMinutes: quizTimeLimit, // Include time limit
      negativeMarking: negativeMarking, // Include negative marking
    }, selectedQuestionIds);
    setQuizTitle('');
    setSelectedQuestionIds([]);
    setQuizTimeLimit(30);
    setNegativeMarking(false);
  };

  const handleToggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleGenerateAIQuestions = () => {
    if (!aiCoursePaperName) {
      toast.error("Please enter a course paper name for AI generation.");
      return;
    }
    if (aiNumQuestions <= 0) {
      toast.error("Please enter a valid number of questions to generate.");
      return;
    }
    const generated = generateAIQuestions(aiCoursePaperName, aiDifficulty, aiNumQuestions);
    setAiGeneratedQuestions(generated);
    setAiCoursePaperName('');
    setAiNumQuestions(3);
  };

  const handleAddAIGeneratedQuestionsToPool = () => {
    if (aiGeneratedQuestions.length === 0) {
      toast.error("No AI generated questions to add.");
      return;
    }
    aiGeneratedQuestions.forEach(q => addQuestion({
      quizId: q.quizId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
    }));
    setAiGeneratedQuestions([]);
    toast.success("AI generated questions added to the question pool!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Teacher Dashboard</h1>
        <nav className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/leaderboard" className="text-blue-600 hover:underline">Leaderboard</Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Question Creation */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PlusCircle className="h-6 w-6" /> Create New Question
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="questionText">Question Text</Label>
              <Textarea
                id="questionText"
                placeholder="Enter your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="mt-1"
              />
            </div>
            {options.map((option, index) => (
              <div key={index}>
                <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                <Input
                  id={`option-${index}`}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
            <div>
              <Label>Correct Answer</Label>
              <RadioGroup onValueChange={setCorrectAnswer} value={correctAnswer} className="flex flex-col space-y-1 mt-2">
                {options.filter(opt => opt).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`correct-option-${index}`} />
                    <Label htmlFor={`correct-option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="questionMarks">Marks for this Question</Label>
              <Input
                id="questionMarks"
                type="number"
                min="1"
                value={questionMarks}
                onChange={(e) => setQuestionMarks(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddQuestion} className="w-full bg-green-600 hover:bg-green-700">Add Question to Pool</Button>
          </CardFooter>
        </Card>

        {/* AI Question Generation */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Brain className="h-6 w-6" /> AI Question Generation (Mock)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="aiNumQuestions">Number of Questions</Label>
              <Input
                id="aiNumQuestions"
                type="number"
                min="1"
                value={aiNumQuestions}
                onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 1)}
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
            <Button onClick={handleGenerateAIQuestions} className="w-full bg-purple-600 hover:bg-purple-700">Generate Questions</Button>
            {aiGeneratedQuestions.length > 0 && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50">
                <h3 className="font-semibold mb-2">Generated Questions:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aiGeneratedQuestions.map((q, index) => (
                    <div key={index} className="p-2 border rounded-md bg-white text-sm">
                      <p className="font-medium">{index + 1}. {q.questionText} ({q.marks} marks)</p>
                      <p className="text-gray-600">Correct: {q.correctAnswer}</p>
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddAIGeneratedQuestionsToPool} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Add to Question Pool</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Creation */}
        <Card className="shadow-lg col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ListChecks className="h-6 w-6" /> Create New Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div>
              <Label>Select Questions for Quiz ({selectedQuestionIds.length} selected)</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border p-3 rounded-md bg-gray-50">
                {questions.length === 0 ? (
                  <p className="text-gray-500">No questions available. Create some first!</p>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`question-${q.id}`}
                        checked={selectedQuestionIds.includes(q.id)}
                        onCheckedChange={() => handleToggleQuestionSelection(q.id)}
                      />
                      <Label htmlFor={`question-${q.id}`} className="text-sm font-normal">
                        {q.questionText} ({q.marks} marks)
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddQuiz} className="w-full bg-blue-600 hover:bg-blue-700">Create Quiz</Button>
          </CardFooter>
        </Card>

        {/* Existing Quizzes */}
        <Card className="shadow-lg col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6" /> Available Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes created yet.</p>
            ) : (
              <ul className="space-y-2">
                {quizzes.map((quiz) => (
                  <li key={quiz.id} className="flex justify-between items-center p-3 border rounded-md bg-white shadow-sm">
                    <div>
                      <span className="font-medium">{quiz.title} ({quiz.questionIds.length} questions)</span>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-4 w-4 inline-block" /> {quiz.timeLimitMinutes} min
                        {quiz.negativeMarking && <MinusCircle className="h-4 w-4 inline-block text-red-500 ml-2" />}
                        {quiz.negativeMarking && <span className="text-red-500 text-xs">Negative Marking</span>}
                      </p>
                    </div>
                    <Link to={`/quiz/${quiz.id}`} className="text-sm text-blue-600 hover:underline">
                      Preview Quiz
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;