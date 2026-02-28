const express = require('express');
const { getHistoryRecords, deleteHistoryRecord, getHistoryRecordById } = require('../services/database');

const router = express.Router();

// 获取历史记录列表
router.get('/', async (req, res) => {
  try {
    const { filter, page = 1, limit = 10 } = req.query;
    
    const records = await getHistoryRecords({
      filter: filter || '',
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({ error: error.message || '获取历史记录失败' });
  }
});

// 获取单个历史记录详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await getHistoryRecordById(id);
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('获取历史记录详情失败:', error);
    res.status(500).json({ error: error.message || '获取历史记录详情失败' });
  }
});

// 删除历史记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteHistoryRecord(id);
    
    if (!result) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.status(200).json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除历史记录失败:', error);
    res.status(500).json({ error: error.message || '删除历史记录失败' });
  }
});

module.exports = router;