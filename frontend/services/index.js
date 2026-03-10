import api from './api'

// ── Menu ──────────────────────────────────────────────────────
export const menuService = {
  getAll:    (params)   => api.get('/menu', { params }),
  getById:   (id)       => api.get(`/menu/${id}`),
  create:    (data)     => api.post('/menu', data),
  update:    (id, data) => api.put(`/menu/${id}`, data),
  delete:    (id)       => api.delete(`/menu/${id}`),
  toggleAvail: (id)     => api.patch(`/menu/${id}/toggle`),
}

// ── Orders ────────────────────────────────────────────────────
export const orderService = {
  create:       (data)          => api.post('/orders', data),
  getMyOrders:  (userId)        => api.get(`/orders/user/${userId}`),
  getById:      (id)            => api.get(`/orders/${id}`),
  getKitchen:   ()              => api.get('/orders/kitchen'),
  getReady:     ()              => api.get('/orders/ready'),
  updateStatus: (id, status)    => api.put(`/orders/${id}/status`, { status }),
  markCollected:(id)            => api.put(`/orders/${id}/collect`),
}

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile:  ()     => api.get('/auth/profile'),
}

// ── Inventory ─────────────────────────────────────────────────
export const inventoryService = {
  getAll:   ()         => api.get('/inventory'),
  update:   (id, data) => api.put(`/inventory/${id}`, data),
  restock:  (data)     => api.post('/inventory/restock', data),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminService = {
  getStats:   ()     => api.get('/admin/stats'),
  getReports: (params) => api.get('/admin/reports', { params }),
  getStaff:   ()     => api.get('/admin/staff'),
  updateRole: (id, role) => api.patch(`/admin/staff/${id}/role`, { role }),
}