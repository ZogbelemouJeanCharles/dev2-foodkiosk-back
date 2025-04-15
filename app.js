const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index'); 
});

app.post('/menu', (req, res) => {
    console.log('Nieuw item ontvangen:', req.body);
    res.send('Menu-item succesvol ontvangen!'); 
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
});
