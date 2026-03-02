const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 检查环境变量
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase环境变量未配置');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 保存识别结果
 * @param {Object} data - 识别结果数据
 * @returns {Promise<Object>} 保存的结果
 */
exports.saveRecognitionResult = async (data) => {
  try {
    const insertData = {
      document_type: data.documentType,
      document_number: data.documentNumber,
      date: data.date,
      amount: data.amount,
      supplier_name: data.supplierName,
      recipient_name: data.recipientName,
      goods_name: data.goodsName,
      specification: data.specification,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      recipient: data.recipient,
      remark: data.remark,
      image_path: data.imagePath,
      recognition_time: data.recognitionTime,
      tag: '待核对' // 默认标签
    };
    
    // 如果有itemsData，添加到数据中
    if (data.itemsData) {
      insertData.items_data = data.itemsData;
    }
    
    const { data: result, error } = await supabase
      .from('document_records')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error('保存识别结果失败:', error);
    throw new Error('保存识别结果失败');
  }
};

/**
 * 获取历史记录
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 历史记录列表
 */
exports.getHistoryRecords = async (options) => {
  try {
    let query = supabase
      .from('document_records')
      .select('*')
      .order('recognition_time', { ascending: false })
      .range((options.page - 1) * options.limit, options.page * options.limit - 1);

    // 添加过滤条件
    if (options.filter) {
      query = query.or(`document_number.ilike.%${options.filter}%,date.ilike.%${options.filter}%,tag.ilike.%${options.filter}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    return data.map(item => ({
      id: item.id,
      单据类型: item.document_type,
      单据编号: item.document_number,
      日期: item.date,
      金额: item.amount,
      识别时间: new Date(item.recognition_time).toLocaleString('zh-CN'),
      标签: item.tag,
      supplierName: item.supplier_name,
      recipientName: item.recipient_name,
      goodsName: item.goods_name,
      specification: item.specification,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      recipient: item.recipient,
      remark: item.remark,
      imagePath: item.image_path,
      itemsData: item.items_data ? JSON.parse(item.items_data) : []
    }));
  } catch (error) {
    console.error('获取历史记录失败:', error);
    throw new Error('获取历史记录失败');
  }
};

/**
 * 根据ID获取历史记录
 * @param {string} id - 记录ID
 * @returns {Promise<Object>} 历史记录
 */
exports.getHistoryRecordById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('document_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // 格式化返回数据
    return {
      id: data.id,
      单据类型: data.document_type,
      单据编号: data.document_number,
      日期: data.date,
      金额: data.amount,
      识别时间: new Date(data.recognition_time).toLocaleString('zh-CN'),
      标签: data.tag,
      supplierName: data.supplier_name,
      recipientName: data.recipient_name,
      goodsName: data.goods_name,
      specification: data.specification,
      quantity: data.quantity,
      unitPrice: data.unit_price,
      recipient: data.recipient,
      remark: data.remark,
      imagePath: data.image_path,
      itemsData: data.items_data ? JSON.parse(data.items_data) : []
    };
  } catch (error) {
    console.error('获取历史记录详情失败:', error);
    throw new Error('获取历史记录详情失败');
  }
};

/**
 * 删除历史记录
 * @param {string} id - 记录ID
 * @returns {Promise<boolean>} 删除结果
 */
exports.deleteHistoryRecord = async (id) => {
  try {
    const { error } = await supabase
      .from('document_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    throw new Error('删除历史记录失败');
  }
};

/**
 * 更新历史记录
 * @param {string} id - 记录ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的记录
 */
exports.updateHistoryRecord = async (id, data) => {
  try {
    const { data: result, error } = await supabase
      .from('document_records')
      .update({
        document_type: data.documentType,
        document_number: data.documentNumber,
        date: data.date,
        amount: data.amount,
        supplier_name: data.supplierName,
        recipient_name: data.recipientName,
        goods_name: data.goodsName,
        specification: data.specification,
        quantity: data.quantity,
        unit_price: data.unitPrice,
        recipient: data.recipient,
        remark: data.remark,
        tag: data.tag
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error('更新历史记录失败:', error);
    throw new Error('更新历史记录失败');
  }
}