import { PreferencesService } from '../services/preferences.service';
export declare class PreferencesController {
    private readonly preferencesService;
    constructor(preferencesService: PreferencesService);
    getLastViewedBoard(role: string): Promise<any>;
    getAllPreferences(role: string): Promise<{
        preferences: any;
    }>;
    upsertPreferences(role: string, boardId: string, prefs: {
        active_tab_id?: string;
        sort_field?: string;
        sort_dir?: string;
        filters?: Record<string, any>;
        page_size?: number;
    }): Promise<any>;
    clearPreferences(role: string, boardId?: string): Promise<{
        success: boolean;
    }>;
}
