/**
 * Vite entry — hosts the same UI as apps/web/src/app/calls (module pages).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CallsListPage from '../pages/calls-list/page';
import CallDetailPage from '../pages/call-detail/[callId]/page';
import ExtractionLibraryPage from '../pages/extraction-library/page';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CallsListPage />} />
        <Route path="/calls/:callId" element={<CallDetailPage />} />
        <Route path="/extraction-library" element={<ExtractionLibraryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
