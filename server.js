require('dotenv').config(); // C'est la première ligne du fichier !

const express = require('express');
const app = express(); // C'est la SEULE et UNIQUE DÉCLARATION de 'app'

const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');

// --- DÉBUT DES MODIFICATIONS POUR POSTGRESQL ---
const { Pool } = require('pg'); // <-- 1. Importez le module pg

// Récupérer l'URL de la base de données depuis les variables d'environnement Vercel
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Erreur: La variable d\'environnement DATABASE_URL n\'est pas définie.');
    // Pour les tests locaux SANS variable d'environnement, vous pouvez la définir manuellement ici:
    // REMPLACEZ PAR VOTRE VRAIE CHAÎNE DE CONNEXION SUPABASE
    // connectionString = 'postgresql://postgres:VOTRE_MOT_DE_PASSE@db.VOTRE_ENDPOINT.supabase.co:5432/postgres';
    process.exit(1); // Arrête l'application si la DB n'est pas configurée
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Très souvent nécessaire pour se connecter à des services cloud comme Supabase
    }
});

// Test de connexion (optionnel, mais utile pour vérifier que la DB est accessible)
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erreur de connexion à la base de données PostgreSQL:', err.stack);
    } else {
        console.log('Connecté à PostgreSQL ! Heure du serveur DB:', res.rows[0].now);
    }
});

// Rendre le pool de connexion PostgreSQL disponible pour vos routes
app.locals.db = pool; // <-- 2. Passez le pool de connexion à vos routes via app.locals
// --- FIN DES MODIFICATIONS POUR POSTGRESQL ---

// Lignes SQLite - elles sont maintenant inutiles et peuvent être supprimées/restées commentées
//const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database('./fastfood.db');

const port = process.env.PORT || 3009; // Votre ligne est correcte pour Vercel

// Layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');


// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const menuRoutes = require('./routes/menu'); // NA express app
app.use('/', menuRoutes);

// Start
app.listen(port, () => {
    console.log(`🚀 Server draait op http://localhost:${port}`);
});

// Optionnel: Gérer la fermeture propre de la connexion à la DB en cas d'arrêt du serveur
process.on('SIGINT', async () => {
    console.log('Fermeture du serveur...');
    await pool.end(); // Ferme toutes les connexions du pool PostgreSQL
    console.log('Connexions PostgreSQL fermées.');
    process.exit(0);
});