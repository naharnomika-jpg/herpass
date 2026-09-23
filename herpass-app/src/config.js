// ─── Herpass API Configuration ───────────────────────────────────────────────
// Change BASE_URL to match your server's address:
//   • Android Emulator (AVD): http://10.0.2.2:8000
//   • iOS Simulator:          http://localhost:8000
//   • Real Device (LAN):      http://192.168.x.x:8000
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_URL = 'http://localhost:8000';

// Polling interval for realtime data refresh (milliseconds)
export const POLL_INTERVAL = 10000;

export const DEMO_USERS = [
  {
    role: 'warden',
    name: 'Dr. Sunita Deshmukh',
    email: 'warden@hostel.edu',
    password: 'warden123',
    label: 'Warden (Admin Portal)',
  },
  {
    role: 'guard',
    name: 'Ramesh Guard (Main Gate)',
    email: 'guard.main@hostel.edu',
    password: 'guard123',
    label: 'Guard (Gate Interface)',
  },
];
