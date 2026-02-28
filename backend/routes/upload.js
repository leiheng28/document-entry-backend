const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { recognizeDocument } = require('../services/ocr');
const { saveRecognitionResult } = require('../services/database');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、PDF 格式的文件'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB限制
});

// 单文件上传
router.post('/single', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    // 执行OCR识别
    const recognitionResult = await recognizeDocument(req.file.path);

    // 保存识别结果
    const savedResult = await saveRecognitionResult({
      documentType: '送货单', // 暂时固定，后续可根据识别结果自动判断
      documentNumber: recognitionResult['单据编号'] || '',
      date: recognitionResult['日期'] || '',
      amount: recognitionResult['金额'] || '',
      supplierName: recognitionResult['供应商名称'] || '',
      recipientName: recognitionResult['收货方名称'] || '',
      goodsName: recognitionResult['商品名称'] || '',
      specification: recognitionResult['规格型号'] || '',
      quantity: recognitionResult['数量'] || '',
      unitPrice: recognitionResult['单价'] || '',
      recipient: recognitionResult['收货人'] || '',
      remark: recognitionResult['备注'] || '',
      imagePath: req.file.filename,
      recognitionTime: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: {
        recognitionResult,
        savedId: savedResult.id,
        imagePath: req.file.filename
      }
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: error.message || '上传失败' });
  }
});

// 多文件上传
router.post('/multiple', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const results = [];

    for (const file of req.files) {
      try {
        // 执行OCR识别
        const recognitionResult = await recognizeDocument(file.path);

        // 保存识别结果
        const savedResult = await saveRecognitionResult({
          documentType: '送货单',
          documentNumber: recognitionResult['单据编号'] || '',
          date: recognitionResult['日期'] || '',
          amount: recognitionResult['金额'] || '',
          supplierName: recognitionResult['供应商名称'] || '',
          recipientName: recognitionResult['收货方名称'] || '',
          goodsName: recognitionResult['商品名称'] || '',
          specification: recognitionResult['规格型号'] || '',
          quantity: recognitionResult['数量'] || '',
          unitPrice: recognitionResult['单价'] || '',
          recipient: recognitionResult['收货人'] || '',
          remark: recognitionResult['备注'] || '',
          imagePath: file.filename,
          recognitionTime: new Date().toISOString()
        });

        results.push({
          fileName: file.originalname,
          success: true,
          data: {
            recognitionResult,
            savedId: savedResult.id
          }
        });
      } catch (error) {
        results.push({
          fileName: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({ error: error.message || '批量上传失败' });
  }
});

module.exports = router;