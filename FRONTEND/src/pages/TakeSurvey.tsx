import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  MessageCircle, Trash2, Send, Zap
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import QuestionRenderer from "@/components/QuestionRenderer";
import {
  submitResponse, fetchSurvey, fetchComments, postComment, deleteComment
} from "@/lib/api";
import { useSurveyBackground } from "@/hooks/useSurveyBackground";
import ShareButton from "@/components/ShareButton";
import { useAuth } from "@/context/AuthContext";
import type { Survey } from "@/data/surveys";

interface Comment {
  id: number;
  username: string;
  content: string;
  user_id: number | null;
  avatar: string | null;
  created_at: string;
}

const CommentsSection = ({ surveyId, primaryColor }: { surveyId: string; primaryColor?: string | null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const btnColor = primaryColor ?? "hsl(var(--primary))";

  useEffect(() => {
    fetchComments(surveyId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [surveyId]);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const comment = await postComment(surveyId, text.trim());
      setComments((prev) => [comment, ...prev]);
      setText("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div className="mt-6 rounded-2xl bg-background/90 backdrop-blur-sm shadow-xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <MessageCircle className="h-5 w-5" style={{ color: btnColor }} />
        {t("comments.title")}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {comments.length}
        </span>
      </h3>
      {user ? (
        <div className="mb-5 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            placeholder={t("comments.placeholder")}
            rows={2}
            className="flex-1 resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handlePost}
              disabled={posting || !text.trim()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: btnColor }}
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("comments.send")}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {t("comments.charLimit", { count: text.length })}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline font-medium">
            {t("comments.loginToComment")}
          </Link>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("comments.noComments")}</p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 rounded-xl border border-border/60 bg-background p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary overflow-hidden">
                  {c.avatar ? (
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar}`}
                      alt=""
                      className="h-full w-full"
                    />
                  ) : (
                    (c.username || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{c.username}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                </div>
                {user && (user.id === c.user_id || user.role === "admin") && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="self-start rounded-lg p-1 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const CompletionScreen = ({
  survey,
  xpGained,
  levelUp,
  newBadges,
  bgStyle,
}: {
  survey: Survey & { primary_color?: string | null };
  xpGained: number;
  levelUp: boolean;
  newBadges: { name_kz: string; name_ru: string; name_en: string }[];
  bgStyle: React.CSSProperties;
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const btnColor = survey.primary_color ?? "hsl(var(--primary))";

  const getBadgeName = (b: { name_kz: string; name_ru: string; name_en: string }) => {
    if (i18n.language === "ru") return b.name_ru;
    if (i18n.language === "en") return b.name_en;
    return b.name_kz;
  };

  return (
    <div className="relative flex min-h-screen flex-col" style={bgStyle}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <div className="rounded-2xl bg-background/90 backdrop-blur-sm p-10 text-center shadow-xl">
              <CheckCircle2 className="mx-auto h-20 w-20" style={{ color: btnColor }} />
              <h2 className="mt-6 text-2xl font-bold text-foreground">{t("survey.submitSuccess").split("!")[0]}!</h2>
              <p className="mt-2 text-muted-foreground">{t("survey.submitSuccess").split("!").slice(1).join("!")}</p>

              {xpGained > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5"
                >
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {t("gamification.xpGained", { xp: xpGained })}
                  </span>
                </motion.div>
              )}

              {levelUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary"
                >
                  {t("gamification.levelUp", { level: "?" })}
                </motion.div>
              )}

              {newBadges.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="mt-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 px-4 py-2.5 text-sm font-bold text-amber-700 dark:text-amber-300"
                >
                  {t("gamification.newBadge", { name: getBadgeName(b) })}
                </motion.div>
              ))}
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/60 px-4 py-2.5">
                <span className="text-xs text-muted-foreground">{t("survey.shareWith")}</span>
                <ShareButton surveyId={survey.id} title={survey.title} />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate("/results")}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
                  style={{ background: btnColor }}
                >
                  {t("survey.viewResults")}
                </button>
                <button
                  onClick={() => navigate("/surveys")}
                  className="rounded-xl border border-border bg-background/60 px-6 py-3 text-sm font-medium text-foreground"
                >
                  {t("survey.otherSurveys")}
                </button>
              </div>
            </div>
            <CommentsSection surveyId={survey.id} primaryColor={survey.primary_color} />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const TakeSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const bgUrl = useSurveyBackground();
  const honeypotRef = useRef<HTMLInputElement>(null);

  const [survey, setSurvey] = useState<(Survey & { primary_color?: string | null }) | null>(null);
  const [loadingS, setLoadingS] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [newBadges, setNewBadges] = useState<{ name_kz: string; name_ru: string; name_en: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoadingS(true);
    fetchSurvey(id)
      .then((data) => {
        setSurvey({
          ...data,
          icon: data.emoji || data.icon || "fa-solid fa-clipboard-list",
          estimatedTime: data.estimated_time || data.estimatedTime || "—",
          questions: data.questions || [],
          primary_color: data.primary_color ?? null,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingS(false));
  }, [id]);

  const bgStyle = { background: bgUrl };
  const btnColor = survey?.primary_color ?? "hsl(var(--primary))";

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
                  <i className="fa-solid fa-magnifying-glass text-3xl text-muted-foreground" />
                </div>
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">{t("survey.notFound")}</h2>
              <Link to="/surveys" className="mt-4 inline-block text-sm text-primary hover:underline">
                {t("survey.emptyBack")}
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <CompletionScreen
        survey={survey}
        xpGained={xpGained}
        levelUp={levelUp}
        newBadges={newBadges}
        bgStyle={bgStyle}
      />
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
      toast.error(t("survey.questionRequired"));
      return;
    }
    if (current < totalQuestions - 1) setCurrent((c) => c + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error(t("survey.questionRequired"));
      return;
    }
    if (honeypotRef.current?.value) {
      setCompleted(true);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitResponse(survey.id, answers);
      setXpGained(result.xpGained ?? 0);
      setLevelUp(result.levelUp ?? false);
      setNewBadges(result.newBadges ?? []);
      setCompleted(true);
      toast.success(t("survey.submitSuccess").split("!")[0] + "!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      if (msg.includes("бұрыннан") || msg.includes("already")) {
        toast.error(t("survey.duplicate"));
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col" style={bgStyle}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col">
          <div className="h-1 bg-white/20">
            <motion.div
              className="h-full"
              style={{ background: btnColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
              <p className="mb-3 text-xs font-medium text-white/70">
                {t("survey.progress", {
                  current: current + 1,
                  total: totalQuestions,
                  title: survey.title,
                })}
              </p>
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                autoComplete="off"
              />

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
                  {t("common.back")}
                </button>

                {current === totalQuestions - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                    style={{ background: btnColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("common.finish")
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
                    style={{ background: btnColor }}
                  >
                    {t("common.next")}
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
