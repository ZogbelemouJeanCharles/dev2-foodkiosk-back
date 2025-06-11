const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./fastfood.db');

router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

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

module.exports = router;
