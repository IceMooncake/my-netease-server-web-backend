import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 提供 openapi.json
app.get('/openapi.json', (_, res) => {
  res.sendFile(path.join(__dirname, '../doc/openapi.json'));
});

app.listen(8972, () => {
  console.log('Server running: http://localhost:8972');
  console.log('OpenAPI: http://localhost:8972/openapi.json');
});
