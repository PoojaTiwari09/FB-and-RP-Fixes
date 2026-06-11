/** True when role is a sales rep (backend or frontend naming). */
export function isSalesRepRole(role?: string): boolean {
  if (!role) return false;
  const n = role.trim().toLowerCase();
  return n === 'sales_rep' || n === 'rep' || n === 'salesrep';
}

/** Prisma filter: rep-owned rows match user id and/or display name (legacy seeds). */
export function repOwnerFilter(
  ownerField: string,
  userId?: string,
  userName?: string,
): Record<string, unknown> | null {
  if (!userId && !userName) return null;
  if (userId && userName) {
    return { OR: [{ [ownerField]: userId }, { [ownerField]: userName }] };
  }
  return { [ownerField]: userId ?? userName };
}

/** True when role is a sales manager (backend or frontend naming). */
export function isManagerRole(role?: string): boolean {
  if (!role) return false;
  const n = role.trim().toLowerCase();
  return (
    n === 'manager' ||
    n === 'sales_manager' ||
    n === 'salesmanager' ||
    n === 'admin'
  );
}
