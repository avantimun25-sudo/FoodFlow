export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
