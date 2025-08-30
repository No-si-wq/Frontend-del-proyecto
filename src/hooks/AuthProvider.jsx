import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: null,
    role: null,
    companyId: null, 
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const { role, companyId } = decodedToken;
        setAuth({
          token: token,
          role: role,
          companyId: companyId,
        });
      } catch (error) {
        console.error("Error decoding token:", error);
        sessionStorage.removeItem('token');
        setAuth({ token: null, role: null, companyId: null });
      }
    }
    setIsAuthReady(true);
  }, []);

const handleLogin = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    const { role, companyId, exp } = decodedToken;

    if (Date.now() >= exp * 1000) {
      console.warn("Token expirado");
      sessionStorage.removeItem("token");
      setAuth({ token: null, role: null, companyId: null });
      return;
    }

    sessionStorage.setItem("token", token);
    setAuth({ token, role, companyId });
  } catch (error) {
    console.error("Error decoding token:", error);
    sessionStorage.removeItem("token");
    setAuth({ token: null, role: null, companyId: null });
  }
};

  
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setAuth({ token: null, role: null, companyId: null });
  };

  const value = {
    auth,
    isAuthReady,
    handleLogin,
    handleLogout,
    setAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;