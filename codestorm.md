# Tables

## 1. User

* `uuid` (PK)
* `username`
* `display_name`
* `role_id` (FK → Role.role_id)
* `pc_code`
* `ip_address`
* `last_active`
* `password_hashed`
* `scored`
* `problems_solved_count`

---

## 2. Role

* `role_id` (PK)
* `name` (e.g., `admin`, `judge`, `participant`)
* `description`

---

## 3. Permission

* `perm_id` (PK)
* `code`
* `name`
* `description`
* `parent_perm_id` (FK → Permission.perm_id, nullable)

---

## 4. RolePermission (junction table for many-to-many)

* `rp_id` (PK)
* `role_id` (FK → Role.role_id)
* `perm_id` (FK → Permission.perm_id)
* `inherited` (Boolean)

---

## 5. Contest

* `cuid` (PK)
* `name`
* `description`
* `start_time`
* `end_time`
* `status` (planned / running / ended / archived)

---

## 6. ContestUser

* `cu_id` (PK)
* `cuid` (FK → Contest.cuid)
* `uuid` (FK → User.uuid)
* `joined_at` (timestamp)
* `status` (active / disqualified / withdrawn)

---

## 7. QuestionProblem

* `quid` (PK)
* `cuid` (FK → Contest.cuid)
* `question_text`
* `difficulty_level`
* `tags` (array)
* `created_by` (FK → User.uuid, nullable)
* `created_at` (timestamp)
* `max_score`
* `is_active` (Boolean)

---

## 8. ContestProblem

* `cp_id` (PK)
* `cuid` (FK → Contest.cuid)
* `quid` (FK → QuestionProblem.quid)
* `order` (int, optional ordering)
* `points` (int)

---

## 9. Submission

* `suid` (PK)
* `quid` (FK → QuestionProblem.quid)
* `cuid` (FK → Contest.cuid)
* `submitted_by` (FK → User.uuid)
* `timestamp` (timestamp)
* `status` (`pending`, `under_review`, `accepted`, `rejected`)
* `reviewed_by` (FK → User.uuid, nullable until reviewed)
* `score`
* `code_text`

---

## 10. Review

* `ruid` (PK)
* `suid` (FK → Submission.suid)
* `quid` (FK → QuestionProblem.quid)
* `submitted_by` (FK → User.uuid)
* `reviewed_by` (FK → User.uuid, judge)
* `timestamp` (timestamp)
* `correct` (Boolean)
* `score_awarded` (int)
* `remarks`

---

## 11. JudgeAssignment (this one is not needed but left it just in case)

* `jauid` (PK)
* `suid` (FK → Submission.suid)
* `assigned_to` (FK → User.uuid, judge)
* `assigned_at` (timestamp)
* `status` (pending / reviewing / completed)

---

## 12. Analytics

* `auid` (PK)
* `cuid` (FK → Contest.cuid)
* `total_submissions` (int, derived)
* `correct_submissions` (int, derived)
* `active_participants` (int, derived)
* `last_updated` (timestamp)

---

## 13. Leaderboard

* `luid` (PK)
* `cuid` (FK → Contest.cuid)
* `uuid` (FK → User.uuid)
* `rank` (int)
* `score` (int)
* `problems_solved` (int)
* `last_submission_time` (timestamp)

---

## 14. AuditLog

* `log_id` (PK)
* `uuid` (FK → User.uuid)
* `action` (string, e.g., `login`, `add_problem`)
* `perm_id` (FK → Permission.perm_id)
* `timestamp` (timestamp)
* `ip_address`

---

## 15. BackupRecord

* `buid` (PK)
* `created_at` (timestamp)
* `created_by` (FK → User.uuid)
* `file_path` (string)
* `status` (success / failed)

---

## 16. Attendance

* `attuid` (PK)
* `cuid` (FK → Contest.cuid)
* `uuid` (FK → User.uuid)
* `checkin_time` (timestamp)
* `checkout_time` (timestamp, nullable)
* `status` (present / absent)

---

## 17. SystemControl (for contest runtime actions)

