const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;


app.use(bodyParser.json());


app.post('/add-item', (req, res) => {
  const { name, category, price } = req.body;
  console.log(`Nieuw item toegevoegd: ${name}, Categorie: ${category}, Prijs: €${price}`);
  res.status(200).json({ message: 'Item toegevoegd!' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
