// ─── Auth Context ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@herpass_user');
        if (stored) setUser(JSON.parse(stored));
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    const userData = data.user;
    setUser(userData);
    await AsyncStorage.setItem('@herpass_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@herpass_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
