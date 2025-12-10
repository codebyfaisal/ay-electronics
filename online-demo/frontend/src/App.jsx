// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import MainLayout from "./components/layout/MainLayout";
import StartupModal from "./components/ui/StartupModal";

// Pages
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import NotFound from "./pages/NotFound";
import Team from "./pages/Team";

// Detail Pages
import CustomerDetail from "./pages/CustomerDetail";
import SaleDetail from "./pages/SaleDetail";
import ProductDetail from "./pages/ProductDetail";
import CustomerEdit from "./pages/CustomerEdit";
import CustomerNew from "./pages/CustomerNew";
import ProductNew from "./pages/ProductNew";
import ProductEdit from "./pages/ProductEdit";
import SaleNew from "./pages/SaleNew";
import Setting from "./pages/Setting";
import OneShotSaleNew from "./pages/OneShotSaleNew";
const App = () => {
  const [showModal, setShowModal] = React.useState(true);

  return (
    <Router>
      <StartupModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/new" element={<ProductNew />} />
          <Route path="/products/edit/:id" element={<ProductEdit />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<CustomerNew />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/edit/:id" element={<CustomerEdit />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/new" element={<SaleNew />} />
          <Route path="/sales/:id" element={<SaleDetail />} />
          <Route path="/one-shot-sale" element={<OneShotSaleNew />} />
          <Route path="/settings" element={<Setting />} />
          <Route path="/team" element={<Team />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
