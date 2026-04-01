import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import QuestionRenderer from "@/components/QuestionRenderer";
import { useSurveys } from "@/context/SurveyContext";
import { submitResponse } from "@/lib/api";

const TakeSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { surveys } = useSurveys();
  const survey = surveys.find((s) => s.id === id);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!survey) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
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
    );
  }

  const question = survey.questions[current];
  const totalQuestions = survey.questions.length;
  const progress = ((current + 1) / totalQuestions) * 100;

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
    if (current < totalQuestions - 1) {
      setCurrent((c) => c + 1);
    }
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
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <CheckCircle2 className="mx-auto h-20 w-20 text-success" />
            <h2 className="mt-6 text-2xl font-bold text-foreground">Рахмет!</h2>
            <p className="mt-2 text-muted-foreground">
              Сіздің жауаптарыңыз сәтті қабылданды
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate("/results")}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Нәтижелерді көру
              </button>
              <button
                onClick={() => navigate("/surveys")}
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground"
              >
                Басқа сауалнама
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {current + 1} / {totalQuestions} сұрақ — {survey.title}
            </p>

            <AnimatePresence mode="wait">
              <QuestionRenderer
                key={question.id}
                question={question}
                answer={answers[question.id]}
                onAnswer={handleAnswer}
              />
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={current === 0}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
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
  );
};

export default TakeSurvey;