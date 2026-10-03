# ResManager: Database Guide

Branch: `database` | Folder: `database/` | DB: MySQL | Project: Campus Resource Management System (Manipal University Jaipur)

Read this fully before writing any script. If something here needs to change, change this file first, then the scripts.

---

## 1. Setup (same on both laptops)

- MySQL **8.0.16 or newer**. Check with `SELECT VERSION();`. Older versions silently ignore CHECK constraints.
- Database name: `resmanager`. Character set: `utf8mb4`.
- Every script (except 00) starts with `USE resmanager;`
- Write and test every script in MySQL Workbench. Save it straight into the repo's `database/` folder, then commit and push from VS Code.
- Scripts only create tables. To change a table: edit its script, run `99_reset.sql`, then re-run `00` to `08` in order. Dev data is disposable.

---

## 2. Script order

A script can only run after every table it points to exists.

| File | Creates | Needs first | Owner |
|---|---|---|---|
| 00_create_database.sql | database `resmanager` | none | Ronak |
| 01_department.sql | department | none | Ronak |
| 02_resource.sql | resource | none | Ronak |
| 03_users.sql | users | department | Ronak |
| 04_timetable.sql | timetable | department, resource | Ronak |
| 05_club.sql | club | users | Garv |
| 06_booking_request.sql | booking_request | users, resource, club | Garv |
| 07_booking_slot.sql | booking_slot | booking_request | Garv |
| 08_complaint.sql | complaint | resource, users | Garv |
| 09_seed_data.sql | sample rows for testing (later) | all tables | both |
| 99_reset.sql | drops all tables, order: complaint, booking_slot, booking_request, club, timetable, users, resource, department | none | Ronak |

Ronak pushes 00 to 03 first, since Garv's tables point at `users`. Garv pulls them, then builds 05 to 08.

---

## 3. Naming rules

