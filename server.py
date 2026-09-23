import os
import json
import csv
import io
import queue
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

import database
import scheduler

app = FastAPI(title="Herpass — Girls Hostel Outing Management System")

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Expo web dev server (and any origin) to reach this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure DB is initialized and daemon started on launch
database.init_db()
database.seed_db()
scheduler.start_scheduler_daemon()

# Mount Static Files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# Pydantic Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class OutingCreateRequest(BaseModel):
    student_id: int
    destination: str
    reason: Optional[str] = ""
    outing_date: str
    departure_time: str
    return_deadline: Optional[str] = "18:00"
    remarks: Optional[str] = ""

class StudentCreateRequest(BaseModel):
    student_id: Optional[str] = ""
    name: str
    room_number: str
    phone: str
    course: str
    year: str
    emergency_contact: Optional[str] = ""
    guardian_contact: str
    photo_url: Optional[str] = ""

class ResolveOverdueRequest(BaseModel):
    resolution_notes: Optional[str] = "Resolved and confirmed by Warden."

class ExtendDeadlineRequest(BaseModel):
    new_return_deadline: str
    reason: str


# Helper: Generate Next Outing ID
def generate_outing_id():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM outings")
    count = cursor.fetchone()[0] + 1
    conn.close()
    year = datetime.now().year
    return f"OUT-{year}-{count:04d}"


# API Endpoints

@app.get("/api/demo-users")
def get_demo_users():
    """Returns sample logins for easy 1-click role testing"""
    return [
        {
            "role": "warden",
            "name": "Dr. Sunita Deshmukh",
            "email": "warden@hostel.edu",
            "password": "warden123",
            "label": "Warden (Admin Portal)"
        },
        {
            "role": "guard",
            "name": "Ramesh Guard (Main Gate)",
            "email": "guard.main@hostel.edu",
            "password": "guard123",
            "label": "Guard (Gate Interface)"
        },
        {
            "role": "student",
            "name": "Ananya Sharma (STU-101)",
            "email": "ananya@student.edu",
            "password": "student123",
            "label": "Student Portal (Ananya)"
        }
    ]

@app.post("/api/login")
def login(req: LoginRequest):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (req.email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user['password_hash'] != database.hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "success": True,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role'],
            "phone": user['phone'],
            "student_ref_id": user['student_ref_id']
        }
    }

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    conn = database.get_db()
    cursor = conn.cursor()
    
    today_str = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM outings WHERE outing_date = ?", (today_str,))
    todays_outings = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM outings WHERE status IN ('OUT', 'RESOLVED')")
    currently_outside = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM outings WHERE status IN ('RETURNED', 'LATE RETURN') AND outing_date = ?", (today_str,))
    returned_today = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM outings WHERE status = 'UPCOMING' AND outing_date = ?", (today_str,))
    upcoming_today = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM outings WHERE status = 'OVERDUE'")
    overdue_count = cursor.fetchone()[0]

    conn.close()

    return {
        "total_students": total_students,
        "todays_outings": todays_outings,
        "currently_outside": currently_outside,
        "returned_today": returned_today,
        "upcoming_today": upcoming_today,
        "overdue_count": overdue_count
    }

@app.get("/api/outings")
def get_outings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    date: Optional[str] = None,
    student_id: Optional[int] = None
):
    conn = database.get_db()
    cursor = conn.cursor()

    query = """
        SELECT o.*, 
               s.student_id as student_code, 
               s.name as student_name, 
               s.room_number, 
               s.phone as student_phone, 
               s.emergency_contact,
               s.photo_url,
               u.name as creator_name
        FROM outings o
        JOIN students s ON o.student_id = s.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE 1=1
    """
    params = []

    if status and status != 'ALL':
        query += " AND o.status = ?"
        params.append(status)

    if date:
        query += " AND o.outing_date = ?"
        params.append(date)

    if student_id:
        query += " AND o.student_id = ?"
        params.append(student_id)

    if search:
        search_pattern = f"%{search}%"
        query += " AND (s.name LIKE ? OR s.room_number LIKE ? OR s.student_id LIKE ? OR o.outing_id LIKE ? OR o.destination LIKE ?)"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern, search_pattern])

    query += " ORDER BY CASE WHEN o.status = 'OVERDUE' THEN 1 WHEN o.status = 'OUT' THEN 2 WHEN o.status = 'UPCOMING' THEN 3 ELSE 4 END, o.id DESC"

    cursor.execute(query, params)
    outings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return outings

