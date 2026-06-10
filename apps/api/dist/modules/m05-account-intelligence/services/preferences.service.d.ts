export declare class PreferencesService {
    private supabase;
    getLastViewedBoard(sessionRole: string): Promise<any>;
    getAllPreferences(sessionRole: string): Promise<any>;
    upsertPreferences(sessionRole: string, slug: string, prefs: {
        active_tab_id?: string;
        sort_field?: string;
        sort_dir?: string;
        filters?: Record<string, any>;
        page_size?: number;
    }): Promise<any>;
    clearPreferences(sessionRole: string, slug?: string): Promise<{
        success: boolean;
    }>;
}
