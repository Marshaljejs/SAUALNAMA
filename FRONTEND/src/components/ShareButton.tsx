import { useState, useEffect, useRef } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ShareButtonProps {
  surveyId: string;
  title: string;
  className?: string;
}

const PLATFORMS = [
  {
    key: "telegram",
    label: "Telegram",
    color: "text-[#2AABEE]",
    href: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    color: "text-[#25D366]",
    href: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    color: "text-foreground",
    href: (url: string, title: string) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

const ShareButton = ({ surveyId, title, className = "" }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const surveyUrl = `${window.location.origin}/survey/${surveyId}`;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      toast.success("Сілтеме көшірілді");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Көшіру мүмкін болмады");
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const handlePlatformClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        title="Бөлісу"
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Share2 className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg"
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {copied
                ? <Check className="h-4 w-4 text-success" />
                : <Link2 className="h-4 w-4 text-muted-foreground" />
              }
              {copied ? "Көшірілді!" : "Сілтемені көшіру"}
            </button>

            <div className="my-1 border-t border-border" />

            {PLATFORMS.map((p) => (
              <a
                key={p.key}
                href={p.href(surveyUrl, title)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePlatformClick}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span className={`text-xs font-bold w-4 text-center ${p.color}`}>
                  {p.key === "telegram" && "TG"}
                  {p.key === "whatsapp" && "WA"}
                  {p.key === "twitter" && "X"}
                </span>
                <span className="text-foreground">{p.label}</span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareButton;
