// lib/db.js
import { Pool } from 'pg'

// 检查 DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL 环境变量未设置')
  console.warn('请在 .env.local 中设置 DATABASE_URL')
  console.warn('示例: postgresql://username:password@localhost:5432/database')
}

// 创建连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 自动处理 SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// 测试连接
async function testConnection() {
  try {
    const client = await pool.connect()
    console.log('✅ 数据库连接成功')
    client.release()
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    console.log('请检查:')
    console.log('1. DATABASE_URL 是否正确')
    console.log('2. 数据库是否正在运行')
    console.log('3. 网络连接是否正常')
    return false
  }
}

// 查询函数
async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// 导出
export { pool, query, testConnection }