import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getSession: () => api.get('/auth/me'),
}

// Board APIs
export const boardAPI = {
  getBoards: () => api.get('/boards'),
  getBoard: (id: string) => api.get(`/boards/${id}`),
  createBoard: (data: any) => api.post('/boards', data),
  updateBoard: (id: string, data: any) => api.patch(`/boards/${id}`, data),
  deleteBoard: (id: string) => api.delete(`/boards/${id}`),
  publishBoard: (id: string) => api.post(`/boards/${id}/publish`),
}

// Deal APIs
export const dealAPI = {
  getDeals: (params?: any) => api.get('/deals', { params }),
  getDeal: (id: string) => api.get(`/deals/${id}`),
  updateDeal: (id: string, data: any) => api.patch(`/deals/${id}`, data),
  getStats: () => api.get('/deals/stats'),
  getHighRisk: () => api.get('/deals/high-risk'),
  getClosingSoon: () => api.get('/deals/closing-soon'),
  getMyDeals: () => api.get('/deals/my-deals'),
  getRecentNotifications: () => api.get('/deals/notifications/recent'),
}

// Summary APIs
export const summaryAPI = {
  generate: (dealId: string) => api.post(`/deals/${dealId}/summaries/generate`),
  getCurrent: (dealId: string) => api.get(`/deals/${dealId}/summaries/current`),
  getHistory: (dealId: string) => api.get(`/deals/${dealId}/summaries/history`),
  getWeeklyChanges: (dealId: string) => api.get(`/deals/${dealId}/summaries/weekly-changes`),
}

// Warning APIs
export const warningAPI = {
  generate: (dealId: string) => api.post(`/deals/${dealId}/warnings/generate`),
  getActive: (dealId: string) => api.get(`/deals/${dealId}/warnings/active`),
  getHistory: (dealId: string) => api.get(`/deals/${dealId}/warnings/history`),
  resolve: (dealId: string, warningId: string, data: any) =>
    api.patch(`/deals/${dealId}/warnings/${warningId}/resolve`, data),
}

// Playbook APIs
export const playbookAPI = {
  getPlaybook: (dealId: string, type?: string) =>
    api.get(`/deals/${dealId}/playbook`, { params: { type } }),
  createItem: (dealId: string, data: any) =>
    api.post(`/deals/${dealId}/playbook/items`, data),
  updateItem: (dealId: string, itemId: string, data: any) =>
    api.patch(`/deals/${dealId}/playbook/items/${itemId}`, data),
  deleteItem: (dealId: string, itemId: string) =>
    api.delete(`/deals/${dealId}/playbook/items/${itemId}`),
  initializeMEDDICC: (dealId: string) =>
    api.post(`/deals/${dealId}/playbook/initialize/meddicc`),
  initializeBANT: (dealId: string) =>
    api.post(`/deals/${dealId}/playbook/initialize/bant`),
  generateSuggestions: (dealId: string, type: string) =>
    api.post(`/deals/${dealId}/playbook/suggestions`, { type }),
}

// Task APIs
export const taskAPI = {
  getTasks: (dealId: string) => api.get(`/deals/${dealId}/tasks`),
  getTask: (dealId: string, taskId: string) =>
    api.get(`/deals/${dealId}/tasks/${taskId}`),
  createTask: (dealId: string, data: any) =>
    api.post(`/deals/${dealId}/tasks`, data),
  updateTask: (dealId: string, taskId: string, data: any) =>
    api.patch(`/deals/${dealId}/tasks/${taskId}`, data),
  deleteTask: (dealId: string, taskId: string) =>
    api.delete(`/deals/${dealId}/tasks/${taskId}`),
  generateNextSteps: (dealId: string) =>
    api.post(`/deals/${dealId}/tasks/generate-next-steps`),
  getMyTasks: () => api.get('/tasks/my-tasks'),
  getOverdue: () => api.get('/tasks/overdue'),
}

// Comment APIs
export const commentAPI = {
  getComments: (dealId: string) => api.get(`/deals/${dealId}/comments`),
  createComment: (dealId: string, data: any) =>
    api.post(`/deals/${dealId}/comments`, data),
  updateComment: (dealId: string, commentId: string, data: any) =>
    api.patch(`/deals/${dealId}/comments/${commentId}`, data),
  deleteComment: (dealId: string, commentId: string) =>
    api.delete(`/deals/${dealId}/comments/${commentId}`),
  getReplies: (dealId: string, commentId: string) =>
    api.get(`/deals/${dealId}/comments/${commentId}/replies`),
}

// Activity APIs
export const activityAPI = {
  getTimeline: (dealId: string, params?: any) =>
    api.get(`/deals/${dealId}/activities/timeline`, { params }),
  getActivities: (dealId: string, params?: any) =>
    api.get(`/deals/${dealId}/activities`, { params }),
  getActivity: (dealId: string, activityId: string) =>
    api.get(`/deals/${dealId}/activities/${activityId}`),
  createActivity: (dealId: string, data: any) =>
    api.post(`/deals/${dealId}/activities`, data),
  updateActivity: (dealId: string, activityId: string, data: any) =>
    api.patch(`/deals/${dealId}/activities/${activityId}`, data),
  deleteActivity: (dealId: string, activityId: string) =>
    api.delete(`/deals/${dealId}/activities/${activityId}`),
}

