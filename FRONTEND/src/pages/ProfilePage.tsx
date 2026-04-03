import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, KeyRound, UserRound, RefreshCw, Zap, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, updatePassword, fetchUserStats } from "@/lib/api";

const dicebearUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const makeSeeds = () =>
  Array.from({ length: 6 }, () => Math.random().toString(36).slice(2, 10));

const AvatarTile = ({
  seed,
  selected,
  onClick,
}: {
  seed: string;
  selected: boolean;
  onClick: () => void;
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-all duration-200 bg-muted ${
        selected
          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-card scale-105 shadow-lg shadow-primary/20"
          : "border-slate-200 dark:border-slate-700 hover:border-primary/60 hover:scale-105"
      }`}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={dicebearUrl(seed)}
        alt=""
        onLoad={() => setLoaded(true)}
        className={`h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {selected && loaded && (
        <div className="absolute bottom-1 right-1 rounded-full bg-primary p-0.5 shadow">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </button>
  );
};

const XP_THRESHOLDS = [0, 100, 250, 500, 1000];

const getLevelProgress = (xp: number, level: number) => {
  const currentThreshold = XP_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  if (level >= XP_THRESHOLDS.length) return 100;
  const range = nextThreshold - currentThreshold;
  const progress = ((xp - currentThreshold) / range) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

const inputCls =
  "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors";

const cardCls =
  "rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-6 shadow-sm";

interface Achievement {
  id: string;
  name_kz: string;
  name_ru: string;
  name_en: string;
  description_kz: string;
  icon: string;
  xp_reward: number;
  earned_at: string;
}

interface UserStats {
  xp: number;
  level: number;
  streak_count: number;
  achievements: Achievement[];
}

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();

  const [seeds, setSeeds] = useState<string[]>(makeSeeds);
  const [selected, setSelected] = useState<string>(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);

  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserStats(user.id)
      .then(setStats)
      .catch(() => {
        setStats({
          xp: user.xp ?? 0,
          level: user.level ?? 1,
          streak_count: user.streak_count ?? 0,
          achievements: [],
        });
      });
  }, [user]);

  const handleRefresh = () => {
    setSeeds(makeSeeds());
    setSelected("");
  };

  const handleSaveAvatar = async () => {
    if (!selected || selected === user?.avatar) return;
    setSaving(true);
    try {
      const data = await updateProfile({ avatar: selected });
      updateUser({ avatar: data.user.avatar });
      toast.success(t("profile.avatarSaved"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === user?.username) return;
    setSavingUsername(true);
    try {
      const data = await updateProfile({ username: trimmed });
      updateUser({ username: data.user.username });
      toast.success(t("profile.usernameSaved"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success(t("profile.passwordSaved"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSavingPassword(false);
    }
  };

  const getAchievementName = (a: Achievement) => {
    if (i18n.language === "ru") return a.name_ru;
    if (i18n.language === "en") return a.name_en;
    return a.name_kz;
  };

  const getLevelName = (level: number) => {
    const names = t("profile.levelNames", { returnObjects: true }) as Record<string, string>;
    return names[String(level)] ?? `${t("profile.level")} ${level}`;
  };

  const xp = stats?.xp ?? user?.xp ?? 0;
  const level = stats?.level ?? user?.level ?? 1;
  const streak = stats?.streak_count ?? user?.streak_count ?? 0;
  const levelProgress = getLevelProgress(xp, level);
  const nextLevelXp = XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-xl space-y-5">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">{t("profile.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("profile.subtitle")}</p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className={cardCls}
          >
            <div className="flex items-center gap-6 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    {t("profile.level")} {level} — {getLevelName(level)}
                  </span>
                  <span className="text-xs font-bold text-foreground">{xp} XP</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {level < 5 && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {t("profile.xpToNext", { xp: nextLevelXp - xp })}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Flame className={`h-5 w-5 ${streak > 0 ? "text-orange-500" : "text-muted-foreground/30"}`} />
                </div>
                <span className="text-xs font-bold text-foreground">{streak}</span>
                <span className="text-[10px] text-muted-foreground">{t("profile.streak")}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                {t("profile.achievementsTitle")}
              </h3>
              {stats && stats.achievements.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.achievements.map((a) => (
                    <motion.div
                      key={a.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      title={`${getAchievementName(a)} (+${a.xp_reward} XP)`}
                      className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 dark:border-amber-800/40 dark:bg-amber-900/20"
                    >
                      <i className={`${a.icon} text-xs text-amber-600 dark:text-amber-400`} />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {getAchievementName(a)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("profile.noAchievements")}</p>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={cardCls}
          >
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="h-4 w-4 text-primary" />
              {t("profile.avatarTitle")}
            </h2>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary bg-muted">
                {user?.avatar ? (
                  <img src={dicebearUrl(user.avatar)} alt="avatar" className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                    {(user?.username ?? "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.avatar ? t("profile.currentAvatar") : t("profile.noAvatar")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 mb-4">
              {seeds.map((seed) => (
                <AvatarTile
                  key={seed}
                  seed={seed}
                  selected={selected === seed}
                  onClick={() => setSelected(seed)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("profile.newOptions")}
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={saving || !selected || selected === user?.avatar}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t("common.save")}
              </button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cardCls}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="h-4 w-4 text-primary" />
              {t("profile.usernameTitle")}
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t("profile.newUsername")}
                className={inputCls}
              />
              <button
                onClick={handleSaveUsername}
                disabled={savingUsername || !newUsername.trim() || newUsername.trim() === user?.username}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 whitespace-nowrap transition-opacity"
              >
                {savingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cardCls}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              {t("profile.passwordTitle")}
            </h2>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("profile.currentPassword")}
                className={inputCls}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("profile.newPassword")}
                className={inputCls}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("profile.confirmPassword")}
                className={inputCls}
              />
              <button
                onClick={handleSavePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : t("profile.changePassword")}
              </button>
            </div>
          </motion.section>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
