const pool = require('./db');

async function main() {
  const [rows] = await pool.query(
    'SELECT resource_code, building, capacity FROM resource'
  );
  console.log(rows);
  await pool.end();
}

main();