const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  categoria: {
    type: String,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  estoque: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('produtos', ProductSchema);
