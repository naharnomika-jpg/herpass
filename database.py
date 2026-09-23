import sqlite3
import hashlib
import json
from datetime import datetime, timedelta

DB_PATH = "herpass.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(f"herpass_salt_{password}".encode('utf-8')).hexdigest()

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('warden', 'guard', 'student')),
        phone TEXT,
        student_ref_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Students Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        room_number TEXT NOT NULL,
        phone TEXT NOT NULL,
        course TEXT NOT NULL,
        year TEXT NOT NULL,
        emergency_contact TEXT NOT NULL,
        guardian_contact TEXT NOT NULL,
        photo_url TEXT,
        status TEXT DEFAULT 'IN_HOSTEL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Outings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS outings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outing_id TEXT UNIQUE NOT NULL,
        student_id INTEGER NOT NULL,
        destination TEXT NOT NULL,
        reason TEXT NOT NULL,
        outing_date TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        return_deadline TEXT NOT NULL DEFAULT '18:00',
        actual_departure TEXT,
        actual_return TEXT,
        status TEXT NOT NULL DEFAULT 'UPCOMING',
        created_by INTEGER,
        approved_by INTEGER,
        remarks TEXT,
        delay_minutes INTEGER DEFAULT 0,
        overdue_notified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
    )
    """)

    # Notifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_role TEXT NOT NULL,
        recipient_id INTEGER,
        outing_id TEXT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        outing_id TEXT,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Enforce 18:00 (6:00 PM) return deadline for all records
    cursor.execute("UPDATE outings SET return_deadline = '18:00'")
    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

def seed_db():
    conn = get_db()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        cursor.execute("UPDATE outings SET return_deadline = '18:00'")
        conn.commit()
        conn.close()
        return

    print("Seeding initial database data...")

    # Seed Students (10 students)
    students_data = [
        ("STU-101", "Ananya Sharma", "204", "+91 98765 43210", "B.Tech CSE", "3rd Year", "+91 98111 22233", "Mr. Rajesh Sharma (+91 98111 22234)", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"),
        ("STU-102", "Priya Singh", "112", "+91 98765 43211", "B.Arch", "2nd Year", "+91 98222 33344", "Mrs. Sunita Singh (+91 98222 33345)", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"),
        ("STU-103", "Riya Patel", "305", "+91 98765 43212", "B.Sc Biotech", "1st Year", "+91 98333 44455", "Mr. Suresh Patel (+91 98333 44456)", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80"),
        ("STU-104", "Sneha Roy", "208", "+91 98765 43213", "B.Tech ECE", "4th Year", "+91 98444 55566", "Mrs. Kamala Roy (+91 98444 55567)", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"),
        ("STU-105", "Kavya Verma", "101", "+91 98765 43214", "MBA", "1st Year", "+91 98555 66677", "Mr. Amit Verma (+91 98555 66678)", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"),
        ("STU-106", "Diya Sengupta", "215", "+91 98765 43215", "M.Tech AI", "2nd Year", "+91 98666 77788", "Dr. A. Sengupta (+91 98666 77789)", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"),
        ("STU-107", "Isha Gupta", "310", "+91 98765 43216", "B.Com Hons", "2nd Year", "+91 98777 88899", "Mrs. Rekha Gupta (+91 98777 88890)", "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80"),
        ("STU-108", "Meera Nair", "106", "+91 98765 43217", "B.Design", "3rd Year", "+91 98888 99900", "Mr. K. Nair (+91 98888 99901)", "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&auto=format&fit=crop&q=80"),
        ("STU-109", "Tanvi Joshi", "202", "+91 98765 43218", "B.Tech IT", "1st Year", "+91 98999 00011", "Mr. Manoj Joshi (+91 98999 00012)", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"),
        ("STU-110", "Aarohi Mehta", "301", "+91 98765 43219", "B.Sc Physics", "3rd Year", "+91 98000 11122", "Mrs. V. Mehta (+91 98000 11123)", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"),
    ]

    cursor.executemany("""
    INSERT INTO students (student_id, name, room_number, phone, course, year, emergency_contact, guardian_contact, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, students_data)

    # Fetch inserted student IDs
    cursor.execute("SELECT id, student_id, name FROM students")
    students_list = cursor.fetchall()
    stu_dict = {s['student_id']: s['id'] for s in students_list}

    # Seed Users (Wardens, Guards, Students)
    users_data = [
        ("Dr. Sunita Deshmukh", "warden@hostel.edu", hash_password("warden123"), "warden", "+91 99999 11111", None),
        ("Mrs. Radhika Rao", "radhika.warden@hostel.edu", hash_password("warden123"), "warden", "+91 99999 22222", None),
        ("Ramesh Guard (Main Gate)", "guard.main@hostel.edu", hash_password("guard123"), "guard", "+91 88888 11111", None),
        ("Suresh Guard (North Gate)", "guard.north@hostel.edu", hash_password("guard123"), "guard", "+91 88888 22222", None),
        ("Mahesh Guard (Night Shift)", "guard.night@hostel.edu", hash_password("guard123"), "guard", "+91 88888 33333", None),
        ("Ananya Sharma", "ananya@student.edu", hash_password("student123"), "student", "+91 98765 43210", stu_dict["STU-101"]),
        ("Priya Singh", "priya@student.edu", hash_password("student123"), "student", "+91 98765 43211", stu_dict["STU-102"]),
        ("Riya Patel", "riya@student.edu", hash_password("student123"), "student", "+91 98765 43212", stu_dict["STU-103"]),
    ]

    cursor.executemany("""
    INSERT INTO users (name, email, password_hash, role, phone, student_ref_id)
    VALUES (?, ?, ?, ?, ?, ?)
    """, users_data)

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    # All Return Deadlines fixed to 18:00 (6:00 PM)
    outings_data = [
        ("OUT-2026-0001", stu_dict["STU-101"], "City Center Market", "Buying books & groceries", today_str, 
         "15:00", "18:00", 
         f"{today_str} 15:05:00", None, 
         "OVERDUE", 1, 1, "Hostel Deadline is 6:00 PM. OVERDUE ALERT ACTIVE!", 15, 1),

        ("OUT-2026-0002", stu_dict["STU-102"], "Central University Library", "Research paper work", today_str, 
         "16:00", "18:00", 
         f"{today_str} 16:10:00", None, 
         "OUT", 1, 1, "Approved for library study (Return by 6:00 PM)", 0, 0),

        ("OUT-2026-0003", stu_dict["STU-103"], "Apollo Hospital Clinic", "Doctor checkup", today_str, 
         "12:00", "18:00", 
         f"{today_str} 12:05:00", f"{today_str} 17:45:00", 
         "RETURNED", 1, 1, "Medical checkup - returned before 6:00 PM", 0, 0),

        ("OUT-2026-0004", stu_dict["STU-104"], "Phoenix Mall", "Buying project supplies", today_str, 
         "17:00", "18:00", 
         None, None, 
         "UPCOMING", 1, 1, "Returning by 6:00 PM", 0, 0),

        ("OUT-2026-0005", stu_dict["STU-105"], "Railway Station", "Receiving relatives", today_str, 
         "16:30", "18:00", 
         None, None, 
         "UPCOMING", 1, 1, "Parent permission verified (Return by 6:00 PM)", 0, 0),
    ]

    cursor.executemany("""
    INSERT INTO outings (
        outing_id, student_id, destination, reason, outing_date, departure_time, return_deadline,
        actual_departure, actual_return, status, created_by, approved_by, remarks, delay_minutes, overdue_notified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, outings_data)

    # Seed Notifications
    notifications_data = [
        ("warden", None, "OUT-2026-0001", "OVERDUE", "🚨 OVERDUE ALERT: Ananya Sharma (Room 204) has missed her return deadline of " + t_15m_ago, "CRITICAL", 0),
        ("guard", None, "OUT-2026-0001", "OVERDUE", "🚨 OVERDUE ALERT: Ananya Sharma (Room 204) has not reported to gate!", "CRITICAL", 0),
        ("guard", None, "OUT-2026-0004", "UPCOMING", f"🔔 Upcoming Outing: Sneha Roy (Room 208) scheduled to leave at {t_in_30m}", "HIGH", 0),
    ]

    cursor.executemany("""
    INSERT INTO notifications (recipient_role, recipient_id, outing_id, type, message, priority, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, notifications_data)

    # Seed Audit Logs
    audit_data = [
        ("Dr. Sunita Deshmukh", "warden", "CREATE_OUTING", "OUT-2026-0001", "Created outing for Ananya Sharma to City Center Market"),
        ("Dr. Sunita Deshmukh", "warden", "APPROVE_OUTING", "OUT-2026-0001", "Approved outing OUT-2026-0001"),
        ("Ramesh Guard (Main Gate)", "guard", "MARK_OUT", "OUT-2026-0001", "Student Ananya Sharma marked OUT at gate"),
        ("SYSTEM", "system", "AUTO_OVERDUE_TRIGGER", "OUT-2026-0001", "Return deadline passed. Automatically transitioned status to OVERDUE and sent critical alerts."),
    ]

    cursor.executemany("""
    INSERT INTO audit_logs (user_name, user_role, action, outing_id, details)
    VALUES (?, ?, ?, ?, ?)
    """, audit_data)

    conn.commit()
    conn.close()
    print("Database seeded with realistic demo data.")

if __name__ == "__main__":
    init_db()
    seed_db()
