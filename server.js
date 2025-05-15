const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');


const app = express();
const port = 3009;

// EJS instellen als template engine
app.set('view engine', 'ejs');
app.set('views', './views'); // <-- voeg dit toe!

// Database verbinding
const db = new sqlite3.Database('./fastfood.db');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });


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

app.post('/menu', upload.single('image'), (req, res) => {
  const { name, category, price, available_date } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;

  db.run(
    `INSERT INTO producten (naam, categorie, prijs, datum, afbeelding) VALUES (?, ?, ?, ?, ?)`,
    [name, category, price, available_date, imagePath],
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


// Start server
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});


