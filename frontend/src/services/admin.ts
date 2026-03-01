
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Existing interfaces ──────────────────────────────────────────────────────

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

// ─── Analytics interfaces ─────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface ScholarshipPerf {
  id: string;
  title: string;
  status: string;
  applications: number;
  accepted: number;
  rejected: number;
  underReview: number;
}

export interface FunnelSlice {
  status: string;
  count: number;
}

// ─── Existing fetch functions ─────────────────────────────────────────────────

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

// ─── Analytics fetch functions ────────────────────────────────────────────────

export const fetchApplicationsOverTime = async (
  token: string,
  period: 7 | 30 | 90 = 30,
): Promise<{ success: boolean; data: TimeSeriesPoint[] }> => {
  const res = await fetch(`${API}/admin/analytics/applications-over-time?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch application trends');
  return res.json();
};

export const fetchScholarshipPerformance = async (
  token: string,
): Promise<{ success: boolean; data: ScholarshipPerf[] }> => {
  const res = await fetch(`${API}/admin/analytics/scholarship-performance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch scholarship performance');
  return res.json();
};

export const fetchUserRegistrations = async (
  token: string,
  period: 7 | 30 | 90 = 30,
): Promise<{ success: boolean; data: TimeSeriesPoint[] }> => {
  const res = await fetch(`${API}/admin/analytics/user-registrations?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user registrations');
  return res.json();
};

export const fetchApplicationFunnel = async (
  token: string,
): Promise<{ success: boolean; data: FunnelSlice[] }> => {
  const res = await fetch(`${API}/admin/analytics/application-funnel`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch application funnel');
  return res.json();
};

// ─── Report download helper ───────────────────────────────────────────────────

export const downloadReport = async (
  token: string,
  type: 'applications' | 'scholarships' | 'users' | 'summary',
): Promise<void> => {
  const ext = type === 'summary' ? 'pdf' : 'csv';
  const res = await fetch(`${API}/admin/reports/${type}.${ext}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Failed to download ${type} report`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-${new Date().toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
