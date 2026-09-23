// ─── Herpass API Layer ────────────────────────────────────────────────────────
import axios from 'axios';
import { BASE_URL } from './config';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/api/login', { email, password }).then(r => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get('/api/dashboard/stats').then(r => r.data);

// ── Outings ───────────────────────────────────────────────────────────────────
export const getOutings = (params = {}) =>
  api.get('/api/outings', { params }).then(r => r.data);

export const createOuting = (payload, userName = 'Warden') =>
  api
    .post('/api/outings/create', payload, { params: { user_name: userName } })
    .then(r => r.data);

export const markOut = (outingId, guardName) =>
  api
    .post(`/api/outings/${outingId}/mark-out`, null, {
      params: { guard_name: guardName },
    })
    .then(r => r.data);

export const markReturned = (outingId, guardName) =>
  api
    .post(`/api/outings/${outingId}/mark-returned`, null, {
      params: { guard_name: guardName },
    })
    .then(r => r.data);

export const resolveOverdue = (outingId, resolutionNotes, wardenName) =>
  api
    .post(
      `/api/outings/${outingId}/resolve-overdue`,
      { resolution_notes: resolutionNotes },
      { params: { warden_name: wardenName } }
    )
    .then(r => r.data);

export const extendDeadline = (outingId, newReturnDeadline, reason, wardenName) =>
  api
    .post(
      `/api/outings/${outingId}/extend`,
      { new_return_deadline: newReturnDeadline, reason },
      { params: { warden_name: wardenName } }
    )
    .then(r => r.data);

// ── Students ──────────────────────────────────────────────────────────────────
export const getStudents = (search = '') =>
  api.get('/api/students', { params: search ? { search } : {} }).then(r => r.data);

export const createStudent = payload =>
  api.post('/api/students/create', payload).then(r => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (role) =>
  api.get('/api/notifications', { params: { role } }).then(r => r.data);

export default api;
