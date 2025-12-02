// index.ts
import express from 'express';
import authRoutes from './routes/authRoutes.ts';
import './services/index.ts'; // 初始化服务
const app = express();

app.use(express.json());

app.use('/api', authRoutes);

// app.use(errorHandler);

export default app;