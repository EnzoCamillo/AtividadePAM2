"use strict";
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { selectFull, selectById, deleteById, insertCliente, updateCliente } = require("./conf/autenticacao"); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  try {
    const data = await selectFull();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// rota para buscar cliente por ID
app.get("/clientes/:id", async (req, res) => {
  try {
    const data = await selectById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

// rota para criar cliente
app.post("/clientes", async (req, res) => {
  try {
    const { Nome, Idade, UF } = req.body;
    await insertCliente(Nome, Idade, UF);
    res.status(201).json({ message: "Cliente criado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

// rota para atualizar cliente
app.put("/clientes/:id", async (req, res) => {
  try {
    const { Nome, Idade, UF } = req.body;
    await updateCliente(Nome, Idade, UF, req.params.id);
    res.json({ message: "Cliente atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

// rota para deletar cliente
app.delete("/clientes/:id", async (req, res) => {
  try {
    const ok = await deleteById(req.params.id);
    if (ok) {
      res.json({ message: "Cliente deletado com sucesso" });
    } else {
      res.status(404).json({ error: "Cliente não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

// inicia o servidor
app.listen(3000, () => {
  console.log("API rodando em http://localhost:3000");
});
