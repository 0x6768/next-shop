// pages/api/init_db.js
import { query } from '@/lib/db'

export default async function handler(req, res) {
  // 获取环境变量ADMIN_PASSWORD
  const admin_pass = process.env.ADMIN_PASSWORD
  if (req.query.password !== admin_pass) {
    return res.status(401).json({ success: false, error: 'Password Error' })
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: '只允许GET请求' })
  }
  
  try {
    // 1. 检查是否已初始化
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      )
    `)
    
    const isTableExists = checkResult.rows[0].exists
    
    if (isTableExists) {
      return res.status(200).json({ 
        success: true, 
        message: '数据库已初始化',
        data: { initialized: true }
      })
    }
    
    // 2. 创建products表
    await query(`
      CREATE TABLE products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        card_keys JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    res.status(200).json({ 
      success: true, 
      message: '数据库初始化成功',
      data: { initialized: true }
    })
    
  } catch (error) {
    console.error('数据库初始化失败:', error)
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: { initialized: false }
    })
  }
}