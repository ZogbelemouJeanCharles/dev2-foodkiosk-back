const express = require('express');
const router = express.Router();
// --- Lignes SQLite à supprimer/commenter - PLUS BESOIN ! ---
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
router.get('/', async (req, res) => {
    try {
        const result = await req.dbPool.query('SELECT * FROM producten');
        res.render('index', { producten: result.rows });
    } catch (err) {
        console.error('Erreur lors de la récupération des produits pour la page d\'accueil:', err.message);
        res.status(500).send('Database fout');
    }
});

// POST nieuw item
// POST nieuw item
router.post('/menu', upload.single('image'), async (req, res) => {
    const { name, category, price, available_date } = req.body;
    // --- MODIFICATION TRÈS IMPORTANTE ICI ---
    // Si pas de fichier, imagePath sera une chaîne vide, pas null
    const imagePath = req.file ? '/uploads/' + req.file.filename : ''; 
    // --- FIN DE LA MODIFICATION ---

    // Si available_date est vide, utilise la date d'aujourd'hui (format ISO pour PostgreSQL)
    const formattedDate = available_date ? available_date : new Date().toISOString(); 

    try {
        const query = `INSERT INTO producten (naam, categorie, prijs, datum, afbeelding) VALUES ($1, $2, $3, ($4)::timestamp, $5) RETURNING id`; // Added ::timestamp cast for extra safety
        // Utilise formattedDate et imagePath
        const params = [name, category, price, formattedDate, imagePath]; 

        const result = await req.dbPool.query(query, params);
        const newProductId = result.rows[0].id;
        console.log(`✅ Nieuw product toegevoegd met ID ${newProductId}`);
        res.redirect('/');
    } catch (err) {
        console.error('❌ Fout bij opslaan nieuw product:', err.message);
        res.status(500).send('Fout bij opslaan');
    }
});

// POST update item
// POST update item
router.post('/menu/edit', upload.single('image'), async (req, res) => {
    const { id, name, category, price, available_date } = req.body;

    // --- MODIFICATION ICI pour l'image ---
    // Si pas de fichier, imagePath sera une chaîne vide, pas null
    const imagePath = req.file ? '/uploads/' + req.file.filename : '';
    // --- FIN MODIFICATION ---
    console.log(`🔍 ID reçu pour l'édition : ${id}`);
    // (La ligne pour la date est déjà corrigée)
    const formattedDate = available_date ? available_date : new Date().toISOString();

    let query;
    let params;

    if (imagePath) { // Si une NOUVELLE image a été uploadée
        query = `UPDATE producten SET naam = $1, categorie = $2, prijs = $3, datum = $4, afbeelding = $5 WHERE id = $6`;
        params = [name, category, price, formattedDate, imagePath, id];
    } else { // Si aucune nouvelle image n'a été uploadée
       
        query = `UPDATE producten SET naam = $1, categorie = $2, prijs = $3, datum = $4, afbeelding = $5 WHERE id = $6`;
        params = [name, category, price, formattedDate, imagePath, id]; // imagePath sera '' ici
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
router.post('/bestelling', async (req, res) => {
    const { totaalbedrag, gebruiker_id, items } = req.body;

    if (!totaalbedrag) {
        return res.status(400).send('Totaalbedrag ontbreekt');
    }

    const currentGebruikerId = gebruiker_id || 1;
    const besteldatum = new Date().toISOString(); // Variable JavaScript, c'est OK

    try {
        // CORRECTION MAJEURE ICI : 'besteldatum' -> 'datum' dans la requête SQL
        const insertBestellingQuery = `INSERT INTO bestellingen (gebruiker_id, datum, status, totaalbedrag) VALUES ($1, $2, $3, $4) RETURNING id`;
        const bestellingResult = await req.dbPool.query(insertBestellingQuery, [currentGebruikerId, besteldatum, 'pending', totaalbedrag]);
        const bestellingId = bestellingResult.rows[0].id;
        console.log(`✅ Bestelling opgeslagen met ID ${bestellingId}`);

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
router.get('/dashboard', async (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // Format 'YYYY-MM-DD'

    // CORRECTION MAJEURE ICI : Toutes les références à 'besteldatum' sont remplacées par 'datum'
    // et les fonctions de date sont adaptées à PostgreSQL.
    const queryVandaag = `SELECT COUNT(*) AS aantal FROM bestellingen WHERE datum::date = $1`;
    const queryMaand = `SELECT TO_CHAR(datum, 'MM') AS maand, COUNT(*) AS aantal FROM bestellingen GROUP BY TO_CHAR(datum, 'MM') ORDER BY maand`;
    const queryOmzet = `SELECT TO_CHAR(datum, 'YYYY') AS jaar, SUM(totaalbedrag) AS omzet FROM bestellingen GROUP BY TO_CHAR(datum, 'YYYY') ORDER BY jaar`;

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
        console.error('❌ Fout bij ophalen dashboard data (PostgreSQL):', err.message);
        res.status(500).send(`Fout bij ophalen dashboard data: ${err.message}`);
    }
});

// GET bestelling detail
router.get('/bestelling/:id', async (req, res) => {
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