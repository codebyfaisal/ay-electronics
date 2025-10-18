// src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AUTH_KEY = 'auth_token'; // Key for the authentication token

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(sessionStorage.getItem(AUTH_KEY));

    const isAuthenticated = !!token;

    const login = (newToken) => {
        sessionStorage.setItem(AUTH_KEY, newToken);
        setToken(newToken);
    };

    const logout = () => {
        sessionStorage.removeItem(AUTH_KEY);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
};