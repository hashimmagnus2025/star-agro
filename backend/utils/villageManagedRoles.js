export const VILLAGE_MANAGED_USER_ROLES = Object.freeze([
  'user',
  'farmer',
  'Enterprenure/Treder',
]);

export const normalizeVillageManagedUserRole = (role) => {
  if (typeof role !== 'string') return null;

  const normalizedRole = role.trim().toLowerCase();
  return VILLAGE_MANAGED_USER_ROLES.find(
    (allowedRole) => allowedRole.toLowerCase() === normalizedRole
  ) || null;
};
