// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// Layout
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Detail Pages
import CustomerDetail from "./pages/CustomerDetail";
import SaleDetail from "./pages/SaleDetail";
import ProductDetail from "./pages/ProductDetail";
import CustomerEdit from "./pages/CustomerEdit";
import CustomerNew from "./pages/CustomerNew";
import ProductNew from "./pages/ProductNew";
import ProductEdit from "./pages/ProductEdit";
import SaleNew from "./pages/SaleNew";

// Protected Route Component
const ProtectedRoute = ({ element: Element, ...rest }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <Element {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

const App = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />

        <Route element={<MainLayout />}>
          <Route path="/" element={<ProtectedRoute element={Dashboard} />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={Dashboard} />}
          />
          <Route
            path="/finance"
            element={<ProtectedRoute element={Finance} />}
          />
          <Route
            path="/products"
            element={<ProtectedRoute element={Products} />}
          />
          <Route
            path="/products/:id"
            element={<ProtectedRoute element={ProductDetail} />}
          />
          <Route
            path="/products/new"
            element={<ProtectedRoute element={ProductNew} />}
          />
          <Route
            path="/products/edit/:id"
            element={<ProtectedRoute element={ProductEdit} />}
          />
          <Route
            path="/customers"
            element={<ProtectedRoute element={Customers} />}
          />
          <Route
            path="/customers/new"
            element={<ProtectedRoute element={CustomerNew} />}
          />
          <Route
            path="/customers/:id"
            element={<ProtectedRoute element={CustomerDetail} />}
          />
          <Route
            path="/customers/edit/:id"
            element={<ProtectedRoute element={CustomerEdit} />}
          />{" "}
          <Route path="/sales" element={<ProtectedRoute element={Sales} />} />
          <Route path="/sales/new" element={<ProtectedRoute element={SaleNew} />} />
          <Route
            path="/sales/:id"
            element={<ProtectedRoute element={SaleDetail} />}
          />{" "}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
