import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, MinusCircle, Users, Loader2, Trash, Edit, Plus, Sparkles, FileText } from 'lucide-react';
import { Quiz, useQuiz } from '@/context/QuizContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface AvailableQuizzesListProps {
  quizzes: Quiz[];
}

const AvailableQuizzesList = ({ quizzes }: AvailableQuizzesListProps) => {
  const { isQuizzesLoading, deleteQuiz } = useQuiz();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getQuizStatus = (quiz: Quiz) => {
    if (quiz.status === 'DELETED') return 'Deleted';

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const scheduledDate = quiz.scheduledDate;

    const startDateTime = new Date(`${scheduledDate}T${quiz.startTime}`);
    const endDateTime = new Date(`${scheduledDate}T${quiz.endTime}`);

    if (now < startDateTime) return 'Scheduled';
    if (now >= startDateTime && now <= endDateTime) return 'Active';
    return 'Expired';
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteQuiz(id);
    }
  };

  const handleEditAsNew = (quiz: Quiz) => {
    // 1. Map Quiz data back to the format expected by QuestionCreator's session storage (Poll structure)
    const draftQuestions = quiz.questions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      timeLimitMinutes: q.timeLimitMinutes,
    }));

    const sessionData = {
      numQuestions: quiz.totalQuestions,
      numOptions: quiz.questions[0]?.options?.length || 4,
      draftQuestions: draftQuestions,
      questionSetName: quiz.title.replace(' (AI Generated)', '').replace(' (Copy)', ''),
      courseName: quiz.courseName,
      step: 2, // Resume directly to the editor
      currentSetId: null, // Crucial: Treat as new draft
      passMarkPercentage: quiz.passPercentage,
      scheduledEndTime: quiz.endTime,
      // Scheduling fields are usually set in step 2, but we can pre-fill them if needed
    };

    localStorage.setItem('activeCreationSession', JSON.stringify(sessionData));

    // 2. Navigate to manual creation mode (QuestionCreator)
    const params = new URLSearchParams(searchParams);
    params.set('view', 'create-quiz');
    params.set('step', 'manual');
    params.set('qStep', '2');
    setSearchParams(params);
    toast.info(`Loaded "${quiz.title}" for editing as a new quiz.`);
  };

  const filteredQuizzes = React.useMemo(() => {
    return quizzes;
  }, [quizzes]);

  if (isQuizzesLoading) {
    return (
      <Card className="bg-card border-slate-800 shadow-2xl shadow-primary/5 animate-pulse">
        <CardHeader className="p-8">
          <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-50 uppercase tracking-tighter">
            <Loader2 className="h-6 w-6 animate-spin text-primary" /> Synchronizing Archives...
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <p className="text-slate-500 font-bold italic tracking-tight">Fetching published assessments from the secure database.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="bg-card p-10 rounded-[40px] border border-slate-800 shadow-2xl shadow-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-all" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none flex items-center gap-4">
              <Trophy className="h-8 w-8 text-primary shadow-xl shadow-primary/20" />
              Published Assessments
            </h2>
            <p className="text-slate-500 mt-2 font-bold italic tracking-tight">Manage and review live academic simulations across all departments.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl shadow-sm hidden md:block">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  Operational: {quizzes.length}
                </span>
              </div>

            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] rounded-[20px] shadow-xl shadow-primary/20 group/btn transition-all flex items-center gap-3">
                  <Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform duration-300" />
                  Create Quiz
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2 bg-slate-900 border-slate-800 text-slate-100 rounded-[28px] shadow-2xl animate-in zoom-in-95 duration-200 side-top-2">
                <div className="px-4 py-3 mb-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Select Protocol</p>
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('view', 'create-quiz');
                    params.set('mode', 'manual');
                    params.delete('step');
                    setSearchParams(params);
                  }}
                  className="p-4 rounded-2xl focus:bg-primary/10 focus:text-primary cursor-pointer group/item transition-all mb-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-focus-within/item:bg-primary/20 transition-colors">
                    <Edit className="h-5 w-5 text-slate-400 group-hover/item:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[11px] uppercase tracking-wider leading-none mb-1">Manual Creation</span>
                    <span className="text-[9px] text-slate-500 font-bold italic">Detailed control of questions</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('view', 'create-quiz');
                    params.set('mode', 'ai');
                    params.delete('step');
                    setSearchParams(params);
                  }}
                  className="p-4 rounded-2xl focus:bg-primary/10 focus:text-primary cursor-pointer group/item transition-all mb-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-focus-within/item:bg-primary/20 transition-colors">
                    <Sparkles className="h-5 w-5 text-slate-400 group-hover/item:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[11px] uppercase tracking-wider leading-none mb-1">AI Engine</span>
                    <span className="text-[9px] text-slate-500 font-bold italic">Instant question banks</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('view', 'create-quiz');
                    params.set('mode', 'pdf');
                    params.delete('step');
                    setSearchParams(params);
                  }}
                  className="p-4 rounded-2xl focus:bg-primary/10 focus:text-primary cursor-pointer group/item transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mr-4 group-focus-within/item:bg-primary/20 transition-colors">
                    <FileText className="h-5 w-5 text-slate-400 group-hover/item:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[11px] uppercase tracking-wider leading-none mb-1">PDF Generator</span>
                    <span className="text-[9px] text-slate-500 font-bold italic">Import documents to quiz</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex flex-col gap-3">
        {filteredQuizzes.length === 0 ? (
          <div className="py-32 bg-card rounded-[40px] border border-slate-800 shadow-2xl shadow-primary/5 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]" />
            <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:border-primary/30 transition-all">
              <Trophy className="h-12 w-12 text-slate-600 group-hover:text-primary/50 transition-all" />
            </div>
            <h3 className="text-2xl font-black text-slate-100 mb-3 uppercase tracking-tighter relative z-10">Archive Depleted</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-bold italic tracking-tight relative z-10">
              No published assessments found. Initialize a new simulation via the creation portal.
            </p>
          </div>
        ) : (
          filteredQuizzes.map((quiz, idx) => (
            <div key={quiz.id} className="group bg-card p-6 rounded-[24px] border border-slate-800 shadow-sm hover:border-slate-700 hover:bg-slate-900/40 transition-all flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-8 flex-1 min-w-0 relative z-10">
                {/* Sequential Number */}
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-slate-500 font-bold text-sm border border-slate-800 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-inner shrink-0">
                  {idx + 1}
                </div>

                <div className="w-14 h-14 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-primary/10 transition-all">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono font-black text-slate-600 uppercase tracking-widest group-hover:text-primary transition-colors">
                      REF: {quiz.id.slice(-6).toUpperCase()}
                    </span>
                    {(() => {
                      const status = getQuizStatus(quiz);
                      switch (status) {
                        case 'Active':
                          return (
                            <div className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                              Live Now
                            </div>
                          );
                        case 'Scheduled':
                          return (
                            <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                              Scheduled
                            </div>
                          );
                        case 'Expired':
                          return (
                            <div className="px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                              Completed
                            </div>
                          );
                        case 'Deleted':
                          return (
                            <div className="px-3 py-1 bg-danger/10 text-danger border border-danger/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                              Deleted
                            </div>
                          );
                        default:
                          return null;
                      }
                    })()}
                  </div>
                  <h4 className={cn(
                    "text-xl font-bold truncate tracking-tight transition-colors",
                    quiz.status === 'DELETED' ? "text-slate-600 line-through" : "text-slate-100"
                  )}>
                    {quiz.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-5 text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
                    <span className="flex items-center gap-2 text-primary bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                      <Clock className="h-3.5 w-3.5" />
                      {quiz.timeLimitMinutes} Simulation Minutes
                    </span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full" />
                    <span className="text-slate-400">Library: <span className="text-slate-200">{quiz.courseName}</span></span>
                    {quiz.status !== 'DELETED' && (
                      <>
                        <span className="w-1 h-1 bg-slate-800 rounded-full" />
                        <span className="text-slate-400">Date: <span className="text-slate-200">{quiz.scheduledDate}</span></span>
                      </>
                    )}
                    {quiz.negativeMarking && (
                      <>
                        <span className="w-1 h-1 bg-slate-800 rounded-full" />
                        <span className="text-danger flex items-center gap-2">
                          <MinusCircle className="h-3.5 w-3.5" />
                          Risk: Negative Marking
                        </span>
                      </>
                    )}
                    {quiz.competitionMode && (
                      <>
                        <span className="w-1 h-1 bg-slate-800 rounded-full" />
                        <span className="text-yellow flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          Competitive Mode
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-6 relative z-10">
                {getQuizStatus(quiz) === 'Scheduled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAsNew(quiz)}
                    className="h-10 px-5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all font-black text-[10px] uppercase tracking-widest"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Clone & Modify
                  </Button>
                )}

                {quiz.status !== 'DELETED' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-10 px-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 hover:bg-slate-800 hover:border-slate-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-white/5"
                    >
                      <Link to={`/quiz-preview/${quiz.id}`}>
                        Preview Simulation
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      className="h-10 w-10 rounded-xl bg-danger/5 text-danger/60 hover:bg-danger/10 hover:text-danger Transition-all border border-danger/10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableQuizzesList;