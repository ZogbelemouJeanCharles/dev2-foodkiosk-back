const express = require('express');
const router = express.Router();
// --- Lignes SQLite à supprimer/commenter ---
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('./fastfood.db');
// --- FIN Lignes SQLite ---
const multer = require('multer');
const path = require('path');

// Multer setup - PAS DE CHANGEMENT ICI, c'est pour la gestion des fichiers locaux
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
    // Le pool de connexion est attaché à app.locals.db dans server.js
    // On le rend disponible dans la requête pour toutes les routes de ce router
    req.dbPool = req.app.locals.db; // AJOUTEZ CETTE LIGNE
    next();
});

// GET homepage
router.get('/', async (req, res) => { // Ajout de 'async'
    try {
        const result = await req.dbPool.query('SELECT * FROM producten'); // Utilisation de req.dbPool.query
        res.render('index', { producten: result.rows }); // Les résultats sont dans result.rows
    } catch (err) {
        console.error('Erreur lors de la récupération des produits pour la page d\'accueil:', err.message);
        res.status(500).send('Database fout');
    }
});

// POST nieuw item
router.post('/menu', upload.single('image'), async (req, res) => { // Ajout de 'async'
    const { name, category, price, available_date } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    try {
        // Attention: PostgreSQL utilise $1, $2, etc. pour les paramètres
        const query = `INSERT INTO producten (naam, categorie, prijs, datum, afbeelding) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const params = [name, category, price, available_date, imagePath];

        const result = await req.dbPool.query(query, params);
        const newProductId = result.rows[0].id; // Récupère l'ID du produit inséré
        console.log(`✅ Nieuw product toegevoegd met ID ${newProductId}`);
        res.redirect('/');
    } catch (err) {
        console.error('❌ Fout bij opslaan nieuw product:', err.message);
        res.status(500).send('Fout bij opslaan');
    }
});

// POST update item
router.post('/menu/edit', upload.single('image'), async (req, res) => { // Ajout de 'async'
    const { id, name, category, price, available_date } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    let query;
    let params;

    if (imagePath) {
        query = `UPDATE producten SET naam = $1, categorie = $2, prijs = $3, datum = $4, afbeelding = $5 WHERE id = $6`;
        params = [name, category, price, available_date, imagePath, id];
    } else {
        query = `UPDATE producten SET naam = $1, categorie = $2, prijs = $3, datum = $4 WHERE id = $5`;
        params = [name, category, price, available_date, id];
    }

    try {
        await req.dbPool.query(query, params);
        console.log(`✅ Product ${id} aangepast`);
        res.redirect('/');
    } catch (err) {
        console.error('❌ Fout bij updaten product:', err.message);
        res.status(500).send('Fout bij updaten');
    }
});

// POST nouvelle bestelling
router.post('/bestelling', async (req, res) => { // Ajout de 'async'
    const { totaalbedrag, gebruiker_id, items } = req.body; // J'ai ajouté gebruiker_id et items, car une bestelling complète inclut ces éléments.

    if (!totaalbedrag) {
        return res.status(400).send('Totaalbedrag ontbreekt');
    }

    // Assurez-vous d'avoir un gebruiker_id valide ou gérez le cas où il n'y en a pas.
    // Pour cet exemple, je suppose que c'est soit fourni, soit une valeur par défaut.
    const currentGebruikerId = gebruiker_id || 1; // Exemple: utilisez un ID par défaut si non fourni
    const besteldatum = new Date().toISOString();
    const status = 'pending'; // Définissez un statut par défaut

    try {
        // Insertion de la bestelling
        const insertBestellingQuery = `INSERT INTO bestellingen (gebruiker_id, besteldatum, status, totaalbedrag) VALUES ($1, $2, $3, $4) RETURNING id`;
        const bestellingResult = await req.dbPool.query(insertBestellingQuery, [currentGebruikerId, besteldatum, status, totaalbedrag]);
        const bestellingId = bestellingResult.rows[0].id;
        console.log(`✅ Bestelling opgeslagen met ID ${bestellingId}`);

        // Si vous avez des items dans la commande, insérez-les dans bestelling_producten
        if (items && Array.isArray(items) && items.length > 0) {
            for (const item of items) {
                const insertBestellingProductenQuery = `INSERT INTO bestelling_producten (bestelling_id, product_id, aantal) VALUES ($1, $2, $3)`;
                await req.dbPool.query(insertBestellingProductenQuery, [bestellingId, item.product_id, item.aantal]);
            }
            console.log(`✅ Détails de la bestelling ajoutés pour la commande ${bestellingId}`);
        }

        res.redirect('/');
    } catch (err) {
        console.error('❌ Fout bij opslaan bestelling:', err.message);
        res.status(500).send('Fout bij opslaan bestelling');
    }
});


// GET dashboard
router.get('/dashboard', async (req, res) => { // Ajout de 'async'
    const today = new Date().toISOString().split('T')[0]; // Format 'YYYY-MM-DD'

    // Requêtes SQL pour PostgreSQL.
    // Les fonctions de date/heure changent de SQLite à PostgreSQL.
    // DATE(datum) en SQLite devient DATE(datum) ou `date_trunc('day', datum)` en Postgres.
    // strftime('%m', datum) devient EXTRACT(MONTH FROM datum) ou TO_CHAR(datum, 'MM').
    // strftime('%Y', datum) devient EXTRACT(YEAR FROM datum) ou TO_CHAR(datum, 'YYYY').

    // Pour `DATE(datum) = ?` -> `datum::date = $1` ou `CAST(datum AS DATE) = $1`
    const queryVandaag = `SELECT COUNT(*) AS aantal FROM bestellingen WHERE datum::date = $1`;
    // Pour `strftime('%m', datum) AS maand` -> `EXTRACT(MONTH FROM besteldatum) AS maand`
    const queryMaand = `SELECT EXTRACT(MONTH FROM besteldatum) AS maand, COUNT(*) AS aantal FROM bestellingen GROUP BY EXTRACT(MONTH FROM besteldatum) ORDER BY maand`;
    // Pour `strftime('%Y', datum) AS jaar` -> `EXTRACT(YEAR FROM besteldatum) AS jaar`
    const queryOmzet = `SELECT EXTRACT(YEAR FROM besteldatum) AS jaar, SUM(totaalbedrag) AS omzet FROM bestellingen GROUP BY EXTRACT(YEAR FROM besteldatum) ORDER BY jaar`;

    try {
        const resultVandaag = await req.dbPool.query(queryVandaag, [today]);
        const resultatenMaand = await req.dbPool.query(queryMaand);
        const resultatenOmzet = await req.dbPool.query(queryOmzet);

        res.render('dashboard', {
            vandaag: resultVandaag.rows[0].aantal,
            maandData: resultatenMaand.rows,
            omzetData: resultatenOmzet.rows,
        });
    } catch (err) {
        console.error('❌ Fout bij ophalen dashboard data:', err.message);
        res.status(500).send('Fout bij dashboard data');
    }
});

// GET bestelling detail
router.get('/bestelling/:id', async (req, res) => { // Ajout de 'async'
    const id = req.params.id;

    const bestellingQuery = `SELECT * FROM bestellingen WHERE id = $1`;
    const productenQuery = `
        SELECT p.naam, p.prijs, bp.aantal
        FROM bestelling_producten bp
        JOIN producten p ON bp.product_id = p.id
        WHERE bp.bestelling_id = $1
    `;

    try {
        const bestellingResult = await req.dbPool.query(bestellingQuery, [id]);
        const bestelling = bestellingResult.rows[0];

        if (!bestelling) {
            return res.status(404).send('Bestelling niet gevonden');
        }

        const productenResult = await req.dbPool.query(productenQuery, [id]);
        const producten = productenResult.rows;

        res.render('bestellingDetail', {
            bestelling,
            producten
        });
    } catch (err) {
        console.error('❌ Fout bij ophalen bestelling details:', err.message);
        res.status(500).send('Fout bij ophalen bestelling details');
    }
});


module.exports = router;