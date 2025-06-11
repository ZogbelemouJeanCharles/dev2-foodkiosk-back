// API-bestand om routes gescheiden te houden van server.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./fastfood.db');

// Route 1: GET /api/categories API die een lijst categorieën terugstuurt in JSON

router.get('/categories', (req, res) => {
  const categories = ['Gerecht', 'Drank', 'D essert'];
  res.json(categories);
});

// Route 2: GET /api/products  Alle producten ophalen (uit de database)
// SQL SELECT wordt uitgevoerd en het resultaat wordt teruggestuurd als JSON
router.get('/products', (req, res) => {
  db.all('SELECT * FROM producten', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Route 3: POST /api/order Bestelling plaatsen  
// Dit wordt getest met Postman (je stuurt JSON met klant en producten)

router.post('/order', (req, res) => {
  console.log("➡️ POST /api/order werd aangeroepen");
  console.log('📦 Data ontvangen:', req.body);

  const { items, klant } = req.body;
  res.json({ success: true, message: 'Bestelling geplaatst!' });
});

module.exports = router;
