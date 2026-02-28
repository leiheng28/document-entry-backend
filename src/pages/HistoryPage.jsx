import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await fetch('http://localhost:3001/api/history');
        const result = await response.json();
        
        if (result.success) {
          setHistory(result.data);
        } else {
          setError(result.error || '加载历史记录失败');
        }
      } catch (err) {
        setError('加载历史记录失败：' + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistory();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该记录？删除后不可恢复')) {
      try {
        const response = await fetch(`http://localhost:3001/api/history/${id}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          setHistory(prev => prev.filter(item => item.id !== id));
        } else {
          setError(result.error || '删除失败');
        }
      } catch (err) {
        setError('删除失败：' + err.message);
      }
    }
  };

  const handleExport = async (id) => {
    try {
      const url = id 
        ? `http://localhost:3001/api/export/excel/${id}`
        : 'http://localhost:3001/api/export/excel';
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 创建下载链接
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `document_records_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError('导出失败：' + err.message);
    }
  };

  const handleView = async (id) => {
    try {
      // 获取历史记录详情
      const response = await fetch(`http://localhost:3001/api/history/${id}`);
      const result = await response.json();
      
      if (result.success) {
        // 构建识别结果对象
        const recognitionResult = {
          '单据编号': result.data.documentNumber,
          '日期': result.data.date,
          '供应商名称': result.data.supplierName,
          '收货方名称': result.data.recipientName,
          '商品名称': result.data.goodsName,
          '规格型号': result.data.specification,
          '数量': result.data.quantity,
          '单价': result.data.unitPrice,
          '金额': result.data.amount,
          '收货人': result.data.recipient,
          '备注': result.data.remark
        };
        
        // 导航到结果页面
        navigate('/result', {
          state: {
            recognitionResult,
            savedId: result.data.id,
            imagePath: result.data.imagePath
          }
        });
      } else {
        setError(result.error || '获取记录详情失败');
      }
    } catch (err) {
      setError('获取记录详情失败：' + err.message);
    }
  };

  const filteredHistory = history.filter(item => 
    item.单据编号.toLowerCase().includes(filter.toLowerCase()) ||
    item.日期.includes(filter) ||
    item.标签.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            上传新单据
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="按单据编号、日期或标签搜索..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : filteredHistory.length > 0 ? (
          <>
            <div className="mb-4 flex justify-end">
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                onClick={() => handleExport()}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出全部
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单据类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单据编号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">识别时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.单据类型}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.单据编号}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.日期}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.金额}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.识别时间}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {item.标签}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleView(item.id)}
                        >
                          查看
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 mr-3"
                          onClick={() => handleExport(item.id)}
                        >
                          导出
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(item.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">暂无识别记录，快去上传单据吧</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              去上传
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;