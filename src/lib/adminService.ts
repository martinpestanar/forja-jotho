import { supabase } from '@/lib/supabase';
import { AdminGameRules, StudentAdminRow, LevelRequirement } from '@/types/trainer';

/**
 * Servicio de Administración para SynDex:
 * - Consulta y actualización de reglas dinámicas del juego.
 * - Acciones rápidas de 1 clic sobre alumnos (batería, niveles, pokedólares, ítems).
 */
export async function getAdminGameRules(): Promise<AdminGameRules | null> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_admin_game_rules');
    if (error) {
      console.error('[AdminService] Error fetching rules:', error.message);
      return null;
    }
    return data as AdminGameRules;
  } catch (err) {
    console.error('[AdminService] Exception in getAdminGameRules:', err);
    return null;
  }
}

export async function updateAdminGameRules(
  mode: 'automatic' | 'manual' | 'hybrid',
  levels: Record<string, LevelRequirement>,
  economy: Record<string, any>
): Promise<AdminGameRules | null> {
  try {
    const { data, error } = await supabase.rpc('rpc_update_admin_game_rules', {
      p_mode: mode,
      p_levels: levels,
      p_economy: economy,
    });
    if (error) {
      console.error('[AdminService] Error updating rules:', error.message);
      return null;
    }
    return data as AdminGameRules;
  } catch (err) {
    console.error('[AdminService] Exception in updateAdminGameRules:', err);
    return null;
  }
}

export async function getAdminStudents(): Promise<StudentAdminRow[]> {
  try {
    const { data, error } = await supabase.rpc('rpc_admin_get_students');
    if (error) {
      console.error('[AdminService] Error fetching students:', error.message);
      return [];
    }
    return (data || []) as StudentAdminRow[];
  } catch (err) {
    console.error('[AdminService] Exception in getAdminStudents:', err);
    return [];
  }
}

export async function executeStudentOverride(
  studentId: string,
  action: 'grant_battery' | 'set_battery' | 'set_level' | 'grant_pokedollars' | 'grant_xp' | 'inject_item',
  payload: Record<string, any> = {}
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('rpc_admin_override_student', {
      p_student_id: studentId,
      p_action: action,
      p_payload: payload,
    });

    if (error) {
      console.error(`[AdminService] Error in action ${action}:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error(`[AdminService] Exception in action ${action}:`, err);
    return { success: false, error: err.message || 'Error inesperado' };
  }
}
