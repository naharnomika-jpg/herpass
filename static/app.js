// HERPASS Client Application Engine

let currentRole = "warden";
let currentUser = {
    name: "Dr. Sunita Deshmukh",
    email: "warden@hostel.edu",
    role: "warden"
};

let allOutings = [];
let allStudents = [];
let allNotifications = [];
let audioAlertsEnabled = true;
let currentFilterStatus = "ALL";
let statusChartInstance = null;
let destinationChartInstance = null;

// Audio Synth Siren for Critical Overdue Alerts
let audioCtx = null;

function playOverdueSiren() {
    if (!audioAlertsEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
        console.log("Audio alert playback error:", e);
    }
}

function toggleAudioAlerts() {
    audioAlertsEnabled = !audioAlertsEnabled;
    const btnText = document.getElementById("soundText");
    const btnIcon = document.getElementById("soundIcon");
    if (audioAlertsEnabled) {
        btnText.innerText = "Audio Alerts Enabled";
        btnIcon.setAttribute("data-lucide", "volume-2");
        btnIcon.className = "w-4 h-4 text-emerald-400";
    } else {
        btnText.innerText = "Audio Alerts Muted";
        btnIcon.setAttribute("data-lucide", "volume-x");
        btnIcon.className = "w-4 h-4 text-rose-400";
    }
    lucide.createIcons();
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    initSSE();
    fetchStudents();
    fetchDashboardData();
    fetchNotifications();
    
    // Set default form date to today and return deadline to 6:00 PM (18:00)
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById("formOutingDate").value = todayStr;
    document.getElementById("formReturnDeadline").value = "18:00";

    // Mobile menu toggle
    document.getElementById("mobileMenuBtn").addEventListener("click", () => {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle("hidden");
    });

    // ── Native Android WebView detection ──────────────────────────────────────
    // The Herpass Android app appends "HerpassAndroid/1.0" to the User-Agent.
    // When running inside the native wrapper:
    //   • Hide the PWA install button (already installed as a native app)
    //   • Suppress the sound toggle (no AudioContext quirks in WebView needed)
    if (navigator.userAgent.includes("HerpassAndroid")) {
        const installBtn = document.getElementById("pwaInstallBtn");
        if (installBtn) installBtn.style.display = "none";
        // Mark body so CSS can optionally adjust padding for native chrome
        document.body.classList.add("herpass-native-app");
    }
});

// Realtime SSE Listener Setup
function initSSE() {
    const sse = new EventSource("/api/events");

    sse.addEventListener("open", () => {
        document.getElementById("sseStatusPill").className = "flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-xs text-emerald-300";
        document.getElementById("sseStatusText").innerText = "Live Realtime Sync";
    });

    sse.addEventListener("OVERDUE_ALERT", (e) => {
        const data = JSON.parse(e.data).data;
        playOverdueSiren();
        showOverdueBanner(data);
        fetchDashboardData();
        fetchNotifications();
    });

    sse.addEventListener("STATUS_CHANGE", () => {
        fetchDashboardData();
        fetchNotifications();
    });

    sse.addEventListener("OUTING_CREATED", () => {
        fetchDashboardData();
    });

    sse.onerror = () => {
        document.getElementById("sseStatusPill").className = "flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400";
        document.getElementById("sseStatusText").innerText = "Reconnecting Sync...";
    };
}

// Role Switcher
function toggleRoleDropdown() {
    const menu = document.getElementById("roleDropdownMenu");
    menu.classList.toggle("hidden");
}

function switchRole(role) {
    currentRole = role;
    document.getElementById("roleDropdownMenu").classList.add("hidden");
    
    const roleBadge = document.getElementById("currentRoleBadge");
    const userName = document.getElementById("currentUserName");
    const sidebarRole = document.getElementById("sidebarUserRole");
    const sidebarName = document.getElementById("sidebarUserName");

    if (role === 'warden') {
        currentUser = { name: "Dr. Sunita Deshmukh", role: "warden" };
        roleBadge.innerText = "WARDEN";
        roleBadge.className = "px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30";
        sidebarRole.innerText = "Chief Warden";
        navigateTab('dashboard');
    } else if (role === 'guard') {
        currentUser = { name: "Ramesh Guard (Main Gate)", role: "guard" };
        roleBadge.innerText = "GUARD GATE";
        roleBadge.className = "px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
        sidebarRole.innerText = "Gate Security Officer";
        navigateTab('guard-gate');
    } else if (role === 'student') {
        currentUser = { name: "Ananya Sharma", role: "student" };
        roleBadge.innerText = "STUDENT";
        roleBadge.className = "px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30";
        sidebarRole.innerText = "Student Portal";
        navigateTab('student-portal');
    }

    userName.innerText = currentUser.name;
    sidebarName.innerText = currentUser.name;
}

