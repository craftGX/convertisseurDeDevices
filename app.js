require("dotenv").config(); // Pour charger les variables d'environnement
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// ✅ Récupérer la liste des devises disponibles
const getCurrencies = async () => {
  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/latest/USD`
    );
    return Object.keys(response.data.conversion_rates);
  } catch (error) {
    console.error("Erreur lors de la récupération des devises :", error.message);
    return [];
  }
};

// ✅ Récupérer l'historique des taux de change
const getHistoricalRates = async (from, to) => {
  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/history/${from}`
    );
    const rates = response.data.conversion_rates[to];
    return rates;
  } catch (error) {
    console.error("Erreur lors de la récupération des taux historiques :", error.message);
    return [];
  }
};

// ✅ Route principale pour afficher le formulaire
app.get("/", async (req, res) => {
  const currencies = await getCurrencies();
  res.render("index", {
    currencies,
    result: null,
    from: null,
    to: null,
    amount: null,
    error: null, // 👉 On initialise error à `null` pour éviter l'erreur
  });
});

// ✅ Route POST pour la conversion
app.post("/convert", async (req, res) => {
  const { from, to, amount } = req.body;

  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/latest/${from}`
    );
    const rate = response.data.conversion_rates[to];
    if (!rate) throw new Error(`Impossible de convertir de ${from} vers ${to}`);

    const result = (amount * rate).toFixed(2);
    res.render("index", {
      currencies: await getCurrencies(),
      result: `${amount} ${from} = ${result} ${to}`,
      from,
      to,
      amount,
      error: null, // ✅ Pas d'erreur, donc error = null
    });
  } catch (error) {
    console.error("Erreur lors de la conversion :", error.message);
    res.render("index", {
      currencies: await getCurrencies(),
      error: error.message, // ✅ On passe le message d'erreur dans `error`
      result: null,
      from,
      to,
      amount,
    });
  }
});

// ✅ Route pour récupérer les données historiques en JSON (pour le graphique)
app.get("/history", async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Les paramètres "from" et "to" sont requis.' });
  }

  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.API_KEY}/history/${from}`
    );
    const rates = response.data.conversion_rates[to];

    res.json(rates);
  } catch (error) {
    console.error("Erreur lors de la récupération des taux historiques :", error.message);
    res.status(500).json({ error: "Erreur lors de la récupération des données." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
