import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    // Initial load pe seedha local storage se uthao
    const [userName, setUserName] = useState(localStorage.getItem("uName") || "Friend");

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Agar token mein name hai toh wahan se update karo
                const nameFromToken = decoded.name || decoded.fullName;
                if (nameFromToken) {
                    setUserName(nameFromToken);
                    localStorage.setItem("uName", nameFromToken);
                }
            } catch (error) {
                console.error("Token decoding failed", error);
            }
        }
    }, [token]);

    // LOGIN FUNCTION FIX
    const login = (newToken, nameFromApi) => {
        // 1. Token save karo
        localStorage.setItem("token", newToken);
        setToken(newToken);

        // 2. Name save karo (Jo Login.jsx se aa raha hai)
        if (nameFromApi) {
            localStorage.setItem("uName", nameFromApi);
            setUserName(nameFromApi);
            console.log("Name saved to storage:", nameFromApi);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("uName");
        setToken(null);
        setUserName("Friend");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!token, userName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);