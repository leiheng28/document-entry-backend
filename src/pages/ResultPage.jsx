import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    单据编号: 'XS20250816-004',
    日期: '2025-08-16',
    供应商名称: '荔湾区香又爽食品店',
    收货方名称: '广州市某超市',
    商品名称: '脆皮肠',
    规格型号: '250g',
    数量: '5',
    单价: '9.50',
    金额: '47.50',
    收货人: '王红',
    备注: ''
  });
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [imagePath, setImagePath] = useState('');

  // 从路由参数中获取识别结果和图片路径
  useEffect(() => {
    const { recognitionResult, imagePath: imgPath } = location.state || {};
    if (recognitionResult) {
      setFormData(recognitionResult);
    }
    if (imgPath) {
      setImagePath(imgPath);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // 直接显示打印提示，因为在上传时已经保存了结果
    setShowPrintPrompt(true);
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handlePrint = () => {
    setShowPrintPrompt(false);
    // 模拟打印操作
    alert('打印功能已触发');
    navigate('/history');
  };

  const handleNoPrint = () => {
    setShowPrintPrompt(false);
    navigate('/history');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">识别结果</h1>
          <button 
            onClick={handleCancel}
            className="text-gray-600 hover:text-red-600"
          >
            返回
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：单据预览 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">单据预览</h2>
            <div className="border rounded-lg p-2 bg-gray-50">
              {imagePath ? (
                <img 
                  src={`http://localhost:3001/uploads/${imagePath}`} 
                  alt="单据预览" 
                  className="w-full h-auto rounded"
                />
              ) : (
                <img 
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=receipt%20document%20with%20table%20of%20items%20and%20prices&image_size=landscape_4_3" 
                  alt="单据预览" 
                  className="w-full h-auto rounded"
                />
              )}
            </div>
          </div>

          {/* 右侧：表单 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">表单内容</h2>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                  <input 
                    type="text" 
                    name={key}
                    value={value}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button 
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 打印提示弹窗 */}
      {showPrintPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">是否需要打印图片单据？</h3>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={handleNoPrint}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                否
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                是
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;