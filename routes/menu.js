const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./fastfood.db');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// LOG ALLE REQUESTS
router.use((req, res, next) => {
  console.log(`➡️ MENU ROUTE: ${req.method} ${req.url}`);
  next();
});

// GET homepage
router.get('/', (req, res) => {
  db.all('SELECT * FROM producten', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database fout');
    }
    res.render('index', { producten: rows });
  });
});

// POST nieuw item
router.post('/menu', upload.single('image'), (req, res) => {
  const { name, category, price, available_date } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;

  db.run(
    `INSERT INTO producten (naam, categorie, prijs, datum, afbeelding) VALUES (?, ?, ?, ?, ?)`,
    [name, category, price, available_date, imagePath],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Fout bij opslaan');
      }
      console.log(`✅ Nieuw product toegevoegd met ID ${this.lastID}`);
      res.redirect('/');
    }
  );
});

// POST update item
router.post('/menu/edit', upload.single('image'), (req, res) => {
  const { id, name, category, price, available_date } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;

  const query = imagePath
    ? `UPDATE producten SET naam = ?, categorie = ?, prijs = ?, datum = ?, afbeelding = ? WHERE id = ?`
    : `UPDATE producten SET naam = ?, categorie = ?, prijs = ?, datum = ? WHERE id = ?`;

  const params = imagePath
    ? [name, category, price, available_date, imagePath, id]
    : [name, category, price, available_date, id];

  db.run(query, params, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Fout bij updaten');
    }
    console.log(`✅ Product ${id} aangepast`);
    res.redirect('/');
  });
});

router.post('/bestelling', (req, res) => {
  const { totaalbedrag } = req.body;

  if (!totaalbedrag) {
    return res.status(400).send('Totaalbedrag ontbreekt');
  }

  const datum = new Date().toISOString(); // bv. "2025-06-08T10:00:00Z"

  db.run(
    'INSERT INTO bestellingen (datum, totaalbedrag) VALUES (?, ?)',
    [datum, totaalbedrag],
    function (err) {
      if (err) {
        console.error('❌ Fout bij opslaan bestelling:', err.message);
        return res.status(500).send('Fout bij opslaan bestelling');
      }
      console.log(`✅ Bestelling opgeslagen met ID ${this.lastID}`);
      res.redirect('/');
    }
  );
});


router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  const queryVandaag = `SELECT COUNT(*) AS aantal FROM bestellingen WHERE DATE(datum) = ?`;
  const queryMaand = `SELECT strftime('%m', datum) AS maand, COUNT(*) AS aantal FROM bestellingen GROUP BY maand`;
  const queryOmzet = `SELECT strftime('%Y', datum) AS jaar, SUM(totaalbedrag) AS omzet FROM bestellingen GROUP BY jaar`;

  db.serialize(() => {
    db.get(queryVandaag, [today], (err, resultVandaag) => {
      if (err) return res.status(500).send('Fout bij vandaag');

      db.all(queryMaand, [], (err, resultatenMaand) => {
        if (err) return res.status(500).send('Fout bij maand');

        db.all(queryOmzet, [], (err, resultatenOmzet) => {
          if (err) return res.status(500).send('Fout bij omzet');

          res.render('dashboard', {
            vandaag: resultVandaag.aantal,
            maandData: resultatenMaand,
            omzetData: resultatenOmzet,
          });
        });
      });
    });
  });
});

router.get('/bestelling/:id', (req, res) => {
  const id = req.params.id;

  const bestellingQuery = `SELECT * FROM bestellingen WHERE id = ?`;
  const productenQuery = `
    SELECT p.naam, p.prijs, bp.aantal
    FROM bestelling_producten bp
    JOIN producten p ON bp.product_id = p.id
    WHERE bp.bestelling_id = ?
  `;

  db.get(bestellingQuery, [id], (err, bestelling) => {
    if (err || !bestelling) return res.status(404).send('Bestelling niet gevonden');

    db.all(productenQuery, [id], (err, producten) => {
      if (err) return res.status(500).send('Fout bij ophalen producten');

      res.render('bestellingDetail', {
        bestelling,
        producten
      });
    });
  });
});



module.exports = router;
