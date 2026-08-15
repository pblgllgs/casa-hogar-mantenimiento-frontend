export function isViewer(user) {
  const roles = user?.roles || [];
  return roles.length === 1 && roles.includes('VIEWER');
}
