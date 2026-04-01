import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "@/lib/api";

export interface User {
  id: number;
  username: string;
  role: "user" | "admin";
  avatar?: string | null;
  xp: number;
  level: number;
  streak_count: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser) as User;
        // Обратная совместимость: старые данные без xp/level/streak
        setUser({
          xp: 0,
          level: 1,
          streak_count: 0,
          ...parsed,
        });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    setToken(data.token);
    const u: User = { xp: 0, level: 1, streak_count: 0, ...data.user };
    setUser(u);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const register = async (username: string, password: string) => {
    const data = await apiRegister(username, password);
    setToken(data.token);
    const u: User = { xp: 0, level: 1, streak_count: 0, ...data.user };
    setUser(u);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      isAdmin: user?.role === "admin",
      isLoading,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
