import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("spendwise_token");

    if (!token) {
      setLoading(false);
      return;
    }

    if (token === "offline-demo") {
      const offlineUser = JSON.parse(localStorage.getItem("spendwise_user") || "null");
      setUser(offlineUser);
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem("spendwise_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (token, userData) => {
    if (token && typeof token === "object") {
      userData = token.user;
      token = token.token;
    }
    localStorage.setItem("spendwise_token", token);
    if (userData?.offlineDemo) localStorage.setItem("spendwise_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("spendwise_token");
    localStorage.removeItem("spendwise_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}