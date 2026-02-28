const express = require('express');
const { getHistoryRecords } = require('../services/database');
const { exportToExcel } = require('../services/export');

const router = express.Router();

// 导出历史记录为Excel
router.get('/excel', async (req, res) => {
  try {
    const { filter } = req.query;
    
    // 获取历史记录
    const records = await getHistoryRecords({
      filter: filter || '',
      page: 1,
      limit: 1000 // 导出最多1000条记录
    });

    // 生成Excel文件
    const excelBuffer = await exportToExcel(records);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=document_records_${new Date().toISOString().split('T')[0]}.xlsx`);

    // 发送Excel文件
    res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('导出Excel失败:', error);
    res.status(500).json({ error: error.message || '导出Excel失败' });
  }
});

// 导出单个记录为Excel
router.get('/excel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取单个记录
    const record = await getHistoryRecordById(id);
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }

    // 生成Excel文件
    const excelBuffer = await exportToExcel([record]);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=document_record_${record.documentNumber || id}.xlsx`);

    // 发送Excel文件
    res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('导出Excel失败:', error);
    res.status(500).json({ error: error.message || '导出Excel失败' });
  }
});

// 导入getHistoryRecordById函数
const { getHistoryRecordById } = require('../services/database');

module.exports = router;