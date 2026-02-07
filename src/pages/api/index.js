export default async function handler(req, res) {
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Powered-By', 'PHP/7.2');
res.setHeader('Server', 'nginx/1.14.0');
  
  return res.status(404).json({
    success: false,
    error: {
      message: 'The requested API endpoint does not exist',
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
}