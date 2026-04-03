import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSurveys } from "@/context/SurveyContext";
import { fetchStats } from "@/lib/api";

const COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 65%, 50%)",
];

interface StatItem {
  questionId: string;
  questionText: string;
  type: string;
  data?: { label: string; count: number }[];
  average?: string;
  count?: number;
  answers?: string[];
}

interface SurveyStats {
  total: number;
  stats: StatItem[];
}

const Results = () => {
  const { surveys } = useSurveys();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string>("");
  const [statsData, setStatsData] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const paramId = searchParams.get("survey");
    if (paramId) {
      setSelectedId(paramId);
    } else if (surveys.length > 0 && !selectedId) {
      setSelectedId(surveys[0].id);
    }
  }, [surveys, searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    loadStats(selectedId);
  }, [selectedId]);

  const loadStats = async (id: string) => {
    setLoading(true);
    setStatsData(null);
    try {
      const data = await fetchStats(id);
      setStatsData(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const selectedSurvey = surveys.find((s) => s.id === selectedId);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("resultsPage.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("resultsPage.subtitle")}</p>
          </motion.div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: t("resultsPage.totalParticipants"), value: surveys.reduce((a, s) => a + s.respondents, 0), faIcon: "fa-solid fa-users", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
              { label: t("resultsPage.totalSurveys"), value: surveys.length, faIcon: "fa-solid fa-clipboard-list", color: "text-primary", bg: "bg-primary/10" },
              { label: t("resultsPage.selectedAnswers"), value: statsData?.total ?? "—", faIcon: "fa-solid fa-chart-bar", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <i className={`${stat.faIcon} ${stat.color} text-lg`}></i>
                </div>
                <p className="mt-3 text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("resultsPage.selectLabel")}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : statsData && statsData.total === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <i className="fa-solid fa-inbox text-2xl text-muted-foreground"></i>
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">{t("resultsPage.noAnswers")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("resultsPage.noAnswersDesc", { title: selectedSurvey?.title })}
              </p>
            </div>
          ) : statsData ? (
            <div className="space-y-6">
              {statsData.stats.map((stat, i) => (
                <motion.div
                  key={stat.questionId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <h3 className="mb-4 font-bold text-card-foreground">
                    {i + 1}. {stat.questionText}
                  </h3>

                  {(stat.type === "single" || stat.type === "multiple") && stat.data && (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stat.data.map((d) => ({ name: d.label, value: d.count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(160,15%,88%)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {stat.data.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {stat.type === "rating" && (
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                        <span className="text-3xl font-black text-amber-500">{stat.average}</span>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("resultsPage.averageRating")}</p>
                        <div className="mt-1 flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fa-solid fa-star text-xl ${
                                star <= Math.round(parseFloat(stat.average || "0"))
                                  ? "text-amber-400"
                                  : "text-muted"
                              }`}
                            ></i>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("resultsPage.answerCount", { count: stat.count })}
                        </p>
                      </div>
                    </div>
                  )}

                  {stat.type === "text" && stat.answers && (
                    <div className="space-y-2">
                      {stat.answers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("resultsPage.textEmpty")}</p>
                      ) : (
                        stat.answers.map((ans, idx) => (
                          <div key={idx} className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
                            {ans}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Results;
