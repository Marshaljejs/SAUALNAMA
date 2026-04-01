import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Shield, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SurveyCard from "@/components/SurveyCard";
import { useSurveys } from "@/context/SurveyContext";
import bgImage from "@/assets/bg.jpg";

const features = [
  {
    icon: Zap,
    title: "Жылдам және оңай",
    desc: "Сауалнамалар 3-5 минутта аяқталады",
  },
  {
    icon: Shield,
    title: "Құпиялылық",
    desc: "Деректеріңіз толық қорғалған",
  },
  {
    icon: BarChart3,
    title: "Нәтижелер",
    desc: "Статистиканы нақты уақытта көріңіз",
  },
];

const Index = () => {
  const { surveys } = useSurveys();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden py-20 md:py-32"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/20 dark:bg-black/50" />
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-2xl text-center"
            >
              <span className="inline-block rounded-full bg-white/60 dark:bg-white/10 px-4 py-1.5 text-xs font-bold text-primary dark:text-primary backdrop-blur-sm border border-transparent dark:border-white/10">
                Қазақша сауалнама платформасы
             </span>
              <h1 className="mt-6 text-4xl font-black leading-tight text-foreground md:text-6xl">
                Пікіріңізді{" "}
                <span className="text-gradient-hero">білдіріңіз</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Қоғам үшін маңызды тақырыптар бойынша сауалнамаларға қатысыңыз. Сіздің пікіріңіз маңызды!
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/surveys"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                >
                  Бастау
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        </section>

        {/* Features */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="rounded-2xl border border-border bg-card p-6 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-bold text-card-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular surveys */}
        <section className="border-t border-border bg-secondary/20 py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Танымал сауалнамалар
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ең көп қатысушылар жинаған сауалнамалар
                </p>
              </div>
              <Link
                to="/surveys"
                className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex items-center gap-1"
              >
                Барлығын көру <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {surveys.slice(0, 3).map((s, i) => (
                <SurveyCard key={s.id} survey={s} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;