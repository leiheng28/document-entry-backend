const XLSX = require('xlsx');

/**
 * 导出数据到Excel
 * @param {Array} records - 历史记录数据
 * @returns {Promise<Buffer>} Excel文件缓冲区
 */
exports.exportToExcel = async (records) => {
  try {
    // 准备导出数据
    const exportData = records.map(record => ({
      '单据类型': record['单据类型'],
      '单据编号': record['单据编号'],
      '日期': record['日期'],
      '金额': record['金额'],
      '供应商名称': record.supplierName || '',
      '收货方名称': record.recipientName || '',
      '商品名称': record.goodsName || '',
      '规格型号': record.specification || '',
      '数量': record.quantity || '',
      '单价': record.unitPrice || '',
      '收货人': record.recipient || '',
      '备注': record.remark || '',
      '识别时间': record['识别时间'],
      '标签': record['标签']
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
    const wscols = [
      { wch: 12 }, // 单据类型
      { wch: 20 }, // 单据编号
      { wch: 15 }, // 日期
      { wch: 12 }, // 金额
      { wch: 20 }, // 供应商名称
      { wch: 20 }, // 收货方名称
      { wch: 15 }, // 商品名称
      { wch: 15 }, // 规格型号
      { wch: 10 }, // 数量
      { wch: 10 }, // 单价
      { wch: 12 }, // 收货人
      { wch: 20 }, // 备注
      { wch: 20 }, // 识别时间
      { wch: 10 }  // 标签
    ];
    ws['!cols'] = wscols;

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '单据记录');

    // 生成Excel文件缓冲区
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return excelBuffer;
  } catch (error) {
    console.error('导出Excel失败:', error);
    throw new Error('导出Excel失败');
  }
};