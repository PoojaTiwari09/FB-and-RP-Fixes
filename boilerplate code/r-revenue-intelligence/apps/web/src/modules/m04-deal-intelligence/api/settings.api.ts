/**
 * Settings API Client
 * Provides methods to interact with settings endpoints
 */

export interface FilterSetting {
  field: string;
  operator: string;
  value: any;
  isLocked: boolean;
}

export interface ColumnSetting {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  isPinned: boolean;
  width?: number;
}

export interface ViewSettings {
  boardId?: string;
  columns?: ColumnSetting[];
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  groupBy?: 'NONE' | 'REP' | 'STAGE' | 'FORECAST_CATEGORY';
  activeTab?: string;
  showCompletedTasks?: boolean;
  compactView?: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  notifyOnWarnings: boolean;
  notifyOnTaskAssignments: boolean;
  notifyOnComments: boolean;
  notifyOnRiskEscalations: boolean;
  dailyDigestEnabled: boolean;
  weeklySummaryEnabled: boolean;
}

export interface CoachingSettings {
  autoAssignTasks: boolean;
  defaultTaskDueDays: number;
  riskEscalationThreshold: number;
  autoEscalateHighRisk: boolean;
  requireCommentOnEscalation: boolean;
  trackMeddpiccCompletion: boolean;
}

export interface GlobalSettings {
  defaultBoardView: string;
  timezone: string;
  dateFormat: string;
  currencySymbol: string;
  theme: string;
}

export class SettingsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  // ============= Filter Settings =============

  async saveFilters(filters: FilterSetting[], boardId?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ filters, boardId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save filters: ${response.statusText}`);
    }

    return response.json();
  }

  async getFilters(boardId?: string): Promise<any> {
    const url = boardId 
      ? `${this.baseUrl}/settings/filters?boardId=${boardId}`
      : `${this.baseUrl}/settings/filters`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get filters: ${response.statusText}`);
    }

    return response.json();
  }

  // ============= View Settings =============

  async saveViewSettings(settings: ViewSettings): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save view settings: ${response.statusText}`);
    }

    return response.json();
  }

  async getViewSettings(boardId?: string): Promise<any> {
    const url = boardId 
      ? `${this.baseUrl}/settings/view?boardId=${boardId}`
      : `${this.baseUrl}/settings/view`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get view settings: ${response.statusText}`);
    }

    return response.json();
  }

  // ============= Notification Settings =============

  async saveNotificationSettings(settings: NotificationSettings): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save notification settings: ${response.statusText}`);
    }

    return response.json();
  }

  async getNotificationSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/notifications`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get notification settings: ${response.statusText}`);
    }

    return response.json();
  }

  // ============= Coaching Settings =============

  async saveCoachingSettings(settings: CoachingSettings): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/coaching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save coaching settings: ${response.statusText}`);
    }

    return response.json();
  }

  async getCoachingSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/coaching`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get coaching settings: ${response.statusText}`);
    }

    return response.json();
  }

  // ============= Global Settings =============

  async saveGlobalSettings(settings: GlobalSettings): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/global`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save global settings: ${response.statusText}`);
    }

    return response.json();
  }

  async getGlobalSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/global`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get global settings: ${response.statusText}`);
    }

    return response.json();
  }

  // ============= All Settings =============

  async getAllSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/all`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get all settings: ${response.statusText}`);
    }

    return response.json();
  }

  // ============= Delete Settings =============

  async deleteSettings(preferenceKey: string, boardId?: string): Promise<any> {
    const params = new URLSearchParams({ preferenceKey });
    if (boardId) {
      params.append('boardId', boardId);
    }

    const response = await fetch(`${this.baseUrl}/settings?${params}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete settings: ${response.statusText}`);
    }

    return response.json();
  }

  async resetAllSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/all`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to reset all settings: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const settingsAPI = new SettingsAPI();
