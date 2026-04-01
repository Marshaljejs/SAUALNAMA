import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import QuestionRenderer from "@/components/QuestionRenderer";
import { submitResponse, fetchSurvey } from "@/lib/api";
import { useSurveyBackground } from "@/hooks/useSurveyBackground";
import ShareButton from "@/components/ShareButton";
import type { Survey } from "@/data/surveys";

const TakeSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bgUrl = useSurveyBackground();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loadingS, setLoadingS] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingS(true);
    fetchSurvey(id)
      .then((data) => {
        // normalize field names coming from DB
        setSurvey({
          ...data,
          icon: data.emoji || data.icon || "fa-solid fa-clipboard-list",
          estimatedTime: data.estimated_time || data.estimatedTime || "—",
          questions: data.questions || [],
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingS(false));
  }, [id]);

  const bgStyle = { background: bgUrl };

  // Loading state
  if (loadingS) {
    return (
      <div className="relative flex min-h-screen flex-col" style={bgStyle}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </main>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound || !survey) {
    return (
      <div className="relative flex min-h-screen flex-col" style={bgStyle}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 items-center justify-center">
            <div className="rounded-2xl bg-background/90 backdrop-blur-sm p-10 text-center shadow-xl">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <i className="fa-solid fa-magnifying-glass text-3xl text-muted-foreground"></i>
                </div>
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">Сауалнама табылмады</h2>
              <Link to="/surveys" className="mt-4 inline-block text-sm text-primary hover:underline">
                Сауалнамалар тізіміне оралу
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const question = survey.questions[current];
  const totalQuestions = survey.questions.length;
  const progress = totalQuestions > 0 ? ((current + 1) / totalQuestions) * 100 : 0;

  const handleAnswer = (value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const canProceed = () => {
    const ans = answers[question.id];
    if (!question.required) return true;
    if (ans === undefined || ans === "") return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Бұл сұраққа жауап беру міндетті");
      return;
    }
    if (current < totalQuestions - 1) setCurrent((c) => c + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error("Бұл сұраққа жауап беру міндетті");
      return;
    }
    setSubmitting(true);
    try {
      await submitResponse(survey.id, answers);
      setCompleted(true);
      toast.success("Сәтті сақталды! Рахмет!");
    } catch {
      toast.error("Қате орын алды. Қайта көріңіз.");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="relative flex min-h-screen flex-col" style={bgStyle}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-background/90 backdrop-blur-sm p-10 text-center shadow-xl"
            >
              <CheckCircle2 className="mx-auto h-20 w-20 text-success" />
              <h2 className="mt-6 text-2xl font-bold text-foreground">Рахмет!</h2>
              <p className="mt-2 text-muted-foreground">
                Сіздің жауаптарыңыз сәтті қабылданды
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/60 px-4 py-2.5">
                <span className="text-xs text-muted-foreground">Достарыңызбен бөлісіңіз:</span>
                <ShareButton surveyId={survey.id} title={survey.title} />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate("/results")}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Нәтижелерді көру
                </button>
                <button
                  onClick={() => navigate("/surveys")}
                  className="rounded-xl border border-border bg-background/60 px-6 py-3 text-sm font-medium text-foreground"
                >
                  Басқа сауалнама
                </button>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col" style={bgStyle}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col">
          {/* Progress bar */}
          <div className="h-1 bg-white/20">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
              <p className="mb-3 text-xs font-medium text-white/70">
                {current + 1} / {totalQuestions} сұрақ — {survey.title}
              </p>

              <div className="rounded-2xl bg-background/90 backdrop-blur-sm shadow-xl p-8 md:p-10">
                <AnimatePresence mode="wait">
                  <QuestionRenderer
                    key={question.id}
                    question={question}
                    answer={answers[question.id]}
                    onAnswer={handleAnswer}
                  />
                </AnimatePresence>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={current === 0}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Артқа
                </button>

                {current === totalQuestions - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Жүктелуде...
                      </>
                    ) : (
                      "Аяқтау"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
                  >
                    Келесі
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TakeSurvey;
