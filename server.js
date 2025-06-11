const express = require('express');
const app = express(); // MOET bovenaan
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');
const sqlite3 = require('sqlite3').verbose();
const port = 3009;



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
