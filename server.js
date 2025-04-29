const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./fastfood.db');

// Tabel producten aanmaken als hij nog niet bestaat
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS producten (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naam TEXT NOT NULL,
    categorie TEXT NOT NULL,
    prijs REAL NOT NULL,
    datum TEXT
  )`);
});

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3009;

// Instellen van EJS als template engine
app.set('view engine', 'ejs');

// Static bestanden serveren vanuit 'public' map
app.use(express.static('public'));

// Middleware voor body parsing van formulieren
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Root route - haalt producten uit database en render EJS view
app.get('/', (req, res) => {
  db.all('SELECT * FROM producten', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database fout');
    } else {
      res.render('index', { producten: rows });
    }
  });
});

// POST route voor nieuw menu-item
app.post('/menu', (req, res) => {
  const { name, category, price, available_date } = req.body;
  db.run(`INSERT INTO producten (naam, categorie, prijs, datum) VALUES (?, ?, ?, ?)`,
    [name, category, price, available_date],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Fout bij opslaan in database');
      }
      console.log(`Nieuw product toegevoegd met ID ${this.lastID}`);
      res.redirect('/');
    });
});

// POST route voor Sign In / Sign Up (optioneel)
app.post('/auth', (req, res) => {
  console.log('Authenticatie data:', req.body);
  res.send('Authenticatie succesvol ontvangen!');
});

// Server starten
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
