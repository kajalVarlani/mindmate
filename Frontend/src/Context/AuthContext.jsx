import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("Friend");
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedName = localStorage.getItem("uName");
    const storedRole = localStorage.getItem("role") || "user";

    if (storedToken) {
      setToken(storedToken);
      setUserName(storedName || "Friend");
      setUserRole(storedRole);
    }

    setLoading(false);
  }, []);

  const login = (newToken, nameFromApi, role = "user") => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("uName", nameFromApi);
    localStorage.setItem("role", role);

    setToken(newToken);
    setUserName(nameFromApi);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUserName("Friend");
    setUserRole("user");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        userName,
        userRole,
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