* `scuid` (PK)
* `cuid` (FK → Contest.cuid)
* `control_code` (FK → Permission.perm_id)
* `value` (JSON/text, e.g., `{phase: "running"}`)
* `set_by` (FK → User.uuid)
* `set_at` (timestamp)

---

# Relationships Between Tables


## User ↔ Role

* One Role has many Users.
* Each `User.role_id` → `Role.role_id`.
* If multi-role support is required, use UserRole (many-to-many).

---

## Role ↔ Permission

* Many-to-Many via `RolePermission`.
* One `Role` may have many `Permissions`.
* One `Permission` may be assigned to many `Roles`.
* `RolePermission` stores these mappings.

---

## Permission (hierarchy)

* Self-Referential One-to-Many.
* `Permission.parent_perm_id` → `Permission.perm_id`.
* Example: *Contest Control (800)* is parent of *Phase Control (820)*, *Timer Control (810)*, etc.

---

## Contest ↔ ContestUser ↔ User

* Many-to-Many between `Contest` and `User`.
* `ContestUser` links them: one contest may have many participants, one user may join many contests.

---

## Contest ↔ ContestProblem ↔ QuestionProblem

* Many-to-Many between `Contest` and `QuestionProblem`.
* `ContestProblem` links them, allowing reuse of problems across contests.

---

## QuestionProblem ↔ Submission

* One-to-Many.
* One `QuestionProblem` can have many `Submissions`.
* `Submission.quid` → `QuestionProblem.quid`.

---

## Contest ↔ Submission

* One-to-Many.
* Each submission belongs to exactly one contest.
* `Submission.cid` → `Contest.cid`.

---

## User ↔ Submission

* One-to-Many.
* One user can submit many times.
* `Submission.submitted_by` → `User.uuid`.

---

## Submission ↔ Review

* One-to-One or One-to-Many (depending on design).
* Typically One Submission → One Review, but can allow multiple reviews if peer-judging is needed.
* `Review.suid` → `Submission.suid`.

---

## Review ↔ User (Judge)

* One-to-Many.
* One judge can review many submissions.
* `Review.reviewed_by` → `User.uuid` (judge role).

---

## Submission ↔ JudgeAssignment

* One-to-Many.
* One submission may be assigned to multiple judges sequentially.
* `JudgeAssignment.suid` → `Submission.suid`.

---

## User (Judge) ↔ JudgeAssignment

* One-to-Many.
* One judge may have many assigned submissions.
* `JudgeAssignment.assigned_to` → `User.uuid`.

---

## Contest ↔ Analytics

* One-to-One (or One-to-Many over time).
* Each contest has aggregated analytics stored.
* `Analytics.cid` → `Contest.cid`.

---

## Contest ↔ Leaderboard

* One-to-Many.
* Each contest has its own leaderboard entries per participant.
* `Leaderboard.cid` → `Contest.cid`.

---

## User ↔ Leaderboard

* One-to-Many.
* Each user may appear in multiple contest leaderboards.
* `Leaderboard.uuid` → `User.uuid`.

---

## User ↔ AuditLog

* One-to-Many.
* Each log entry belongs to a user who performed an action.
* `AuditLog.uuid` → `User.uuid`.

---

## Permission ↔ AuditLog

* One-to-Many.
* Each log entry also records the permission used.
* `AuditLog.perm_id` → `Permission.perm_id`.

---

## User ↔ BackupRecord

* One-to-Many.
* A backup is created by a single user (admin).
* `BackupRecord.created_by` → `User.uuid`.

---

## Contest ↔ Attendance ↔ User

* Many-to-Many.
* `Attendance` links participants to their attendance records per contest.
* One user can have many attendance entries (multiple contests).
* One contest has attendance entries for many users.

---

## Contest ↔ SystemControl

* One-to-Many.
* Each contest can have multiple control records (timer, phase, emergency).
* `SystemControl.cid` → `Contest.cid`.

---

## User ↔ SystemControl

* One-to-Many.
* Each control action is performed by a single user.
* `SystemControl.set_by` → `User.uuid`.

---

