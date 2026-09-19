# UniAce Mastery Hub: Long-Term Architecture Transition Roadmap (Option B: Supabase)

## Executive Summary & Architecture Overview

To support massive university launch traffic while eliminating single-cloud billing vulnerabilities, UniAce Mastery Hub utilizes a phased transition model moving from Firebase (Option A) to a hybrid dual-driver PostgreSQL model (Option B - Phase 2), culminating in a full cutover (Phase 3).

```
[Phase 1: Immediate Launch (Now)]
Students ---> Express Server (In-Memory Cache) + Client IndexedDB
                         |
                 Firestore (Free Tier)
      (Auth, Realtime Battles, Atomic Escrow)

[Phase 2: Hybrid Read Offload]
Students ---> Express Server 
                 |----> Supabase Postgres (Curriculum, 10,000+ Questions, Syllabi)
                 '----> Firestore (Auth & Realtime Arena)

[Phase 3: Full Cutover]
Students ---> Supabase Auth + Supabase Postgres + Supabase Realtime
```

---

## 1. Schema Mapping (Drizzle ORM & PostgreSQL)

The read-heavy static educational datasets are defined in `server/db/schema.ts` using Drizzle ORM:

### 1.1 `departments`
- `id` (VARCHAR(128) PRIMARY KEY)
- `code` (VARCHAR(64) UNIQUE NOT NULL)
- `name` (TEXT NOT NULL)
- `faculty` (TEXT NOT NULL)
- `description` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### 1.2 `courses`
- `id` (VARCHAR(128) PRIMARY KEY)
- `code` (VARCHAR(64) UNIQUE NOT NULL)
- `title` (TEXT NOT NULL)
- `department_id` (VARCHAR(128) REFERENCES departments)
- `level` (INT DEFAULT 100)
- `semester` (VARCHAR(32) DEFAULT 'First')
- `credit_units` (INT DEFAULT 3)
- `description` (TEXT)
- `is_verified` (BOOLEAN DEFAULT TRUE)
- **Indexes**: `idx_courses_dept`, `idx_courses_level`, `idx_courses_code`

### 1.3 `curriculum`
- `id` (VARCHAR(128) PRIMARY KEY)
- `course_code` (VARCHAR(64) REFERENCES courses.code)
- `title` (TEXT NOT NULL)
- `syllabus` (TEXT)
- `learning_objectives` (JSONB)
- `modules` (JSONB: Array of module objects)
- `prerequisites` (JSONB)
- **Indexes**: `idx_curriculum_course_code`

### 1.4 `past_papers`
- `id` (VARCHAR(128) PRIMARY KEY)
- `course_code` (VARCHAR(64) NOT NULL)
- `course_title` (TEXT NOT NULL)
- `year` (INT NOT NULL)
- `semester` (VARCHAR(32) NOT NULL)
- `exam_type` (VARCHAR(64) DEFAULT 'Final')
- `questions` (JSONB)
- `pdf_url` (TEXT)
- `solution_guide` (JSONB)
- **Indexes**: `idx_past_papers_course_year`, `idx_past_papers_course_code`

### 1.5 `question_bank`
- `id` (VARCHAR(128) PRIMARY KEY)
- `course_code` (VARCHAR(64) NOT NULL)
- `topic` (TEXT NOT NULL)
- `difficulty` (VARCHAR(32) DEFAULT 'medium')
- `question` (TEXT NOT NULL)
- `options` (JSONB)
- `correct_answer` (TEXT NOT NULL)
- `explanation` (TEXT)
- `blooms_taxonomy` (VARCHAR(64))
- `tags` (JSONB)
- **Indexes**: `idx_qb_course_topic`, `idx_qb_difficulty`

---

## 2. Dual-Driver Query Abstraction Layer (`server/db/dualDriver.ts`)

The `AcademicRepository` provides unified query methods for Express server routes and background tasks:

```typescript
import { AcademicRepository } from './server/db/dualDriver';

// Automatically routes to Supabase Postgres if configured, with graceful fallback to Express Cache + Firestore
const courses = await AcademicRepository.getCourses({ level: 200 });
const curriculum = await AcademicRepository.getCurriculum('CSC201');
const pastPapers = await AcademicRepository.getPastPapers({ courseCode: 'CSC201', year: 2024 });
```

---

## 3. Data Export & Migration Protocol (`server/db/exporter.ts`)

To sync existing static data from Firestore to Supabase Postgres:

1. Configure Supabase credentials in environment (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).
2. Run the migration export script:
   ```bash
   npx tsx scripts/exportFirestoreToSupabase.ts
   ```
3. Or invoke the protected Admin migration endpoint: `POST /api/admin/supabase-migrate`.

---

## 4. Full Phase 3 Cutover Strategy

Once university launch traffic stabilizes:
1. Enable **Supabase Auth** with standard Google OAuth / Email Sign-In.
2. Mirror the `users` and `ai_sparks` balance tables into Supabase Postgres.
3. Migrate real-time Arena WebSocket sessions to **Supabase Realtime**.
4. Disable Firebase Admin client calls, achieving complete independence from Google Cloud billing limits.