@app.post("/api/outings/create")
def create_outing(req: OutingCreateRequest, user_name: str = "Warden", user_role: str = "warden"):
    conn = database.get_db()
    cursor = conn.cursor()

    # Check student exists
    cursor.execute("SELECT name, room_number FROM students WHERE id = ?", (req.student_id,))
    student = cursor.fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")

    outing_code = generate_outing_id()

    cursor.execute("""
        INSERT INTO outings (
            outing_id, student_id, destination, reason, outing_date, 
            departure_time, return_deadline, remarks, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UPCOMING')
    """, (
        outing_code, req.student_id, req.destination, req.reason, 
        req.outing_date, req.departure_time, req.return_deadline or "18:00", req.remarks
    ))

    cursor.execute("""
        INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
        VALUES (?, ?, 'CREATE_OUTING', ?, ?)
    """, (user_name, user_role, outing_code, f"Created outing for {student['name']} (Room {student['room_number']}) to {req.destination}"))

    cursor.execute("""
        INSERT INTO notifications (recipient_role, outing_id, type, message, priority)
        VALUES ('guard', ?, 'NEW_OUTING', ?, 'NORMAL')
    """, (outing_code, f"New approved outing: {student['name']} (Room {student['room_number']}) to {req.destination} on {req.outing_date} at {req.departure_time}"))

    conn.commit()
    conn.close()

    scheduler.broadcast_event("OUTING_CREATED", {
        "outing_id": outing_code,
        "student_name": student['name'],
        "room_number": student['room_number'],
        "destination": req.destination
    })

    return {"success": True, "outing_id": outing_code, "message": f"Outing {outing_code} created successfully."}

@app.post("/api/outings/{outing_id}/mark-out")
def mark_out(outing_id: str, guard_name: str = "Ramesh Guard"):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.*, s.name as student_name, s.room_number 
        FROM outings o JOIN students s ON o.student_id = s.id 
        WHERE o.outing_id = ?
    """, (outing_id,))
    outing = cursor.fetchone()

    if not outing:
        conn.close()
        raise HTTPException(status_code=404, detail="Outing record not found")

    if outing['status'] in ('RETURNED', 'LATE RETURN', 'CANCELLED'):
        conn.close()
        raise HTTPException(status_code=400, detail=f"Cannot mark OUT an outing with status '{outing['status']}'")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        UPDATE outings SET status = 'OUT', actual_departure = ? WHERE outing_id = ?
    """, (now_str, outing_id))

    cursor.execute("""
        UPDATE students SET status = 'OUTSIDE' WHERE id = ?
    """, (outing['student_id'],))

    cursor.execute("""
        INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
        VALUES (?, 'guard', 'MARK_OUT', ?, ?)
    """, (guard_name, outing_id, f"Marked {outing['student_name']} (Room {outing['room_number']}) OUT at gate at {now_str}"))

    conn.commit()
    conn.close()

    scheduler.broadcast_event("STATUS_CHANGE", {
        "outing_id": outing_id,
        "student_name": outing['student_name'],
        "status": "OUT",
        "departure_time": now_str
    })

    return {"success": True, "message": f"{outing['student_name']} marked OUT."}

