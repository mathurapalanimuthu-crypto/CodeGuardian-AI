import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Repository from "./pages/Repository";
import Analysis from "./pages/Analysis";
import History from "./pages/History";

import { AnalysisProvider } from "./context/AnalysisContext";

function App() {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repository" element={<Repository />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </BrowserRouter>
    </AnalysisProvider>
  );
}

export default App;