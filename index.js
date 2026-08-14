const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const cors = require('cors');

const app = express();

// CORS ayarları - tüm isteklere izin ver
app.use(cors());

// Parse Server konfigürasyonu
const config = {
  databaseURI: process.env.DATABASE_URI,
  cloud: process.env.CLOUD_CODE_MAIN || './cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  // Hata ayıklama için logları aç
  logLevel: 'verbose',
  // İsteğe bağlı: Gelişmiş seçenekler
  allowClientClassCreation: false,
  enforcePrivateUsers: true,
};

// Parse Server'ı başlat
const api = new ParseServer(config);

// Express'e Parse Server middleware'ini ekle
app.use('/parse', api.app);

// Sağlık kontrolü için basit bir route
app.get('/health', (req, res) => {
  res.send('OK');
});

// Hata yönetimi
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).send('Bir hata oluştu.');
});

// Sunucuyu başlat
const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`✅ Parse Server başarıyla çalışıyor!`);
  console.log(`🌐 Sunucu URL: http://localhost:${port}/parse`);
  console.log(`📡 Sağlık kontrolü: http://localhost:${port}/health`);
}).on('error', (err) => {
  console.error('❌ Sunucu başlatılamadı:', err);
  process.exit(1);
});
