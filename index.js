const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const cors = require('cors');

const app = express();
app.use(cors()); // Tüm isteklere izin ver

try {
  const api = new ParseServer({
    databaseURI: process.env.DATABASE_URI,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    cloud: './cloud/main.js',
    allowClientClassCreation: true,
    enableAnonymousUsers: true,
    allowCustomObjectId: true
  });

  app.use('/parse', api.app);

  // Health check endpoint'i
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  const port = process.env.PORT || 1337;
  app.listen(port, () => {
    console.log(`✅ Parse Server çalışıyor! Port: ${port}`);
  });
} catch (error) {
  console.error('❌ Parse Server başlatma hatası:', error);
  process.exit(1);
}
