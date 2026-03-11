import api from './api'

export const menuService = {
  getAll:      (params)   => api.get('/menu', { params }),
  getById:     (id)       => api.get(`/menu/${id}`),
  create:      (data)     => api.post('/menu', data),
  update:      (id, data) => api.put(`/menu/${id}`, data),
  delete:      (id)       => api.delete(`/menu/${id}`),
  toggleAvail: (id)       => api.patch(`/menu/${id}/toggle`),
}

export const orderService = {
  create:        (data)       => api.post('/orders', data),
  getAll:        (params)     => api.get('/orders/all', { params }),
  getMyOrders:   (userId)     => api.get(`/orders/user/${userId}`),
  getById:       (id)         => api.get(`/orders/${id}`),
  getKitchen:    ()           => api.get('/orders/kitchen'),
  getReady:      ()           => api.get('/orders/ready'),
  updateStatus:  (id, status) => api.put(`/orders/${id}/status`, { status }),
  markCollected: (id)         => api.put(`/orders/${id}/collect`),
  cancel:        (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
}

export const authService = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile:  ()     => api.get('/auth/profile'),
}

export const inventoryService = {
  getAll:   ()             => api.get('/inventory'),
  create:   (data)         => api.post('/inventory', data),
  update:   (id, data)     => api.put(`/inventory/${id}`, data),
  restock:  (data)         => api.post('/inventory/restock', data),
}

export const adminService = {
  getStats:     ()             => api.get('/admin/stats'),
  getReports:   (params)       => api.get('/admin/reports', { params }),
  getStaff:     ()             => api.get('/admin/staff'),
  createStaff:  (data)         => api.post('/admin/staff', data),
  updateRole:   (id, role)     => api.patch(`/admin/staff/${id}/role`, { role }),
  deleteStaff:  (id)           => api.delete(`/admin/staff/${id}`),
}