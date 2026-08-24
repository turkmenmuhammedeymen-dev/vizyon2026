const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

try {
  const api = new ParseServer({
    // ★ DÜZELTİLDİ: MONGODB_URI kullan (DATABASE_URI değil)
    databaseURI: process.env.MONGODB_URI,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL || 'https://vizyon-parse-server.onrender.com/parse',
    // ★ Cloud Code ana dizindeki main.js dosyası
    cloud: './main.js'
  });

  // Parse Server'ı /parse yoluna bağla
  app.use('/parse', api.app);

  const port = process.env.PORT || 1337;
  app.listen(port, () => {
    console.log(`✅ Parse Server başarıyla başlatıldı!`);
    console.log(`📍 Port: ${port}`);
    console.log(`🔗 Server URL: ${process.env.SERVER_URL || 'http://localhost:'+port+'/parse'}`);
    console.log(`📦 MongoDB: ${process.env.MONGODB_URI ? 'Bağlantı dizesi mevcut ✅' : 'MONGODB_URI eksik ❌'}`);
  });

} catch (error) {
  console.error('❌ Parse Server başlatma hatası:', error.message);
  console.error('Detay:', error);
  process.exit(1);
}