// Navigation Tabs
function navigateTab(tabId) {
    document.querySelectorAll("main > section").forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll(".nav-item").forEach(item => {
        item.className = "nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/70";
    });
    document.querySelectorAll(".mobile-nav-item").forEach(item => {
        item.classList.remove("text-pink-400", "font-semibold");
        item.classList.add("text-slate-400");
    });

    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.className = "nav-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-pink-400 bg-pink-500/10 border border-pink-500/20 font-bold";
    }

    const activeMobileNav = document.getElementById(`mobile-nav-${tabId}`);
    if (activeMobileNav) {
        activeMobileNav.classList.remove("text-slate-400");
        activeMobileNav.classList.add("text-pink-400", "font-semibold");
    }

    const targetSec = document.getElementById(`view-${tabId}`);
    if (targetSec) {
        targetSec.classList.remove("hidden");
    }

    // Refresh tab specific data
    if (tabId === 'guard-gate') renderGateCards();
    if (tabId === 'overdue-list') renderOverdueList();
    if (tabId === 'outings') renderAllOutingsTable();
    if (tabId === 'students') renderStudentsGrid();
    if (tabId === 'student-portal') renderStudentPortal();
    if (tabId === 'history-audit') fetchAuditLogs();
    if (tabId === 'analytics') fetchAnalyticsData();

    lucide.createIcons();
}


// Fetch API Data
async function fetchStudents() {
    try {
        const res = await fetch("/api/students");
        allStudents = await res.json();
        populateStudentSelect();
    } catch (e) {
        console.error("Error fetching students:", e);
    }
}

function populateStudentSelect() {
    const sel = document.getElementById("formStudentId");
    sel.innerHTML = allStudents.map(s => `
        <option value="${s.id}">${s.name} (Room ${s.room_number})</option>
    `).join("");
}

async function fetchDashboardData() {
    try {
        const statsRes = await fetch("/api/dashboard/stats");
        const stats = await statsRes.json();

        if (document.getElementById("stat-total-students")) {
            document.getElementById("stat-total-students").innerText = stats.total_students;
        }
        document.getElementById("stat-todays-outings").innerText = stats.todays_outings;
        document.getElementById("stat-currently-outside").innerText = stats.currently_outside;
        document.getElementById("stat-returned-today").innerText = stats.returned_today;
        if (document.getElementById("stat-upcoming-today")) {
            document.getElementById("stat-upcoming-today").innerText = stats.upcoming_today;
        }
        if (document.getElementById("stat-overdue-count")) {
            document.getElementById("stat-overdue-count").innerText = stats.overdue_count;
        }
        if (document.getElementById("sidebarOverdueCount")) {
            document.getElementById("sidebarOverdueCount").innerText = stats.overdue_count;
        }

        const outingsRes = await fetch("/api/outings");
        allOutings = await outingsRes.json();

        renderDashboardTable();
        renderGateCards();
    } catch (e) {
        console.error("Error fetching dashboard data:", e);
    }
}

function showOverdueBanner(data) {
    const banner = document.getElementById("overdueBanner");
    if (banner) banner.classList.add("hidden");
}

function hideOverdueBanner() {
    document.getElementById("overdueBanner").classList.add("hidden");
}

