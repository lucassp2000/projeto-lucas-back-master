const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const User = require('../models/User');

router.get('/dashboard', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();

    res.json({
      productCount,
      userCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

module.exports = router;
