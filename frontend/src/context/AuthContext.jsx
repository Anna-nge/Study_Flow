import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api";
import { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // On first load, if a token exists, fetch the profile it belongs to.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // The API client fires this when the server answers 401.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("studyflow:logout", onLogout);
    return () => window.removeEventListener("studyflow:logout", onLogout);
  }, []);

  const handleAuth = ({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const login = useCallback((email, password) => authApi.login({ email, password }).then(handleAuth), []);
  const register = useCallback((data) => authApi.register(data).then(handleAuth), []);
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
