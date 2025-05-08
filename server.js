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

// Start server
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
