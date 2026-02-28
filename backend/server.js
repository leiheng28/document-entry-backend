const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/upload');
const historyRoutes = require('./routes/history');
const exportRoutes = require('./routes/export');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/upload', uploadRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/export', exportRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;