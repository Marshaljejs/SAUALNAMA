import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GripVertical, ArrowLeft, Save, Loader2, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuestionRenderer from "@/components/QuestionRenderer";
import { useSurveys } from "@/context/SurveyContext";
import { createSurvey } from "@/lib/api";
import type { Question, QuestionType, QuestionOption } from "@/data/surveys";

const ICONS = [
  { icon: "fa-solid fa-clipboard-list", label: "Список" },
  { icon: "fa-solid fa-chart-bar", label: "График" },
  { icon: "fa-solid fa-lightbulb", label: "Идея" },
  { icon: "fa-solid fa-bullseye", label: "Цель" },
  { icon: "fa-solid fa-star", label: "Звезда" },
  { icon: "fa-solid fa-flask", label: "Наука" },
  { icon: "fa-solid fa-trophy", label: "Трофей" },
  { icon: "fa-solid fa-graduation-cap", label: "Образование" },
  { icon: "fa-solid fa-briefcase", label: "Работа" },
  { icon: "fa-solid fa-earth-americas", label: "Мир" },
  { icon: "fa-solid fa-palette", label: "Искусство" },
  { icon: "fa-solid fa-rocket", label: "Ракета" },
];

const CATEGORIES = ["Технология", "Білім", "Денсаулық", "Қоғам", "Мәдениет", "Спорт", "Бизнес", "Ғылым"];

const PRIMARY_COLORS = [
  { value: "#6366f1", label: "Индиго" },
  { value: "#3b82f6", label: "Синий" },
  { value: "#8b5cf6", label: "Фиолетовый" },
  { value: "#ec4899", label: "Розовый" },
  { value: "#10b981", label: "Зелёный" },
  { value: "#f59e0b", label: "Оранжевый" },
  { value: "#ef4444", label: "Красный" },
  { value: "#14b8a6", label: "Бирюзовый" },
];

const questionTypeLabels: Record<QuestionType, string> = {
  single: "Бір нұсқа",
  multiple: "Бірнеше нұсқа",
  text: "Еркін жауап",
  rating: "Бағалау (жұлдыз)",
};

const generateId = () => Math.random().toString(36).substring(2, 10);

