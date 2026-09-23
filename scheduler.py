import time
import threading
from datetime import datetime, timedelta
import database

# Real-time event listeners (SSE clients) queue list
event_listeners = []

def broadcast_event(event_type: str, data: dict):
    """
    Broadcasts real-time JSON payload to all connected SSE clients.
    """
    payload = {
        "event": event_type,
        "timestamp": datetime.now().isoformat(),
        "data": data
    }
    dead_listeners = []
    for listener in event_listeners:
        try:
            listener.put(payload)
        except Exception:
            dead_listeners.append(listener)
    for l in dead_listeners:
        if l in event_listeners:
            event_listeners.remove(l)

def run_scheduler_tick():
    """
    Evaluates all active outings against current system time.
    """
    conn = database.get_db()
    cursor = conn.cursor()

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    current_time_str = now.strftime("%H:%M")

    # 1. Check for OVERDUE Outings (status == 'OUT' and current_time > return_deadline)
    cursor.execute("""
        SELECT o.*, s.name as student_name, s.room_number, s.phone, s.emergency_contact
        FROM outings o
        JOIN students s ON o.student_id = s.id
        WHERE o.status = 'OUT' AND o.outing_date <= ?
    """, (today_str,))

    active_outings = cursor.fetchall()
    
    for outing in active_outings:
        outing_id = outing['outing_id']
        deadline_str = outing['return_deadline']
        outing_date_str = outing['outing_date']
        student_name = outing['student_name']
        room_number = outing['room_number']

        try:
            # Parse return deadline datetime
            deadline_dt = datetime.strptime(f"{outing_date_str} {deadline_str}", "%Y-%m-%d %H:%M")
        except ValueError:
            continue

        if now >= deadline_dt:
            # Overdue detected! Calculate delay minutes
            delay = int((now - deadline_dt).total_seconds() // 60)
            
            # Transition status to OVERDUE if not already set
            cursor.execute("""
                UPDATE outings SET status = 'OVERDUE', delay_minutes = ?, overdue_notified = 1
                WHERE id = ? AND status != 'OVERDUE'
            """, (delay, outing['id']))

            # Check if updated
            if cursor.rowcount > 0:
                msg = f"🚨 URGENT OVERDUE ALERT: {student_name} (Room {room_number}) has NOT returned by deadline ({deadline_str}). Overdue by {delay} minutes!"
                
                # Insert notifications for Warden and Guard
                cursor.execute("""
                    INSERT INTO notifications (recipient_role, outing_id, type, message, priority)
                    VALUES ('warden', ?, 'OVERDUE', ?, 'CRITICAL')
                """, (outing_id, msg))

                cursor.execute("""
                    INSERT INTO notifications (recipient_role, outing_id, type, message, priority)
                    VALUES ('guard', ?, 'OVERDUE', ?, 'CRITICAL')
                """, (outing_id, msg))

                # Insert audit log
                cursor.execute("""
                    INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
                    VALUES ('AUTOMATED SYSTEM', 'system', 'AUTO_OVERDUE_TRIGGER', ?, ?)
                """, (outing_id, f"Deadline {deadline_str} passed. Transitioned status to OVERDUE. Delay: {delay}m."))

                conn.commit()

                print(f"[SCHEDULER] Overdue alert: {student_name} (Room {room_number}) delay {delay}m")

                # Broadcast real-time SSE alert to all connected dashboards
                broadcast_event("OVERDUE_ALERT", {
                    "outing_id": outing_id,
                    "student_name": student_name,
                    "room_number": room_number,
                    "return_deadline": deadline_str,
                    "delay_minutes": delay,
                    "message": msg
                })

    # 2. Check for UPCOMING Outings whose start time has arrived
    cursor.execute("""
        SELECT o.*, s.name as student_name, s.room_number 
        FROM outings o
        JOIN students s ON o.student_id = s.id
        WHERE o.status = 'UPCOMING' AND o.outing_date = ?
    """, (today_str,))
    
    upcoming_outings = cursor.fetchall()
    for outing in upcoming_outings:
        departure_str = outing['departure_time']
        try:
            dep_dt = datetime.strptime(f"{today_str} {departure_str}", "%Y-%m-%d %H:%M")
        except ValueError:
            continue

        # If current time is within 5 minutes before or after departure time and guard not notified yet
        if now >= dep_dt:
            msg = f"🚪 OUTING TIME: {outing['student_name']} (Room {outing['room_number']}) is scheduled to leave now ({departure_str}). Guard please verify at gate."
            
            # Check if notification already exists
            cursor.execute("SELECT id FROM notifications WHERE outing_id = ? AND type = 'DEPARTURE_TIME'", (outing['outing_id'],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications (recipient_role, outing_id, type, message, priority)
                    VALUES ('guard', ?, 'DEPARTURE_TIME', ?, 'HIGH')
                """, (outing['outing_id'], msg))
                conn.commit()

                broadcast_event("DEPARTURE_READY", {
                    "outing_id": outing['outing_id'],
                    "student_name": outing['student_name'],
                    "room_number": outing['room_number'],
                    "departure_time": departure_str,
                    "message": msg
                })

    conn.close()

def start_scheduler_daemon():
    """
    Launches background thread monitoring loop every 3 seconds.
    """
    def loop():
        while True:
            try:
                run_scheduler_tick()
            except Exception as e:
                print(f"[SCHEDULER ERROR] {e}")
            time.sleep(3)

    thread = threading.Thread(target=loop, daemon=True)
    thread.start()
    print("Background automatic monitoring daemon started.")
