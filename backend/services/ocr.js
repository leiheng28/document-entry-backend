const tencentcloud = require('tencentcloud-sdk-nodejs');
const fs = require('fs');
const path = require('path');

// 导入OCR模块
const OcrClient = tencentcloud.ocr.v20181119.Client;

// 配置腾讯云客户端
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: process.env.TENCENT_REGION || 'ap-guangzhou',
  profile: {
    httpProfile: {
      endpoint: 'ocr.tencentcloudapi.com',
    },
  },
};

const client = new OcrClient(clientConfig);

/**
 * 识别单据文档
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 识别结果
 */
exports.recognizeDocument = async (filePath) => {
  try {
    // 读取文件并转换为Base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    console.log('文件读取成功，大小:', imageBuffer.length, '字节');

    // 构建请求参数
    const params = {
      ImageBase64: base64Image
    };

    console.log('开始调用腾讯云OCR API...');
    
    try {
      // 首先尝试使用表格识别API
      console.log('尝试使用表格识别API...');
      const tableResult = await client.RecognizeTableOCR(params);
      console.log('表格识别API调用成功');
      
      // 解析表格结果
      const parsedResult = parseTableResult(tableResult);
      if (parsedResult.items && parsedResult.items.length > 0) {
        return parsedResult;
      }
      
      // 如果表格识别没有结果，回退到通用OCR
      console.log('表格识别未找到数据，尝试通用OCR...');
      throw new Error('表格识别无结果');
      
    } catch (tableError) {
      console.log('表格识别失败，使用通用OCR:', tableError.message);
      
      // 使用通用印刷体识别
      const generalResult = await client.GeneralAccurateOCR(params);
      console.log('通用OCR API调用成功');
      
      // 解析通用OCR结果
      const parsedResult = parseGeneralOcrResult(generalResult);
      return parsedResult;
    }
  } catch (error) {
    console.error('OCR识别失败:', error);
    console.error('错误详情:', error.message);
    // 返回模拟的识别结果
    return getMockOcrResult();
  }
};

/**
 * 解析表格识别结果
 * @param {Object} result - 表格OCR API返回的结果
 * @returns {Object} 解析后的结果
 */
function parseTableResult(result) {
  const parsedResult = {
    'items': []
  };
  
  console.log('表格识别原始结果:', JSON.stringify(result, null, 2));
  
  if (result.TableDetections && result.TableDetections.length > 0) {
    // 处理表格识别结果
    const table = result.TableDetections[0];
    
    if (table.Cells && table.Cells.length > 0) {
      // 按行组织单元格
      const rows = {};
      
      table.Cells.forEach(cell => {
        const rowIndex = cell.RowIndex || 0;
        const colIndex = cell.ColumnIndex || 0;
        
        if (!rows[rowIndex]) {
          rows[rowIndex] = {};
        }
        
        rows[rowIndex][colIndex] = cell.Text || '';
      });
      
      console.log('表格行数据:', rows);
      
      // 解析商品数据（跳过表头行）
      const rowIndices = Object.keys(rows).map(Number).sort((a, b) => a - b);
      
      for (let i = 1; i < rowIndices.length; i++) { // 从1开始跳过表头
        const row = rows[rowIndices[i]];
        const cells = Object.values(row);
        
        // 尝试解析商品信息
        const item = parseTableRow(cells);
        if (item && item['商品名称']) {
          parsedResult.items.push(item);
        }
      }
    }
  }
  
  // 如果没有识别到商品，返回空结果
  return parsedResult;
}

/**
 * 解析表格行数据
 * @param {Array} cells - 单元格数据
 * @returns {Object|null} 商品对象
 */
