import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { Flame } from "lucide-react";

const StreakResetModal = () => {
  const { streakReset, dismissStreakReset } = useAuth();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {streakReset && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={dismissStreakReset}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.85, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4"
          >
            <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-2xl text-center">

              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-orange-500/15 dark:bg-orange-500/10 blur-xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 dark:bg-orange-500/[0.08] border border-orange-500/20">
                  <span className="text-5xl select-none">😔</span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-center gap-2">
                <div className="relative">
                  <Flame className="h-5 w-5 text-orange-400/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-px w-7 rotate-45 bg-destructive/70" />
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Streak
                </span>
                <div className="relative">
                  <Flame className="h-5 w-5 text-orange-400/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-px w-7 rotate-45 bg-destructive/70" />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-black text-foreground leading-snug">
                {t("streak.resetTitle")}
              </h2>

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t("streak.resetDesc")}
              </p>

              <p className="mt-2 text-xs font-medium text-primary/80">
                {t("streak.bestMotivation")}
              </p>
              <button
                onClick={dismissStreakReset}
                className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0"
              >
                {t("streak.resetBtn")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StreakResetModal;
