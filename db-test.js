const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./fastfood.db');

db.all("SELECT * FROM producten", [], (err, rows) => {
  if (err) throw err;
  console.log("🧾 Alle producten:");
  console.log(rows);
});
