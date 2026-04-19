import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiLogin, apiRegister, type User, type UserRole } from '../lib/authApi';
import { getMe } from '../lib/userApi';

type GuestRole = 'guest';
export type AppRole = UserRole | GuestRole;

export interface AppUser extends User {
  role: AppRole;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: AppRole) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<AppUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const refreshUser = async () => {
    try {
      const me = (await getMe()) as any;
      const u: AppUser = { ...me };
      setUser(u);
      localStorage.setItem('currentUser', JSON.stringify(u));
    } catch {
      // token yaroqsiz bo'lsa, xotirjam logout
      // (Bu yerda avtomatik logout qilmaymiz, user o'zi chiqadi)
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      // backenddagi eng so'nggi user ma'lumotini tortib kelamiz (avatar_url ham)
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await apiLogin(email, password);
      localStorage.setItem('token', token);
      const u: AppUser = { ...user };
      setUser(u);
      localStorage.setItem('currentUser', JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: AppRole = 'participant'
  ): Promise<boolean> => {
    try {
      const realRole = role === 'guest' ? 'participant' : role;
      const { token, user } = await apiRegister(name, email, password, realRole);
      localStorage.setItem('token', token);
      const u: AppUser = { ...user };
      setUser(u);
      localStorage.setItem('currentUser', JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  const updateProfile = (updates: Partial<AppUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, login, register, logout, updateProfile, refreshUser }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
