let app;
try {
  app = require('../server.js');
} catch (err) {
  console.error('Vercel Serverless Initialization Error:', err);
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(200).json({ status: 'ok', fallback: true, error: err.message });
  });
}

module.exports = app;
