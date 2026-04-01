import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import type { Survey } from "@/data/surveys";

interface SurveyCardProps {
  survey: Survey;
  index: number;
}

const SurveyCard = ({ survey, index }: SurveyCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
  >
    <Link
      to={`/survey/${survey.id}`}
      className="group block rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <i className={`${survey.icon} text-2xl text-primary`}></i>
      </div>

      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {survey.category}
      </span>
      <h3 className="mt-3 text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
        {survey.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {survey.description}
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {survey.estimatedTime}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {survey.respondents} қатысушы
        </span>
      </div>
    </Link>
  </motion.div>
);

export default SurveyCard;