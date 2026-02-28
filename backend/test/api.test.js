const request = require('supertest');
const app = require('../server');

// 测试API接口
describe('API接口测试', () => {
  // 测试健康检查接口
  describe('GET /api/health', () => {
    it('应该返回状态ok', async () => {
      const response = await request(app).get('/api/health');
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  // 测试上传接口
  describe('POST /api/upload/single', () => {
    it('应该上传文件并返回识别结果', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .attach('document', './test/test-receipt.jpg')
        .expect('Content-Type', /json/);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recognitionResult');
    });
  });

  // 测试历史记录接口
  describe('GET /api/history', () => {
    it('应该返回历史记录列表', async () => {
      const response = await request(app).get('/api/history');
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // 测试导出接口
  describe('GET /api/export/excel', () => {
    it('应该导出Excel文件', async () => {
      const response = await request(app).get('/api/export/excel');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });
});