// Render Dashboard Outings Table
function renderDashboardTable() {
    const tbody = document.getElementById("outingsTableBody");
    const searchVal = document.getElementById("dashboardSearchInput").value.toLowerCase();

    const filtered = allOutings.filter(o => {
        const matchesStatus = currentFilterStatus === 'ALL' || 
            o.status === currentFilterStatus || 
            (currentFilterStatus === 'OUT' && (o.status === 'OVERDUE' || o.status === 'RESOLVED'));
        const matchesSearch = !searchVal || 
            o.student_name.toLowerCase().includes(searchVal) ||
            o.room_number.toLowerCase().includes(searchVal) ||
            o.outing_id.toLowerCase().includes(searchVal) ||
            o.destination.toLowerCase().includes(searchVal);
        return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500">No outing records match your search filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => `
        <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3.5 px-4">
                <div class="font-bold text-white">${o.student_name}</div>
            </td>
            <td class="py-3.5 px-4 font-semibold text-slate-200">Room ${o.room_number}</td>
            <td class="py-3.5 px-4">
                <div class="text-slate-200 font-medium">${o.destination}</div>
            </td>
            <td class="py-3.5 px-4 text-slate-300 font-mono">${o.departure_time}</td>
            <td class="py-3.5 px-4 font-mono font-bold ${o.status === 'OVERDUE' ? 'text-rose-400 font-extrabold animate-pulse' : 'text-slate-300'}">${o.return_deadline}</td>
            <td class="py-3.5 px-4 text-right space-x-1">
                ${getActionButtons(o)}
            </td>
        </tr>
    `).join("");

    lucide.createIcons();
}

function getStatusBadgeClass(status) {
    if (status === 'RETURNED') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (status === 'OUT') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (status === 'UPCOMING') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (status === 'OVERDUE') return 'bg-rose-600 text-white font-black animate-pulse';
    if (status === 'RESOLVED') return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
    if (status === 'LATE RETURN') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    return 'bg-slate-800 text-slate-400';
}

function getStatusIcon(status) {
    if (status === 'RETURNED') return '🟢';
    if (status === 'OUT') return '🟠';
    if (status === 'UPCOMING') return '🔵';
    if (status === 'OVERDUE') return '🔴';
    if (status === 'RESOLVED') return '🟣';
    return '⚪';
}

function getActionButtons(o) {
    let btns = '';

    if (o.status === 'UPCOMING') {
        btns += `
            <button onclick="markOut('${o.outing_id}')" title="Mark Student OUT at Gate" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition">
                Mark OUT
            </button>
        `;
    } else if (o.status === 'OUT' || o.status === 'OVERDUE' || o.status === 'RESOLVED') {
        btns += `
            <button onclick="markReturned('${o.outing_id}')" title="Mark Student RETURNED at Gate" class="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition">
                Mark RETURNED
            </button>
        `;
    }

    if (o.status === 'OVERDUE') {
        btns += `
            <button onclick="openResolveModal('${o.outing_id}')" title="Resolve Overdue Alert" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition">
                Resolve
            </button>
        `;
    }

    btns += `
        <button onclick="openExtendModal('${o.outing_id}')" title="Extend Return Deadline" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition border border-slate-700">
            Extend
        </button>
    `;

    return btns;
}

function filterOutings() {
    renderDashboardTable();
}

function setFilterStatus(status) {
    currentFilterStatus = status;
    renderDashboardTable();
}

// Render Guard Gate Verification Cards
function renderGateCards() {
    const upcomingContainer = document.getElementById("gateUpcomingList");
    const outsideContainer = document.getElementById("gateOutsideList");
    const gateSearch = document.getElementById("gateSearchInput")?.value.toLowerCase() || "";

    const upcomingList = allOutings.filter(o => o.status === 'UPCOMING' && (!gateSearch || o.student_name.toLowerCase().includes(gateSearch) || o.room_number.includes(gateSearch)));
    const outsideList = allOutings.filter(o => (o.status === 'OUT' || o.status === 'OVERDUE' || o.status === 'RESOLVED') && (!gateSearch || o.student_name.toLowerCase().includes(gateSearch) || o.room_number.includes(gateSearch)));

    document.getElementById("gateUpcomingCount").innerText = upcomingList.length;
    document.getElementById("gateOutsideCount").innerText = outsideList.length;

    if (upcomingList.length === 0) {
        upcomingContainer.innerHTML = `<div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">No pending departures at gate.</div>`;
    } else {
        upcomingContainer.innerHTML = upcomingList.map(o => `
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-bold text-white text-sm">${o.student_name}</div>
                        <div class="text-xs text-blue-400 font-semibold">Room ${o.room_number}</div>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs border border-blue-500/30">${o.departure_time}</span>
                </div>
                
                <div class="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                    <span class="font-semibold text-slate-200">Destination:</span> ${o.destination}
                </div>

                <div class="flex items-center justify-between pt-1">
                    <span class="text-[11px] text-slate-400">Return Deadline: ${o.return_deadline}</span>
                    <button onclick="markOut('${o.outing_id}')" class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition transform active:scale-95">
                        <i data-lucide="log-out" class="w-4 h-4"></i>
                        <span>MARK OUT AT GATE</span>
                    </button>
                </div>
            </div>
        `).join("");
    }

    if (outsideList.length === 0) {
        outsideContainer.innerHTML = `<div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">No students currently outside.</div>`;
    } else {
        outsideContainer.innerHTML = outsideList.map(o => `
            <div class="p-4 rounded-2xl ${o.status === 'OVERDUE' ? 'bg-rose-950/40 border-2 border-rose-500 animate-pulse' : 'bg-slate-900 border border-slate-800'} transition space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-bold text-white text-sm">${o.student_name}</div>
                        <div class="text-xs text-amber-400 font-semibold">Room ${o.room_number} | Phone: ${o.student_phone}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded text-xs font-bold ${getStatusBadgeClass(o.status)}">${o.status}</span>
                </div>

                <div class="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex justify-between">
                    <div><span class="font-semibold text-slate-200">Out Time:</span> ${o.actual_departure ? o.actual_departure.split(' ')[1] : o.departure_time}</div>
                    <div><span class="font-semibold text-slate-200">Return Deadline:</span> <span class="text-rose-400 font-bold">${o.return_deadline}</span></div>
                </div>

                <div class="flex items-center justify-between pt-1">
                    <a href="tel:${o.student_phone}" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700">
                        <i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span>Call Student</span>
                    </a>
                    <button onclick="markReturned('${o.outing_id}')" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition transform active:scale-95">
                        <i data-lucide="log-in" class="w-4 h-4"></i>
                        <span>MARK RETURNED</span>
                    </button>
                </div>
            </div>
        `).join("");
    }

    lucide.createIcons();
}

// Render Overdue List View
function renderOverdueList() {
    const container = document.getElementById("overdueFullList");
    const overdues = allOutings.filter(o => o.status === 'OVERDUE');

    if (overdues.length === 0) {
        container.innerHTML = `
            <div class="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <i data-lucide="check-circle-2" class="w-8 h-8"></i>
                </div>
                <h3 class="font-heading font-bold text-lg text-white">✓ All Students Accounted For</h3>
                <p class="text-xs text-slate-400 max-w-sm mx-auto">There are currently no overdue return alerts in the system.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = overdues.map(o => `
        <div class="p-6 rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-500 shadow-2xl space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs">🔴 URGENT OVERDUE</span>
                    </div>
                    <h2 class="font-heading font-bold text-xl text-white mt-1">${o.student_name}</h2>
                    <p class="text-xs text-slate-300">Room ${o.room_number} | Phone: ${o.student_phone} | Emergency: ${o.emergency_contact}</p>
                </div>

                <div class="flex items-center space-x-2">
                    <button onclick="openResolveModal('${o.outing_id}')" class="px-4 py-2.5 rounded-xl bg-white text-rose-950 hover:bg-rose-100 font-bold text-xs shadow-lg transition">
                        Mark Resolved
                    </button>
                    <button onclick="markReturned('${o.outing_id}')" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition">
                        Mark RETURNED
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                    <span class="text-slate-400 block">Destination</span>
                    <span class="font-semibold text-white">${o.destination}</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Out Time</span>
                    <span class="font-semibold text-white">${o.actual_departure ? o.actual_departure.split(' ')[1] : o.departure_time}</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Return Deadline</span>
                    <span class="font-extrabold text-rose-400">${o.return_deadline}</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Overdue Duration</span>
                    <span class="font-extrabold text-rose-400">${o.delay_minutes || 15} Minutes</span>
                </div>
            </div>
        </div>
    `).join("");

    lucide.createIcons();
}

// API Action Calls
async function markOut(outingId) {
    try {
        const res = await fetch(`/api/outings/${outingId}/mark-out?guard_name=${encodeURIComponent(currentUser.name)}`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
            fetchDashboardData();
        } else {
            alert(data.detail || "Error marking student OUT");
        }
    } catch (e) {
        console.error("Mark OUT failed:", e);
    }
}

async function markReturned(outingId) {
    try {
        const res = await fetch(`/api/outings/${outingId}/mark-returned?guard_name=${encodeURIComponent(currentUser.name)}`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            fetchDashboardData();
        } else {
            alert(data.detail || "Error marking student RETURNED");
        }
    } catch (e) {
        console.error("Mark RETURNED failed:", e);
    }
}

async function handleCreateOuting(e) {
    e.preventDefault();
    const payload = {
        student_id: parseInt(document.getElementById("formStudentId").value),
        destination: document.getElementById("formDestination").value,
        reason: "",
        outing_date: document.getElementById("formOutingDate").value,
        departure_time: document.getElementById("formDepartureTime").value,
        return_deadline: document.getElementById("formReturnDeadline").value,
        remarks: document.getElementById("formRemarks").value
    };

    try {
        const res = await fetch(`/api/outings/create?user_name=${encodeURIComponent(currentUser.name)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            closeModal("createOutingModal");
            fetchDashboardData();
        } else {
            alert(data.detail || "Error creating outing");
        }
    } catch (err) {
        console.error("Create outing failed:", err);
    }
}

function openCreateOutingModal() {
    document.getElementById("createOutingModal").classList.remove("hidden");
}

function openCreateStudentModal() {
    document.getElementById("createStudentModal").classList.remove("hidden");
}

async function handleCreateStudent(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById("newStudentName").value,
        room_number: document.getElementById("newStudentRoom").value,
        phone: document.getElementById("newStudentPhone").value,
        course: document.getElementById("newStudentCourse").value,
        year: document.getElementById("newStudentYear").value,
        guardian_contact: document.getElementById("newStudentGuardian").value
    };

    try {
        const res = await fetch("/api/students/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message || "Student added successfully!");
            document.getElementById("createStudentForm").reset();
            closeModal("createStudentModal");
            await fetchStudents();
            renderStudentsGrid();
        } else {
            alert(data.detail || "Error adding student");
        }
    } catch (err) {
        console.error("Create student failed:", err);
    }
}

