import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:slug" element={<BoardPage />} />
          <Route path="*" element={<Navigate to="/board/demo" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
