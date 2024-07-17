const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const dashboardRoutes = require("./routes/dashboard"); // Adicione esta linha

dotenv.config();

const app = express();

app.use(express.json());

const corsOptions = {
  origin: 'https://meugerenciamento.vercel.app', // Substitua pelo domínio que você quer permitir
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Conectar ao banco de dados
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error(err);
  });

// Usar rotas
app.use("/api/v1", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1", dashboardRoutes); // Adicione esta linha

// Welcome route
app.get("/api/v1", (req, res) => {
  res.send("Seja bem-vindo!");
});

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
