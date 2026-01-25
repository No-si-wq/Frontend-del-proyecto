import React, { createContext, useState, useEffect } from "react";
import apiClient from "../api/axios";

export const AuthContext = createContext();

const initialAuthState = {
  token: null,
  user: null,
};

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(initialAuthState);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      setIsAuthReady(true);
      return;
    }

    const validateSession = async () => {
      try {
        const res = await apiClient.get("/api/auth/validate");

        setAuth({
          token,
          user: res.data.user,
        });
      } catch (err) {
        console.warn("Sesión inválida o expirada", err);
        sessionStorage.removeItem("token");
        setAuth(initialAuthState);
      } finally {
        setIsAuthReady(true);
      }
    };

    validateSession();
  }, []);

  const handleLogin = ({ token, user }) => {
    sessionStorage.setItem("token", token);

    setAuth({
      token,
      user,
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setAuth(initialAuthState);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        isAuthReady,
        isAuthenticated: !!auth.token,
        handleLogin,
        handleLogout,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;