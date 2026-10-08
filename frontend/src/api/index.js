import { api } from "./client";

// Member A — auth & users
export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  updateMe: (data) => api.put("/api/auth/me", data),
  deleteMe: () => api.del("/api/auth/me"),
};

export const usersApi = {
  list: (q) => api.get("/api/users", { q }),
  create: (data) => api.post("/api/users", data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  remove: (id) => api.del(`/api/users/${id}`),
  stats: () => api.get("/api/analytics/admin"),
};

// Member B — courses & notes
export const coursesApi = {
  list: () => api.get("/api/courses"),
  create: (data) => api.post("/api/courses", data),
  update: (id, data) => api.put(`/api/courses/${id}`, data),
  remove: (id) => api.del(`/api/courses/${id}`),
};

export const notesApi = {
  list: (params) => api.get("/api/notes", params),
  create: (data) => api.post("/api/notes", data),
  update: (id, data) => api.put(`/api/notes/${id}`, data),
  remove: (id) => api.del(`/api/notes/${id}`),
};

// Member C — tasks, study logs & analytics
export const tasksApi = {
  list: (params) => api.get("/api/tasks", params),
  create: (data) => api.post("/api/tasks", data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  remove: (id) => api.del(`/api/tasks/${id}`),
};

export const studyLogsApi = {
  list: (params) => api.get("/api/studylogs", params),
  create: (data) => api.post("/api/studylogs", data),
  update: (id, data) => api.put(`/api/studylogs/${id}`, data),
  remove: (id) => api.del(`/api/studylogs/${id}`),
};

export const analyticsApi = {
  summary: () =>
    api.get("/api/analytics/summary", { tz: Intl.DateTimeFormat().resolvedOptions().timeZone }),
};