function openResolveModal(outingId) {
    document.getElementById("resolveOutingId").value = outingId;
    document.getElementById("resolveOverdueModal").classList.remove("hidden");
}

async function handleResolveOverdue(e) {
    e.preventDefault();
    const outingId = document.getElementById("resolveOutingId").value;

    try {
        const res = await fetch(`/api/outings/${outingId}/resolve-overdue?warden_name=${encodeURIComponent(currentUser.name)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resolution_notes: "Resolved and confirmed by Warden." })
        });
        const data = await res.json();
        if (res.ok) {
            closeModal("resolveOverdueModal");
            fetchDashboardData();
        }
    } catch (err) {
        console.error("Resolve overdue failed:", err);
    }
}

function openExtendModal(outingId) {
    document.getElementById("extendOutingId").value = outingId;
    document.getElementById("extendDeadlineModal").classList.remove("hidden");
}

async function handleExtendDeadline(e) {
    e.preventDefault();
    const outingId = document.getElementById("extendOutingId").value;
    const newTime = document.getElementById("extendNewTime").value;
    const reason = document.getElementById("extendReason").value;

    try {
        const res = await fetch(`/api/outings/${outingId}/extend?warden_name=${encodeURIComponent(currentUser.name)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ new_return_deadline: newTime, reason: reason })
        });
        const data = await res.json();
        if (res.ok) {
            closeModal("extendDeadlineModal");
            fetchDashboardData();
        }
    } catch (err) {
        console.error("Extend deadline failed:", err);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
}

