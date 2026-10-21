import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(Number(PORT), HOST, () => {
  console.log(`[EquipNav Server] Running on http://${HOST}:${PORT}`);
});
