import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BatchResultPage = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const navigate = useNavigate();

  // 从路由参数中获取批量识别结果
  useEffect(() => {
    const { results: batchResults } = location.state || {};
    if (batchResults) {
      setResults(batchResults);
    }
  }, [location.state]);

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

  const handleViewSingle = (result) => {
    if (result.success) {
      navigate('/result', {
        state: {
          recognitionResult: result.data.recognitionResult,
          savedId: result.data.savedId,
          imagePath: result.data.imagePath
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">批量识别结果</h1>
          <button 
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-red-600"
          >
            返回
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">识别汇总</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border">
                <p className="text-gray-600 text-sm">总文件数</p>
                <p className="text-xl font-bold">{results.length}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-gray-600 text-sm">成功识别</p>
                <p className="text-xl font-bold text-green-600">{results.filter(r => r.success).length}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-gray-600 text-sm">识别失败</p>
                <p className="text-xl font-bold text-red-600">{results.filter(r => !r.success).length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">详细结果</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单据编号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.fileName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.success ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">成功</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">失败</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.success ? result.data.recognitionResult['单据编号'] : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.success ? result.data.recognitionResult['金额'] : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {result.success ? (
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewSingle(result)}
                        >
                          查看详情
                        </button>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            上传新单据
          </button>
          <button 
            onClick={() => setShowPrintPrompt(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存并打印
          </button>
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

export default BatchResultPage;