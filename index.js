const express = require("express");
  const app = express();

  app.get("/", function(req, res) {
      res.send("<h1>Bem vindo ao meu site!</h1>");
  });

  app.get("/produtos", function(req, res) {
      res.send("<h1>Lista de Produtos!</h1>");
  });

  // CORRIGIDO: resposta agora em HTML
  app.get("/consulta/:parametro", function(req, res) {
      res.send("<h1>Resultado da consulta: " + req.params.parametro + "</h1>");
  });

  // Em versões novas do path-to-regexp, parâmetro opcional usa chaves
  app.get("/cadastro{/:nome}", function(req, res) {
      var nome = req.params.nome;
      if (nome) {
          res.send("<h1>Produto " + nome + " criado!</h1>");
      } else {
          res.send("<h1>Produto criado!</h1>");
      }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
  });