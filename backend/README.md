# 单据自动识别录单网站后端

## 项目介绍

本项目是单据自动识别录单网站的后端服务，基于Node.js + Express开发，集成了腾讯云OCR服务和Supabase数据库，实现了单据上传、OCR识别、数据存储、历史记录查询和Excel导出等功能。

## 技术栈

- Node.js 14+
- Express 4.18.2
- Multer 1.4.5-lts.1（文件上传）
- TencentCloud SDK（OCR识别）
- Supabase（数据库）
- XLSX（Excel导出）
- CORS（跨域支持）
- Dotenv（环境变量管理）

## 项目结构

```
backend/
├── routes/           # 路由文件
│   ├── upload.js     # 文件上传和OCR识别
│   ├── history.js    # 历史记录管理
│   └── export.js     # Excel导出
├── services/         # 服务文件
│   ├── ocr.js        # OCR识别服务
│   ├── database.js   # 数据库服务
│   └── export.js     # 导出服务
├── test/             # 测试文件
│   └── api.test.js   # API接口测试
├── uploads/          # 上传文件存储
├── server.js         # 主服务器文件
├── package.json      # 项目配置
└── .env              # 环境变量
```

## 环境配置

1. 复制 `.env.example` 文件为 `.env`
2. 填写以下配置：
   - 腾讯云OCR API密钥（SECRET_ID、SECRET_KEY）
   - Supabase连接信息（URL、ANON_KEY、SERVICE_ROLE_KEY）
   - 服务器配置（PORT、NODE_ENV）

## 数据库配置

在Supabase中创建 `document_records` 表，包含以下字段：

| 字段名 | 数据类型 | 描述 |
| --- | --- | --- |
| id | int8 | 主键 |
| document_type | text | 单据类型 |
| document_number | text | 单据编号 |
| date | text | 日期 |
| amount | text | 金额 |
| supplier_name | text | 供应商名称 |
| recipient_name | text | 收货方名称 |
| goods_name | text | 商品名称 |
| specification | text | 规格型号 |
| quantity | text | 数量 |
| unit_price | text | 单价 |
| recipient | text | 收货人 |
| remark | text | 备注 |
| image_path | text | 图片路径 |
| recognition_time | timestamp | 识别时间 |
| tag | text | 标签 |

## API接口

### 1. 文件上传和OCR识别

- **单文件上传**：`POST /api/upload/single`
  - FormData: `document` (文件)
  - 返回：识别结果和保存ID

- **多文件上传**：`POST /api/upload/multiple`
  - FormData: `documents` (多个文件)
  - 返回：每个文件的识别结果

### 2. 历史记录管理

- **获取历史记录**：`GET /api/history`
  - 查询参数：`filter` (搜索关键词), `page` (页码), `limit` (每页数量)
  - 返回：历史记录列表

- **获取记录详情**：`GET /api/history/:id`
  - 返回：单个记录的详细信息

- **删除记录**：`DELETE /api/history/:id`
  - 返回：删除结果

### 3. Excel导出

- **导出所有记录**：`GET /api/export/excel`
  - 查询参数：`filter` (搜索关键词)
  - 返回：Excel文件

- **导出单个记录**：`GET /api/export/excel/:id`
  - 返回：单个记录的Excel文件

## 运行项目

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 启动生产服务器：`npm start`
4. 运行测试：`npm test`

## 部署指南

### 腾讯云部署

1. 创建腾讯云CVM实例
2. 安装Node.js 14+
3. 上传项目文件
4. 安装依赖：`npm install`
5. 配置环境变量
6. 启动服务：`npm start`
7. 配置安全组，开放3001端口
8. 配置域名和SSL证书（可选）

### 注意事项

- 确保腾讯云OCR服务已开通并配置正确的API密钥
- 确保Supabase数据库已创建并配置正确的连接信息
- 确保服务器有足够的存储空间用于存储上传的文件
- 定期清理上传的文件，避免存储空间不足

## 性能优化

- 单张单据识别响应时间≤3秒
- 支持批量上传和识别（最多10张）
- 历史记录查询支持分页，提高查询速度
- Excel导出限制为1000条记录，避免内存不足

## 安全措施

- 文件上传限制为10MB，防止恶意文件
- 敏感信息（如API密钥）存储在环境变量中
- 支持CORS跨域请求，限制来源（可选）
- 错误处理和日志记录，便于排查问题