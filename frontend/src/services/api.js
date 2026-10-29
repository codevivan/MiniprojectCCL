const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`) : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('campusbite_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}: Failed to complete request`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    studentRegister: (payload) => request('/auth/student/register', { method: 'POST', body: JSON.stringify(payload) }),
    studentLogin: (payload) => request('/auth/student/login', { method: 'POST', body: JSON.stringify(payload) }),
    getOwnerStatus: () => request('/auth/owner/status'),
    ownerRegister: (payload) => request('/auth/owner/register', { method: 'POST', body: JSON.stringify(payload) }),
    ownerSetup: (payload) => request('/auth/owner/register', { method: 'POST', body: JSON.stringify(payload) }),
    ownerLogin: (payload) => request('/auth/owner/login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me')
  },
  menu: {
    getAll: (params = {}) => {
      const clean = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'ALL' && v !== 'undefined' && v !== 'null') {
          clean[k] = v;
        }
      });
      const qs = new URLSearchParams(clean).toString();
      return request(`/menu${qs ? `?${qs}` : ''}`);
    },
    getCategories: () => request('/menu/categories'),
    getById: (id) => request(`/menu/${id}`),
    create: (payload) => request('/menu', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id) => request(`/menu/${id}`, { method: 'DELETE' })
  },
  orders: {
    create: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
    getById: (id) => request(`/orders/${id}`),
    getMyOrders: () => request('/orders/my-orders'),
    updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    verifyCash: (id) => request(`/orders/${id}/verify-cash`, { method: 'PATCH' })
  },
  payments: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/payments${qs ? `?${qs}` : ''}`);
    }
  },
  suggestions: {
    submit: (payload) => request('/suggestions', { method: 'POST', body: JSON.stringify(payload) }),
    getMy: () => request('/suggestions/my'),
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/suggestions${qs ? `?${qs}` : ''}`);
    },
    updateStatus: (id, status, adminResponse) => 
      request(`/suggestions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminResponse }) })
  },
  settings: {
    get: () => request('/settings'),
    update: (payload) => request('/settings', { method: 'PUT', body: JSON.stringify(payload) })
  },
  admin: {
    getStats: () => request('/admin/stats'),
    getAnalytics: () => request('/admin/analytics'),
    getActiveOrders: () => request('/admin/active-orders'),
    getAllOrders: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/admin/all-orders${qs ? `?${qs}` : ''}`);
    },
    getStudents: () => request('/admin/students')
  },
  uploads: {
    uploadFoodImage: async (file) => {
      const token = localStorage.getItem('campusbite_token');
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE}/uploads/food-image`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });
      return await res.json();
    },
    uploadImage: async (file) => {
      return api.uploads.uploadFoodImage(file);
    }
  }
};
