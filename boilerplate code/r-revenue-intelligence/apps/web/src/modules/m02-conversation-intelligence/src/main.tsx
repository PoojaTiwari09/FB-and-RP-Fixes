/**
 * Vite entry — hosts the same UI as apps/web/src/app/conversation-intelligence.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConversationLibraryView } from '../components/ConversationLibraryView';
import '../styles/index.css';
import '../styles/revenue-portal.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConversationLibraryView />
  </React.StrictMode>,
);
