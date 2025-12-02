// index.js
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import './services/index.js'; // 初始化服务

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

app.listen(3000, () => {
  console.log('服务器启动：http://localhost:3000');
});
