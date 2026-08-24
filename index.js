const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

try {
  const api = new ParseServer({
    databaseURI: process.env.MONGODB_URI,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    // ★ DÜZELTİLDİ: Sunucu içinde localhost kullan
    serverURL: process.env.SERVER_URL || 'http://localhost:10000/parse',
    cloud: './main.js'
  });

  app.use('/parse', api);

  const port = process.env.PORT || 10000;
  app.listen(port, () => {
    console.log(`✅ Parse Server çalışıyor! Port: ${port}`);
    console.log(`📡 Server URL: ${process.env.SERVER_URL || 'http://localhost:'+port+'/parse'}`);
  });
} catch (error) {
  console.error('❌ Parse Server hatası:', error);
  process.exit(1);
}
