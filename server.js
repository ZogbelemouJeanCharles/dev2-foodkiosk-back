const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3009;

// Static bestend bedienen (HTML, CSS, JS) vanuit de map 'public'
app.use(express.static('public'));

// Middleware voor body parsing van formulieren (URL encoded en JSON)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// De rootroute, hier wordt de index-pagina bediend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // Verwijs naar het HTML-bestand in de map 'public'
});

// Route voor het toevoegen van menu-items via een POST-aanroep
app.post('/menu', (req, res) => {
  const { name, category, price } = req.body;
  console.log(`Nieuw item ontvangen: ${name}, Categorie: ${category}, Prijs: €${price}`);
  res.send('Menu-item succesvol ontvangen!');
});

// Server starten
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
