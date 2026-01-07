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
  marks: number | ''; // Allow marks to be an empty string
  timeLimitMinutes: number | ''; // Allow timeLimitMinutes to be an empty string
}

interface QuestionCreatorProps {
  onNavigate?: (view: string) => void;
}

const QuestionCreator = ({ onNavigate }: QuestionCreatorProps) => {
  const { addQuestion } = useQuiz();

  const [numQuestionsToCreate, setNumQuestionsToCreate] = useState<number | ''>(0); // Default to 0, allow empty string
  const [optionsPerQuestion, setOptionsPerQuestion] = useState<number>(0); // Default to 0
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]); // Start with empty array

  /* New state for wizard step */
  const [step, setStep] = useState<number>(1);

  // Adjust draftQuestions array length and options count when numQuestionsToCreate or optionsPerQuestion changes
  useEffect(() => {
    setDraftQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      const targetCount = numQuestionsToCreate === '' ? 0 : numQuestionsToCreate;

      // Adjust number of questions
      while (newQuestions.length < targetCount) {
        newQuestions.push({
          questionText: '',
          options: Array(optionsPerQuestion).fill(''), // Use optionsPerQuestion for new questions
          correctAnswer: '',
          marks: 1,
          timeLimitMinutes: 1, // Default time limit for new questions
        });
      }
      const slicedQuestions = newQuestions.slice(0, targetCount);

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
      if (field === 'marks' || field === 'timeLimitMinutes') {
        // If value is empty string, store as empty string. Otherwise, parse to int.
        const parsedValue = value === '' ? '' : parseInt(value);
        newQuestions[index] = { ...newQuestions[index], [field]: parsedValue };
      } else {
        newQuestions[index] = { ...newQuestions[index], [field]: value };
      }
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
    // Check if number of questions is 0 or empty
    if (!numQuestionsToCreate || numQuestionsToCreate === 0 || draftQuestions.length === 0) {
      toast.error("Please enter number of questions to continue");
      return;
    }

    // Check if options per question is 0
    if (optionsPerQuestion === 0) {
      toast.error("Please select number of MCQ options (1 to 6)");
      return;
    }

    let hasError = false;
    draftQuestions.forEach((q, index) => {
      // Check for empty question text, empty options, no correct answer, or invalid marks/time
      if (
        !q.questionText.trim() ||
        q.options.some(opt => !opt.trim()) ||
        !q.correctAnswer.trim() ||
        q.marks === '' ||
        (typeof q.marks === 'number' && q.marks <= 0) ||
        q.timeLimitMinutes === '' ||
        (typeof q.timeLimitMinutes === 'number' && q.timeLimitMinutes <= 0)
      ) {
        toast.error(`Question ${index + 1}: Please fill all fields, select a correct answer, and set valid marks and time (must be at least 1).`);
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
      // Ensure marks and timeLimitMinutes are numbers before adding
      const marksToAdd = typeof q.marks === 'number' ? q.marks : 1; // Fallback to 1 if somehow not a number
      const timeLimitToAdd = typeof q.timeLimitMinutes === 'number' ? q.timeLimitMinutes : 1; // Fallback to 1 if somehow not a number

      addQuestion({
        quizId: 'unassigned', // These questions are added to a general pool
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: marksToAdd,
        timeLimitMinutes: timeLimitToAdd,
      });
    });

    toast.success(`${draftQuestions.length} question(s) added to the pool!`);
    // Reset form
    setNumQuestionsToCreate(0);
    setOptionsPerQuestion(0); // Reset options per question
    setDraftQuestions([]);
    setStep(1); // Return to step 1
  };

  const handleDeleteQuestionBlock = (indexToDelete: number) => {
    setDraftQuestions((prevQuestions) => {
      const newQuestions = prevQuestions.filter((_, index) => index !== indexToDelete);
      setNumQuestionsToCreate(newQuestions.length); // Update the count input
      if (newQuestions.length === 0) setStep(1); // If all deleted, go back to step 1
      return newQuestions;
    });
    toast.info("Question block removed.");
  };

  // derived state for Step 1 validation
  const isStep1Valid =
    numQuestionsToCreate !== '' &&
    numQuestionsToCreate > 0 &&
    optionsPerQuestion > 0 &&
    optionsPerQuestion <= 6;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <PlusCircle className="h-6 w-6" /> Create New Questions
          {step === 2 && <span className="text-sm font-normal text-muted-foreground ml-2">(Step 2: Fill Details)</span>}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1 Inputs - Always visible, locked in Step 2 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="numQuestionsToCreate">Number of Questions to Create</Label>
            <Input
              id="numQuestionsToCreate"
              type="number"
              min="0"
              value={numQuestionsToCreate}
              disabled={step === 2} // Lock in Step 2
              onChange={(e) => {
                const val = e.target.value;
                setNumQuestionsToCreate(val === '' ? '' : parseInt(val));
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="optionsPerQuestion">Number of MCQ Options per Question</Label>
            <Input
              id="optionsPerQuestion"
              type="number"
              min="0"
              max="6"
              value={optionsPerQuestion}
              disabled={step === 2} // Lock in Step 2
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                // Block > 6 or < 0, but allow 0 (default)
                if (val >= 0 && val <= 6) {
                  setOptionsPerQuestion(val);
                }
              }}
              className="mt-1"
            />
          </div>
        </div>

        {/* Step 2 Content - Question List */}
        {step === 2 && (
          <div className="space-y-8 max-h-[60vh] overflow-y-auto p-3 border rounded-md bg-gray-50 mt-6">
            {draftQuestions.map((q, index) => (
              <Card key={index} className="p-4 border rounded-md bg-white shadow-sm relative">
                {numQuestionsToCreate !== '' && numQuestionsToCreate > 1 && (
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
                  <div>
                    <Label htmlFor={`questionMarks-${index}`}>Marks for this Question</Label>
                    <Input
                      id={`questionMarks-${index}`}
                      type="number"
                      min="1"
                      value={q.marks}
                      onChange={(e) => handleUpdateQuestion(index, 'marks', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`questionTime-${index}`}>Time for this Question (minutes)</Label>
                    <Input
                      id={`questionTime-${index}`}
                      type="number"
                      min="1"
                      value={q.timeLimitMinutes}
                      onChange={(e) => handleUpdateQuestion(index, 'timeLimitMinutes', e.target.value)}
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
        )}
      </CardContent>

      <CardFooter>
        {step === 1 ? (
          <Button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Proceed to Questions
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => setStep(1)} className="w-[100px]">
              Back
            </Button>
            <Button onClick={handleAddAllQuestions} className="flex-1 bg-green-600 hover:bg-green-700">
              Add All Questions to Pool
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuestionCreator;