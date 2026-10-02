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
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    // Reset all sidebar nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Reset all mobile nav items
    document.querySelectorAll('.mobile-nav-btn').forEach(item => item.classList.remove('active'));

    // Activate sidebar item
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) activeNav.classList.add('active');

    // Activate mobile nav item
    const activeMobileNav = document.getElementById(`mobile-nav-${tabId}`);
    if (activeMobileNav) activeMobileNav.classList.add('active');

    // Show target section
    const targetSec = document.getElementById(`view-${tabId}`);
    if (targetSec) targetSec.classList.add('active');

    // Refresh data for specific tabs
    if (tabId === 'guard-gate') renderGateCards();
    if (tabId === 'students') renderStudentsGrid();

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

        const safe = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val ?? '—'; };
        safe('stat-todays-outings', stats.todays_outings);
        safe('stat-currently-outside', stats.currently_outside);
        safe('stat-returned-today', stats.returned_today);
        safe('stat-total-students', stats.total_students);

        // Overdue banner
        const banner = document.getElementById('overdueBanner');
        if (banner) {
            if (stats.overdue_count > 0) {
                banner.classList.remove('hidden');
                const txt = document.getElementById('overdueBannerText');
                if(txt) txt.innerText = `${stats.overdue_count} OVERDUE student${stats.overdue_count>1?'s':''} — tap to review`;
            } else {
                banner.classList.add('hidden');
            }
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

// Render Dashboard — Mobile Cards + Desktop Table
function renderDashboardTable() {
    const searchVal = (document.getElementById('dashboardSearchInput')?.value || '').toLowerCase();

    const filtered = allOutings.filter(o => {
        const matchesStatus = currentFilterStatus === 'ALL' ||
            o.status === currentFilterStatus ||
            (currentFilterStatus === 'OUT' && (o.status === 'OVERDUE' || o.status === 'RESOLVED'));
        const matchesSearch = !searchVal ||
            o.student_name?.toLowerCase().includes(searchVal) ||
            o.room_number?.toLowerCase().includes(searchVal) ||
            o.outing_id?.toLowerCase().includes(searchVal) ||
            o.destination?.toLowerCase().includes(searchVal);
        return matchesStatus && matchesSearch;
    });

    // Update count badge
    const countEl = document.getElementById('registerCount');
    if(countEl) countEl.innerText = filtered.length;

    // ── Mobile cards ──
    const cardList = document.getElementById('outingsCardList');
    if (cardList) {
        if (filtered.length === 0) {
            cardList.innerHTML = `<div style="text-align:center;padding:48px 0;color:#4B5B78;font-size:14px;">No records match your filter.</div>`;
        } else {
            cardList.innerHTML = filtered.map(o => {
                const isOverdue = o.status === 'OVERDUE';
                const avatarColors = isOverdue ? ['#BE123C','#F43F5E'] : ['#6366F1','#8B5CF6'];
                const barColor = { OUT:'#F59E0B', OVERDUE:'#F43F5E', RETURNED:'#10B981', UPCOMING:'#3B82F6', 'LATE RETURN':'#A855F7' }[o.status] || '#6366F1';
                return `
                <div class="outing-card ${isOverdue ? 'overdue' : ''}">
                    <div class="outing-card-bar" style="background:${barColor};"></div>
                    <div class="outing-card-body">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div class="avatar" style="background:linear-gradient(135deg,${avatarColors[0]},${avatarColors[1]});font-size:18px;">${o.student_name?.charAt(0)?.toUpperCase()}</div>
                            <div style="flex:1;">
                                <div style="font-weight:800;color:#E2E8F0;font-size:15px;">${o.student_name}</div>
                                <div style="font-size:12px;color:#94A3B8;margin-top:2px;">Room ${o.room_number} · ${o.student_code}</div>
                            </div>
                            <span class="status-badge status-${o.status.replace(' ','-')}">${o.status}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;background:#0A0F1E;border-radius:9px;padding:10px 12px;border:1px solid #131D35;">
                            <div style="width:24px;height:24px;border-radius:7px;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <i data-lucide="map-pin" style="width:12px;height:12px;color:#818CF8;"></i>
                            </div>
                            <div>
                                <div style="font-size:13px;font-weight:600;color:#E2E8F0;">${o.destination}</div>
                                ${o.reason ? `<div style="font-size:11px;color:#94A3B8;margin-top:2px;">${o.reason}</div>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:7px;">
                            <div class="time-chip"><div class="time-chip-label">Departs</div><div class="time-chip-value" style="color:#3B82F6;">${o.departure_time}</div></div>
                            <div class="time-chip ${isOverdue ? 'overdue' : ''}"><div class="time-chip-label">Return By</div><div class="time-chip-value" style="color:${isOverdue?'#F43F5E':'#F59E0B'}">${o.return_deadline}</div></div>
                            <div class="time-chip"><div class="time-chip-label">Date</div><div class="time-chip-value" style="color:#94A3B8;font-size:11px;">${o.outing_date}</div></div>
                        </div>
                        ${(o.status === 'UPCOMING' || o.status === 'OUT' || o.status === 'OVERDUE') ? `
                        <div class="action-row">
                            <div class="action-btns">
                                ${o.status === 'UPCOMING' ? `<button onclick="markOut('${o.outing_id}')" class="btn-primary btn-success" style="padding:9px 16px;font-size:12px;"><i data-lucide="log-out" style="width:14px;height:14px;"></i>Mark OUT</button>` : ''}
                                ${(o.status === 'OUT' || o.status === 'OVERDUE') ? `<button onclick="markReturned('${o.outing_id}')" class="btn-primary btn-blue" style="padding:9px 16px;font-size:12px;"><i data-lucide="log-in" style="width:14px;height:14px;"></i>Returned</button>` : ''}
                                ${o.status === 'OVERDUE' ? `<button onclick="openResolveModal('${o.outing_id}')" class="btn-primary btn-danger" style="padding:9px 16px;font-size:12px;">Resolve</button>` : ''}
                            </div>
                            <button onclick="openExtendModal('${o.outing_id}')" class="btn-ghost" style="padding:8px 12px;font-size:12px;">
                                <i data-lucide="clock" style="width:14px;height:14px;"></i>Extend
                            </button>
                        </div>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
    }

    // ── Desktop table ──
    const tbody = document.getElementById('outingsTableBody');
    if (tbody) {
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#4B5B78;font-size:14px;">No outing records match your search filter.</td></tr>`;
        } else {
            tbody.innerHTML = filtered.map(o => `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div class="avatar" style="width:34px;height:34px;border-radius:9px;font-size:13px;background:linear-gradient(135deg,#6366F1,#8B5CF6);">${o.student_name?.charAt(0)?.toUpperCase()}</div>
                            <div style="font-weight:800;color:#E2E8F0;">${o.student_name}</div>
                        </div>
                    </td>
                    <td style="color:#94A3B8;">Room ${o.room_number}</td>
                    <td style="color:#E2E8F0;font-weight:500;">${o.destination}</td>
                    <td style="color:#94A3B8;font-family:monospace;">${o.departure_time}</td>
                    <td style="font-family:monospace;font-weight:800;color:${o.status==='OVERDUE'?'#F43F5E':'#94A3B8'};">${o.return_deadline}</td>
                    <td style="text-align:right;"><div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">${getActionButtons(o)}</div></td>
                </tr>
            `).join('');
        }
    }

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
    // Update filter chip active states
    document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
    const activeChip = document.getElementById('chip-' + status);
    if (activeChip) activeChip.classList.add('active');
    renderDashboardTable();
}

// Render Guard Gate Verification Cards
function renderGateCards() {
    const upcomingContainer = document.getElementById('gateUpcomingList');
    const outsideContainer = document.getElementById('gateOutsideList');
    const gateSearch = (document.getElementById('gateSearchInput')?.value || '').toLowerCase();

    const upcomingList = allOutings.filter(o =>
        o.status === 'UPCOMING' &&
        (!gateSearch || o.student_name?.toLowerCase().includes(gateSearch) || o.room_number?.includes(gateSearch))
    );
    const outsideList = allOutings.filter(o =>
        (o.status === 'OUT' || o.status === 'OVERDUE' || o.status === 'RESOLVED') &&
        (!gateSearch || o.student_name?.toLowerCase().includes(gateSearch) || o.room_number?.includes(gateSearch))
    );

    ['gateUpcomingCount','gateUpcomingBadge'].forEach(id => { const el=document.getElementById(id); if(el) el.innerText=upcomingList.length; });
    ['gateOutsideCount','gateOutsideBadge'].forEach(id => { const el=document.getElementById(id); if(el) el.innerText=outsideList.length; });

    if (!upcomingContainer || !outsideContainer) return;

    if (upcomingList.length === 0) {
        upcomingContainer.innerHTML = `<div class="gate-card" style="display:flex;align-items:center;justify-content:center;padding:28px;color:#4B5B78;font-size:14px;">No pending departures at gate.</div>`;
    } else {
        upcomingContainer.innerHTML = upcomingList.map(o => `
        <div class="gate-card">
            <div class="gate-card-bar" style="background:#3B82F6;"></div>
            <div class="gate-card-body">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div class="avatar" style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);font-size:17px;">${o.student_name?.charAt(0)?.toUpperCase()}</div>
                    <div style="flex:1;">
                        <div style="font-weight:800;color:#E2E8F0;font-size:15px;">${o.student_name}</div>
                        <div style="font-size:12px;color:#3B82F6;margin-top:2px;font-weight:600;">Room ${o.room_number} · ${o.student_code||''}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:9px;border:1px solid rgba(59,130,246,0.4);background:rgba(59,130,246,0.1);">
                        <i data-lucide="clock" style="width:11px;height:11px;color:#3B82F6;"></i>
                        <span style="font-size:12px;font-weight:800;color:#3B82F6;">${o.departure_time}</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;background:#0A0F1E;border-radius:9px;padding:10px 12px;border:1px solid #131D35;">
                    <i data-lucide="map-pin" style="width:13px;height:13px;color:#4B5B78;flex-shrink:0;"></i>
                    <span style="font-size:13px;color:#94A3B8;">${o.destination}${o.reason?' · '+o.reason:''}</span>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <span style="font-size:12px;color:#94A3B8;">Return By: <strong style="color:#E2E8F0;">${o.return_deadline}</strong></span>
                    <div style="display:flex;gap:8px;">
                        <button onclick="openExtendModal('${o.outing_id}')" class="btn-ghost" style="padding:10px 12px;font-size:12px;">
                            <i data-lucide="clock" style="width:14px;height:14px;"></i>
                        </button>
                        <button onclick="markOut('${o.outing_id}')" class="btn-primary btn-success" style="padding:11px 18px;font-size:13px;font-weight:900;">
                            <i data-lucide="log-out" style="width:15px;height:15px;"></i>
                            MARK OUT
                        </button>
                    </div>
                </div>
            </div>
        </div>`).join('');
    }

    if (outsideList.length === 0) {
        outsideContainer.innerHTML = `<div class="gate-card" style="display:flex;align-items:center;justify-content:center;padding:28px;color:#4B5B78;font-size:14px;">No students currently outside.</div>`;
    } else {
        outsideContainer.innerHTML = outsideList.map(o => {
            const isOverdue = o.status === 'OVERDUE';
            return `
        <div class="gate-card ${isOverdue?'overdue':''}">
            <div class="gate-card-bar" style="background:${isOverdue?'#F43F5E':'#F59E0B'};"></div>
            <div class="gate-card-body">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div class="avatar" style="background:${isOverdue?'linear-gradient(135deg,#BE123C,#F43F5E)':'linear-gradient(135deg,#D97706,#F59E0B)'};font-size:17px;">${o.student_name?.charAt(0)?.toUpperCase()}</div>
                    <div style="flex:1;">
                        <div style="font-weight:800;color:#E2E8F0;font-size:15px;">${o.student_name}</div>
                        <div style="font-size:12px;color:${isOverdue?'#F43F5E':'#F59E0B'};margin-top:2px;font-weight:600;">Room ${o.room_number}</div>
                    </div>
                    <span class="status-badge status-${o.status.replace(' ','-')}">${o.status}</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <div class="time-chip">
                        <div class="time-chip-label">Out Since</div>
                        <div class="time-chip-value" style="color:#E2E8F0;">${o.actual_departure?o.actual_departure.split(' ')[1]:o.departure_time}</div>
                    </div>
                    <div class="time-chip" style="${isOverdue?'border-color:rgba(244,63,94,0.4);background:rgba(244,63,94,0.06);':''}">
                        <div class="time-chip-label" style="${isOverdue?'color:#F43F5E;':''}">Deadline</div>
                        <div class="time-chip-value" style="color:${isOverdue?'#F43F5E':'#F59E0B'}">${o.return_deadline}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <a href="tel:${o.student_phone}" class="contact-tap" style="padding:10px 14px;border-radius:10px;">
                        <i data-lucide="phone" style="width:15px;height:15px;color:#10B981;flex-shrink:0;"></i>
                        <span style="font-size:13px;font-weight:700;color:#10B981;">Call</span>
                    </a>
                    <div style="display:flex;gap:8px;">
                        ${isOverdue ? `<button onclick="openResolveModal('${o.outing_id}')" class="btn-primary btn-danger" style="padding:11px 16px;font-size:12px;">Resolve</button>` : ''}
                        <button onclick="markReturned('${o.outing_id}')" class="btn-primary btn-blue" style="padding:11px 18px;font-size:13px;font-weight:900;">
                            <i data-lucide="log-in" style="width:15px;height:15px;"></i>
                            RETURNED
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        }).join('');
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
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;
    const searchVal = (document.getElementById('studentSearchInput')?.value || '').toLowerCase();

    const filtered = allStudents.filter(s =>
        !searchVal ||
        s.name?.toLowerCase().includes(searchVal) ||
        s.room_number?.toLowerCase().includes(searchVal) ||
        s.course?.toLowerCase().includes(searchVal) ||
        s.student_id?.toLowerCase().includes(searchVal)
    );

    // Update outside/present counts
    const outsideCount = allStudents.filter(s => s.status === 'OUTSIDE').length;
    const safe = (id, val) => { const el=document.getElementById(id); if(el) el.innerText=val; };
    safe('stat-total-students', allStudents.length);
    safe('stat-outside-count', outsideCount);
    safe('stat-present-count', allStudents.length - outsideCount);

    const GRAD_POOL = [
        'linear-gradient(135deg,#6366F1,#8B5CF6)',
        'linear-gradient(135deg,#EC4899,#8B5CF6)',
        'linear-gradient(135deg,#3B82F6,#6366F1)',
        'linear-gradient(135deg,#10B981,#3B82F6)',
        'linear-gradient(135deg,#F59E0B,#EF4444)',
    ];
    const getGrad = name => GRAD_POOL[(name?.charCodeAt(0)||0) % GRAD_POOL.length];
    const isOutside = s => s.status === 'OUTSIDE';

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:56px 0;color:#4B5B78;font-size:14px;">No students found.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(s => `
        <div class="student-card">
            <div style="display:flex;align-items:center;gap:14px;">
                <div class="avatar avatar-lg" style="background:${getGrad(s.name)};flex-shrink:0;">${s.name?.charAt(0)?.toUpperCase()}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:800;color:#E2E8F0;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
                        <span style="display:flex;align-items:center;gap:4px;background:rgba(99,102,241,0.15);border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;color:#818CF8;">
                            <i data-lucide="home" style="width:10px;height:10px;"></i>
                            Room ${s.room_number}
                        </span>
                        <span style="font-size:11px;color:#94A3B8;">${s.course||''}</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;border:1px solid ${isOutside(s)?'rgba(245,158,11,0.4)':'rgba(16,185,129,0.4)'};background:${isOutside(s)?'rgba(245,158,11,0.1)':'rgba(16,185,129,0.1)'};flex-shrink:0;">
                    <span style="width:7px;height:7px;border-radius:50%;background:${isOutside(s)?'#F59E0B':'#10B981'};display:inline-block;"></span>
                    <span style="font-size:11px;font-weight:800;color:${isOutside(s)?'#F59E0B':'#10B981'};">${isOutside(s)?'OUT':'IN'}</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:7px;background:#0A0F1E;border-radius:9px;padding:8px 12px;border:1px solid #131D35;">
                <i data-lucide="id-card" style="width:13px;height:13px;color:#4B5B78;flex-shrink:0;"></i>
                <span style="font-size:12px;color:#94A3B8;font-family:monospace;">${s.student_id||''}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <a href="tel:${s.phone}" class="contact-tap">
                    <div style="width:34px;height:34px;border-radius:9px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i data-lucide="phone" style="width:15px;height:15px;color:#10B981;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#4B5B78;">Student Phone</div>
                        <div style="font-size:13px;font-weight:600;color:#E2E8F0;margin-top:2px;">${s.phone||'—'}</div>
                    </div>
                    ${s.phone ? '<i data-lucide="phone-call" style="width:14px;height:14px;color:#10B981;opacity:0.7;flex-shrink:0;"></i>' : ''}
                </a>
                <a href="tel:${s.guardian_contact}" class="contact-tap">
                    <div style="width:34px;height:34px;border-radius:9px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i data-lucide="users" style="width:15px;height:15px;color:#3B82F6;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#4B5B78;">Guardian Contact</div>
                        <div style="font-size:13px;font-weight:600;color:#E2E8F0;margin-top:2px;">${s.guardian_contact||'—'}</div>
                    </div>
                    ${s.guardian_contact ? '<i data-lucide="phone-call" style="width:14px;height:14px;color:#3B82F6;opacity:0.7;flex-shrink:0;"></i>' : ''}
                </a>
            </div>
        </div>
    `).join('');

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
    const container = document.getElementById('notificationsList');
    if (!container) return;

    // Update mobile dot
    const mobileDot = document.getElementById('mobileNotifDot');
    if(mobileDot) mobileDot.classList.toggle('hidden', allNotifications.length === 0);

    const PRIORITY = {
        CRITICAL: { bg:'rgba(244,63,94,0.1)',border:'rgba(244,63,94,0.4)',bar:'#F43F5E',iconColor:'#F43F5E',iconBg:'rgba(244,63,94,0.15)' },
        HIGH:     { bg:'rgba(245,158,11,0.07)',border:'rgba(245,158,11,0.35)',bar:'#F59E0B',iconColor:'#F59E0B',iconBg:'rgba(245,158,11,0.15)' },
        INFO:     { bg:'rgba(59,130,246,0.05)',border:'rgba(59,130,246,0.25)',bar:'#3B82F6',iconColor:'#3B82F6',iconBg:'rgba(59,130,246,0.15)' },
    };

    if (allNotifications.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:48px 0;color:#4B5B78;font-size:14px;">No notifications at this time.</div>`;
        return;
    }

    container.innerHTML = allNotifications.map(n => {
        const cfg = PRIORITY[n.priority] || PRIORITY.INFO;
        return `
        <div class="notif-card ${(n.priority||'').toLowerCase()}" style="background:${cfg.bg};border-color:${cfg.border};">
            <div class="notif-bar" style="background:${cfg.bar};"></div>
            <div class="notif-body">
                <div style="display:flex;align-items:flex-start;gap:12px;">
                    <div style="width:38px;height:38px;border-radius:11px;background:${cfg.iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i data-lucide="${n.priority==='CRITICAL'?'alert-triangle':n.priority==='HIGH'?'alert-circle':'info'}" style="width:18px;height:18px;color:${cfg.iconColor};"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:${cfg.iconColor};">${n.type}</div>
                        <div style="font-size:11px;color:#4B5B78;margin-top:3px;">${(n.created_at||'').split(' ')[1]||''}</div>
                    </div>
                    <span style="padding:3px 8px;border-radius:7px;font-size:10px;font-weight:800;text-transform:uppercase;color:${cfg.iconColor};background:${cfg.iconBg};border:1px solid ${cfg.border};flex-shrink:0;">${n.priority}</span>
                </div>
                <p style="font-size:14px;color:#E2E8F0;line-height:1.6;margin:0;">${n.message}</p>
            </div>
        </div>`;
    }).join('');

    lucide.createIcons();
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

