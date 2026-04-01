import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SurveyCard from "@/components/SurveyCard";
import { useSurveys } from "@/context/SurveyContext";
import { useAuth } from "@/context/AuthContext";

const SurveyList = () => {
  const { surveys, loading } = useSurveys();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex items-end justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                Сауалнамалар
              </h1>
              <p className="mt-2 text-muted-foreground">
                Қатысу үшін сауалнаманы таңдаңыз
              </p>
            </div>
            {user && (
              <Link
                to="/create"
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Жаңа
              </Link>
            )}
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
              <p className="mt-1 text-sm text-muted-foreground">Әзірге сауалнамалар жарияланбаған</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {surveys.map((s, i) => (
                <SurveyCard key={s.id} survey={s} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SurveyList;
