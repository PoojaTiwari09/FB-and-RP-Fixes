"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
let PreferencesService = class PreferencesService {
    supabase = (0, supabase_1.getSupabase)();
    async getLastViewedBoard(sessionRole) {
        const { data } = await this.supabase
            .from('user_board_preferences')
            .select(`
        board_id,
        active_tab_id,
        sort_field,
        sort_dir,
        filters,
        page_size,
        updated_at,
        board_config ( slug )
      `)
            .eq('session_role', sessionRole)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        if (data && data.board_config && data.board_config.slug) {
            return { ...data, board_id: data.board_config.slug };
        }
        return data || null;
    }
    async getAllPreferences(sessionRole) {
        const { data, error } = await this.supabase
            .from('user_board_preferences')
            .select('*, board_config ( slug )')
            .eq('session_role', sessionRole)
            .order('updated_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return (data || []).map(d => ({
            ...d,
            board_id: d.board_config?.slug || d.board_id
        }));
    }
    async upsertPreferences(sessionRole, slug, prefs) {
        if (prefs.sort_dir && !['asc', 'desc'].includes(prefs.sort_dir))
            throw new common_1.BadRequestException("sort_dir must be 'asc' or 'desc'");
        const { data: board } = await this.supabase
            .from('board_config')
            .select('board_id')
            .eq('slug', slug)
            .single();
        if (!board)
            throw new common_1.BadRequestException(`Board with slug ${slug} not found`);
        const boardId = board.board_id;
        const { data: existing } = await this.supabase
            .from('user_board_preferences')
            .select('id')
            .eq('session_role', sessionRole)
            .eq('board_id', boardId)
            .single();
        const payload = {
            session_role: sessionRole,
            board_id: boardId,
            active_tab_id: prefs.active_tab_id || null,
            sort_field: prefs.sort_field || null,
            sort_dir: prefs.sort_dir || null,
            filters: prefs.filters || {},
            page_size: prefs.page_size || 20,
            updated_at: new Date().toISOString(),
        };
        let result;
        if (existing) {
            result = await this.supabase
                .from('user_board_preferences')
                .update(payload)
                .eq('id', existing.id)
                .select('*')
                .single();
        }
        else {
            result = await this.supabase
                .from('user_board_preferences')
                .insert(payload)
                .select('*')
                .single();
        }
        if (result.error)
            throw new Error(result.error.message);
        return result.data;
    }
    async clearPreferences(sessionRole, slug) {
        let q = this.supabase.from('user_board_preferences').delete().eq('session_role', sessionRole);
        if (slug) {
            const { data: board } = await this.supabase.from('board_config').select('board_id').eq('slug', slug).single();
            if (board) {
                q = q.eq('board_id', board.board_id);
            }
        }
        const { error } = await q;
        if (error)
            throw new Error(error.message);
        return { success: true };
    }
};
exports.PreferencesService = PreferencesService;
exports.PreferencesService = PreferencesService = __decorate([
    (0, common_1.Injectable)()
], PreferencesService);
//# sourceMappingURL=preferences.service.js.map