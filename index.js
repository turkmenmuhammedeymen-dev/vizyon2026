const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

// CORS'u manuel ekleyelim (opsiyonel)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

try {
  const api = new ParseServer({
    databaseURI: process.env.DATABASE_URI,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    cloud: './cloud/main.js',
    // Ekstra seçenekler
    allowClientClassCreation: false,
    enableSingleSchemaCache: false,
  });

  app.use('/parse', api.app);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  const port = process.env.PORT || 1337;
  app.listen(port, () => {
    console.log(`Parse Server çalışıyor! Port: ${port}`);
  });
} catch (error) {
  console.error('Parse Server başlatma hatası:', error);
  process.exit(1);
}
