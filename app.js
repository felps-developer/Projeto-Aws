require('dotenv').config({ override: true });

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  console.error('Defina SUPABASE_URL no arquivo .env (veja .env.example)');
  process.exit(1);
}

if (!SUPABASE_KEY) {
  console.error('Defina SUPABASE_KEY no arquivo .env (veja .env.example)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(
  cors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('API de produtos — Supabase OK');
});

app.get('/products', async (req, res) => {
  const { data, error } = await supabase.from('products').select();

  if (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data ?? []);
});

app.get('/products/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select()
    .eq('id', req.params.id);

  if (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  res.json(data[0]);
});

app.post('/products', async (req, res) => {
  const { name, description, price } = req.body;

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description: description ?? '',
      price: Number(price),
    })
    .select();

  if (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

app.put('/products/:id', async (req, res) => {
  const { name, description, price } = req.body;

  const { data, error } = await supabase
    .from('products')
    .update({
      name,
      description: description ?? '',
      price: Number(price),
    })
    .eq('id', req.params.id)
    .select();

  if (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  res.json(data[0]);
});

app.delete('/products/:id', async (req, res) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    console.error('Erro ao deletar produto:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Produto removido com sucesso' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`> API rodando em http://localhost:${PORT}`);
  console.log('> Deixe este terminal aberto. Para parar: Ctrl+C');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} em uso. Altere PORT no .env ou encerre o outro processo.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