- `snake_case` everywhere. Table names are singular, except `users` (avoids clashing with MySQL's own `user`).
- Primary key of table X is `x_id` (exception: `resource_code`).
- A foreign key has the same name as the key it points to. Exceptions where one table is referenced for different roles: `president_user_id`, `faculty_user_id`, `approved_by`, `resolved_by`.
- Name foreign keys explicitly: `fk_<table>_<column>`, e.g. `fk_booking_request_club_id`.
- ENUM values are capitalised exactly as listed below (the frontend uses them as CSS classes after `.toLowerCase()`).
- Types: ids are `INT AUTO_INCREMENT`; phone is `VARCHAR`; times are `TIME`; dates are `DATE`; timestamps are `DATETIME`.

---

## 4. Tables

### department
| Column | Type | Constraints |
|---|---|---|
| department_id | INT | PK, AUTO_INCREMENT |
| department_code | VARCHAR(10) | NOT NULL, UNIQUE |
| department_name | VARCHAR(100) | NOT NULL, UNIQUE |

### resource
`resource_code` = building short form + room number, e.g. `LHC002`, `1AB102`. It is unique across campus.
| Column | Type | Constraints |
|---|---|---|
| resource_code | VARCHAR(10) | PK |
| room_number | VARCHAR(10) | NOT NULL |
| resource_type | VARCHAR(50) | NOT NULL (Lecture Hall, Classroom, Computer Lab...) |
| building | VARCHAR(50) | NOT NULL |
| capacity | INT | NOT NULL, CHECK (capacity > 0) |
| floor | INT | NOT NULL (0 = ground) |
| status | ENUM('Available','Unavailable','Maintenance') | NOT NULL, DEFAULT 'Available' |

### users
Rows are created automatically at first Microsoft login. So `phone` and `department_id` start empty and are filled from the Profile page.
| Column | Type | Constraints |
|---|---|---|
| user_id | INT | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| phone | VARCHAR(15) | NULL |
| role | ENUM('Student','Faculty','Admin') | NOT NULL |
| department_id | INT | NULL, FK to department |

### timetable
Uploaded by the admin. Blocks a room at fixed weekly times.
| Column | Type | Constraints |
|---|---|---|
| timetable_id | INT | PK, AUTO_INCREMENT |
| subject_code | VARCHAR(20) | NOT NULL |
| day | ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') | NOT NULL (matches MySQL `DAYNAME()`) |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL, CHECK (end_time > start_time) |
| department_id | INT | NOT NULL, FK to department |
| resource_code | VARCHAR(10) | NOT NULL, FK to resource |

### club
Admin creates clubs first, then assigns people from the admin dashboard. So both user columns can be empty.
| Column | Type | Constraints |
|---|---|---|
| club_id | INT | PK, AUTO_INCREMENT |
| club_name | VARCHAR(100) | NOT NULL, UNIQUE |
| president_user_id | INT | NULL, **UNIQUE** (one president per club, one club per president), FK to users |
| faculty_user_id | INT | NULL, FK to users (a faculty may advise many clubs) |

### booking_request
| Column | Type | Constraints |
|---|---|---|
| booking_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | NOT NULL, FK to users (who booked) |
| resource_code | VARCHAR(10) | NOT NULL, FK to resource |
| club_id | INT | NULL, FK to club (set for president bookings, NULL for faculty) |
| booking_date | DATE | NOT NULL |
| purpose | VARCHAR(255) | NOT NULL |
| status | ENUM('Pending','Approved','Rejected','Cancelled') | NOT NULL, DEFAULT 'Pending' |
| approved_by | INT | NULL, FK to users (set when an admin approves or rejects) |
| approval_date | DATETIME | NULL (set together with approved_by) |

Also add an index on (`resource_code`, `booking_date`) for the clash check.

### booking_slot
One row per selected time slot. A booking with 9-10 AM and 2-3 PM has two rows.
| Column | Type | Constraints |
|---|---|---|
| booking_id | INT | FK to booking_request, ON DELETE CASCADE |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL, CHECK (end_time > start_time) |

Primary key: (`booking_id`, `start_time`).

### complaint
Always about a resource (e.g. title "Projector not working", resource `1AB102`).
| Column | Type | Constraints |
|---|---|---|
| complaint_id | INT | PK, AUTO_INCREMENT |
| title | VARCHAR(100) | NOT NULL |
| description | TEXT | NOT NULL |
| resource_code | VARCHAR(10) | NOT NULL, FK to resource |
| user_id | INT | NOT NULL, FK to users (who filed it) |
| status | ENUM('Pending','Resolved') | NOT NULL, DEFAULT 'Pending' |
| created_date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| resolved_by | INT | NULL, FK to users (admin) |
| resolved_date | DATETIME | NULL |

---

## 5. Relationships

| Relationship | Cardinality | Where the FK lives |
|---|---|---|
| Department has Users | 1:N | users.department_id |
| Department schedules Timetable | 1:N | timetable.department_id |
| Resource has Timetable | 1:N | timetable.resource_code |
| User presides over Club | 1:1 (both optional) | club.president_user_id (UNIQUE) |
| User advises Club | 1:N | club.faculty_user_id |
| User requests Booking | 1:N | booking_request.user_id |
| User approves Booking | 1:N | booking_request.approved_by |
| Resource is booked in Booking | 1:N | booking_request.resource_code |
| Club has Bookings | 1:N (optional) | booking_request.club_id |
| Booking has Slots | 1:N | booking_slot.booking_id |
| User files Complaint | 1:N | complaint.user_id |
| User resolves Complaint | 1:N | complaint.resolved_by |
| Resource has Complaints | 1:N | complaint.resource_code |

---

## 6. Delete and update policy

- Every FK uses **RESTRICT** on delete, so nothing can be deleted while other rows depend on it. This protects booking history.
- Exception: `booking_slot.booking_id` uses **CASCADE**, so deleting a booking removes its slots.
- Every `resource_code` FK also uses `ON UPDATE CASCADE`.
- A resource with bookings is never deleted. Set its status to `Unavailable` instead.

---

## 7. Rules the backend must enforce (the DB cannot)

1. **Role from email**, read from the verified Microsoft token, never from a form field. `@muj.manipal.edu` = Student, `@jaipur.manipal.edu` = Faculty. Admin is set manually: `UPDATE users SET role='Admin' WHERE email='...'`.
2. **Who may browse, book and file complaints:** Faculty always. A Student only if their `user_id` appears in some `club.president_user_id`. Other students see only Dashboard and Profile. Check this on every endpoint, not just in the frontend.
3. **`club_id` on a booking** is set by the backend from the president's club (NULL for faculty). Never trust a `club_id` sent by the frontend.
4. **Clash check**, inside a transaction, before saving or approving: no other Approved booking for the same `resource_code` and `booking_date` with an overlapping slot, and no `timetable` row for the same `resource_code` where `day = DAYNAME(booking_date)` and the times overlap.
5. **Editing a booking:** delete its old `booking_slot` rows, insert the new ones, reset status to `Pending`.
6. **Admin only:** approve or reject bookings (set `approved_by`, `approval_date`), resolve complaints, upload the timetable, create clubs, and assign `president_user_id` and `faculty_user_id`.
7. `president_user_id` must reference a Student and `faculty_user_id` a Faculty. The admin dropdowns filter by role and the backend re-checks. Show email next to name in dropdowns.
8. Reject booking dates in the past.
9. Never commit database passwords (e.g. in `application.properties`). Keep them out of Git.

---

## 8. Git rules for this branch

- Work only on the `database` branch. Never commit directly to `main`.
- `git pull` before you start and before you push.
- Each person edits only their own scripts (see the Owner column). This avoids merge conflicts.
- One script per commit, with a clear message: `Add users table script`.
- Only push scripts that run cleanly in Workbench.
