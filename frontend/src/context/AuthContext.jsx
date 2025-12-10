// src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { showInfo } from '../utils/toast';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AUTH_KEY = 'auth_token';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(sessionStorage.getItem(AUTH_KEY));

    const isAuthenticated = !!token;

    const login = (newToken) => {
        sessionStorage.setItem(AUTH_KEY, newToken);
        setToken(newToken);
    };

    // const logout = () => {
    //     sessionStorage.removeItem(AUTH_KEY);
    //     setToken(null);
    // };

    const logout = async () => {
        try {
            const response = await axios.get("/auth/logout");
            if (response.data.success) {
                showInfo("Logout successful")
                window.location.href = "/login";
            } else throw new Error(response.data.message || "Logout failed");
        } catch (error) {
            showInfo(error.message || "Logout failed");
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
};