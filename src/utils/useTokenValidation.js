import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../hooks/AuthProvider";
import apiClient from "../api/axios";

export function useTokenValidation() {
  const { setAuth, logout } = useContext(AuthContext);
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const validate = async () => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const res = await apiClient.get("/api/auth/validate");

        setAuth({
          token,
          user: res.data.user,
        });

        setIsValid(true);
      } catch (err) {
        console.warn("Token inválido o expirado", err);
        logout();
        setIsValid(false);
      }
    };

    validate();
  }, [setAuth, logout]);

  return { isValid };
}
