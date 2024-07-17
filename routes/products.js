const express = require("express");
const jwt = require("jsonwebtoken");
const Product = require("../models/Products");
const router = express.Router();

// Middleware para verificar o token JWT e extrair os dados do usuário
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Token não informado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Token não é válido" });
  }
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  console.log(req.user)
  if (req.user.cargo !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }
  next();
};

router.post("/", [authMiddleware, isAdmin], async (req, res) => {
  const { nome, categoria, valor, estoque } = req.body;

  if (!nome || !categoria || !valor || !estoque) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  try {
    const newProduct = new Product({
      nome,
      categoria,
      valor,
      estoque,
    });

    const product = await newProduct.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar produto
router.put("/:id", [authMiddleware, isAdmin], async (req, res) => {
  const { nome, categoria, valor, estoque } = req.body;

  const updatedFields = { nome, categoria, valor, estoque };

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ver produto por ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar produto, acessível apenas por admin
router.delete("/:id", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }
    res.json({ message: "Produto deletado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar todos os produtos, acessível apenas por admin
router.get("/", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
