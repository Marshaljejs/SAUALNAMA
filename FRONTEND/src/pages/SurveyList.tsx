import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SurveyCard from "@/components/SurveyCard";
import { useSurveys } from "@/context/SurveyContext";

const SurveyList = () => {
  const { surveys } = useSurveys();

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
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Жаңа
            </Link>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((s, i) => (
              <SurveyCard key={s.id} survey={s} index={i} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SurveyList;