// AI Score APIs
export const scoreAPI = {
  calculate: (dealId: string) => api.post(`/deals/${dealId}/score/calculate`),
  getCurrent: (dealId: string) => api.get(`/deals/${dealId}/score/current`),
  getHistory: (dealId: string) => api.get(`/deals/${dealId}/score/history`),
}

// Risk Escalation APIs
export const escalationAPI = {
  create: (dealId: string, data: any) =>
    api.post(`/deals/${dealId}/escalations`, data),
  getEscalations: (dealId: string) => api.get(`/deals/${dealId}/escalations`),
  resolve: (dealId: string, escalationId: string, data: any) =>
    api.patch(`/deals/${dealId}/escalations/${escalationId}/resolve`, data),
  getActive: () => api.get('/escalations/active'),
}

// Coaching APIs
export const coachingAPI = {
  generatePrompts: (data: any) => api.post('/coaching/prompts', data),
  getPromptsForDeal: (dealId: string) =>
    api.get(`/coaching/deals/${dealId}/prompts`),
  getOpportunities: () => api.get('/coaching/opportunities'),
}

// Export APIs
export const exportAPI = {
  createExport: (data: any) => api.post('/exports', data),
  downloadExport: async (exportId: string, fileName?: string) => {
    const res = await api.get(`/exports/download/${exportId}`, { responseType: 'blob' });
    const contentDisposition = res.headers['content-disposition'] || '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const name = match?.[1] || fileName || `export-${exportId}`;
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  createAndDownload: async (data: any) => {
    const res = await api.post('/exports', data);
    await exportAPI.downloadExport(res.data.id, res.data.fileName);
  },
  exportBoardToCSV: async (boardId: string, activeTab?: string) => {
    await exportAPI.createAndDownload({
      format: 'CSV',
      type: 'BOARD',
      boardId,
      activeTab,
    });
  },
  exportBoardToPDF: async (boardId: string, activeTab?: string) => {
    await exportAPI.createAndDownload({
      format: 'PDF',
      type: 'BOARD',
      boardId,
      activeTab,
    });
  },
  exportForecastSummary: async (format: 'CSV' | 'PDF' = 'PDF') => {
    await exportAPI.createAndDownload({
      format,
      type: 'FORECAST_SUMMARY',
    });
  },
  exportTeamDiagnostics: async (format: 'CSV' | 'PDF' = 'CSV') => {
    await exportAPI.createAndDownload({
      format,
      type: 'TEAM_DIAGNOSTICS',
    });
  },
  exportTopRiskDeals: async (format: 'CSV' | 'PDF' = 'CSV') => {
    await exportAPI.createAndDownload({
      format,
      type: 'TOP_RISK_DEALS',
    });
  },
  exportAnalyticsReport: async (format: 'CSV' | 'PDF' = 'PDF') => {
    await exportAPI.createAndDownload({
      format,
      type: 'ANALYTICS_REPORT',
      includeAiInsights: true,
      includeHistoricalTrends: true,
    });
  },
}

// Analytics APIs
export const analyticsAPI = {
  getAnalytics: (data: any) => api.post('/analytics', data).then(res => res.data),
  getAEAnalytics: (boardId?: string) =>
    api.get('/analytics/ae', { params: { boardId } }).then(res => res.data),
  getManagerAnalytics: (boardId?: string) =>
    api.get('/analytics/manager', { params: { boardId } }).then(res => res.data),
  getExecutiveAnalytics: () =>
    api.get('/analytics/executive').then(res => res.data),
  getHistoricalMetrics: (days: number = 30, metricTypes?: string[]) =>
    api.get('/analytics/historical', { params: { days, metricTypes: metricTypes?.join(',') } }).then(res => res.data),
}

// Settings APIs
export const settingsAPI = {
  saveFilters: (filters: any[], boardId?: string) =>
    api.post('/settings/filters', { filters, boardId }).then(res => res.data),
  getFilters: (boardId?: string) =>
    api.get('/settings/filters', { params: { boardId } }).then(res => res.data),
  saveViewSettings: (settings: any) =>
    api.post('/settings/view', settings).then(res => res.data),
  getViewSettings: (boardId?: string) =>
    api.get('/settings/view', { params: { boardId } }).then(res => res.data),
  saveNotificationSettings: (settings: any) =>
    api.post('/settings/notifications', settings).then(res => res.data),
  getNotificationSettings: () =>
    api.get('/settings/notifications').then(res => res.data),
  saveCoachingSettings: (settings: any) =>
    api.post('/settings/coaching', settings).then(res => res.data),
  getCoachingSettings: () =>
    api.get('/settings/coaching').then(res => res.data),
  saveGlobalSettings: (settings: any) =>
    api.post('/settings/global', settings).then(res => res.data),
  getGlobalSettings: () =>
    api.get('/settings/global').then(res => res.data),
  getAllSettings: () =>
    api.get('/settings/all').then(res => res.data),
  deleteSettings: (preferenceKey: string, boardId?: string) =>
    api.delete('/settings', { params: { preferenceKey, boardId } }).then(res => res.data),
  resetAllSettings: () =>
    api.delete('/settings/all').then(res => res.data),
}

// Sync APIs
export const syncAPI = {
  fullSync: () => api.post('/sync/deals/full'),
  incrementalSync: () => api.post('/sync/deals/incremental'),
  getLogs: () => api.get('/sync/logs'),
  getStatus: () => api.get('/sync/status'),
}

export default api
