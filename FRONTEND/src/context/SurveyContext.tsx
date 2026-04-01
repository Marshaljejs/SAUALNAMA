import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Survey } from "@/data/surveys";
import { fetchSurveys } from "@/lib/api";

interface SurveyContextType {
  surveys: Survey[];
  loading: boolean;
  addSurvey: (survey: Survey) => void;
  deleteSurvey: (id: string) => void;
  reloadSurveys: () => void;
}

const SurveyContext = createContext<SurveyContextType | null>(null);

export const SurveyProvider = ({ children }: { children: ReactNode }) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeSurvey = (s: any): Survey => ({
    ...s,
    icon: s.emoji || s.icon || "fa-solid fa-clipboard-list",
    estimatedTime: s.estimated_time || s.estimatedTime || "—",
    questions: s.questions || [],
    respondents: Number(s.respondents) || 0,
  });

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const data = await fetchSurveys();
      setSurveys(data.map(normalizeSurvey));
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const addSurvey = (survey: Survey) => {
    setSurveys((prev) => [...prev, survey]);
  };

  const deleteSurvey = (id: string) => {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <SurveyContext.Provider value={{ surveys, loading, addSurvey, deleteSurvey, reloadSurveys: loadSurveys }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurveys = () => {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurveys must be used within SurveyProvider");
  return ctx;
};