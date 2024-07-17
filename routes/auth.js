const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
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

// Register
router.post("/register", async (req, res) => {
  const { nome, email, celular, username, password, confirmpassword } =
    req.body;

  if (!nome || !email) {
    return res.status(400).json({ message: "Nome e email são obrigatórios" });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ message: "As senhas não coincidem" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "A senha deve ter no mínimo 6 dígitos" });
  }

  try {
    // Verificar se o email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nome,
      email,
      celular,
      username,
      password: hashedPassword,
      cargo: "user", // Garantindo que o cargo seja sempre 'user' ao registrar
    });

    const user = await newUser.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: user._id, cargo: user.cargo },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter dados do perfil do usuário logado
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar dados do perfil do usuário logado
router.put("/profile", authMiddleware, async (req, res) => {
  const { nome, email, celular } = req.body;

  try {
    // Buscar o usuário atual
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verificar se o email já existe para outro usuário
    if (email && email !== currentUser.email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
    }

    const updatedFields = { nome, email, celular };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updatedFields },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Token não informado." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.cargo !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  } catch (err) {
    res.status(400).json({ message: "Token informado não é válido" });
  }
};

// Rota para deletar usuário, acessível apenas por admin
router.delete("/user/:id", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({ message: "Ususário deletado com sucesso !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para atualizar o cargo do usuário, acessível apenas por admin
router.put("/update-cargo/:id", isAdmin, async (req, res) => {
  const { cargo } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { cargo },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar todos os usuários, acessível apenas por admin
router.get("/users", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEÇÃO DE PRODUTOS ================= //

module.exports = router;