Permission Table
views

| Code | Name            | Granted to |
|------|-----------------|------------|
| 0    | Login           | all        |
| 100  | Dashboard       | admin      |
| 200  | Problems        | user       |
| 300  | Judge queue     | judge      |
| 400  | Leaderboards    | admin      |
| 500  | users           | admin      |
| 600  | analytics       | admin      |
| 700  | exports         | admin      |
| 800  | contest control | admin      |
| 900  | audit log       | admin      |
| 1000 | backup          | admin      |
| 1100 | attendance      | admin      |

---

Controls (admin only)

810, timer control
820, phase control
830, display control
840, emergency actions
850, problem set/remove
860, user add/remove

---

problems (user)

210, view ques
220, add submission
230, total score

---

Permission table (extended)
| perm_id | code | name            | description                                                | default_granted_to | parent_perm_id |
|---------|------|-----------------|------------------------------------------------------------|--------------------|----------------|
| 1       | 0    | Login           | Basic access to the system                                 | all                | NULL           |
| 2       | 100  | Dashboard       | Admin dashboard                                            | admin              | NULL           |
| 3       | 200  | Problems        | Problem-solving area                                       | user               | NULL           |
| 4       | 210  | View Question   | View contest problem statements                            | user               | 200            |
| 5       | 220  | Add Submission  | Submit solution to a problem                               | user               | 200            |
| 6       | 230  | Total Score     | View participant’s own score                               | user               | 200            |
| 7       | 300  | Judge Queue     | Access to submissions awaiting judgement                   | judge              | NULL           |
| 8       | 310  | View Submission | View details of a single submission                        | judge              | 300            |
| 9       | 320  | View Queue List | View list of pending submissions                           | judge              | 300            |
| 10      | 400  | Leaderboards    | Contest rankings                                           | admin              | NULL           |
| 11      | 500  | Users           | Manage user accounts                                       | admin              | NULL           |
| 12      | 600  | Analytics       | Analytics dashboards                                       | admin              | NULL           |
| 13      | 700  | Exports         | Data export functionality                                  | admin              | NULL           |
| 14      | 800  | Contest Control | Main contest control panel                                 | admin              | NULL           |
| 15      | 810  | Timer Control   | Start/stop contest timers                                  | admin              | 800            |
| 16      | 820  | Phase Control   | Change contest phases (registration, running, ended, etc.) | admin              | 800            |
| 17      | 830  | Display Control | Control displays/announcements                             | admin              | 800            |
| 18      | 840  | Emergency Act.  | Perform emergency shutdown/reset actions                   | admin              | 800            |
| 19      | 850  | Problem Control | Add/remove contest problems                                | admin              | 800            |
| 20      | 860  | User Control    | Add/remove contest participants                            | admin              | 800            |
| 21      | 900  | Audit Log       | View full audit history                                    | admin              | NULL           |
| 22      | 1000 | Backup          | System backup & restore                                    | admin              | NULL           |
| 23      | 1100 | Attendance      | Monitor participant attendance/activity                    | admin              | NULL           |


---

judge queue/ problem queue for judges

view submission | if being reviewed another judge can't view
view list of submitted ques

---

table's

user directory

- uuid
- username
- role
- PC code
- ipaddress
- last active
- submission
- accepted

---
question problems

quid
ques text
difficulty level
tags

---

user (participant)

- uuid
- name
- PC-name
- password
- scored
- problem solved (suid which correct)
- problem solved count

---

submission table

suid
quid -> foreign key
submitted by uuid -> foreign key
viewed currently by -> juid -> foreign key
timestamp -> Date
reviewed? -> Boolean

---

reviewed ques table

ruid
suid -> foreign key
quid -> foreign key
submitted by -> uuid
reviewed by -> juid
timestamp -> Date
correct? Boolean

---

analytics

auid
total submission -> count of reviewed ques table
accepted/correct submissions -> count correct of reviewed ques table
active participants -> count of uuid from user directory with role participant

---

notes
- for problem performance 
quid + deduplicated uuid gives total number of users submitted question while correct? decuides how many correct