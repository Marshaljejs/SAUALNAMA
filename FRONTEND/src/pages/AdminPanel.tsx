import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GripVertical, ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSurveys } from "@/context/SurveyContext";
import { createSurvey } from "@/lib/api";
import type { Question, QuestionType, QuestionOption } from "@/data/surveys";

// ← ИКОНКИ вместо эмодзи
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

const AdminPanel = () => {
  const navigate = useNavigate();
  const { addSurvey } = useSurveys();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("fa-solid fa-clipboard-list"); // ← emoji → icon
  const [category, setCategory] = useState("Технология");
  const [estimatedTime, setEstimatedTime] = useState("3 мин");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);

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
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: [...q.options, { id: generateId(), label: "" }] }
          : q
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
        q.id === qId
          ? { ...q, options: q.options.filter((o) => o.id !== oId) }
          : q
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
          if (!q.options[j].label.trim())
            return `${i + 1}-сұрақтың ${j + 1}-нұсқасын жазыңыз`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      await new Promise((res) => setTimeout(res, 800));

      const newSurvey = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        icon, // ← emoji → icon
        category,
        estimatedTime,
        respondents: 0,
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
      toast.success("Сауалнама сәтті сақталды!");
      navigate("/surveys");
    } catch {
      toast.error("Қате орын алды. Қайта көріңіз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Артқа
            </button>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Жаңа сауалнама құру
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Сұрақтарды қосып, сауалнаманы жариялаңыз
            </p>
          </motion.div>

          {/* Survey info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="mb-4 text-sm font-semibold text-card-foreground">Негізгі мәліметтер</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Атауы *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Мысалы: Технология әдеттері"
                  maxLength={100}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Сипаттама *</label>
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
                {/* ИКОНКИ вместо эмодзи-кнопок */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Иконка</label>
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
                        <i className={`${item.icon} text-base text-primary`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Санат</label>
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

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Уақыт</label>
                  <select
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {["1 мин", "2 мин", "3 мин", "4 мин", "5 мин", "10 мин"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Questions */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Сұрақтар ({questions.length})</h2>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <Plus className="h-3.5 w-3.5" />
                Сұрақ қосу
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
                    placeholder="Сұрақ мәтіні..."
                    maxLength={200}
                    className="mb-3 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {(Object.keys(questionTypeLabels) as QuestionType[]).map((t) => (
                        <option key={t} value={t}>{questionTypeLabels[t]}</option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                        className="rounded border-border accent-primary"
                      />
                      Міндетті
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
                        Нұсқа қосу
                      </button>
                    </div>
                  )}

                  {/* ⭐ → fa-star */}
                  {q.type === "rating" && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <i className="fa-solid fa-star text-amber-400"></i>
                      Пайдаланушы 1-ден 5-ке дейін бағалайды
                    </p>
                  )}

                  {/* ✏️ → fa-pen */}
                  {q.type === "text" && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <i className="fa-solid fa-pen text-primary"></i>
                      Пайдаланушы еркін жауап жазады
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 📝 → fa-file-pen */}
            {questions.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <i className="fa-solid fa-file-pen text-2xl text-muted-foreground"></i>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Әзірге сұрақ жоқ. «Сұрақ қосу» батырмасын басыңыз
                </p>
              </div>
            )}
          </div>

          {/* Save */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end gap-3 border-t border-border pt-6"
          >
            <button
              onClick={() => navigate("/surveys")}
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Бас тарту
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Жүктелуде...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сақтау
                </>
              )}
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;