const env = require('./config/env');
const { initDB } = require('./config/db');
const app = require('./app');

(async () => {
  try {
    await initDB();
    app.listen(env.PORT, () => console.log(`Backend running on port ${env.PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
