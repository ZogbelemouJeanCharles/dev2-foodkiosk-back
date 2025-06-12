const express = require('express');
const app = express(); // MOET bovenaan
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');

//const port = 3009;

const sqlite3 = require('sqlite3').verbose();
// Ouvre la base de données en mode lecture seule
const db = new sqlite3.Database('./fastfood.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        // En cas d'erreur, affichez un message pour le débogage dans les logs Vercel
        console.error('Erreur lors de l\'ouverture de la base de données en mode lecture seule:', err.message);
        // Vous pouvez décider de faire un process.exit(1) ici pour arrêter l'appli si la DB ne s'ouvre pas du tout
        // Ou simplement laisser l'appli essayer de continuer si elle n'a pas besoin de la DB immédiatement
    } else {
        console.log('Base de données fastfood.db ouverte avec succès en mode lecture seule.');
    }
});


const port = process.env.PORT || 3009;

// Layout
app.set('view engine', 'ejs');
app.set('views', './views');
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
