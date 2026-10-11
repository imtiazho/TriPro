import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Firebase or demo token to all outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tripro_token');
  const orgId = localStorage.getItem('tripro_active_org_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (orgId) {
    config.headers['x-organization-id'] = orgId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname.startsWith('/app')) {
        console.warn('Authentication token expired or rejected.');
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    getMe: () => apiClient.get('/auth/me').then((r) => r.data.data),
    updateProfile: (data: any) => apiClient.patch('/auth/profile', data).then((r) => r.data.data),
    switchOrg: (organizationId: string) => apiClient.post('/auth/switch-org', { organizationId }).then((r) => r.data.data),
  },

  // Organization
  organization: {
    get: () => apiClient.get('/organization').then((r) => r.data.data),
    update: (data: any) => apiClient.patch('/organization', data).then((r) => r.data.data),
    getMembers: () => apiClient.get('/organization/members').then((r) => r.data.data),
    inviteMember: (data: any) => apiClient.post('/organization/members/invite', data).then((r) => r.data),
    updateMemberRole: (id: string, data: any) => apiClient.patch(`/organization/members/${id}`, data).then((r) => r.data.data),
  },

  // Compliance Obligations
  compliance: {
    list: (params?: any) => apiClient.get('/compliance', { params }).then((r) => r.data),
    getById: (id: string) => apiClient.get(`/compliance/${id}`).then((r) => r.data.data),
    create: (data: any) => apiClient.post('/compliance', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/compliance/${id}`, data).then((r) => r.data.data),
    delete: (id: string) => apiClient.delete(`/compliance/${id}`).then((r) => r.data),
  },

  // Tasks
  tasks: {
    list: (params?: any) => apiClient.get('/tasks', { params }).then((r) => r.data),
    create: (data: any) => apiClient.post('/tasks', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/tasks/${id}`, data).then((r) => r.data.data),
    delete: (id: string) => apiClient.delete(`/tasks/${id}`).then((r) => r.data),
  },

  // Evidence
  evidence: {
    list: (params?: any) => apiClient.get('/evidence', { params }).then((r) => r.data),
    upload: (formData: FormData) =>
      apiClient
        .post('/evidence/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data),
    download: (id: string) => `${API_BASE_URL}/evidence/${id}/download`,
    delete: (id: string) => apiClient.delete(`/evidence/${id}`).then((r) => r.data),
  },

  // HR Compliance
  hr: {
    list: (params?: any) => apiClient.get('/hr', { params }).then((r) => r.data),
    create: (data: any) => apiClient.post('/hr', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/hr/${id}`, data).then((r) => r.data.data),
    delete: (id: string) => apiClient.delete(`/hr/${id}`).then((r) => r.data),
  },

  // Vendors & TPRM
  vendors: {
    list: (params?: any) => apiClient.get('/vendors', { params }).then((r) => r.data),
    getById: (id: string) => apiClient.get(`/vendors/${id}`).then((r) => r.data.data),
    create: (data: any) => apiClient.post('/vendors', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/vendors/${id}`, data).then((r) => r.data.data),
    delete: (id: string) => apiClient.delete(`/vendors/${id}`).then((r) => r.data),
  },

  // Risks
  risks: {
    list: (params?: any) => apiClient.get('/risks', { params }).then((r) => r.data),
    create: (data: any) => apiClient.post('/risks', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/risks/${id}`, data).then((r) => r.data.data),
    delete: (id: string) => apiClient.delete(`/risks/${id}`).then((r) => r.data),
  },

  // Findings & CAPA
  findings: {
    list: (params?: any) => apiClient.get('/findings', { params }).then((r) => r.data),
    create: (data: any) => apiClient.post('/findings', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/findings/${id}`, data).then((r) => r.data.data),
    createAction: (findingId: string, data: any) =>
      apiClient.post(`/findings/${findingId}/actions`, data).then((r) => r.data.data),
    updateAction: (actionId: string, data: any) =>
      apiClient.patch(`/findings/actions/${actionId}`, data).then((r) => r.data.data),
  },

  // Policies
  policies: {
    list: (params?: any) => apiClient.get('/policies', { params }).then((r) => r.data),
    create: (data: any) => apiClient.post('/policies', data).then((r) => r.data.data),
    update: (id: string, data: any) => apiClient.patch(`/policies/${id}`, data).then((r) => r.data.data),
    acknowledge: (id: string) => apiClient.post(`/policies/${id}/acknowledge`).then((r) => r.data),
  },

  // Notifications
  notifications: {
    list: (params?: any) => apiClient.get('/notifications', { params }).then((r) => r.data),
    markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`).then((r) => r.data.data),
    markAllRead: () => apiClient.post('/notifications/read-all').then((r) => r.data),
  },

  // Reports
  reports: {
    getDashboard: () => apiClient.get('/reports/dashboard').then((r) => r.data.data),
    exportCSV: () => `${API_BASE_URL}/reports/export/csv`,
  },

  // Super-admin Platform Management
  admin: {
    getStats: () => apiClient.get('/admin/stats').then((r) => r.data.data),
    getOrganizations: (params?: any) => apiClient.get('/admin/organizations', { params }).then((r) => r.data),
    createOrganization: (data: any) => apiClient.post('/admin/organizations', data).then((r) => r.data.data),
    updateOrgStatus: (id: string, status: string) =>
      apiClient.patch(`/admin/organizations/${id}/status`, { status }).then((r) => r.data.data),
    getAuditLogs: (params?: any) => apiClient.get('/admin/audit-logs', { params }).then((r) => r.data),
  },
};
