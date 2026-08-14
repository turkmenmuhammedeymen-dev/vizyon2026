const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const cors = require('cors');

const app = express();
app.use(cors()); // CORS izinleri

const api = new ParseServer({
  databaseURI: process.env.DATABASE_URI,
  cloud: process.env.CLOUD_CODE_MAIN || './cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL || 'https://vizyon-parse-server.onrender.com/parse',
  allowClientClassCreation: false,
});

app.use('/parse', api);

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`✅ Parse Server çalışıyor! Port: ${port}`);
});
