import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Menu, X, LogOut, User, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Жүйеден шықтыңыз");
    navigate("/");
  };

  const links = [
    { to: "/", label: "Басты бет" },
    { to: "/surveys", label: "Сауалнамалар" },
    { to: "/results", label: "Нәтижелер" },
    ...(user ? [{ to: "/my-surveys", label: "Менікі" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Админ" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ClipboardList className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Сауалнама</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                {isAdmin ? <Shield className="h-3.5 w-3.5 text-amber-500" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Шығу
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 transition-all"
            >
              Кіру
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-foreground md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border bg-background px-4 pb-4 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="mt-2 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="mr-2 inline h-4 w-4" />
              Шығу ({user.username})
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Кіру
            </Link>
          )}
        </motion.nav>
      )}
    </header>
  );
};

export default Header;
