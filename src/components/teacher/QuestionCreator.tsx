"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuiz } from '@/context/QuizContext';

// Define a type for questions in local draft state
interface DraftQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

const QuestionCreator = () => {
  const { addQuestion } = useQuiz();

  const [numQuestionsToCreate, setNumQuestionsToCreate] = useState<number>(1);
  const [optionsPerQuestion, setOptionsPerQuestion] = useState<number>(4); // New state for options per question
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>(() => [
    { questionText: '', options: Array(4).fill(''), correctAnswer: '', marks: 1 },
  ]);

  // Adjust draftQuestions array length and options count when numQuestionsToCreate or optionsPerQuestion changes
  useEffect(() => {
    setDraftQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];

      // Adjust number of questions
      while (newQuestions.length < numQuestionsToCreate) {
        newQuestions.push({
          questionText: '',
          options: Array(optionsPerQuestion).fill(''), // Use optionsPerQuestion for new questions
          correctAnswer: '',
          marks: 1,
        });
      }
      const slicedQuestions = newQuestions.slice(0, numQuestionsToCreate);

      // Adjust options count for all questions
      return slicedQuestions.map(q => {
        const newOptions = [...q.options];
        while (newOptions.length < optionsPerQuestion) {
          newOptions.push('');
        }
        const adjustedOptions = newOptions.slice(0, optionsPerQuestion);

        // If the correct answer is no longer in the options, reset it
        let newCorrectAnswer = q.correctAnswer;
        if (newCorrectAnswer && !adjustedOptions.includes(newCorrectAnswer)) {
          newCorrectAnswer = '';
        }

        return {
          ...q,
          options: adjustedOptions,
          correctAnswer: newCorrectAnswer,
        };
      });
    });
  }, [numQuestionsToCreate, optionsPerQuestion]); // Depend on both counts

  const handleUpdateQuestion = (index: number, field: keyof DraftQuestion, value: any) => {
    setDraftQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setDraftQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
      return newQuestions;
    });
  };

  const handleAddAllQuestions = () => {
    let hasError = false;
    draftQuestions.forEach((q, index) => {
      if (!q.questionText.trim() || q.options.some(opt => !opt.trim()) || !q.correctAnswer.trim() || q.marks <= 0) {
        toast.error(`Question ${index + 1}: Please fill all fields, select a correct answer, and set valid marks.`);
        hasError = true;
      } else if (!q.options.includes(q.correctAnswer)) {
        toast.error(`Question ${index + 1}: Correct answer must be one of the provided options.`);
        hasError = true;
      }
    });

    if (hasError) {
      return;
    }

    draftQuestions.forEach((q) => {
      addQuestion({
        quizId: 'unassigned', // These questions are added to a general pool
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
      });
    });

    toast.success(`${draftQuestions.length} question(s) added to the pool!`);
    // Reset form
    setNumQuestionsToCreate(1);
    setOptionsPerQuestion(4); // Reset options per question
    setDraftQuestions([
      { questionText: '', options: Array(4).fill(''), correctAnswer: '', marks: 1 },
    ]);
  };

  const handleDeleteQuestionBlock = (indexToDelete: number) => {
    setDraftQuestions((prevQuestions) => {
      const newQuestions = prevQuestions.filter((_, index) => index !== indexToDelete);
      setNumQuestionsToCreate(newQuestions.length); // Update the count input
      return newQuestions;
    });
    toast.info("Question block removed.");
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <PlusCircle className="h-6 w-6" /> Create New Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="numQuestionsToCreate">Number of Questions to Create</Label>
          <Input
            id="numQuestionsToCreate"
            type="number"
            min="1"
            value={numQuestionsToCreate}
            onChange={(e) => setNumQuestionsToCreate(parseInt(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
        <div className="mt-3">
          <Label htmlFor="optionsPerQuestion">Number of MCQ Options per Question</Label>
          <Input
            id="optionsPerQuestion"
            type="number"
            min="2"
            max="6"
            value={optionsPerQuestion}
            onChange={(e) => setOptionsPerQuestion(parseInt(e.target.value) || 2)}
            className="mt-1"
          />
        </div>

        <div className="space-y-8 max-h-[60vh] overflow-y-auto p-3 border rounded-md bg-gray-50">
          {draftQuestions.map((q, index) => (
            <Card key={index} className="p-4 border rounded-md bg-white shadow-sm relative">
              {numQuestionsToCreate > 1 && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleDeleteQuestionBlock(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <h3 className="text-lg font-semibold mb-3">Question {index + 1}</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`questionText-${index}`}>Question Text</Label>
                  <Textarea
                    id={`questionText-${index}`}
                    placeholder="Enter your question here..."
                    value={q.questionText}
                    onChange={(e) => handleUpdateQuestion(index, 'questionText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                {/* Moved Marks input here */}
                <div>
                  <Label htmlFor={`questionMarks-${index}`}>Marks for this Question</Label>
                  <Input
                    id={`questionMarks-${index}`}
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => handleUpdateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                {q.options.map((option, optIndex) => (
                  <div key={optIndex}>
                    <Label htmlFor={`option-${index}-${optIndex}`}>Option {optIndex + 1}</Label>
                    <Input
                      id={`option-${index}-${optIndex}`}
                      placeholder={`Option ${optIndex + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
                <div>
                  <Label>Correct Answer</Label>
                  <RadioGroup
                    onValueChange={(value) => handleUpdateQuestion(index, 'correctAnswer', value)}
                    value={q.correctAnswer}
                    className="flex flex-col space-y-1 mt-2"
                  >
                    {q.options.filter(opt => opt.trim()).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`correct-option-${index}-${optIndex}`} />
                        <Label htmlFor={`correct-option-${index}-${optIndex}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddAllQuestions} className="w-full bg-green-600 hover:bg-green-700">
          Add All Questions to Pool
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuestionCreator;