# ResManager

**Campus Resource Management System**: book classrooms, labs and lecture halls, with automatic clash checks against approved bookings and the real class timetable.

![Node](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-orange)

## Overview

On a busy campus, room booking often happens through messages and paper registers. Nobody can see which rooms are free, two groups get the same room, and requests have no visible status. ResManager replaces that with one web app: users request a room for a date and one-hour slots, an admin approves or rejects the request, and the system stops double-bookings and clashes with scheduled classes.

It is loaded with real data: **61 rooms** and **897 timetable slots** (III-semester CSE, 40 sections) taken from the university timetable PDFs.

## Features

- **Passwordless login:** a 6-digit email OTP (5-minute expiry, resend limit, 5 attempts, single use).
- **Role-based access:** Faculty and club presidents can book; other students can only view and edit their profile; Admins manage everything.
- **Room browser:** filter rooms by type, building and status.
- **Live slot availability:** slots that are already booked or have a class are greyed out for the chosen date.
- **Clash-safe booking:** overlap checks against Approved bookings and the timetable, inside a transaction with a row lock.
- **Approval workflow:** Pending, Approved, Rejected or Cancelled, with who approved and when. Approval re-checks clashes.
- **Complaints:** report room problems; admins resolve them.
- **Admin console:** bookings, complaints, clubs, rooms, users and roles, and a **CSV timetable upload** with duplicate detection.

## Roles

| Role | Can do |
| --- | --- |
| Faculty | Book rooms, edit or cancel own bookings, file complaints |
| Student (club president) | Same as Faculty, bookings are tied to their club |
| Student (other) | Sign in, update profile |
| Admin | Approve or reject bookings, resolve complaints, manage clubs, rooms, timetable and roles |

The role comes from the email domain for new users (`muj.manipal.edu` is Student, `jaipur.manipal.edu` is Faculty). Admins are set in the database or by another admin.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript (no frameworks) |
| Backend | Node.js, Express, mysql2 (connection pool), express-session, nodemailer |
| Database | MySQL 8 (InnoDB) |
| Auth | Email OTP over Gmail SMTP, server-side sessions |

## Project structure

```
ResManager/
├── backend/
│   ├── server.js        # routes and runtime SQL
│   ├── db.js            # MySQL connection pool
│   └── .env             # local settings (not committed)
├── frontend/
│   ├── pages/           # login, dashboard, resources, bookings, complaints, profile, admin
│   ├── js/              # page scripts + common.js
│   └── css/
└── database/
    ├── 00_create_database.sql ... 16_remove_seed_rooms.sql
    ├── 99_reset.sql
    └── data/timetable.csv
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- MySQL 8
- A Gmail account with an [App password](https://support.google.com/accounts/answer/185833) for sending OTP emails (or use console mode while developing)

### 1. Set up the database

Run the scripts in `database/` in numeric order, using MySQL Workbench or the `mysql` client:

```
00 create database -> 01-08 tables -> 09 unique keys -> 10 checks -> 11 foreign keys
-> 12 indexes -> 13 seed data -> 15 real resources -> 16 remove seed rooms
```

`99_reset.sql` drops everything if you want to start over.

### 2. Configure the backend

Create `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=resmanager
PORT=3000
SESSION_SECRET=a_long_random_string
OTP_MODE=console        # "console" prints the OTP in the terminal, "email" sends it
MAIL_USER=your_gmail_address
MAIL_PASS=your_gmail_app_password
```

### 3. Install and run

```bash
cd backend
npm install
node server.js
```

Open `http://localhost:3000`. Restart the server after any change to `server.js` or `.env`.

### 4. Load the timetable

Sign in as an Admin, open **Admin → Timetable**, and upload `database/data/timetable.csv` (897 rows). The CSV columns are:

```
subject_code,day,start_time,end_time,department,resource_code
CSC2102,Monday,11:30,12:20,CSE,RLHC0201
```

## How booking works

1. The user picks a room and a date. `GET /availability` returns the booked and class slots, and the page greys them out.
2. `POST /bookings` starts a transaction, locks the room row, checks for overlap with Approved bookings and the timetable, then inserts the request as **Pending**.
3. An admin approves it. The same clash check runs again under a lock, so two requests for one slot can never both be approved.

Two time ranges overlap when `existing.start < new.end AND existing.end > new.start`.

## API summary

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /logout` |
| User | `GET /me`, `PUT /me`, `GET /departments`, `GET /dashboard` |
| Rooms | `GET /resources`, `GET /availability` |
| Bookings | `GET /bookings`, `POST /bookings`, `PUT /bookings/:id`, `PUT /bookings/:id/cancel` |
| Complaints | `GET /complaints`, `POST /complaints`, `PUT /complaints/:id` |
| Admin | `GET /admin/overview`, booking approve and reject, complaint resolve, clubs, resources, timetable upload, user roles (all under `/admin`) |

## Security notes

- All queries use parameterised `?` placeholders.
- OTPs are single-use and rate-limited; sessions use httpOnly, sameSite cookies.
- Access is enforced on the server by middleware, not only hidden in the UI.
- `.env` is git-ignored. Never commit it.

## Limitations

- The timetable covers only III-semester CSE; other years and branches are not blocked yet.
- Room capacities are placeholders (Lecture Hall 120, Classroom 60, Lab 30).
- OTPs are kept in server memory and are lost on restart.
- Bookings use one-hour slots only.

## Roadmap

- Load timetables for all years and departments, with real capacities.
- Email notifications when a booking is approved or rejected.
- Calendar view and usage reports.
- Deploy with a verified college mail domain and a transactional email service.

## Author

**Ronak**, B.Tech CSE, Manipal University Jaipur
