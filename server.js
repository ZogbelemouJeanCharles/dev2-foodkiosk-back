const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3009;

// Instellen van EJS als template engine
app.set('view engine', 'ejs');

// Static bestanden serveren vanuit 'public' map
app.use(express.static('public'));

// Middleware voor body parsing van formulieren
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Root route - render een EJS view
app.get('/', (req, res) => {
  res.render('index'); // views/index.ejs
});

// POST route voor nieuw menu-item
app.post('/menu', (req, res) => {
  const { name, category, price } = req.body;
  console.log(`Nieuw item ontvangen: ${name}, Categorie: ${category}, Prijs: €${price}`);
  res.send('Menu-item succesvol ontvangen!');
});

// POST route voor Sign In / Sign Up (optioneel)
app.post('/auth', (req, res) => {
  console.log('Authenticatie data:', req.body);
  res.send('Authenticatie succesvol ontvangen!');
});

// Server starten
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
