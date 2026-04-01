import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Question } from "@/data/surveys";

interface QuestionRendererProps {
  question: Question;
  answer: string | string[] | number | undefined;
  onAnswer: (value: string | string[] | number) => void;
}

const QuestionRenderer = ({ question, answer, onAnswer }: QuestionRendererProps) => {
  const renderSingle = () => (
    <div className="mt-6 flex flex-col gap-3">
      {question.options?.map((opt) => {
        const selected = answer === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id)}
            className={`rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-card-foreground hover:border-primary/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const renderMultiple = () => {
    const selected = (answer as string[]) || [];
    return (
      <div className="mt-6 flex flex-col gap-3">
        {question.options?.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => {
                const next = isSelected
                  ? selected.filter((s) => s !== opt.id)
                  : [...selected, opt.id];
                onAnswer(next);
              }}
              className={`rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-card-foreground hover:border-primary/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && "✓"}
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
        <p className="text-xs text-muted-foreground">Бірнеше нұсқа таңдауға болады</p>
      </div>
    );
  };

  const renderRating = () => {
    const rating = (answer as number) || 0;
    return (
      <div className="mt-6 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onAnswer(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-10 w-10 transition-colors ${
                star <= rating
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderText = () => (
    <div className="mt-6">
      <textarea
        value={(answer as string) || ""}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Жауабыңызды жазыңыз..."
        rows={4}
        className="w-full rounded-xl border-2 border-border bg-card px-5 py-4 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none resize-none"
      />
    </div>
  );

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-xl font-bold text-foreground md:text-2xl leading-snug">
        {question.text}
      </h2>
      {question.required && (
        <span className="mt-2 inline-block text-xs text-destructive font-medium">
          * Міндетті сұрақ
        </span>
      )}
      {question.type === "single" && renderSingle()}
      {question.type === "multiple" && renderMultiple()}
      {question.type === "rating" && renderRating()}
      {question.type === "text" && renderText()}
    </motion.div>
  );
};

export default QuestionRenderer;
