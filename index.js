const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

try {
  const api = new ParseServer({
    // ★ DİKKAT: MONGODB_URI kullanıyoruz, DATABASE_URI değil!
    databaseURI: process.env.MONGODB_URI,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    // ★ main.js ana dizinde, cloud klasörü yok
    cloud: './main.js'
  });

  // Parse Server'ı /parse yoluna bağla
  app.use('/parse', api.app);

  const port = process.env.PORT || 1337;
  app.listen(port, () => {
    console.log(`✅ Parse Server çalışıyor! Port: ${port}`);
    console.log(`📡 Server URL: ${process.env.SERVER_URL || 'http://localhost:'+port+'/parse'}`);
  });
} catch (error) {
  console.error('❌ Parse Server başlatma hatası:', error);
  process.exit(1);
}