function callGuardian(studentId) {
    alert(`Dialing Guardian Emergency Line for student (${studentId})...`);
}

// Render Students Grid
function renderStudentsGrid() {
    const grid = document.getElementById("studentsGrid");
    grid.innerHTML = allStudents.map(s => `
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition">
            <div>
                <h3 class="font-heading font-bold text-base text-white">${s.name}</h3>
                <div class="text-xs text-pink-400 font-semibold">Room ${s.room_number}</div>
                <div class="text-[11px] text-slate-400">${s.course} (${s.year})</div>
            </div>

            <div class="space-y-1.5 text-xs bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-slate-300">
                <div><span class="text-slate-400">Student Phone:</span> <span class="font-mono text-white">${s.phone}</span></div>
                <div><span class="text-slate-400">Guardian Contact:</span> <span class="text-white">${s.guardian_contact}</span></div>
            </div>
        </div>
    `).join("");

    lucide.createIcons();
}

// Render Student Portal View
function renderStudentPortal() {
    const container = document.getElementById("studentOutingHistoryList");
    // Show Ananya Sharma (STU-101) outings
    const studentOutings = allOutings.filter(o => o.student_code === 'STU-101');

    container.innerHTML = studentOutings.map(o => `
        <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-0.5 rounded ${getStatusBadgeClass(o.status)}">${o.status}</span>
                </div>
                <div class="font-bold text-white text-sm mt-1">${o.destination}</div>
                <div class="text-slate-400">Reason: ${o.reason} | Out Date: ${o.outing_date}</div>
            </div>

            <div class="text-right">
                <div class="text-slate-300">Scheduled: ${o.departure_time} to <span class="text-rose-400 font-bold">${o.return_deadline}</span></div>
                <div class="text-slate-400 text-[11px]">Actual Departure: ${o.actual_departure || 'Not left yet'}</div>
            </div>
        </div>
    `).join("");
}

