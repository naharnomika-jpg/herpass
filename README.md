# 🛡️ HERPASS — Girls Hostel Outing Safety & Management System

**Herpass** is a real-time outing management and safety monitoring system designed for women's hostels and university campuses. It streamlines student outing permissions, automates gate verification, tracks return deadlines, and triggers real-time alerts when curfew or return deadlines are breached.

---

## 🌟 Key Features

- 🕒 **Automated Real-Time Tracking**: Automatic detection and countdown to return deadlines (6:00 PM standard hostel return).
- 🚨 **Instant Overdue Alerts**: Real-time push notifications and audio alerts across dashboards when students are overdue.
- 📱 **Fast Gate Desk (Guard View)**: 1-click verification for security guards to mark student departure (`Mark OUT`) and entry (`Mark RETURNED`).
- 👩‍💼 **Warden Administration Portal**: Full dashboard with live register, quick overdue resolution, deadline extensions, and student directory.
- 👥 **Student Resident Directory**: Profile cards with room numbers, courses, phone contacts, and guardian details.
- 📶 **PWA & Mobile Ready**: Offline-capable Progressive Web App with Service Worker support and React Native / Android client applications.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Python FastAPI with SQLite, SSE (Server-Sent Events) live event stream, and background scheduler daemon.
- **Frontend Dashboard**: Responsive Single Page App (Tailwind CSS, Lucide Icons, Chart.js, Vanilla JS).
- **Mobile App**: React Native (Expo) & Native Android WebView client.

---

## 🚀 Getting Started

### 1. Run the Backend & Web Dashboard
```bash
# Install Python dependencies (if needed)
pip install fastapi uvicorn pydantic

# Start the server
python server.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

#### Demo Credentials:
- **Warden**: `warden@hostel.edu` / `warden123`
- **Security Guard**: `guard.main@hostel.edu` / `guard123`
- **Student**: `ananya@student.edu` / `student123`

---

### 2. Run the React Native Mobile App (`herpass-app`)
```bash
cd herpass-app
npm install
npx expo start
```

---

### 3. Android Native App (`android-app`)
Open the `android-app` directory in **Android Studio** and build/run on an emulator or physical device.

---

## 📄 License
MIT License
