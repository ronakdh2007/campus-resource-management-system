const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => res.redirect('/pages/login.html'));

app.get('/resources', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resource');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// TEMPORARY until Microsoft login exists: pretend this user is logged in
// 2 = Aarav (club president), 5 = Rohit (faculty), 1 = Meera (admin)
const CURRENT_USER_ID = 1;

async function getCurrentUser() {
  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [CURRENT_USER_ID]);
  return rows[0];
}

// ---------- access control : enforced on the server, not just the frontend ----------
async function attachUser(req, res, next) {
  try {
    req.user = await getCurrentUser();
    if (!req.user) return res.status(401).json({ error: 'Not logged in.' });
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
      [CURRENT_USER_ID]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ---------- my complaints ----------
app.get('/complaints', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT complaint_id, title, description, resource_code, status, created_date, resolved_date
       FROM complaint WHERE user_id = ? ORDER BY created_date DESC`,
      [CURRENT_USER_ID]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// ---------- create a booking ----------
app.post('/bookings', async (req, res) => {
  const { resource_code, booking_date, purpose, slots } = req.body;
  const conn = await pool.getConnection();
  try {
    const user = await getCurrentUser();

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
      [bookingId, CURRENT_USER_ID]
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
      [Number(req.params.id), CURRENT_USER_ID]
    );
    if (result.affectedRows === 0) return res.status(409).json({ error: 'Booking cannot be cancelled.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});