@app.post("/api/outings/{outing_id}/mark-returned")
def mark_returned(outing_id: str, guard_name: str = "Ramesh Guard"):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.*, s.name as student_name, s.room_number 
        FROM outings o JOIN students s ON o.student_id = s.id 
        WHERE o.outing_id = ?
    """, (outing_id,))
    outing = cursor.fetchone()

    if not outing:
        conn.close()
        raise HTTPException(status_code=404, detail="Outing record not found")

    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # Calculate if late
    final_status = "RETURNED"
    delay_minutes = 0

    try:
        deadline_dt = datetime.strptime(f"{outing['outing_date']} {outing['return_deadline']}", "%Y-%m-%d %H:%M")
        if now > deadline_dt:
            final_status = "LATE RETURN"
            delay_minutes = int((now - deadline_dt).total_seconds() // 60)
    except ValueError:
        pass

    cursor.execute("""
        UPDATE outings 
        SET status = ?, actual_return = ?, delay_minutes = ? 
        WHERE outing_id = ?
    """, (final_status, now_str, delay_minutes, outing_id))

    cursor.execute("""
        UPDATE students SET status = 'IN_HOSTEL' WHERE id = ?
    """, (outing['student_id'],))

    details = f"Marked {outing['student_name']} RETURNED at {now_str}."
    if delay_minutes > 0:
        details += f" (Late return by {delay_minutes} minutes)."

    cursor.execute("""
        INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
        VALUES (?, 'guard', 'MARK_RETURNED', ?, ?)
    """, (guard_name, outing_id, details))

    conn.commit()
    conn.close()

    scheduler.broadcast_event("STATUS_CHANGE", {
        "outing_id": outing_id,
        "student_name": outing['student_name'],
        "status": final_status,
        "return_time": now_str,
        "delay_minutes": delay_minutes
    })

    return {
        "success": True, 
        "status": final_status, 
        "delay_minutes": delay_minutes, 
        "message": f"{outing['student_name']} marked RETURNED ({final_status})."
    }

@app.post("/api/outings/{outing_id}/resolve-overdue")
def resolve_overdue(outing_id: str, req: ResolveOverdueRequest, warden_name: str = "Dr. Sunita Deshmukh"):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.*, s.name as student_name FROM outings o JOIN students s ON o.student_id = s.id WHERE o.outing_id = ?
    """, (outing_id,))
    outing = cursor.fetchone()

    if not outing:
        conn.close()
        raise HTTPException(status_code=404, detail="Outing not found")

    remarks_update = f"{outing['remarks'] or ''} | OVERDUE RESOLVED by {warden_name}: {req.resolution_notes}"

    cursor.execute("""
        UPDATE outings SET status = 'RESOLVED', remarks = ? WHERE outing_id = ?
    """, (remarks_update, outing_id))

    cursor.execute("""
        INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
        VALUES (?, 'warden', 'RESOLVE_OVERDUE', ?, ?)
    """, (warden_name, outing_id, f"Overdue resolved for {outing['student_name']}. Note: {req.resolution_notes}"))

    cursor.execute("""
        UPDATE notifications SET is_read = 1 WHERE outing_id = ? AND type = 'OVERDUE'
    """, (outing_id,))

    conn.commit()
    conn.close()

    scheduler.broadcast_event("OVERDUE_RESOLVED", {
        "outing_id": outing_id,
        "warden_name": warden_name,
        "notes": req.resolution_notes
    })

    return {"success": True, "message": f"Overdue case for {outing_id} resolved."}

@app.post("/api/outings/{outing_id}/extend")
def extend_deadline(outing_id: str, req: ExtendDeadlineRequest, warden_name: str = "Dr. Sunita Deshmukh"):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM outings WHERE outing_id = ?", (outing_id,))
    outing = cursor.fetchone()
    if not outing:
        conn.close()
        raise HTTPException(status_code=404, detail="Outing not found")

    old_deadline = outing['return_deadline']
    remarks_update = f"{outing['remarks'] or ''} | Extended deadline from {old_deadline} to {req.new_return_deadline} ({req.reason})"

    # If status was OVERDUE, change back to OUT if new deadline is in future
    new_status = outing['status']
    if outing['status'] == 'OVERDUE':
        new_status = 'OUT'

    cursor.execute("""
        UPDATE outings SET return_deadline = ?, remarks = ?, status = ? WHERE outing_id = ?
    """, (req.new_return_deadline, remarks_update, new_status, outing_id))

    cursor.execute("""
        INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
        VALUES (?, 'warden', 'EXTEND_DEADLINE', ?, ?)
    """, (warden_name, outing_id, f"Extended deadline from {old_deadline} to {req.new_return_deadline}. Reason: {req.reason}"))

    conn.commit()
    conn.close()

    scheduler.broadcast_event("DEADLINE_EXTENDED", {
        "outing_id": outing_id,
        "new_deadline": req.new_return_deadline,
        "status": new_status
    })

    return {"success": True, "message": f"Deadline extended to {req.new_return_deadline}."}

@app.get("/api/students")
def get_students(search: Optional[str] = None):
    conn = database.get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM students WHERE 1=1"
    params = []
    if search:
        pattern = f"%{search}%"
        query += " AND (name LIKE ? OR room_number LIKE ? OR student_id LIKE ? OR course LIKE ?)"
        params.extend([pattern, pattern, pattern, pattern])

    query += " ORDER BY room_number ASC"
    cursor.execute(query, params)
    students = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return students

