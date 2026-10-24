const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});