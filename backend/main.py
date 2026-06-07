"""
AssignTify Backend — FastAPI + Supabase

Prerequisites:
  1. Create the 'tasks' table in your Supabase project by running
     the SQL below in the Supabase SQL Editor:

         -- Drop old table if it has wrong column names
         DROP TABLE IF EXISTS tasks;

         CREATE TABLE tasks (
             id            TEXT PRIMARY KEY,
             user_email    TEXT NOT NULL,
             name          TEXT NOT NULL,
             description   TEXT DEFAULT '',
             deadline      TEXT NOT NULL,
             priority      TEXT NOT NULL DEFAULT 'Medium',
             hours_per_day REAL DEFAULT 1,
             created_at    TIMESTAMPTZ DEFAULT NOW(),
             completed     BOOLEAN DEFAULT false
         );

         -- Enable Row Level Security (optional but recommended)
         ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

         -- Allow all operations for now (tighten later with auth)
         CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);

  2. Copy .env.example to .env and fill in your Supabase URL and anon key.

  3. Run:  cd backend && pip install -r requirements.txt && python main.py
"""

import os
import sys
import traceback
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Environment & Supabase setup
# ---------------------------------------------------------------------------
load_dotenv()  # reads backend/.env

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# Strip trailing /rest/v1/ if present — the supabase-py client adds it automatically
SUPABASE_URL = SUPABASE_URL.rstrip("/")
if SUPABASE_URL.endswith("/rest/v1"):
    SUPABASE_URL = SUPABASE_URL[: -len("/rest/v1")]

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env or environment variables.")
    print("See backend/.env.example for reference.")
    sys.exit(1)

print(f"[INIT] Connecting to Supabase at: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("[INIT] Supabase client created successfully.")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="AssignTify API", version="1.0.0")

# Allowed CORS origins — add your deployed Vercel URL here when available
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # alternate dev port
    "http://127.0.0.1:5173",
    # "https://your-app.vercel.app",  # Uncomment and replace with your Vercel URL
]

# Also allow any VERCEL_URL env var (set automatically by Vercel)
vercel_url = os.getenv("VERCEL_URL")
if vercel_url:
    ALLOWED_ORIGINS.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TABLE = "tasks"

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    id: str
    user_email: str
    name: str
    description: str = ""
    deadline: str
    priority: str = "Medium"
    hours_per_day: float = 1
    created_at: str
    completed: bool = False


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    hours_per_day: Optional[float] = None
    completed: Optional[bool] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_task(row: dict) -> dict:
    """Normalise a Supabase row into the shape the frontend expects.
    Handles both snake_case and camelCase column names for resilience."""
    return {
        "id": row.get("id", ""),
        "name": row.get("name", ""),
        "description": row.get("description", ""),
        "deadline": row.get("deadline", ""),
        "priority": row.get("priority", "Medium"),
        "hoursPerDay": row.get("hours_per_day") or row.get("hoursPerDay") or 1,
        "createdAt": row.get("created_at") or row.get("createdAt") or "",
        "completed": row.get("completed", False),
    }


def _task_to_row(task: TaskCreate) -> dict:
    """Convert a TaskCreate payload into a Supabase row."""
    return {
        "id": task.id,
        "user_email": task.user_email,
        "name": task.name,
        "description": task.description,
        "deadline": task.deadline,
        "priority": task.priority,
        "hours_per_day": task.hours_per_day,
        "created_at": task.created_at,
        "completed": task.completed,
    }


def _log_error(label: str, e: Exception):
    """Print detailed error info to the terminal."""
    print(f"\n{'='*60}")
    print(f"[ERROR] {label}")
    print(f"  Type: {type(e).__name__}")
    print(f"  Message: {e}")
    traceback.print_exc()
    print(f"{'='*60}\n")


# ---------------------------------------------------------------------------
# Debug / Health Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok", "message": "AssignTify API is running"}


@app.get("/api/debug/verify-table")
def verify_table():
    """Diagnostic endpoint: query the tasks table and return the actual
    column names Supabase sees.  Helps diagnose column-name mismatches."""
    try:
        response = supabase.table(TABLE).select("*").limit(5).execute()
        columns = []
        sample_rows = response.data
        if sample_rows:
            columns = list(sample_rows[0].keys())
        return {
            "table": TABLE,
            "row_count_sample": len(sample_rows),
            "columns": columns,
            "sample_data": sample_rows[:2],
            "supabase_url": SUPABASE_URL,
        }
    except Exception as e:
        _log_error("verify-table", e)
        return {
            "table": TABLE,
            "error": str(e),
            "error_type": type(e).__name__,
            "hint": "Check that the 'tasks' table exists and has the correct columns.",
        }


