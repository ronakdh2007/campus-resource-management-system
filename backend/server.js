const express = require('express');
const path = require('path');
const pool = require('./db');

const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => res.redirect('/pages/login.html'));

app.get('/resources', attachUser, requireBooker, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resource');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// which 1-hour slots are taken for a room on a date: timetable classes + Approved bookings
app.get('/availability', attachUser, requireBooker, async (req, res) => {
  try {
    const { resource_code, date } = req.query;
    if (!resource_code || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return res.status(400).json({ error: 'Room and date are required.' });
    }
    const [booked] = await pool.query(
      `SELECT TIME_FORMAT(bs.start_time, '%H:%i') AS start_time, TIME_FORMAT(bs.end_time, '%H:%i') AS end_time
       FROM booking_request b JOIN booking_slot bs ON bs.booking_id = b.booking_id
       WHERE b.resource_code = ? AND b.booking_date = ? AND b.status = 'Approved'`,
      [resource_code, date]
    );
    const [classes] = await pool.query(
      `SELECT TIME_FORMAT(start_time, '%H:%i') AS start_time, TIME_FORMAT(end_time, '%H:%i') AS end_time
       FROM timetable WHERE resource_code = ? AND \`day\` = DAYNAME(?)`,
      [resource_code, date]
    );
    res.json({ booked, classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

// ---------- login with email OTP ----------
const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map(); // email -> { code, expires, attempts, sentAt } (in memory)
const DOMAIN_ROLE = { 'muj.manipal.edu': 'Student', 'jaipur.manipal.edu': 'Faculty' };

const mailer = process.env.OTP_MODE === 'email'
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } })
  : null;

function cleanEmail(v) { return String(v || '').trim().toLowerCase(); }
function roleForEmail(email) { return DOMAIN_ROLE[email.split('@')[1]]; }

// "ramesh.kumar@..." -> "Ramesh Kumar", "aarav.2410101001@..." -> "Aarav"
function nameFromEmail(email) {
  const parts = email.split('@')[0].split('.').filter(p => /^[a-z]+$/.test(p));
  const name = parts.map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
  return (name || 'New User').slice(0, 100);
}

const STUDENT_EMAIL = /^[a-z]+\.\d{10}@muj\.manipal\.edu$/;            // firstname.1234567890@muj.manipal.edu
const FACULTY_EMAIL = /^[a-z]+(\.[a-z]+)+@jaipur\.manipal\.edu$/;      // first.last@jaipur.manipal.edu

function validCollegeEmail(email) {
  return STUDENT_EMAIL.test(email) || FACULTY_EMAIL.test(email);
}

app.post('/auth/request-otp', async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const [known] = await pool.query('SELECT 1 FROM users WHERE email = ?', [email]);
    if (!validCollegeEmail(email) && known.length === 0) {
      return res.status(400).json({
        error: 'Use your college email: firstName.regNum@muj.manipal.edu (for students) or firstName.lastName@jaipur.manipal.edu (for faculty).'
      });
    }
    const old = otpStore.get(email);
    if (old && Date.now() - old.sentAt < 30000) {
      return res.status(429).json({ error: 'Please wait 30 seconds before requesting another code.' });
    }
    const code = String(crypto.randomInt(100000, 1000000));
    otpStore.set(email, { code, expires: Date.now() + OTP_TTL_MS, attempts: 0, sentAt: Date.now() });

        if (mailer) {
          try {
            await mailer.sendMail({
              from: 'ResManager <' + process.env.MAIL_USER + '>',
              to: email,
              subject: 'Your ResManager login code',
              text: 'Your code is ' + code + '. It expires in 5 minutes.'
            });
          } catch (mailErr) {
            otpStore.delete(email); // failed send must not block a retry for 30 s
            throw mailErr;          // the outer catch sends the 500
          }
        } else {
          console.log('[DEV OTP] ' + email + ' -> ' + code);
        }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not send the code.' });
  }
});

app.post('/auth/verify-otp', async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    const entry = otpStore.get(email);

    if (!entry || Date.now() > entry.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });
    }
    entry.attempts++;
    if (entry.attempts > 5) {
      otpStore.delete(email);
      return res.status(429).json({ error: 'Too many wrong attempts. Request a new code.' });
    }
    if (entry.code !== code) return res.status(400).json({ error: 'Wrong code.' });
    otpStore.delete(email); // a code works only once

    // existing user keeps their role (this is how Admin works); a new user gets the role from the domain
    const [found] = await pool.query('SELECT user_id, role FROM users WHERE email = ?', [email]);
    let user = found[0];
    if (!user) {
      const role = roleForEmail(email);
      const [ins] = await pool.query('INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        [nameFromEmail(email), email, role]);
      user = { user_id: ins.insertId, role: role };
    }

    req.session.regenerate(function (err) {
      if (err) return res.status(500).json({ error: 'Login failed.' });
      req.session.user_id = user.user_id;
      res.json({ ok: true, redirect: user.role === 'Admin' ? '/pages/admin.html' : '/pages/dashboard.html' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/logout', function (req, res) {
  req.session.destroy(function () {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// ---------- access control : enforced on the server, not just the frontend ----------
async function attachUser(req, res, next) {
  try {
    if (!req.session.user_id) return res.status(401).json({ error: 'Not logged in.' });
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.session.user_id]);
    if (!rows[0]) return res.status(401).json({ error: 'Not logged in.' });
    req.user = rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Auth failed' });
  }
}

// Faculty always; a Student only if they are a club president; Admin never books
async function canBook(user) {
  if (user.role === 'Faculty') return true;
  if (user.role === 'Student') {
    const [c] = await pool.query('SELECT 1 FROM club WHERE president_user_id = ? LIMIT 1', [user.user_id]);
    return c.length > 0;
  }
  return false;
}

async function requireBooker(req, res, next) {
  if (!(await canBook(req.user))) return res.status(403).json({ error: 'You do not have access to this.' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only.' });
  next();
}

// these run BEFORE the routes below, for every /bookings... and /complaints... request
app.use('/bookings', attachUser, requireBooker);
app.use('/complaints', attachUser, requireBooker);
app.use('/admin', attachUser, requireAdmin);

// ---------- who am I (feeds the frontend access gate) ----------
app.get('/me', attachUser, async (req, res) => {
  const u = req.user;
  const [clubs] = await pool.query('SELECT club_id, club_name FROM club WHERE president_user_id = ?', [u.user_id]);
  res.json({
    user_id: u.user_id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, department_id: u.department_id,
    club: clubs[0] || null,
    canAccess: await canBook(u),
    isAdmin: u.role === 'Admin'
  });
});

// ---------- departments list (for the profile dropdown) ----------
app.get('/departments', attachUser, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT department_id, department_code, department_name FROM department ORDER BY department_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// ---------- update my own details (name, phone, department only) ----------
app.put('/me', attachUser, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim() || null;
    const deptId = Number(req.body.department_id);

    if (!name || name.length > 100) return res.status(400).json({ error: 'Please enter a valid name.' });
    if (phone && !/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ error: 'Phone number must be exactly 10 digits and start with 6, 7, 8 or 9.' });

    const [d] = await pool.query('SELECT 1 FROM department WHERE department_id = ?', [deptId]);
    if (d.length === 0) return res.status(400).json({ error: 'Please select a valid department.' });

    await pool.query('UPDATE users SET name = ?, phone = ?, department_id = ? WHERE user_id = ?',
      [name, phone, deptId, req.user.user_id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ---------- my bookings (with slots) ----------
app.get('/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.booking_date, b.purpose, b.status,
              b.resource_code, r.building, r.resource_type, r.capacity,
              JSON_ARRAYAGG(JSON_OBJECT('start_time', s.start_time, 'end_time', s.end_time)) AS slots
       FROM booking_request b
       JOIN resource r ON r.resource_code = b.resource_code
       LEFT JOIN booking_slot s ON s.booking_id = b.booking_id
       WHERE b.user_id = ?
       GROUP BY b.booking_id
       ORDER BY b.booking_date DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ---------- my complaints ----------
// ---------- my complaints ----------
app.get('/complaints', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT complaint_id, title, description, resource_code, status,
              DATE(created_date) AS created_date, DATE(resolved_date) AS resolved_date
       FROM complaint WHERE user_id = ? ORDER BY complaint_id DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// ---------- file a complaint ----------
app.post('/complaints', async (req, res) => {
  try {
    const { resource_code, title, description } = req.body;
    if (!resource_code || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Missing complaint details.' });
    }
    const [r] = await pool.query('SELECT 1 FROM resource WHERE resource_code = ?', [resource_code]);
    if (r.length === 0) return res.status(404).json({ error: 'Resource not found.' });

    const [result] = await pool.query(
      'INSERT INTO complaint (title, description, resource_code, user_id) VALUES (?, ?, ?, ?)',
      [title.trim(), description.trim(), resource_code, req.user.user_id]
    );
    res.status(201).json({ complaint_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to file complaint' });
  }
});

// ---------- edit my complaint (rule 9: own + still Pending) ----------
app.put('/complaints/:id', async (req, res) => {
  try {
    const { resource_code, title, description } = req.body;
    if (!resource_code || !title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Missing complaint details.' });
    }
    const [r] = await pool.query('SELECT 1 FROM resource WHERE resource_code = ?', [resource_code]);
    if (r.length === 0) return res.status(404).json({ error: 'Resource not found.' });

    const [result] = await pool.query(
      `UPDATE complaint SET resource_code = ?, title = ?, description = ?
       WHERE complaint_id = ? AND user_id = ? AND status = 'Pending'`,
      [resource_code, title.trim(), description.trim(), Number(req.params.id), req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'Only your own pending complaints can be edited.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// ---------- create a booking ----------
app.post('/bookings', async (req, res) => {
  const { resource_code, booking_date, purpose, slots } = req.body;
  const conn = await pool.getConnection();
  try {
    const user = req.user;

    // rule 2: who may book. Faculty always, a student only if a club president, admin never
    let clubId = null;
    if (user.role === 'Student') {
      const [clubs] = await conn.query('SELECT club_id FROM club WHERE president_user_id = ?', [user.user_id]);
      if (clubs.length === 0) throw { status: 403, message: 'Only club presidents can book.' };
      clubId = clubs[0].club_id; // rule 3: club_id comes from the DB, never from the frontend
    } else if (user.role === 'Admin') {
      throw { status: 403, message: 'Admins cannot make bookings.' };
    }

    // basic validation (rule 8: no past dates)
    if (!resource_code || !booking_date || !purpose || !Array.isArray(slots) || slots.length === 0) {
      throw { status: 400, message: 'Missing booking details.' };
    }
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    if (booking_date < today) throw { status: 400, message: 'Booking date cannot be in the past.' };
    for (const s of slots) {
      if (s.end_time <= s.start_time) throw { status: 400, message: 'A slot must end after it starts.' };
    }

    await conn.beginTransaction();

    // lock the room row so two people can't clash at the same moment
    const [rooms] = await conn.query('SELECT status FROM resource WHERE resource_code = ? FOR UPDATE', [resource_code]);
    if (rooms.length === 0) throw { status: 404, message: 'Resource not found.' };
    if (rooms[0].status !== 'Available') throw { status: 409, message: 'This room is not available for booking.' };

    // rule 4: clash check, per slot (overlap = existing.start < new.end AND existing.end > new.start)
    for (const s of slots) {
      const [clash1] = await conn.query(
        `SELECT 1 FROM booking_request b JOIN booking_slot bs ON bs.booking_id = b.booking_id
         WHERE b.resource_code = ? AND b.booking_date = ? AND b.status = 'Approved'
           AND bs.start_time < ? AND bs.end_time > ? LIMIT 1`,
        [resource_code, booking_date, s.end_time, s.start_time]
      );
      if (clash1.length) throw { status: 409, message: 'That slot is already booked.' };

      const [clash2] = await conn.query(
        `SELECT 1 FROM timetable
         WHERE resource_code = ? AND \`day\` = DAYNAME(?) AND start_time < ? AND end_time > ? LIMIT 1`,
        [resource_code, booking_date, s.end_time, s.start_time]
      );
      if (clash2.length) throw { status: 409, message: 'A class is scheduled in that slot.' };
    }

    const [result] = await conn.query(
      `INSERT INTO booking_request (user_id, resource_code, club_id, booking_date, purpose)
       VALUES (?, ?, ?, ?, ?)`,
      [user.user_id, resource_code, clubId, booking_date, purpose]
    );
    const bookingId = result.insertId;
    await conn.query(
      'INSERT INTO booking_slot (booking_id, start_time, end_time) VALUES ?',
      [slots.map(s => [bookingId, s.start_time, s.end_time])]
    );

    await conn.commit();
    res.status(201).json({ booking_id: bookingId });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    conn.release();
  }
});

// ---------- shared clash check (used by edit now, admin approve later) ----------
async function checkClashes(conn, resource_code, booking_date, slots, excludeBookingId = 0) {
  for (const s of slots) {
    const [c1] = await conn.query(
      `SELECT 1 FROM booking_request b JOIN booking_slot bs ON bs.booking_id = b.booking_id
       WHERE b.resource_code = ? AND b.booking_date = ? AND b.status = 'Approved'
         AND b.booking_id <> ? AND bs.start_time < ? AND bs.end_time > ? LIMIT 1`,
      [resource_code, booking_date, excludeBookingId, s.end_time, s.start_time]
    );
    if (c1.length) throw { status: 409, message: 'That slot is already booked.' };

    const [c2] = await conn.query(
      `SELECT 1 FROM timetable
       WHERE resource_code = ? AND \`day\` = DAYNAME(?) AND start_time < ? AND end_time > ? LIMIT 1`,
      [resource_code, booking_date, s.end_time, s.start_time]
    );
    if (c2.length) throw { status: 409, message: 'A class is scheduled in that slot.' };
  }
}

// ---------- edit my booking (rule 5) ----------
app.put('/bookings/:id', async (req, res) => {
  const bookingId = Number(req.params.id);
  const { booking_date, purpose, slots } = req.body;
  const conn = await pool.getConnection();
  try {
    if (!booking_date || !purpose || !Array.isArray(slots) || slots.length === 0) {
      throw { status: 400, message: 'Missing booking details.' };
    }
    const today = new Date().toLocaleDateString('en-CA');
    if (booking_date < today) throw { status: 400, message: 'Booking date cannot be in the past.' };
    for (const s of slots) {
      if (s.end_time <= s.start_time) throw { status: 400, message: 'A slot must end after it starts.' };
    }

    await conn.beginTransaction();

    // only my own booking, and lock it
    const [rows] = await conn.query(
      'SELECT resource_code, status FROM booking_request WHERE booking_id = ? AND user_id = ? FOR UPDATE',
      [bookingId, req.user.user_id]
    );
    if (rows.length === 0) throw { status: 404, message: 'Booking not found.' };
    if (!['Pending', 'Approved'].includes(rows[0].status)) {
      throw { status: 409, message: 'Only pending or approved bookings can be edited.' };
    }
    const resource_code = rows[0].resource_code;

    const [rooms] = await conn.query('SELECT status FROM resource WHERE resource_code = ? FOR UPDATE', [resource_code]);
    if (rooms[0].status !== 'Available') throw { status: 409, message: 'This room is not available for booking.' };

    await checkClashes(conn, resource_code, booking_date, slots, bookingId);

    // delete old slots, insert new, reset to Pending: all in ONE transaction
    await conn.query('DELETE FROM booking_slot WHERE booking_id = ?', [bookingId]);
    await conn.query('INSERT INTO booking_slot (booking_id, start_time, end_time) VALUES ?',
      [slots.map(s => [bookingId, s.start_time, s.end_time])]);
    await conn.query(
      `UPDATE booking_request
       SET booking_date = ?, purpose = ?, status = 'Pending', approved_by = NULL, approval_date = NULL
       WHERE booking_id = ?`,
      [booking_date, purpose, bookingId]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  } finally {
    conn.release();
  }
});

// ---------- cancel my booking ----------
app.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE booking_request SET status = 'Cancelled'
       WHERE booking_id = ? AND user_id = ? AND status IN ('Pending','Approved')`,
      [Number(req.params.id), req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(409).json({ error: 'Booking cannot be cancelled.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ---------- dashboard counts for the logged-in user ----------
app.get('/dashboard', attachUser, async (req, res) => {
  try {
    const [[b]] = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(status = 'Pending'), 0) AS pending
       FROM booking_request WHERE user_id = ?`, [req.user.user_id]);
    const [[c]] = await pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(status = 'Resolved'), 0) AS resolved,
              COALESCE(SUM(status = 'Pending'), 0) AS pending
       FROM complaint WHERE user_id = ?`, [req.user.user_id]);
    res.json({
      bookings: { total: Number(b.total), pending: Number(b.pending) },
      complaints: { total: Number(c.total), resolved: Number(c.resolved), pending: Number(c.pending) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ---------- admin routes (the /admin prefix is already protected by attachUser + requireAdmin) ----------
function sendError(res, err, fallback) {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That name, code or president is already in use.' });
  console.error(err);
  res.status(500).json({ error: fallback });
}

// everything the admin page needs, in one call
app.get('/admin/overview', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT user_id, name, email, role, department_id FROM users');
    const [departments] = await pool.query('SELECT * FROM department');
    const [resources] = await pool.query('SELECT * FROM resource');
    const [clubs] = await pool.query('SELECT * FROM club');
    const [bookings] = await pool.query(
      `SELECT b.booking_id, b.user_id, b.resource_code, b.club_id, b.booking_date, b.purpose, b.status,
              b.approved_by, DATE(b.approval_date) AS approval_date,
              JSON_ARRAYAGG(JSON_OBJECT('start_time', s.start_time, 'end_time', s.end_time)) AS slots
       FROM booking_request b LEFT JOIN booking_slot s ON s.booking_id = b.booking_id
       GROUP BY b.booking_id ORDER BY b.booking_id`
    );
    const [complaints] = await pool.query(
      `SELECT complaint_id, title, description, resource_code, user_id, status,
              DATE(created_date) AS created_date, resolved_by, DATE(resolved_date) AS resolved_date
       FROM complaint ORDER BY complaint_id`
    );
    const [timetable] = await pool.query(
      `SELECT timetable_id, subject_code, \`day\`, TIME_FORMAT(start_time, '%H:%i') AS start_time,
              TIME_FORMAT(end_time, '%H:%i') AS end_time, department_id, resource_code
       FROM timetable`
    );
    res.json({ users, departments, resources, clubs, bookings, complaints, timetable });
  } catch (err) { sendError(res, err, 'Failed to load admin data'); }
});

// approve: re-run the clash check inside a transaction (rule 4)
app.put('/admin/bookings/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT resource_code, booking_date, status FROM booking_request WHERE booking_id = ? FOR UPDATE', [id]);
    if (!rows.length) throw { status: 404, message: 'Booking not found.' };
    if (rows[0].status !== 'Pending') throw { status: 409, message: 'Only pending bookings can be approved.' };
    const { resource_code, booking_date } = rows[0];

    const [rooms] = await conn.query('SELECT status FROM resource WHERE resource_code = ? FOR UPDATE', [resource_code]);
    if (rooms[0].status !== 'Available') throw { status: 409, message: 'Cannot approve: resource is ' + rooms[0].status + '.' };

    const [slots] = await conn.query('SELECT start_time, end_time FROM booking_slot WHERE booking_id = ?', [id]);
    await checkClashes(conn, resource_code, booking_date, slots, id);

    await conn.query(
      `UPDATE booking_request SET status = 'Approved', approved_by = ?, approval_date = NOW() WHERE booking_id = ?`,
      [req.user.user_id, id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    sendError(res, err, 'Failed to approve booking');
  } finally { conn.release(); }
});

app.put('/admin/bookings/:id/reject', async (req, res) => {
  try {
    const [r] = await pool.query(
      `UPDATE booking_request SET status = 'Rejected', approved_by = ?, approval_date = NOW()
       WHERE booking_id = ? AND status = 'Pending'`, [req.user.user_id, Number(req.params.id)]);
    if (r.affectedRows === 0) return res.status(409).json({ error: 'Only pending bookings can be rejected.' });
    res.json({ ok: true });
  } catch (err) { sendError(res, err, 'Failed to reject booking'); }
});

app.put('/admin/complaints/:id/resolve', async (req, res) => {
  try {
    const [r] = await pool.query(
      `UPDATE complaint SET status = 'Resolved', resolved_by = ?, resolved_date = NOW()
       WHERE complaint_id = ? AND status = 'Pending'`, [req.user.user_id, Number(req.params.id)]);
    if (r.affectedRows === 0) return res.status(409).json({ error: 'Only pending complaints can be resolved.' });
    res.json({ ok: true });
  } catch (err) { sendError(res, err, 'Failed to resolve complaint'); }
});

app.post('/admin/clubs', async (req, res) => {
  try {
    const name = (req.body.club_name || '').trim();
    if (!name) return res.status(400).json({ error: 'Club name is required.' });
    const [r] = await pool.query('INSERT INTO club (club_name) VALUES (?)', [name]);
    res.status(201).json({ club_id: r.insertId });
  } catch (err) { sendError(res, err, 'Failed to create club'); }
});

// rule 7: president must be a Student, advisor must be Faculty (re-checked here)
app.put('/admin/clubs/:id', async (req, res) => {
  try {
    const president = req.body.president_user_id || null;
    const advisor = req.body.faculty_user_id || null;
    if (president) {
      const [u] = await pool.query('SELECT role FROM users WHERE user_id = ?', [president]);
      if (!u.length || u[0].role !== 'Student') return res.status(400).json({ error: 'President must be a student.' });
    }
    if (advisor) {
      const [u] = await pool.query('SELECT role FROM users WHERE user_id = ?', [advisor]);
      if (!u.length || u[0].role !== 'Faculty') return res.status(400).json({ error: 'Advisor must be a faculty member.' });
    }
    await pool.query('UPDATE club SET president_user_id = ?, faculty_user_id = ? WHERE club_id = ?',
      [president, advisor, Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) { sendError(res, err, 'Failed to update club'); }
});

function checkResourceBody(b) {
  if (!b.room_number || !b.resource_type || !b.building) throw { status: 400, message: 'Missing resource details.' };
  if (!(Number(b.capacity) > 0)) throw { status: 400, message: 'Capacity must be greater than 0.' };
  if (!(Number(b.floor) >= 0)) throw { status: 400, message: 'Floor must be 0 or more.' };
  if (!['Available', 'Unavailable', 'Maintenance'].includes(b.status)) throw { status: 400, message: 'Invalid status.' };
}

app.post('/admin/resources', async (req, res) => {
  try {
    const b = req.body;
    if (!b.resource_code || b.resource_code.length > 10) throw { status: 400, message: 'Invalid resource code.' };
    checkResourceBody(b);
    await pool.query(
      'INSERT INTO resource (resource_code, room_number, resource_type, building, capacity, `floor`, status) VALUES (?,?,?,?,?,?,?)',
      [b.resource_code, b.room_number, b.resource_type, b.building, b.capacity, b.floor, b.status]);
    res.status(201).json({ ok: true });
  } catch (err) { sendError(res, err, 'Failed to add resource'); }
});

app.put('/admin/resources/:code', async (req, res) => {
  try {
    const b = req.body;
    checkResourceBody(b);
    const [r] = await pool.query(
      'UPDATE resource SET room_number=?, resource_type=?, building=?, capacity=?, `floor`=?, status=? WHERE resource_code=?',
      [b.room_number, b.resource_type, b.building, b.capacity, b.floor, b.status, req.params.code]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Resource not found.' });
    res.json({ ok: true });
  } catch (err) { sendError(res, err, 'Failed to update resource'); }
});

// timetable upload: all rows or none
app.post('/admin/timetable', async (req, res) => {
  const rows = req.body.rows;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'No rows to upload.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const deptIds = new Map(); // department_code -> department_id, looked up once each
    for (const t of rows) {
      if (!deptIds.has(t.department_code)) {
        const [d] = await conn.query('SELECT department_id FROM department WHERE department_code = ?', [t.department_code]);
        if (!d.length) throw { status: 400, message: 'Unknown department ' + t.department_code };
        deptIds.set(t.department_code, d[0].department_id);
      }
      const deptId = deptIds.get(t.department_code);
      const args = [t.subject_code, t.day, t.start_time, t.end_time, deptId, t.resource_code];

      const [dup] = await conn.query(
        'SELECT 1 FROM timetable WHERE subject_code = ? AND `day` = ? AND start_time = ? AND end_time = ? AND department_id = ? AND resource_code = ? LIMIT 1', args);
      if (dup.length) {
        throw { status: 409, message: 'Already in the timetable (or repeated in the file): '
          + t.subject_code + ' ' + t.day + ' ' + t.start_time + '-' + t.end_time + ' ' + t.resource_code };
      }
      await conn.query(
        'INSERT INTO timetable (subject_code, `day`, start_time, end_time, department_id, resource_code) VALUES (?,?,?,?,?,?)', args);
    }
    await conn.commit();
    res.status(201).json({ count: rows.length });
  } catch (err) {
    await conn.rollback();
    sendError(res, err, 'Failed to upload timetable');
  } finally { conn.release(); }
});

app.put('/admin/users/:id/role', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = req.body.role;
    if (!['Student', 'Faculty', 'Admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });

    const [u] = await pool.query('SELECT role FROM users WHERE user_id = ?', [id]);
    if (!u.length) return res.status(404).json({ error: 'User not found.' });
    if (u[0].role === 'Admin') return res.status(403).json({ error: 'An admin\'s role cannot be changed.' });
    if (u[0].role === role) return res.json({ ok: true });

    if (u[0].role === 'Student') {
      const [c] = await pool.query('SELECT 1 FROM club WHERE president_user_id = ?', [id]);
      if (c.length) return res.status(409).json({ error: 'This student is a club president. Remove them from the club first.' });
    }
    if (u[0].role === 'Faculty') {
      const [c] = await pool.query('SELECT 1 FROM club WHERE faculty_user_id = ?', [id]);
      if (c.length) return res.status(409).json({ error: 'This faculty member is a club advisor. Remove them from the club first.' });
    }

    await pool.query("UPDATE users SET role = ? WHERE user_id = ? AND role <> 'Admin'", [role, id]);
    res.json({ ok: true });
  } catch (err) { sendError(res, err, 'Failed to change role'); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});