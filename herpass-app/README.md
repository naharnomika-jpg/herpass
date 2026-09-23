# Herpass React Native App

Girls Hostel Outing Management System — React Native (Expo) Mobile App

## Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/client) on your phone OR an Android/iOS emulator
- Python FastAPI backend running (`python server.py` in the Herpass root)

### 2. Configure API URL

Edit `src/config.js`:
```js
export const BASE_URL = 'http://10.0.2.2:8000';  // Android emulator
// OR
export const BASE_URL = 'http://192.168.x.x:8000'; // Real device (use your LAN IP)
```

### 3. Install & Run
```bash
cd herpass-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator.

## Project Structure

```
herpass-app/
├── App.js                    # Root navigator
├── app.json                  # Expo config
├── src/
│   ├── config.js             # API URL & constants
│   ├── api.js                # All API calls (Axios)
│   ├── theme.js              # Design tokens (colors, typography)
│   ├── context/
│   │   └── AuthContext.js    # Login/logout session state
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── GateScreen.js
│   │   ├── StudentsScreen.js
│   │   └── NotificationsScreen.js
│   ├── modals/
│   │   ├── CreateOutingModal.js
│   │   ├── ResolveOverdueModal.js
│   │   ├── ExtendDeadlineModal.js
│   │   └── AddStudentModal.js
│   └── components/
│       ├── StatusBadge.js
│       ├── OutingCard.js
│       ├── StatCard.js
│       └── StudentCard.js
```

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Warden | warden@hostel.edu | warden123 |
| Guard | guard.main@hostel.edu | guard123 |

## Features

- ✅ Login with session persistence
- ✅ Dashboard with KPI stats + overdue alert banner
- ✅ Live outing list with search + status filter
- ✅ Mark OUT / Mark RETURNED
- ✅ Create Outing (with date/time pickers)
- ✅ Extend Deadline
- ✅ Resolve Overdue case
- ✅ Guard Gate Desk view
- ✅ Students directory (click-to-call contacts)
- ✅ Add Student
- ✅ Notifications screen
- ✅ Auto-polling every 10s for realtime-like updates
- ✅ Dark premium theme matching the web app
