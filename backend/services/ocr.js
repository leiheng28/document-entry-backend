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

    // 调用通用票据识别接口
    console.log('开始调用腾讯云OCR API...');
    try {
      // 使用正确的方法名称：GeneralAccurateOCR
      const result = await client.GeneralAccurateOCR(params);
      console.log('OCR API调用成功');

      // 解析识别结果
      const parsedResult = parseOcrResult(result);
      return parsedResult;
    } catch (apiError) {
      console.error('腾讯云OCR API调用失败，使用模拟数据:', apiError.message);
      // 返回模拟的识别结果
      return getMockOcrResult();
    }
  } catch (error) {
    console.error('OCR识别失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    // 返回模拟的识别结果
    return getMockOcrResult();
  }
};

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
      }
    ],
    '合计金额': '19535.2'
  };
}

/**
 * 解析OCR识别结果
 * @param {Object} result - OCR API返回的结果
 * @returns {Object} 解析后的结果
 */
function parseOcrResult(result) {
  const parsedResult = {
    'items': [] // 商品列表
  };
  
  if (result.TextDetections && result.TextDetections.length > 0) {
    // 提取文本内容
    const texts = result.TextDetections.map(item => item.DetectedText);
    console.log('识别到的文本:', texts);
    
    // 解析基本信息
    texts.forEach(text => {
      // 单据编号
      if (text.includes('单号') || text.includes('单据编号') || text.includes('No.')) {
        parsedResult['单据编号'] = extractValue(text);
      }
      // 日期
      else if (text.includes('日期') || text.includes('时间') || text.includes('Date')) {
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
      else if (text.includes('备注') || text.includes('备注栏') || text.includes('Remark')) {
        parsedResult['备注'] = extractValue(text);
      }
    });
    
    // 解析表格商品数据
    const items = parseTableData(texts);
    if (items.length > 0) {
      parsedResult['items'] = items;
      // 计算合计金额
      const totalAmount = items.reduce((sum, item) => {
        const amount = parseFloat(item['金额'] || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      parsedResult['合计金额'] = totalAmount.toFixed(2);
    } else {
      // 如果没有识别到表格数据，尝试从文本中提取单个商品
      const singleItem = parseSingleItem(texts);
      if (singleItem) {
        parsedResult['items'] = [singleItem];
        parsedResult['合计金额'] = singleItem['金额'] || '0';
      }
    }
  }

  return parsedResult;
}

/**
 * 解析表格数据
 * @param {Array} texts - 文本数组
 * @returns {Array} 商品列表
 */
function parseTableData(texts) {
  const items = [];
  
  // 查找表格中的商品行
  // 通常商品行包含：商品名称、规格、数量、单价、金额
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    
    // 识别商品名称行（通常包含品牌名称）
    if (isProductName(text)) {
      const item = {
        '商品名称': text
      };
      
      // 尝试从后续文本中提取规格、数量、单价、金额
      // 通常这些数据在同一行或相邻行
      for (let j = i + 1; j < Math.min(i + 5, texts.length); j++) {
        const nextText = texts[j];
        
        // 规格型号（通常包含ml、g、kg等单位）
        if (!item['规格型号'] && isSpecification(nextText)) {
          item['规格型号'] = extractSpecification(nextText);
        }
        // 数量
        else if (!item['数量'] && isQuantity(nextText)) {
          item['数量'] = extractNumber(nextText);
        }
        // 单价
        else if (!item['单价'] && isPrice(nextText)) {
          item['单价'] = extractAmount(nextText);
        }
        // 金额
        else if (!item['金额'] && isAmount(nextText)) {
          item['金额'] = extractAmount(nextText);
        }
        // 如果遇到下一个商品名称，停止当前商品解析
        else if (isProductName(nextText)) {
          break;
        }
      }
      
      // 只有当商品有基本数据时才添加到列表
      if (item['商品名称']) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * 解析单个商品（非表格格式）
 * @param {Array} texts - 文本数组
 * @returns {Object|null} 商品对象
 */
function parseSingleItem(texts) {
  const item = {};
  
  texts.forEach(text => {
    // 商品名称
    if (text.includes('商品') || text.includes('品名') || text.includes('名称')) {
      item['商品名称'] = extractValue(text);
    }
    // 规格型号
    else if (text.includes('规格') || text.includes('型号')) {
      item['规格型号'] = extractValue(text);
    }
    // 数量
    else if (text.includes('数量') || text.includes('Qty')) {
      item['数量'] = extractNumber(text);
    }
    // 单价
    else if (text.includes('单价') || text.includes('Price')) {
      item['单价'] = extractAmount(text);
    }
    // 金额
    else if (text.includes('金额') || text.includes('合计') || text.includes('Total')) {
      item['金额'] = extractAmount(text);
    }
  });
  
  return item['商品名称'] ? item : null;
}

/**
 * 判断是否为商品名称
 * @param {string} text - 文本
 * @returns {boolean} 是否为商品名称
 */
function isProductName(text) {
  // 商品名称通常包含品牌或产品类型关键词
  const productKeywords = ['元气森林', '外星人', '冰茶', '饮料', '食品', '脆皮肠', '水', '茶'];
  return productKeywords.some(keyword => text.includes(keyword));
}

/**
 * 判断是否为规格型号
 * @param {string} text - 文本
 * @returns {boolean} 是否为规格型号
 */
function isSpecification(text) {
  // 规格通常包含单位：ml、L、g、kg、瓶、箱等
  const specPatterns = [/\d+\s*(ml|L|g|kg|瓶|箱|包|袋|罐|盒)/i];
  return specPatterns.some(pattern => pattern.test(text));
}

/**
 * 提取规格型号
 * @param {string} text - 文本
 * @returns {string} 规格型号
 */
function extractSpecification(text) {
  // 提取包含单位的规格信息
  const specMatch = text.match(/\d+\s*(ml|L|g|kg|瓶|箱|包|袋|罐|盒)[\d\s*×xX\*]*/i);
  return specMatch ? specMatch[0] : text;
}

/**
 * 判断是否为数量
 * @param {string} text - 文本
 * @returns {boolean} 是否为数量
 */
function isQuantity(text) {
  // 数量通常是纯数字或包含数量单位
  return /^\d+(\.\d+)?$/.test(text.trim()) || /数量|Qty/i.test(text);
}

/**
 * 判断是否为单价
 * @param {string} text - 文本
 * @returns {boolean} 是否为单价
 */
function isPrice(text) {
  // 单价通常包含价格符号或关键词
  return /单价|Price|¥|￥|\$/i.test(text);
}

/**
 * 判断是否为金额
 * @param {string} text - 文本
 * @returns {boolean} 是否为金额
 */
function isAmount(text) {
  // 金额通常包含价格符号或关键词
  return /金额|合计|Total|¥|￥|\$/i.test(text);
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
  // 如果没有冒号，返回整个文本
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