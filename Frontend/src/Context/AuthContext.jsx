import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("Friend");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedName = localStorage.getItem("uName");

    if (storedToken) {
      setToken(storedToken);
      setUserName(storedName || "Friend");
    }

    setLoading(false); // 👈 IMPORTANT
  }, []);

  const login = (newToken, nameFromApi) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("uName", nameFromApi);

    setToken(newToken);
    setUserName(nameFromApi);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUserName("Friend");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        userName,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
