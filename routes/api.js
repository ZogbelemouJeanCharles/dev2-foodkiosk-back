// API-bestand om routes gescheiden te houden van server.js
const express = require('express');
const router = express.Router();

// --- Lignes SQLite à supprimer/commenter ---
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('./fastfood.db');
// --- FIN Lignes SQLite ---

// Middleware pour récupérer le pool de connexion DB
router.use((req, res, next) => {
    // Le pool de connexion est attaché à app.locals.db dans server.js
    // On le rend disponible dans la requête pour toutes les routes de ce router
    req.dbPool = req.app.locals.db;
    next();
});

// Route 1: GET /api/categories API die een lijst categorieën terugstuurt in JSON
// Cette route ne dépend pas de la DB, donc pas de changement majeur
router.get('/categories', (req, res) => {
    const categories = ['Gerecht', 'Drank', 'Dessert']; // Ces catégories sont "hardcodées"
    res.json(categories);
});

// Route 2: GET /api/products  Alle producten ophalen (uit de database)
// SQL SELECT wordt uitgevoerd en het resultaat wordt teruggestuurd als JSON
router.get('/products', async (req, res) => { // Ajout de 'async'
    try {
        const result = await req.dbPool.query('SELECT * FROM producten'); // Utilisation de req.dbPool.query
        res.json(result.rows); // Les résultats sont dans result.rows pour pg
    } catch (err) {
        console.error('Erreur lors de la récupération des produits:', err.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
    }
});

// Route 3: POST /api/order Bestelling plaatsen  
// Ceci est un exemple de route POST. Elle ne fait rien d'autre que logger et renvoyer un succès.
// Si vous aviez l'intention d'insérer dans la DB ici, il faudrait ajouter le code d'insertion.
router.post('/order', (req, res) => {
    console.log("➡️ POST /api/order werd aangeroepen");
    console.log('📦 Data ontvangen:', req.body);

    const { items, klant } = req.body;
    // Si vous aviez l'intention d'insérer ici (par ex. dans une table `bestellingen` pour l'API)
    // vous feriez une insertion ici comme dans menu.js pour bestellingen.
    res.json({ success: true, message: 'Bestelling geplaatst!' });
});

module.exports = router;