@app.post("/api/students/create")
def create_student(req: StudentCreateRequest):
    conn = database.get_db()
    cursor = conn.cursor()

    stu_code = req.student_id
    if not stu_code:
        cursor.execute("SELECT COUNT(*) FROM students")
        cnt = cursor.fetchone()[0] + 101
        stu_code = f"STU-{cnt}"

    cursor.execute("SELECT id FROM students WHERE student_id = ?", (stu_code,))
    if cursor.fetchone():
        stu_code = f"STU-{int(datetime.now().timestamp()) % 10000:04d}"

    cursor.execute("""
        INSERT INTO students (student_id, name, room_number, phone, course, year, emergency_contact, guardian_contact, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        stu_code, req.name, req.room_number, req.phone, req.course, req.year,
        req.emergency_contact or "", req.guardian_contact, req.photo_url or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    ))

    cursor.execute("""
        INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
        VALUES ('Warden', 'warden', 'CREATE_STUDENT', NULL, ?)
    """, (f"Added new student profile: {req.name} (Room {req.room_number})",))

    conn.commit()
    conn.close()
    return {"success": True, "message": f"Student {req.name} added successfully."}

@app.get("/api/notifications")
def get_notifications(role: Optional[str] = None):
    conn = database.get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM notifications WHERE 1=1"
    params = []
    if role:
        query += " AND recipient_role IN (?, 'all')"
        params.append(role)

    query += " ORDER BY id DESC LIMIT 50"
    cursor.execute(query, params)
    notes = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return notes

@app.get("/api/audit-logs")
def get_audit_logs():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return logs

@app.get("/api/reports/analytics")
def get_analytics():
    conn = database.get_db()
    cursor = conn.cursor()

    # Outings count by status
    cursor.execute("SELECT status, COUNT(*) as count FROM outings GROUP BY status")
    status_distribution = {row['status']: row['count'] for row in cursor.fetchall()}

    # Top Destinations
    cursor.execute("""
        SELECT destination, COUNT(*) as count 
        FROM outings 
        GROUP BY destination 
        ORDER BY count DESC LIMIT 5
    """)
    top_destinations = [dict(r) for r in cursor.fetchall()]

    # Student outing frequency
    cursor.execute("""
        SELECT s.name, s.room_number, COUNT(o.id) as total_outings
        FROM students s
        LEFT JOIN outings o ON s.id = o.student_id
        GROUP BY s.id
        ORDER BY total_outings DESC LIMIT 5
    """)
    frequent_students = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "status_distribution": status_distribution,
        "top_destinations": top_destinations,
        "frequent_students": frequent_students
    }

@app.get("/api/export/csv")
def export_csv():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT o.outing_id, s.student_id as student_code, s.name as student_name, s.room_number,
               o.destination, o.reason, o.outing_date, o.departure_time, o.actual_departure,
               o.return_deadline, o.actual_return, o.status, o.delay_minutes, o.remarks
        FROM outings o
        JOIN students s ON o.student_id = s.id
        ORDER BY o.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Outing ID", "Student ID", "Student Name", "Room Number",
        "Destination", "Reason", "Date", "Scheduled Departure", "Actual Departure",
        "Return Deadline", "Actual Return", "Status", "Delay Minutes", "Remarks"
    ])

    for r in rows:
        writer.writerow([
            r['outing_id'], r['student_code'], r['student_name'], r['room_number'],
            r['destination'], r['reason'], r['outing_date'], r['departure_time'], r['actual_departure'],
            r['return_deadline'], r['actual_return'], r['status'], r['delay_minutes'], r['remarks']
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=herpass_outing_history_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@app.get("/api/events")
async def event_stream(request: Request):
    """
    Server-Sent Events (SSE) live push channel
    """
    q = queue.Queue()
    scheduler.event_listeners.append(q)

    async def generator():
        try:
            # Initial ping
            yield f"event: connected\ndata: {json.dumps({'message': 'Connected to Herpass Realtime Engine'})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = q.get_nowait()
                    yield f"event: {payload['event']}\ndata: {json.dumps(payload)}\n\n"
                except queue.Empty:
                    # Keep-alive heartbeat every 15s
                    yield ": heartbeat\n\n"
                    import asyncio
                    await asyncio.sleep(2)
        except Exception:
            pass
        finally:
            if q in scheduler.event_listeners:
                scheduler.event_listeners.remove(q)

    return StreamingResponse(generator(), media_type="text/event-stream")

# PWA Manifest & Service Worker Root Routes
@app.get("/manifest.json")
def get_manifest():
    with open("static/manifest.json", "r", encoding="utf-8") as f:
        return Response(content=f.read(), media_type="application/manifest+json")

@app.get("/sw.js")
def get_service_worker():
    with open("static/sw.js", "r", encoding="utf-8") as f:
        return Response(content=f.read(), media_type="application/javascript")

# Fallback root route to serve SPA frontend
@app.get("/")
def read_root():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())



if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=False)
