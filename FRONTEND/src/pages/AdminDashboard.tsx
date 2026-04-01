import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ClipboardList, BarChart3, Trash2, Shield, ShieldOff, Loader2, Eye, EyeOff, Ban } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { fetchAdminStats, fetchAdminUsers, fetchAdminSurveys, updateUserRole, adminDeleteUser, adminDeleteSurvey, toggleSurveyPublish, banUser } from "@/lib/api";

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"stats" | "users" | "surveys">("stats");
  const [stats, setStats] = useState<{ users: { total: number; admins: number; regular: number }; surveys: { total: number; published: number }; responses: { total: number } } | null>(null);
  const [users, setUsers] = useState<{ id: number; username: string; role: string; is_banned: boolean; survey_count: number; created_at: string }[]>([]);
  const [surveys, setSurveys] = useState<{ id: string; title: string; icon: string; owner_name: string; is_published: boolean; response_count: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
  }, [isAdmin]);

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    if (tab === "surveys" && surveys.length === 0) loadSurveys();
  }, [tab]);

  const loadStats = async () => {
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
    finally { setLoading(false); }
  };

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSurveys();
      setSurveys(data.map((s: any) => ({
        ...s,
        icon: s.emoji || s.icon || "fa-solid fa-clipboard-list",
      })));
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
    finally { setLoading(false); }
  };

  const handleBanToggle = async (userId: number, currentBanned: boolean) => {
    try {
      await banUser(userId, !currentBanned);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: !currentBanned } : u));
      toast.success(!currentBanned ? "Пайдаланушы бандалды" : "Бан алынды");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
  };

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Рөл өзгертілді: ${newRole}`);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`"${username}" пайдаланушысын жоясыз ба?`)) return;
    try {
      await adminDeleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("Пайдаланушы жойылды");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
  };

  const handleDeleteSurvey = async (id: string, title: string) => {
    if (!confirm(`"${title}" сауалнамасын жоясыз ба?`)) return;
    try {
      await adminDeleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success("Сауалнама жойылды");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      await toggleSurveyPublish(id, !current);
      setSurveys((prev) => prev.map((s) => s.id === id ? { ...s, is_published: !current } : s));
      toast.success(!current ? "Жарияланды" : "Жасырылды");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Қате"); }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <i className="fa-solid fa-lock text-3xl text-destructive"></i>
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold">Рұқсат жоқ</h2>
            <p className="mt-2 text-muted-foreground">Тек администраторларға арналған</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Админ панелі</h1>
                <p className="text-sm text-muted-foreground">Барлығын басқару</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-border">
            {[
              { key: "stats", label: "Статистика", icon: BarChart3 },
              { key: "users", label: "Пайдаланушылар", icon: Users },
              { key: "surveys", label: "Сауалнамалар", icon: ClipboardList },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as "stats" | "users" | "surveys")}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>

          {/* STATS */}
          {tab === "stats" && stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Жалпы пайдаланушылар", value: stats.users.total, faIcon: "fa-solid fa-users", color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Администраторлар", value: stats.users.admins, faIcon: "fa-solid fa-crown", color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Сауалнамалар", value: stats.surveys.total, faIcon: "fa-solid fa-clipboard-list", color: "text-primary", bg: "bg-primary/10" },
                { label: "Жалпы жауаптар", value: stats.responses.total, faIcon: "fa-solid fa-circle-check", color: "text-success", bg: "bg-success/10" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  {/* эмодзи → Font Awesome иконка */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                    <i className={`${stat.faIcon} ${stat.color} text-lg`}></i>
                  </div>
                  <p className={`mt-3 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* USERS */}
          {tab === "users" && (
            loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Логин</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Рөл</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Күй</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Сауалнамалар</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Тіркелді</th>
                      <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Әрекет</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-foreground">{u.username}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                          }`}>
                            <i className={u.role === "admin" ? "fa-solid fa-crown text-amber-500" : "fa-solid fa-user"}></i>
                            {u.role === "admin" ? "Админ" : "Пайдаланушы"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.is_banned ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                          }`}>
                            {u.is_banned ? "Бандалған" : "Белсенді"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{u.survey_count}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("kk-KZ")}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleRoleChange(u.id, u.role)}
                              className={`rounded-lg p-1.5 transition-colors ${
                                u.role === "admin"
                                  ? "text-amber-500 hover:bg-amber-50"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                              title={u.role === "admin" ? "Пайдаланушы ету" : "Админ ету"}
                            >
                              {u.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleBanToggle(u.id, u.is_banned)}
                              className={`rounded-lg p-1.5 transition-colors ${
                                u.is_banned
                                  ? "text-success hover:bg-success/10"
                                  : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              }`}
                              title={u.is_banned ? "Бан алу" : "Бандау"}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "surveys" && (
            loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Сауалнама</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Иесі</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Жауаптар</th>
                      <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Күй</th>
                      <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Әрекет</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {surveys.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {/* s.emoji → Font Awesome иконка */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <i className={`${s.icon} text-sm text-primary`}></i>
                            </div>
                            <span className="font-medium text-foreground">{s.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{s.owner_name || "—"}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{s.response_count}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            s.is_published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}>
                            {s.is_published ? "Жарияланған" : "Жасырын"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleTogglePublish(s.id, s.is_published)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                              title={s.is_published ? "Жасыру" : "Жариялау"}
                            >
                              {s.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteSurvey(s.id, s.title)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;