import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import apiClient from "../api/axios";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: null,
    roleId: null,
    companyId: null,
    username: null,
    permissions: [],
  });

  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setIsAuthReady(true);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const { roleId, companyId, username, exp } = decoded;

      if (Date.now() >= exp * 1000) {
        console.warn("Token expirado al cargar");
        sessionStorage.removeItem("token");
        setAuth({
          token: null,
          roleId: null,
          companyId: null,
          username: null,
          permissions: [],
        });
        setIsAuthReady(true);
        return;
      }

      const fetchPermissions = async () => {
        try {
          const res = await apiClient.get(`/api/roles/${roleId}/permisos`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const permissions = res.data.map(
            (p) => p.key ?? p.permission?.key
          );

          setAuth({
            token,
            roleId,
            companyId,
            username,
            permissions,
          });

        } catch (error) {
          console.error("Error obteniendo permisos iniciales:", error);

          setAuth({
            token,
            roleId,
            companyId,
            username,
            permissions: [],
          });

        } finally {
          setIsAuthReady(true);
        }
      };

      fetchPermissions();

    } catch (error) {
      console.error("Token inválido al cargar:", error);
      sessionStorage.removeItem("token");

      setAuth({
        token: null,
        roleId: null,
        companyId: null,
        username: null,
        permissions: [],
      });

      setIsAuthReady(true);
    }
  }, []);

  const handleLogin = async ({ token, username, roleId, permissions }) => {
    try {
      const decoded = jwtDecode(token);
      const { roleId: jwtRoleId, companyId, exp } = decoded;

      const finalRoleId = roleId || jwtRoleId;

      if (Date.now() >= exp * 1000) {
        console.warn("Token expirado al iniciar sesión");
        sessionStorage.removeItem("token");
        return;
      }

      sessionStorage.setItem("token", token);

      let finalPermissions = permissions;

      if (!finalPermissions || finalPermissions.length === 0) {
        try {
          const res = await apiClient.get(`/api/roles/${finalRoleId}/permisos`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          finalPermissions = res.data.map(
            (p) => p.key ?? p.permission?.key
          );

        } catch (err) {
          console.error("Error obteniendo permisos al iniciar sesión:", err);
          finalPermissions = [];
        }
      }

      setAuth({
        token,
        roleId: finalRoleId,
        companyId,
        username: username ?? decoded.username,
        permissions: finalPermissions,
      });

    } catch (error) {
      console.error("Error decodificando token al iniciar sesión:", error);
      sessionStorage.removeItem("token");

      setAuth({
        token: null,
        roleId: null,
        companyId: null,
        username: null,
        permissions: [],
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setAuth({
      token: null,
      roleId: null,
      companyId: null,
      username: null,
      permissions: [],
    });
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        isAuthReady,
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