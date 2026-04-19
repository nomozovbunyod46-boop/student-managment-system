require('dotenv').config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),

  DB_HOST: requireEnv('DB_HOST'),
  DB_USER: requireEnv('DB_USER'),
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: requireEnv('DB_NAME'),

  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};

env.isProd = env.NODE_ENV === 'production';

module.exports = env;
