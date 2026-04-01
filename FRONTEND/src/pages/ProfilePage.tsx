import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, KeyRound, UserRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, updatePassword } from "@/lib/api";

// ── DiceBear avataaars (v7, стабильный SVG) ────────────────────────────────
// Пример: https://api.dicebear.com/7.x/avataaars/svg?seed=abc123
const dicebearUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const makeSeeds = () =>
  Array.from({ length: 6 }, () => Math.random().toString(36).slice(2, 10));

// ── Тайл аватара: спиннер пока грузится, ничего если ошибка ──────────────
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
      {/* Спиннер пока SVG не загружен */}
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

// ── Общие стили ────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors";

const cardCls =
  "rounded-2xl border border-slate-200 dark:border-slate-700 bg-card p-6 shadow-sm";

// ── Страница ───────────────────────────────────────────────────────────────
const ProfilePage = () => {
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
      toast.success("Аватар сәтті сақталды");
    } catch (err: any) {
      toast.error(err.message);
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
      toast.success("Логин сәтті өзгертілді");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Жаңа кілтсөздер сәйкес келмейді");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success("Кілтсөз сәтті өзгертілді");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-xl space-y-5">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Аватарды, логинді және кілтсөзді өзгертуге болады
            </p>
          </motion.div>

          {/* ── Аватар ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={cardCls}
          >
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="h-4 w-4 text-primary" />
              Аватар таңдау
            </h2>

            {/* Текущий аватар */}
            <div className="mb-5 flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary bg-muted">
                {user?.avatar ? (
                  <img
                    src={dicebearUrl(user.avatar)}
                    alt="avatar"
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                    {(user?.username ?? "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.avatar ? "Аватар орнатылған" : "Аватар таңдалмаған"}
                </p>
              </div>
            </div>

            {/* Сетка 6 аватаров */}
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
                Жаңа нұсқалар
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={saving || !selected || selected === user?.avatar}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Сақтау
              </button>
            </div>
          </motion.section>

          {/* ── Никнейм ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cardCls}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="h-4 w-4 text-primary" />
              Логинді өзгерту
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Жаңа логин"
                className={inputCls}
              />
              <button
                onClick={handleSaveUsername}
                disabled={savingUsername || !newUsername.trim() || newUsername.trim() === user?.username}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 whitespace-nowrap transition-opacity"
              >
                {savingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сақтау"}
              </button>
            </div>
          </motion.section>

          {/* ── Пароль ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cardCls}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              Кілтсөзді өзгерту
            </h2>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ағымдағы кілтсөз"
                className={inputCls}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Жаңа кілтсөз (кем дегенде 6 таңба)"
                className={inputCls}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Жаңа кілтсөзді қайталаңыз"
                className={inputCls}
              />
              <button
                onClick={handleSavePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Кілтсөзді өзгерту"}
              </button>
            </div>
          </motion.section>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
