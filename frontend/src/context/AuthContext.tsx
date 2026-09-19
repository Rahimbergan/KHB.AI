import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  companyName?: string;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => { success: boolean; error?: string };
  signUp: (name: string, email: string, password: string) => { success: boolean; error?: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'khb_auth_user';
const STORAGE_KEY_USERS_DB = 'khb_registered_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only restore if user explicitly signed up or signed in
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // invalid json
      }
    }
    return null; // Guest by default: Must register or sign in first!
  });

  const signIn = (email: string, password: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Iltimos, Gmail va parolni kiriting.' };
    }

    // Check registered users list from localStorage
    const existingUsersRaw = localStorage.getItem(STORAGE_KEY_USERS_DB);
    const users: Array<{ name: string; email: string; password: string; companyName?: string }> = existingUsersRaw
      ? JSON.parse(existingUsersRaw)
      : [];

    const found = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.password === password) {
        const loggedUser: UserProfile = {
          name: found.name,
          email: found.email,
          companyName: found.companyName || 'KHB Smart Retail',
          role: 'Business Owner'
        };
        setUser(loggedUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(loggedUser));
        return { success: true };
      } else {
        return { success: false, error: 'Parol noto‘g‘ri kiritildi.' };
      }
    }

    // Demo admin check
    if (cleanEmail === 'admin@khb.ai' && password === 'admin123') {
      const adminUser: UserProfile = {
        name: 'Rahimbergan',
        email: 'admin@khb.ai',
        companyName: 'KHB Smart Retail',
        role: 'Business Owner'
      };
      setUser(adminUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(adminUser));
      return { success: true };
    }

    return { success: false, error: 'Bunday hisob topilmadi. Iltimos, avval ro‘yxatdan o‘ting.' };
  };

  const signUp = (name: string, email: string, password: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, error: 'Iltimos, ism yoki kompaniya nomini kiriting.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Iltimos, haqiqiy Gmail yoki email manzilini kiriting.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Parol kamida 4 ta belgidan iborat bo‘lishi kerak.' };
    }

    // Save to users database in localStorage
    const existingUsersRaw = localStorage.getItem(STORAGE_KEY_USERS_DB);
    const users: Array<{ name: string; email: string; password: string; companyName?: string }> = existingUsersRaw
      ? JSON.parse(existingUsersRaw)
      : [];

    const newUserEntry = {
      name: cleanName,
      email: cleanEmail,
      password: password,
      companyName: cleanName
    };

    users.push(newUserEntry);
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

    // Instantly log in the new user (no confirmation needed per spec)
    const newUser: UserProfile = {
      name: cleanName,
      email: cleanEmail,
      companyName: cleanName,
      role: 'Business Owner'
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

    return { success: true };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