# ---------------------------------------------------------------------------
# CRUD Routes
# ---------------------------------------------------------------------------

@app.get("/api/tasks/{user_email}")
def get_tasks(user_email: str):
    """Fetch all tasks for a given user."""
    try:
        print(f"[GET /api/tasks/{user_email}] Querying Supabase...")
        response = (
            supabase.table(TABLE)
            .select("*")
            .eq("user_email", user_email)
            .execute()
        )
        print(f"[GET] Received {len(response.data)} rows from Supabase")

        # Sort in Python instead of in the query (avoids column-name errors on .order())
        rows = response.data
        rows.sort(key=lambda r: r.get("created_at") or r.get("createdAt") or "", reverse=True)

        tasks = [_row_to_task(row) for row in rows]
        return {"tasks": tasks}
    except Exception as e:
        _log_error(f"GET /api/tasks/{user_email}", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tasks")
def create_task(task: TaskCreate):
    """Create a new task."""
    try:
        row = _task_to_row(task)
        print(f"[POST /api/tasks] Inserting task: {row}")
        response = supabase.table(TABLE).insert(row).execute()
        print(f"[POST] Supabase response data: {response.data}")
        if response.data:
            return {"task": _row_to_task(response.data[0])}
        raise HTTPException(status_code=500, detail="Failed to create task — no data returned from Supabase")
    except HTTPException:
        raise
    except Exception as e:
        _log_error("POST /api/tasks", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, updates: TaskUpdate):
    """Update an existing task."""
    try:
        update_data: dict = {}
        if updates.name is not None:
            update_data["name"] = updates.name
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.deadline is not None:
            update_data["deadline"] = updates.deadline
        if updates.priority is not None:
            update_data["priority"] = updates.priority
        if updates.hours_per_day is not None:
            update_data["hours_per_day"] = updates.hours_per_day
        if updates.completed is not None:
            update_data["completed"] = updates.completed

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        print(f"[PUT /api/tasks/{task_id}] Updating with: {update_data}")
        response = (
            supabase.table(TABLE)
            .update(update_data)
            .eq("id", task_id)
            .execute()
        )
        print(f"[PUT] Supabase response data: {response.data}")
        if response.data:
            return {"task": _row_to_task(response.data[0])}
        raise HTTPException(status_code=404, detail="Task not found")
    except HTTPException:
        raise
    except Exception as e:
        _log_error(f"PUT /api/tasks/{task_id}", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/tasks/{task_id}/toggle")
def toggle_task(task_id: str):
    """Toggle the completed status of a task."""
    try:
        print(f"[PATCH /api/tasks/{task_id}/toggle] Fetching current status...")
        current = (
            supabase.table(TABLE)
            .select("completed")
            .eq("id", task_id)
            .execute()
        )
        if not current.data:
            raise HTTPException(status_code=404, detail="Task not found")

        new_status = not current.data[0]["completed"]
        print(f"[PATCH] Toggling completed: {not new_status} -> {new_status}")
        response = (
            supabase.table(TABLE)
            .update({"completed": new_status})
            .eq("id", task_id)
            .execute()
        )
        if response.data:
            return {"task": _row_to_task(response.data[0])}
        raise HTTPException(status_code=500, detail="Failed to toggle task")
    except HTTPException:
        raise
    except Exception as e:
        _log_error(f"PATCH /api/tasks/{task_id}/toggle", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    """Delete a task."""
    try:
        print(f"[DELETE /api/tasks/{task_id}] Deleting...")
        response = (
            supabase.table(TABLE)
            .delete()
            .eq("id", task_id)
            .execute()
        )
        print(f"[DELETE] Done. Response: {response.data}")
        return {"deleted": True, "id": task_id}
    except Exception as e:
        _log_error(f"DELETE /api/tasks/{task_id}", e)
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("\n[SERVER] Starting AssignTify API on http://0.0.0.0:8000")
    print("[SERVER] Debug endpoint: http://localhost:8000/api/debug/verify-table\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)