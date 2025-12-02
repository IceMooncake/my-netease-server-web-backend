// config/db.ts
import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'user',
  password: '123456',
  database: 'minecraft',
  waitForConnections: true,
});
