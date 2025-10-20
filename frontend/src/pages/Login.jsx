// src/pages/Login.jsx
import React, { useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { showError } from "../utils/toast";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!password) {
      showError("Password is required.");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post("/login", { password });

      if (response.data.success && response.data.data.token) {
        login(response.data.data.token);
        navigate("/");
      } else {
        showError(
          response.data.message || "Login failed: Invalid credentials."
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Network error: Could not connect to the server.";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="h-full flex justify-center items-center">
      <div className="text-center max-w-sm">
        <h2 className="text-3xl font-bold mb-2 text-[rgb(var(--primary))]">
          Welcome Back
        </h2>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          Sign in to continue to the dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full text-lg py-3 outline hover:outline-none"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? "Logging In..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Contact administration if you forgot your password.
        </p>
      </div>
    </section>
  );
};

export default Login;