interface QuestionDraft {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  required: boolean;
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
const PreviewModal = ({
  title,
  description,
  questions,
  primaryColor,
  onClose,
}: {
  title: string;
  description: string;
  questions: QuestionDraft[];
  primaryColor: string | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

  const q = questions[current];

  const mappedQuestions: Question[] = questions.map((qq) => ({
    id: qq.id,
    text: qq.text || "(Мәтінсіз сұрақ)",
    type: qq.type,
    required: qq.required,
    ...(qq.type === "single" || qq.type === "multiple" ? { options: qq.options } : {}),
  }));

  const colorStyle = primaryColor ? { "--preview-primary": primaryColor } as React.CSSProperties : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={colorStyle}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-2xl"
      >
        {/* Header */}
        <div
          className="rounded-t-2xl p-6 text-white"
          style={{ background: primaryColor ?? "hsl(var(--primary))" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/70 mb-1">
                {t("survey.previewTitle")}
              </p>
              <h2 className="text-xl font-bold">{title || "(Атаусыз)"}</h2>
              {description && <p className="mt-1 text-sm text-white/80">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Progress bar */}
          {mappedQuestions.length > 0 && (
            <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${((current + 1) / mappedQuestions.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {mappedQuestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("survey.noQuestions")}
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                {current + 1} / {mappedQuestions.length}
              </p>
              <AnimatePresence mode="wait">
                <QuestionRenderer
                  key={q.id}
                  question={mappedQuestions[current]}
                  answer={answers[q.id]}
                  onAnswer={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
                />
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                >
                  {t("common.back")}
                </button>
                {current < mappedQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrent((c) => c + 1)}
                    className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                    style={{ background: primaryColor ?? "hsl(var(--primary))" }}
                  >
                    {t("common.next")}
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
                    style={{ background: primaryColor ?? "hsl(var(--primary))" }}
                  >
                    {t("common.close")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addSurvey } = useSurveys();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("fa-solid fa-clipboard-list");
  const [category, setCategory] = useState("Технология");
  const [estimatedTime, setEstimatedTime] = useState("3 мин");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        text: "",
        type: "single",
        options: [
          { id: generateId(), label: "" },
          { id: generateId(), label: "" },
        ],
        required: true,
      },
    ]);
  };

  const updateQuestion = (qId: string, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, { id: generateId(), label: "" }] } : q
      )
    );
  };

  const updateOption = (qId: string, oId: string, label: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === oId ? { ...o, label } : o)) }
          : q
      )
    );
  };

  const removeOption = (qId: string, oId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, options: q.options.filter((o) => o.id !== oId) } : q
      )
    );
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Сауалнама атауын жазыңыз";
    if (!description.trim()) return "Сипаттама жазыңыз";
    if (questions.length === 0) return "Кем дегенде бір сұрақ қосыңыз";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `${i + 1}-сұрақтың мәтінін жазыңыз`;
      if (q.type === "single" || q.type === "multiple") {
        if (q.options.length < 2) return `${i + 1}-сұраққа кем дегенде 2 нұсқа қосыңыз`;
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].label.trim()) return `${i + 1}-сұрақтың ${j + 1}-нұсқасын жазыңыз`;
        }
      }
    }
    return null;
  };

  const handleSave = async (forcedStatus?: "published" | "draft") => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const saveStatus = forcedStatus ?? status;
    setSaving(true);
    try {
      const newSurvey = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        icon,
        category,
        estimatedTime,
        respondents: 0,
        status: saveStatus,
        primary_color: primaryColor,
        questions: questions.map((q): Question => ({
          id: q.id,
          text: q.text.trim(),
          type: q.type,
          required: q.required,
          ...(q.type === "single" || q.type === "multiple"
            ? { options: q.options.map((o) => ({ id: o.id, label: o.label.trim() })) }
            : {}),
        })),
      };

      addSurvey(newSurvey);
      await createSurvey(newSurvey);
      toast.success(t("survey.saveSuccess"));
      navigate(saveStatus === "draft" ? "/my-surveys" : "/surveys");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Preview modal */}
      <AnimatePresence>
        {showPreview && (
          <PreviewModal
            title={title}
            description={description}
            questions={questions}
            primaryColor={primaryColor}
            onClose={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8 md:py-12">
          <div className="container mx-auto max-w-3xl px-4 md:px-6">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                    {t("survey.createTitle")}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{t("survey.createSubtitle")}</p>
                </div>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  {t("survey.previewBtn")}
                </button>
              </div>
            </motion.div>

            {/* Survey info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="mb-4 text-sm font-semibold text-card-foreground">{t("survey.basic")}</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("survey.titleLabel")}
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Мысалы: Технология әдеттері"
                    maxLength={100}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("survey.descLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Сауалнаманың мақсаты..."
                    maxLength={300}
                    rows={3}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Icons */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("survey.iconLabel")}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ICONS.map((item) => (
                        <button
                          key={item.icon}
                          onClick={() => setIcon(item.icon)}
                          title={item.label}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                            icon === item.icon
                              ? "bg-primary/10 ring-2 ring-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <i className={`${item.icon} text-base text-primary`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("survey.categoryLabel")}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("survey.timeLabel")}
                    </label>
                    <select
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {["1 мин", "2 мин", "3 мин", "4 мин", "5 мин", "10 мин"].map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color + Status */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Primary Color */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("survey.colorLabel")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {/* Reset to default */}
                      <button
                        onClick={() => setPrimaryColor(null)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          primaryColor === null ? "ring-2 ring-offset-1 ring-primary border-primary" : "border-border hover:border-primary/50"
                        }`}
                        style={{ background: "conic-gradient(red, orange, yellow, green, blue, violet, red)" }}
                        title="По умолчанию"
                      />
                      {PRIMARY_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setPrimaryColor(c.value)}
                          title={c.label}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            primaryColor === c.value
                              ? "ring-2 ring-offset-1 ring-primary border-white scale-110"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ background: c.value }}
                        />
                      ))}
                    </div>
                    {primaryColor && (
                      <p className="mt-1 text-xs text-muted-foreground">{primaryColor}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t("survey.statusLabel")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus("published")}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                          status === "published"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <i className="fa-solid fa-globe mr-1.5" />
                        {t("survey.statusPublished")}
                      </button>
                      <button
                        onClick={() => setStatus("draft")}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-medium transition-all ${
                          status === "draft"
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            : "border-border text-muted-foreground hover:border-amber-400/60"
                        }`}
                      >
                        <i className="fa-solid fa-pen-ruler mr-1.5" />
                        {t("survey.statusDraft")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Questions */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("survey.questionsTitle")} ({questions.length})
                </h2>
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("survey.addQuestion")}
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {questions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="font-semibold">{idx + 1}-сұрақ</span>
                      </div>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="rounded-lg p-1.5 text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <input
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      placeholder={t("survey.questionPlaceholder")}
                      maxLength={200}
                      className="mb-3 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                    />

                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                      >
                        {(Object.keys(questionTypeLabels) as QuestionType[]).map((type) => (
                          <option key={type} value={type}>{questionTypeLabels[type]}</option>
                        ))}
                      </select>

                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                          className="rounded border-border accent-primary"
                        />
                        {t("survey.requiredLabel")}
                      </label>
                    </div>

                    {(q.type === "single" || q.type === "multiple") && (
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <input
                              value={opt.label}
                              onChange={(e) => updateOption(q.id, opt.id, e.target.value)}
                              placeholder={`${oi + 1}-нұсқа`}
                              maxLength={100}
                              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                            />
                            {q.options.length > 2 && (
                              <button
                                onClick={() => removeOption(q.id, opt.id)}
                                className="rounded p-1 text-destructive/50 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(q.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          {t("survey.addOption")}
                        </button>
                      </div>
                    )}

                    {q.type === "rating" && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <i className="fa-solid fa-star text-amber-400" />
                        Пайдаланушы 1-ден 5-ке дейін бағалайды
                      </p>
                    )}
                    {q.type === "text" && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <i className="fa-solid fa-pen text-primary" />
                        Пайдаланушы еркін жауап жазады
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {questions.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <i className="fa-solid fa-file-pen text-2xl text-muted-foreground" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{t("survey.noQuestions")}</p>
                </div>
              )}
            </div>

            {/* Save buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-end gap-3 border-t border-border pt-6"
            >
              <button
                onClick={() => navigate("/surveys")}
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 disabled:opacity-60 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <i className="fa-solid fa-pen-ruler h-4 w-4" />
                {t("survey.saveDraft")}
              </button>
              <button
                onClick={() => handleSave("published")}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t("survey.savePublish")}
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminPanel;
