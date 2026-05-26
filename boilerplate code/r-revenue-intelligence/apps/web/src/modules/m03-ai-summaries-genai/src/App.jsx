import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DeepResearchPage from './pages/DeepResearchPage';
import ResearchReportPage from './pages/ResearchReportPage';
import AskAnythingPage from './pages/AskAnythingPage';
import SmartSummariesPage from './pages/SmartSummariesPage';
import SmartSummariesAdminPage from './pages/SmartSummariesAdminPage';
import SharedBriefPage from './pages/SharedBriefPage';
import { ResearchJobProvider } from './contexts/ResearchJobContext';
import GlobalProgressWidget from './components/GlobalProgressWidget';

export default function App() {
  const [currentRole, setCurrentRole] = React.useState('Sales Manager');

  return (
    <BrowserRouter>
      <ResearchJobProvider>
        <Routes>
          {/* Public Shared Brief View (Bypasses Sidebar/TopBar) */}
          <Route path="/smart-summaries/shared/:token" element={<SharedBriefPage />} />

          {/* Standard App Layout */}
          <Route
            path="/*"
            element={
              <div className="app-layout">
                <Sidebar />
                <div className="app-content">
                  <TopBar role={currentRole} onRoleChange={setCurrentRole} />
                  <Routes>
                    <Route path="/" element={<Navigate to="/research" replace />} />
                    <Route path="/research" element={<DeepResearchPage />} />
                    <Route path="/research/report/:reportId" element={<ResearchReportPage />} />
                    <Route path="/research/report" element={<ResearchReportPage />} />
                    <Route path="/ask-anything" element={<AskAnythingPage />} />
                    <Route path="/smart-summaries" element={<SmartSummariesPage />} />
                    <Route path="/smart-summaries/admin" element={<SmartSummariesAdminPage />} />
                  </Routes>
                </div>
                {/* Floating progress widget visible on ALL pages */}
                <GlobalProgressWidget />
              </div>
            }
          />
        </Routes>
      </ResearchJobProvider>
    </BrowserRouter>
  );
}
