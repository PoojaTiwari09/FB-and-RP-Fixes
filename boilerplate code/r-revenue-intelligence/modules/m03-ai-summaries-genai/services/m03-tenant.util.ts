/** Demo tenant used by M01/M02 and unified Postgres RLS. */
export const M03_DEMO_TENANT = '00000000-0000-0000-0000-000000000001';

/** Legacy M03 header org id from early Supabase demos. */
export const M03_LEGACY_ORG = 'a0000000-0000-0000-0000-000000000001';

export function resolveM03TenantId(orgOrTenantId?: string): string {
  if (!orgOrTenantId) return M03_DEMO_TENANT;
  if (orgOrTenantId === M03_LEGACY_ORG) return M03_DEMO_TENANT;
  return orgOrTenantId;
}
