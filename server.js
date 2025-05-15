const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3009;

// EJS instellen als template engine
app.set('view engine', 'ejs');
app.set('views', './views'); // <-- voeg dit toe!

// Database verbinding
const db = new sqlite3.Database('./fastfood.db');

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// API-routes koppelen
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Homepagina met dynamische data uit DB
app.get('/', (req, res) => {
  db.all('SELECT * FROM producten', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database fout');
    } else {
      res.render('index', { producten: rows }); // ✅ index.ejs in /views/
    }
  });
});

app.post('/menu', (req, res) => {
  const { name, category, price, available_date } = req.body;
  db.run(
    `INSERT INTO producten (naam, categorie, prijs, datum) VALUES (?, ?, ?, ?)`,
    [name, category, price, available_date],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Fout bij opslaan in database');
      }
      console.log(`Nieuw product toegevoegd met ID ${this.lastID}`);
      res.redirect('/');
    }
  );
});

app.post('/menu/edit', (req, res) => {
  const { id, name, category, price, available_date } = req.body;
  db.run(
    `UPDATE producten SET naam = ?, categorie = ?, prijs = ?, datum = ? WHERE id = ?`,
    [name, category, price, available_date, id],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Fout bij bewerken in database');
      }
      console.log(`Product met ID ${id} bewerkt.`);
      res.redirect('/');
    }
  );
});

// Start server
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});


