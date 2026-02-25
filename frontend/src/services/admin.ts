
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AdminStats {
  users: { total: number; students: number; organizations: number };
  scholarships: { total: number; active: number };
  applications: { total: number; pending: number; accepted: number; rejected: number };
  auditEvents24h: number;
}

export interface AdminUser {
  id: string;
  fullname: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const fetchAdminStats = async (token: string): Promise<{ success: boolean; data: AdminStats }> => {
  const res = await fetch(`${API}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
};

export const fetchAdminUsers = async (
  token: string,
  params: { page?: number; limit?: number; role?: string; search?: string },
): Promise<{ success: boolean; data: AdminUser[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.role) query.set('role', params.role);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API}/admin/users?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const fetchAuditLogs = async (
  token: string,
  params: { page?: number; limit?: number; action?: string; status?: string; startDate?: string; endDate?: string },
): Promise<{ success: boolean; data: AuditLogEntry[]; pagination: Pagination }> => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.action) query.set('action', params.action);
  if (params.status) query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetch(`${API}/audit-logs?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
};
