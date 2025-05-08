const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./fastfood.db');

// Route 1: GET /api/categories
router.get('/categories', (req, res) => {
  const categories = ['Gerecht', 'Drank', 'Dessert'];
  res.json(categories);
});

// Route 2: GET /api/products
router.get('/products', (req, res) => {
  db.all('SELECT * FROM producten', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Route 3: POST /api/order
router.post('/order', (req, res) => {
  console.log("➡️ POST /api/order werd aangeroepen");
  console.log('📦 Data ontvangen:', req.body);

  const { items, klant } = req.body;
  res.json({ success: true, message: 'Bestelling geplaatst!' });
});

module.exports = router;
