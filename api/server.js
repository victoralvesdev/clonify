const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Configuração do proxy para a RapidAPI
app.use('/api/facebook-ads', createProxyMiddleware({
  target: process.env.NEXT_PUBLIC_RAPIDAPI_URL,
  changeOrigin: true,
  headers: {
    'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
    'X-RapidAPI-Host': process.env.NEXT_PUBLIC_RAPIDAPI_HOST
  }
}));

module.exports = app; 