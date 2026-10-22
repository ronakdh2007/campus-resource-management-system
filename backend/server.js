const express = require('express');
const pool = require('./db');

const app = express();

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