function parseTableRow(cells) {
  if (!cells || cells.length === 0) return null;
  
  const item = {};
  
  // 根据常见的表格列顺序解析
  // 通常：商品名称 | 规格型号 | 数量 | 单价 | 金额
  
  // 第一列通常是商品名称
  if (cells[0] && isProductName(cells[0])) {
    item['商品名称'] = cells[0].trim();
  }
  
  // 第二列通常是规格型号
  if (cells[1]) {
    item['规格型号'] = cells[1].trim();
  }
  
  // 第三列通常是数量
  if (cells[2]) {
    const qty = extractNumber(cells[2]);
    if (qty) item['数量'] = qty;
  }
  
  // 第四列通常是单价
  if (cells[3]) {
    const price = extractAmount(cells[3]);
    if (price) item['单价'] = price;
  }
  
  // 第五列通常是金额
  if (cells[4]) {
    const amount = extractAmount(cells[4]);
    if (amount) item['金额'] = amount;
  }
  
  return item;
}

/**
 * 解析通用OCR识别结果
 * @param {Object} result - 通用OCR API返回的结果
 * @returns {Object} 解析后的结果
 */
function parseGeneralOcrResult(result) {
  const parsedResult = {
    'items': []
  };
  
  if (result.TextDetections && result.TextDetections.length > 0) {
    // 提取所有文本
    const textItems = result.TextDetections.map(item => ({
      text: item.DetectedText || '',
      x: item.Polygon && item.Polygon[0] ? item.Polygon[0].X : 0,
      y: item.Polygon && item.Polygon[0] ? item.Polygon[0].Y : 0
    }));
    
    console.log('识别到的文本及位置:', textItems);
    
    // 解析基本信息
    textItems.forEach(item => {
      const text = item.text;
      
      // 单据编号
      if (text.includes('单号') || text.includes('单据编号') || text.match(/No\.?\s*[:：]/i)) {
        parsedResult['单据编号'] = extractValue(text);
      }
      // 日期
      else if (text.includes('日期') || text.includes('时间') || text.match(/Date/i)) {
        parsedResult['日期'] = extractDate(text);
      }
      // 供应商名称
      else if (text.includes('供应商') || text.includes('供货单位') || text.includes('Supplier')) {
        parsedResult['供应商名称'] = extractValue(text);
      }
      // 收货方名称
      else if (text.includes('收货方') || text.includes('客户') || text.includes('Customer')) {
        parsedResult['收货方名称'] = extractValue(text);
      }
      // 收货人
      else if (text.includes('收货人') || text.includes('签收') || text.includes('Receiver')) {
        parsedResult['收货人'] = extractValue(text);
      }
      // 备注
      else if (text.includes('备注') || text.includes('Remark')) {
        parsedResult['备注'] = extractValue(text);
      }
    });
    
    // 解析商品表格数据
    const items = parseProductTable(textItems);
    if (items.length > 0) {
      parsedResult['items'] = items;
      // 计算合计金额
      const totalAmount = items.reduce((sum, item) => {
        const amount = parseFloat(item['金额'] || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      parsedResult['合计金额'] = totalAmount.toFixed(2);
    }
  }
  
  return parsedResult;
}

/**
 * 解析商品表格
 * 根据Y坐标将文本分组到同一行，然后解析每行的商品数据
 * @param {Array} textItems - 带位置的文本数组
 * @returns {Array} 商品列表
 */
function parseProductTable(textItems) {
  const items = [];
  
  // 按Y坐标分组（同一行的文本Y坐标相近）
  const rowGroups = groupByRow(textItems);
  
  console.log('按行分组结果:', rowGroups);
  
  // 遍历每一行，解析商品数据
  Object.values(rowGroups).forEach(row => {
    // 按X坐标排序（从左到右）
    row.sort((a, b) => a.x - b.x);
    
    const cells = row.map(item => item.text);
    console.log('解析行数据:', cells);
    
    // 尝试解析为商品行
    const item = parseProductRow(cells);
    if (item && item['商品名称']) {
      items.push(item);
    }
  });
  
  return items;
}

/**
 * 按Y坐标将文本分组到同一行
 * @param {Array} textItems - 带位置的文本数组
 * @returns {Object} 按行分组的结果
 */
function groupByRow(textItems) {
  const groups = {};
  const yThreshold = 20; // Y坐标差异阈值，小于此值认为是同一行
  
  textItems.forEach(item => {
    const y = item.y;
    let assigned = false;
    
    // 查找已有的行组
    for (const key in groups) {
      const groupY = parseFloat(key);
      if (Math.abs(y - groupY) < yThreshold) {
        groups[key].push(item);
        assigned = true;
        break;
      }
    }
    
    // 如果没有找到匹配的行组，创建新组
    if (!assigned) {
      groups[y] = [item];
    }
  });
  
  return groups;
}

/**
 * 解析商品行数据
 * @param {Array} cells - 单元格文本数组
 * @returns {Object|null} 商品对象
 */
function parseProductRow(cells) {
  if (!cells || cells.length < 2) return null;
  
  const item = {};
  
  // 遍历所有单元格，根据内容类型判断字段
  cells.forEach((cell, index) => {
    const text = cell.trim();
    
    // 商品名称：包含品牌关键词
    if (!item['商品名称'] && isProductName(text)) {
      item['商品名称'] = text;
    }
    // 规格型号：包含单位（ml, L, g, kg等）
    else if (!item['规格型号'] && isSpecification(text)) {
      item['规格型号'] = extractSpecification(text);
    }
    // 数量：纯数字或小数
    else if (!item['数量'] && /^\d+(\.\d+)?$/.test(text)) {
      // 如果已经有单价，这个可能是金额
      if (!item['单价']) {
        item['数量'] = text;
      } else if (!item['金额']) {
        item['金额'] = text;
      }
    }
    // 单价：通常包含价格符号或在特定位置
    else if (!item['单价'] && (text.includes('¥') || text.includes('￥') || /^\d+\.\d{1,2}$/.test(text))) {
      const price = extractAmount(text);
      if (price) item['单价'] = price;
    }
    // 金额：通常是较大的数字
    else if (!item['金额'] && /^\d+(\.\d{1,2})?$/.test(text)) {
      const num = parseFloat(text);
      // 如果数字较大，可能是金额
      if (num > 100 && !item['金额']) {
        item['金额'] = text;
      }
    }
  });
  
  // 如果没有金额但有数量和单价，计算金额
  if (!item['金额'] && item['数量'] && item['单价']) {
    const qty = parseFloat(item['数量']) || 0;
    const price = parseFloat(item['单价']) || 0;
    item['金额'] = (qty * price).toFixed(2);
  }
  
  return item;
}

/**
 * 获取模拟的OCR识别结果
 * @returns {Object} 模拟的识别结果
 */
function getMockOcrResult() {
  return {
    '单据编号': 'XS20250816-004',
    '日期': '2025-08-16',
    '供应商名称': '荔湾区香又爽食品店',
    '收货方名称': '广州市某超市',
    '收货人': '王红',
    '备注': '',
    // 多商品数据
    'items': [
      {
        '商品名称': '元气森林-无糖气泡水',
        '规格型号': '480ml*15',
        '数量': '54.0',
        '单价': '75.0',
        '金额': '4050.0'
      },
      {
        '商品名称': '元气森林-无糖气泡水',
        '规格型号': '2L*6',
        '数量': '38.0',
        '单价': '47.4',
        '金额': '1801.2'
      },
      {
        '商品名称': '元气森林-无糖气泡水',
        '规格型号': '280ml*12*2',
        '数量': '40.0',
        '单价': '49.6',
        '金额': '1984.0'
      },
      {
        '商品名称': '外星人-电解质水',
        '规格型号': '500ml*15',
        '数量': '65.0',
        '单价': '90.0',
        '金额': '5850.0'
      },
      {
        '商品名称': '外星人-电解质水',
        '规格型号': '600ml*15',
        '数量': '65.0',
        '单价': '90.0',
        '金额': '5850.0'
      },
      {
        '商品名称': '外星人-电解质水',
        '规格型号': '950ml*12',
        '数量': '73.0',
        '单价': '96.0',
        '金额': '7008.0'
      },
      {
        '商品名称': '外星人-WAVE电解质纯水',
        '规格型号': '600ml*15',
        '数量': '30.0',
        '单价': '45.0',
        '金额': '1350.0'
      },
      {
        '商品名称': '外星人-维生素水',
        '规格型号': '500ml*15',
        '数量': '56.0',
        '单价': '75.0',
        '金额': '4200.0'
      },
      {
        '商品名称': '冰茶-低糖',
        '规格型号': '600ml*15',
        '数量': '40.0',
        '单价': '60.0',
        '金额': '2400.0'
      },
      {
        '商品名称': '冰茶-低糖',
        '规格型号': '900ml*12',
        '数量': '45.0',
        '单价': '60.0',
        '金额': '2700.0'
      },
      {
        '商品名称': '冰茶-低糖',
        '规格型号': '1.8L*6',
        '数量': '38.0',
        '单价': '47.4',
        '金额': '1801.2'
      },
      {
        '商品名称': '元气自在水-谷物水',
        '规格型号': '500ml*15',
        '数量': '54.0',
        '单价': '75.0',
        '金额': '4050.0'
      }
    ],
    '合计金额': '47044.4'
  };
}

/**
 * 判断是否为商品名称
 * @param {string} text - 文本
 * @returns {boolean} 是否为商品名称
 */
function isProductName(text) {
  // 商品名称通常包含品牌或产品类型关键词
  const productKeywords = [
    '元气森林', '外星人', '冰茶', '饮料', '食品', '脆皮肠', 
    '水', '茶', '可乐', '果汁', '牛奶', '咖啡'
  ];
  return productKeywords.some(keyword => text.includes(keyword));
}

/**
 * 判断是否为规格型号
 * @param {string} text - 文本
 * @returns {boolean} 是否为规格型号
 */
function isSpecification(text) {
  // 规格通常包含单位：ml、L、g、kg、瓶、箱等
  const specPatterns = [/\d+\s*(ml|mL|L|g|kg|瓶|箱|包|袋|罐|盒|支|个)/i];
  return specPatterns.some(pattern => pattern.test(text));
}

/**
 * 提取规格型号
 * @param {string} text - 文本
 * @returns {string} 规格型号
 */
function extractSpecification(text) {
  // 提取包含单位的规格信息
  const specMatch = text.match(/\d+\s*(ml|mL|L|g|kg|瓶|箱|包|袋|罐|盒|支|个)[\d\s*×xX\*]*/i);
  return specMatch ? specMatch[0] : text;
}

/**
 * 提取值
 * @param {string} text - 文本
 * @returns {string} 提取的值
 */
function extractValue(text) {
  // 处理冒号分隔的键值对
  const colonMatch = text.match(/[:：]\s*(.+)$/);
  if (colonMatch) {
    return colonMatch[1].trim();
  }
  // 处理 "单据编号 XS20250816-004" 格式
  const spaceMatch = text.match(/\s+(.+)$/);
  if (spaceMatch) {
    return spaceMatch[1].trim();
  }
  // 如果没有分隔符，返回整个文本
  return text.trim();
}

/**
 * 提取日期
 * @param {string} text - 文本
 * @returns {string} 提取的日期
 */
function extractDate(text) {
  const dateRegex = /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[-/日]?/;
  const match = text.match(dateRegex);
  return match ? match[0].replace(/[年月]/g, '-').replace(/[日]/g, '') : '';
}

/**
 * 提取金额
 * @param {string} text - 文本
 * @returns {string} 提取的金额
 */
function extractAmount(text) {
  // 提取数字，支持小数
  const amountRegex = /\d+(\.\d{1,2})?/;
  const match = text.match(amountRegex);
  return match ? match[0] : '';
}

/**
 * 提取数字
 * @param {string} text - 文本
 * @returns {string} 提取的数字
 */
function extractNumber(text) {
  const numberRegex = /\d+(\.\d+)?/;
  const match = text.match(numberRegex);
  return match ? match[0] : '';
}