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
      <Card className="glass-card border-white/50 animate-pulse">
        <CardHeader className="p-8">
          <CardTitle className="flex items-center gap-4 text-xl font-black text-[#1E2455] uppercase tracking-tighter">
            <Loader2 className="h-7 w-7 animate-spin text-[#6C8BFF]" /> <span className="opacity-50 font-poppins">Synchronizing Archives...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 font-poppins">
          <p className="text-[#7A80B8] font-bold italic tracking-tight">Fetching published assessments from the secure database.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-poppins">
      {/* Header */}
      <div className="glass-card p-10 relative overflow-hidden group border-white/60">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C8BFF]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-[#6C8BFF]/10 transition-all duration-1000" />
        <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-8">
          <div>
            <h2 className="text-4xl font-black text-[#1E2455] tracking-tighter uppercase leading-none flex items-center gap-5">
              <div className="p-3 bg-[#6C8BFF]/10 rounded-2xl shadow-sm border border-[#6C8BFF]/20">
                <Trophy className="h-8 w-8 text-[#6C8BFF]" />
              </div>
              Published Assessments
            </h2>
            <p className="text-[#3A3F6B] mt-4 font-bold italic opacity-70">Manage and review live academic simulations across all departments.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="px-6 py-3 bg-white/40 border border-white/60 rounded-2xl shadow-sm hidden lg:block backdrop-blur-md">
              <span className="text-[10px] font-black text-[#6C8BFF] uppercase tracking-[0.25em]">
                OPERATIONAL INDEX: {quizzes.length}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="pastel-button-primary h-16 px-10 text-[11px] tracking-[0.2em] group/btn">
                  <Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform duration-500" />
                  GENERATE MODULE
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-3 glass-card bg-white/40 backdrop-blur-xl border-white/60 shadow-2xl animate-in zoom-in-95 duration-300 side-bottom-4">
                <div className="px-5 py-4 mb-2 border-b border-white/20">
                  <p className="text-[9px] font-black text-[#7A80B8] uppercase tracking-[0.4em]">SELECT PROTOCOL</p>
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('view', 'create-quiz');
                    params.set('mode', 'manual');
                    params.delete('step');
                    setSearchParams(params);
                  }}
                  className="p-5 rounded-2xl focus:bg-[#6C8BFF]/10 focus:text-[#1E2455] cursor-pointer group/item transition-all mb-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 border border-white flex items-center justify-center mr-5 group-focus/item:scale-110 transition-transform shadow-sm">
                    <Edit className="h-6 w-6 text-[#6C8BFF]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[11px] text-[#1E2455] uppercase tracking-wider leading-none mb-1.5">Manual Synthesis</span>
                    <span className="text-[9px] text-[#7A80B8] font-bold italic opacity-70">High-precision curation</span>
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
                  className="p-5 rounded-2xl focus:bg-[#E38AD6]/10 focus:text-[#1E2455] cursor-pointer group/item transition-all mb-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 border border-white flex items-center justify-center mr-5 group-focus/item:scale-110 transition-transform shadow-sm">
                    <Sparkles className="h-6 w-6 text-[#E38AD6]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[11px] text-[#1E2455] uppercase tracking-wider leading-none mb-1.5">Neural Generation</span>
                    <span className="text-[9px] text-[#7A80B8] font-bold italic opacity-70">AI-optimized banks</span>
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
                  className="p-5 rounded-2xl focus:bg-[#FFB86C]/10 focus:text-[#1E2455] cursor-pointer group/item transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/60 border border-white flex items-center justify-center mr-5 group-focus/item:scale-110 transition-transform shadow-sm">
                    <FileText className="h-6 w-6 text-[#FFB86C]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-[11px] text-[#1E2455] uppercase tracking-wider leading-none mb-1.5">Document Parser</span>
                    <span className="text-[9px] text-[#7A80B8] font-bold italic opacity-70">PDF to Module conversion</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex flex-col gap-5">
        {filteredQuizzes.length === 0 ? (
          <div className="py-40 glass-card rounded-[48px] border-white/50 text-center relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,139,255,0.05)_0%,transparent_70%)]" />
            <div className="w-28 h-28 bg-white/40 border border-white/60 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-glass group-hover:scale-110 transition-transform duration-700">
              <Trophy className="h-14 w-14 text-[#7A80B8] group-hover:text-[#6C8BFF] transition-colors" />
            </div>
            <h3 className="text-3xl font-black text-[#1E2455] mb-5 uppercase tracking-tighter relative z-10">Archive Depleted</h3>
            <p className="text-[#3A3F6B] max-w-sm mx-auto font-bold italic opacity-60 tracking-tight relative z-10 px-6">
              No published assessments indexed. Initialize a new simulation via the creation portal.
            </p>
          </div>
        ) : (
          filteredQuizzes.map((quiz, idx) => (
            <div key={quiz.id} className="group glass-card p-8 border-white/40 hover:border-white/70 hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-500 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden gap-10">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />

              <div className="flex flex-col md:flex-row items-center gap-10 flex-1 min-w-0 relative z-10 w-full">
                {/* Sequential Number */}
                <div className="flex items-center justify-center w-12 h-12 rounded-[18px] bg-white/50 text-[#7A80B8] font-black text-xs border border-white shadow-inner group-hover:bg-gradient-to-br group-hover:from-[#6C8BFF] group-hover:to-[#E38AD6] group-hover:text-white group-hover:border-transparent transition-all duration-500 shrink-0 shadow-sm">
                  {idx + 1}
                </div>

                <div className="w-18 h-18 bg-white/40 border border-white/60 rounded-[28px] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-white/60 transition-all duration-700 p-4 shadow-sm">
                  <Trophy className="h-9 w-9 text-[#6C8BFF]" />
                </div>

                <div className="min-w-0 flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                    <span className="text-[10px] font-black text-[#7A80B8] uppercase tracking-[0.3em] group-hover:text-[#6C8BFF] transition-colors bg-white/40 px-3 py-1 rounded-full border border-white/60">
                      REF-{quiz.id.slice(-6).toUpperCase()}
                    </span>
                    {(() => {
                      const status = getQuizStatus(quiz);
                      switch (status) {
                        case 'Active':
                          return (
                            <div className="px-4 py-1.5 bg-[#4EE3B2]/10 text-[#4EE3B2] border border-[#4EE3B2]/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2">
                              <span className="w-2 h-2 bg-[#4EE3B2] rounded-full animate-pulse" />
                              Active Simulation
                            </div>
                          );
                        case 'Scheduled':
                          return (
                            <div className="px-4 py-1.5 bg-[#6C8BFF]/10 text-[#6C8BFF] border border-[#6C8BFF]/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                              Enqueued
                            </div>
                          );
                        case 'Expired':
                          return (
                            <div className="px-4 py-1.5 bg-white/40 text-[#7A80B8] border border-white/60 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm italic opacity-60">
                              Archived
                            </div>
                          );
                        case 'Deleted':
                          return (
                            <div className="px-4 py-1.5 bg-[#FF6B8A]/10 text-[#FF6B8A] border border-[#FF6B8A]/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">
                              Purged
                            </div>
                          );
                        default:
                          return null;
                      }
                    })()}
                  </div>
                  <h4 className={cn(
                    "text-3xl font-black truncate tracking-tighter transition-colors font-poppins",
                    quiz.status === 'DELETED' ? "text-[#7A80B8] line-through opacity-40 italic" : "text-[#1E2455]"
                  )}>
                    {quiz.title}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black text-[#7A80B8] mt-5 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2.5 text-[#1E2455] bg-white/60 px-4 py-1.5 rounded-xl border border-white shadow-sm">
                      <Clock className="h-4 w-4 text-[#6C8BFF]" />
                      {quiz.timeLimitMinutes} Simulation Minutes
                    </span>
                    <span className="w-1.5 h-1.5 bg-[#7A80B8]/20 rounded-full" />
                    <span className="italic opacity-80">Collection: <span className="text-[#1E2455] not-italic">{quiz.courseName}</span></span>
                    {quiz.status !== 'DELETED' && (
                      <>
                        <span className="w-1.5 h-1.5 bg-[#7A80B8]/20 rounded-full" />
                        <span className="italic opacity-80">Date: <span className="text-[#1E2455] not-italic">{quiz.scheduledDate}</span></span>
                      </>
                    )}
                    {quiz.negativeMarking && (
                      <>
                        <span className="w-1.5 h-1.5 bg-[#7A80B8]/20 rounded-full" />
                        <span className="text-[#FF6B8A] flex items-center gap-2 bg-[#FF6B8A]/5 px-3 py-1 rounded-lg border border-[#FF6B8A]/10">
                          NEUTRALIZATION ACTIVE
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto justify-center">
                {getQuizStatus(quiz) === 'Scheduled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAsNew(quiz)}
                    className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[#7A80B8] hover:text-[#6C8BFF] hover:bg-[#6C8BFF]/5 border border-transparent hover:border-[#6C8BFF]/20 transition-all shadow-sm"
                  >
                    <Edit className="h-4.5 w-4.5 mr-3" /> SYNTHESIZE COPY
                  </Button>
                )}

                {quiz.status !== 'DELETED' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-14 px-10 rounded-2xl bg-[#1E2455] text-white hover:bg-[#1E2455]/90 transition-all font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:shadow-[#1E2455]/20 flex items-center justify-center gap-3"
                    >
                      <Link to={`/quiz-preview/${quiz.id}`}>
                        PREVIEW SIMULATION
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      className="h-14 w-14 rounded-2xl bg-[#FF6B8A]/5 text-[#FF6B8A]/60 hover:bg-[#FF6B8A]/10 hover:text-[#FF6B8A] transition-all border border-[#FF6B8A]/10 shadow-sm flex items-center justify-center p-0"
                    >
                      <Trash className="h-5 w-5" />
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