// Notifications Center
async function fetchNotifications() {
    try {
        const res = await fetch(`/api/notifications?role=${currentRole}`);
        allNotifications = await res.json();
        
        const badge = document.getElementById("notifBadge");
        if (allNotifications.length > 0) {
            badge.innerText = allNotifications.length;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }

        renderNotificationsList();
    } catch (e) {
        console.error("Error fetching notifications:", e);
    }
}

function renderNotificationsList() {
    const container = document.getElementById("notificationsList");
    if (!container) return;

    container.innerHTML = allNotifications.map(n => `
        <div class="p-3.5 rounded-2xl ${n.priority === 'CRITICAL' ? 'bg-rose-950/60 border border-rose-500' : 'bg-slate-800 border border-slate-700'} text-xs space-y-1">
            <div class="flex items-center justify-between">
                <span class="font-extrabold ${n.priority === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-blue-400'}">${n.type}</span>
                <span class="text-[10px] text-slate-400">${n.created_at.split(' ')[1] || ''}</span>
            </div>
            <p class="text-slate-200 leading-relaxed">${n.message}</p>
        </div>
    `).join("");
}

function toggleNotificationsDrawer() {
    const drawer = document.getElementById("notificationsDrawer");
    drawer.classList.toggle("hidden");
}

// Audit Logs
async function fetchAuditLogs() {
    try {
        const res = await fetch("/api/audit-logs");
        const logs = await res.json();
        const tbody = document.getElementById("auditTableBody");

        tbody.innerHTML = logs.map(l => `
            <tr class="hover:bg-slate-800/40">
                <td class="py-3 px-4 font-mono text-slate-400">${l.timestamp}</td>
                <td class="py-3 px-4 font-bold text-white">${l.user_name}</td>
                <td class="py-3 px-4 uppercase text-[10px] text-pink-400 font-bold">${l.user_role}</td>
                <td class="py-3 px-4 font-semibold text-emerald-400">${l.action}</td>
                <td class="py-3 px-4 text-slate-300">${l.details}</td>
            </tr>
        `).join("");
    } catch (e) {
        console.error("Audit log error:", e);
    }
}

// Analytics Charts
async function fetchAnalyticsData() {
    try {
        const res = await fetch("/api/reports/analytics");
        const data = await res.json();

        // Chart 1: Status Distribution
        const ctx1 = document.getElementById("statusChart").getContext("2d");
        if (statusChartInstance) statusChartInstance.destroy();
        
        const labels = Object.keys(data.status_distribution);
        const values = Object.values(data.status_distribution);

        statusChartInstance = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#a855f7']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                }
            }
        });

        // Chart 2: Top Destinations
        const ctx2 = document.getElementById("destinationChart").getContext("2d");
        if (destinationChartInstance) destinationChartInstance.destroy();

        destinationChartInstance = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: data.top_destinations.map(d => d.destination),
                datasets: [{
                    label: 'Outings Count',
                    data: data.top_destinations.map(d => d.count),
                    backgroundColor: '#db2777'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { ticks: { color: '#94a3b8' } },
                    y: { ticks: { color: '#94a3b8' } }
                },
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                }
            }
        });

    } catch (e) {
        console.error("Analytics fetch error:", e);
    }
}

// -------------------------------------------------------------
// PWA (Progressive Web App) Installation & Service Worker Setup
// -------------------------------------------------------------
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
    }
});

async function installPWAApp() {
    if (!deferredPrompt) {
        alert("To install Herpass on your mobile home screen:\n\n• iOS (Safari): Tap Share button -> 'Add to Home Screen'\n• Android (Chrome): Tap Menu (⋮) -> 'Install app' or 'Add to Home Screen'");
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    deferredPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
        installBtn.classList.add('hidden');
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[PWA] Service Worker registered successfully with scope:', reg.scope))
            .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
    });
}

