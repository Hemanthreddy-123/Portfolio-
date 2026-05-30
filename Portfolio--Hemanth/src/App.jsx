import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { PortfolioProvider } from "./context/PortfolioContext";
import Portfolio from "./pages/Portfolio";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <PortfolioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Fallback to homepage for any other routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </PortfolioProvider>
  );
}

export default App;
