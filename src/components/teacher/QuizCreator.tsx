"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListChecks, PlusCircle, Trash2, Eye, Save, Brain } from 'lucide-react';
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
  negativeMarksValue: number;
  competitionMode: boolean;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
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
  const { generateAIQuestions, addQuiz } = useQuiz();

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
  const [negativeMarksValue, setNegativeMarksValue] = useState<string | number>('');
  const [competitionMode, setCompetitionMode] = useState<boolean>(false);
  const [defaultTimePerQuestion, setDefaultTimePerQuestion] = useState<number | null>(null);
  const [enableTimePerQuestion, setEnableTimePerQuestion] = useState<boolean>(false);
  const [totalCalculatedQuizTime, setTotalCalculatedQuizTime] = useState<number>(0);
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const [aiCoursePaperName, setAiCoursePaperName] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    setQuizData((prev) => {
      const newQuestions = [...prev.questions];
      const targetCount = prev.totalQuestions === '' ? 0 : prev.totalQuestions;

      while (newQuestions.length < targetCount) {
        newQuestions.push({
          questionText: '',
          options: Array(prev.optionsPerQuestion).fill(''),
          correctAnswerIndex: null,
          marks: 1,
          timeLimitMinutes: defaultTimePerQuestion !== null ? defaultTimePerQuestion : 1,
        });
      }
      const slicedQuestions = newQuestions.slice(0, targetCount);

      const updatedQuestions = slicedQuestions.map(q => {
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
      newQuestions[questionIndex].correctAnswerIndex = newQuestions[questionIndex].options.indexOf(selectedOptionValue);
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
      negativeMarking,
      negativeMarksValue: Number(negativeMarksValue) || 0,
      competitionMode,
      scheduledDate: quizData.scheduledDate,
      startTime: quizData.startTime,
      endTime: quizData.endTime,
      difficulty: quizDifficulty,
      _questionsData: quizData.questions.map((q, i) => ({
        id: `q-${i}`,
        quizId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : '',
        marks: Number(q.marks) || 1,
        timeLimitMinutes: Number(q.timeLimitMinutes) || 1
      }))
    };
  };

  const handleCreateQuiz = () => {
    const final = prepareQuizForOutput();
    if (final) {
      addQuiz({
        title: final.title,
        courseName: final.courseName,
        timeLimitMinutes: final.timeLimitMinutes,
        negativeMarking: final.negativeMarking,
        competitionMode: final.competitionMode,
        scheduledDate: final.scheduledDate,
        startTime: final.startTime,
        endTime: final.endTime,
        negativeMarksValue: final.negativeMarksValue,
        difficulty: final.difficulty
      }, final._questionsData);
      setStep(1);
    }
  };

  const handlePreviewQuiz = () => {
    const final = prepareQuizForOutput();
    if (final) {
      sessionStorage.setItem('preview_quiz_data', JSON.stringify(final));
      navigate(`/quiz-preview/${final.id}`);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ListChecks className="h-6 w-6" /> {step === 1 ? 'Configure Quiz' : 'Manage Questions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 ? (
          <>
            <div><Label>Course / Paper Name</Label><Input value={quizData.quizTitle} onChange={e => handleUpdateQuizDetails('quizTitle', e.target.value)} /></div>
            <div><Label>Course (Dashboard Name)</Label><Input value={quizData.courseName} onChange={e => handleUpdateQuizDetails('courseName', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Date</Label><Input type="date" value={quizData.scheduledDate} onChange={e => handleUpdateQuizDetails('scheduledDate', e.target.value)} /></div>
              <div><Label>Start</Label><Input type="time" value={quizData.startTime} onChange={e => handleUpdateQuizDetails('startTime', e.target.value)} /></div>
              <div><Label>End</Label><Input type="time" value={quizData.endTime} onChange={e => handleUpdateQuizDetails('endTime', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Questions</Label><Input type="number" value={quizData.totalQuestions} onChange={e => handleUpdateQuizDetails('totalQuestions', e.target.value)} /></div>
              <div><Label>Options</Label><Input type="number" value={quizData.optionsPerQuestion} onChange={e => handleUpdateQuizDetails('optionsPerQuestion', e.target.value)} /></div>
            </div>
            <div className="flex justify-between items-center"><Label>Negative Marking</Label><Switch checked={negativeMarking} onCheckedChange={setNegativeMarking} /></div>
            <Button onClick={() => setStep(2)} className="w-full">Proceed to Questions</Button>
          </>
        ) : (
          <>
             <div className="space-y-4">
                <Button onClick={handleGenerateAIQuestions} variant="outline" className="w-full">Generate with AI</Button>
                {quizData.questions.map((q, i) => (
                  <Card key={i} className="p-4 space-y-3">
                    <Label>Question {i+1}</Label>
                    <Input value={q.questionText} onChange={e => handleUpdateDraftQuestion(i, 'questionText', e.target.value)} />
                    <RadioGroup value={q.correctAnswerIndex !== null ? q.options[q.correctAnswerIndex] : ''} onValueChange={v => handleUpdateCorrectAnswerIndex(i, v)}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                           <RadioGroupItem value={opt} id={`q-${i}-${oi}`} />
                           <Input value={opt} onChange={e => {
                             const opts = [...q.options]; opts[oi] = e.target.value;
                             handleUpdateDraftQuestion(i, 'options', opts);
                           }} />
                        </div>
                      ))}
                    </RadioGroup>
                  </Card>
                ))}
             </div>
             <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline">Back</Button>
                <Button onClick={handlePreviewQuiz} variant="secondary">Preview</Button>
                <Button onClick={handleCreateQuiz} className="bg-green-600">Create & Schedule</Button>
             </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizCreator;