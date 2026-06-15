import { Injectable, BadRequestException } from '@nestjs/common';
import { getSupabase } from '../config/supabase';

@Injectable()
export class PreferencesService {
  private supabase = getSupabase();

  async getLastViewedBoard(sessionRole: string) {
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

    if (data && data.board_config && (data.board_config as any).slug) {
      return { ...data, board_id: (data.board_config as any).slug }; // replace board_id with slug for frontend
    }
    return data || null;
  }

  async getAllPreferences(sessionRole: string) {
    const { data, error } = await this.supabase
      .from('user_board_preferences')
      .select('*, board_config ( slug )')
      .eq('session_role', sessionRole)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    
    return (data || []).map(d => ({
      ...d,
      board_id: (d.board_config as any)?.slug || d.board_id
    }));
  }

  async upsertPreferences(
    sessionRole: string,
    boardId: string,
    prefs: {
      active_tab_id?: string;
      sort_field?: string;
      sort_dir?: string;
      filters?: Record<string, any>;
      page_size?: number;
    },
  ) {
    if (prefs.sort_dir && !['asc', 'desc'].includes(prefs.sort_dir))
      throw new BadRequestException("sort_dir must be 'asc' or 'desc'");

    // Validate board exists
    const { data: board } = await this.supabase
      .from('board_config')
      .select('board_id')
      .eq('board_id', boardId)
      .single();
    
    if (!board) throw new BadRequestException(`Board with ID ${boardId} not found`);

    // Check if it exists
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
    } else {
      result = await this.supabase
        .from('user_board_preferences')
        .insert(payload)
        .select('*')
        .single();
    }

    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  async clearPreferences(sessionRole: string, slug?: string) {
    let q = this.supabase.from('user_board_preferences').delete().eq('session_role', sessionRole);
    if (slug) {
      const { data: board } = await this.supabase.from('board_config').select('board_id').eq('slug', slug).single();
      if (board) {
        q = (q as any).eq('board_id', board.board_id);
      }
    }
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
