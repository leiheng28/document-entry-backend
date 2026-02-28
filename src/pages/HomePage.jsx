import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleUpload = async () => {
    if (files.length > 0) {
      try {
        setIsLoading(true);
        setError('');
        
        const formData = new FormData();
        
        if (files.length === 1) {
          // 单文件上传
          formData.append('document', files[0]);
          
          const response = await fetch('http://localhost:3001/api/upload/single', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 传递识别结果、保存ID和图片路径
            navigate('/result', { 
              state: { 
                recognitionResult: result.data.recognitionResult, 
                savedId: result.data.id,
                imagePath: result.data.imagePath 
              } 
            });
          } else {
            setError(result.error || '上传失败');
          }
        } else {
          // 批量上传
          files.forEach(file => {
            formData.append('documents', file);
          });
          
          const response = await fetch('http://localhost:3001/api/upload/multiple', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 导航到汇总结果页面
            navigate('/batch-result', { 
              state: { 
                results: result.results 
              } 
            });
          } else {
            setError(result.error || '批量上传失败');
          }
        }
      } catch (err) {
        setError('上传失败：' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">单据自动识别录单</h1>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept=".jpg,.jpeg,.png,.pdf" 
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg text-gray-600 mb-2">点击或拖拽上传单据</p>
            <p className="text-sm text-gray-500">支持 JPG、PNG、PDF 格式，单张文件≤10MB</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">已选择的文件</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div key={index} className="bg-gray-100 rounded p-2 flex items-center">
                  <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate" style={{ maxWidth: '120px' }}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <button 
            onClick={handleUpload}
            disabled={files.length === 0 || isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                识别中...
              </>
            ) : (
              '开始识别'
            )}
          </button>
        </div>

        <div className="mt-12 flex justify-between">
          <button 
            onClick={() => navigate('/history')}
            className="text-gray-600 hover:text-blue-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            历史记录
          </button>
          <div className="text-gray-500 text-sm">
            无需登录，直接使用
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;