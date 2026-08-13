const express = require('express');
const ParseServer = require('parse-server').ParseServer;

const app = express();

const api = new ParseServer({
  databaseURI: process.env.DATABASE_URI,
  cloud: process.env.CLOUD_CODE_MAIN || './cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
});

app.use('/parse', api);

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`Parse Server çalışıyor! Port: ${port}`);
});
