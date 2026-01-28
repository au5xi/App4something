// client/src/lib/api.ts

// If VITE_API_BASE is set, use it (cross-origin).
// Otherwise, default to '' so requests hit same-origin (e.g., /api/...).
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').trim();

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // Merge headers safely
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Set JSON content-type only when sending a body and when not already set
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach Bearer token when present
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Always include credentials (cookies, auth) to match server CORS settings
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ? JSON.stringify(data.error) : (data?.message || 'Request failed'));
  }
  return data as T;
}

export const api = {
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<{ user: any }>('/api/me'),

  updateProfile: (payload: any) => request<{ user: any }>('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  searchUsers: (q: string) => request<{ users: any[] }>(`/api/users/search?q=${encodeURIComponent(q)}`),

  friends: () => request<{ friends: any[] }>('/api/friends'),
  friendRequests: () => request<{ received: any[] }>('/api/friends/requests'),
  sendFriendRequest: (userId: string) => request<{ request: any }>('/api/friends/request', { method: 'POST', body: JSON.stringify({ userId }) }),
  acceptFriendRequest: (requestId: string) => request<{ friendship: any }>('/api/friends/accept', { method: 'POST', body: JSON.stringify({ requestId }) }),
  denyFriendRequest: (requestId: string) => request<{ ok: boolean }>('/api/friends/deny', { method: 'POST', body: JSON.stringify({ requestId }) }),

  statusSummary: (payload: { mode: 'OFF' | 'GENERAL' | 'SPECIFIC'; text?: string | null }) =>
    request<{ status: any }>('/api/status/summary', { method: 'PUT', body: JSON.stringify(payload) }),
  getAvailability: () => request<{ start: string; days: any[] }>('/api/status/availability'),
  setAvailability: (days: any[]) => request<{ ok: boolean }>('/api/status/availability', { method: 'PUT', body: JSON.stringify({ days }) }),

  events: () => request<{ events: any[] }>('/api/events'),
  nextEvent: () => request<{ event: any | null }>('/api/events/next'),
  createEvent: (payload: any) => request<{ event: any }>('/api/events', { method: 'POST', body: JSON.stringify(payload) }),
  event: (id: string) => request<{ event: any }>(`/api/events/${id}`),
  respondEvent: (id: string, status: 'INTERESTED' | 'JOINED' | 'DECLINED') =>
    request<{ participant: any }>(`/api/events/${id}/respond`, { method: 'POST', body: JSON.stringify({ status }) }),
  shout: (id: string, message: string) => request<{ shout: any }>(`/api/events/${id}/shout`, { method: 'POST', body: JSON.stringify({ message }) }),

  calendarFriends: (ids: string[]) =>
    request<{ start: string; friends: any[] }>(`/api/calendar/friends?ids=${encodeURIComponent(ids.join(','))}`),
};
