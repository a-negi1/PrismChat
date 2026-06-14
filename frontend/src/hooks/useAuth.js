import { useState, useEffect } from "react";
import { auth, signOut } from "../services/firebase";

const STORAGE_KEY = "prism_user";

export const useAuth = () => {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const login = (userData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try { await signOut(auth); } catch (_) {}
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    setUser(updatedData);
  };

  return { user, login, logout, updateUser };
};
