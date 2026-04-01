import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, BarChart2, Loader2 } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { fetchMySurveys, deleteSurvey } from "@/lib/api";

interface Survey {
  id: string;
  title: string;
  icon: string;
  category: string;
  is_published: boolean;
  response_count: number;
  created_at: string;
}

const MySurveys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const data = await fetchMySurveys();
      setSurveys(data.map((s: any) => ({
        ...s,
        icon: s.emoji || s.icon || "fa-solid fa-clipboard-list",
      })));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Қате орын алды");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" сауалнамасын жоясыз ба?`)) return;
    setDeletingId(id);
    try {
      await deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success("Сауалнама жойылды");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Қате орын алды");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground">Менің сауалнамаларым</h1>
              <p className="mt-1 text-muted-foreground">
                Сәлем, {user?.username}!{" "}
                <i className="fa-solid fa-hand-wave text-amber-400"></i>
              </p>
            </div>
            <Link
              to="/create"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" /> Жаңа сауалнама
            </Link>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : surveys.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <i className="fa-solid fa-clipboard-list text-3xl text-muted-foreground"></i>
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">Сауалнама жоқ</p>
              <p className="mt-1 text-sm text-muted-foreground">Алғашқы сауалнамаңызды жасаңыз!</p>
              <Link
                to="/create"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Жасау
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {surveys.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <i className={`${s.icon} text-xl text-primary`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-card-foreground truncate">{s.title}</h3>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.is_published
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {s.is_published ? "Жарияланған" : "Жасырын"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.category} · {s.response_count} жауап
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ShareButton surveyId={s.id} title={s.title} />
                    <button
                      onClick={() => navigate(`/results?survey=${s.id}`)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Нәтижелер"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.title)}
                      disabled={deletingId === s.id}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                      title="Жою"
                    >
                      {deletingId === s.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MySurveys;
