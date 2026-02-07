// pages/api/products/list.js
import { query } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
  
  try {
    const { category, search } = req.query
    
    // 只使用存在的字段查询
    const result = await query(
      `SELECT 
        id, 
        name, 
        description, 
        price, 
        stock,
        created_at
       FROM products 
       ORDER BY created_at DESC`,
      []
    )
    
    // 转换为与原接口相同的格式
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      points: parseFloat(row.price), // 使用 price 字段
      type: 'virtual', // 固定值
      category: 'general', // 固定值
      icon: 'mdi:package-variant', // 固定图标
      color: '#1890ff', // 固定颜色
      stock: row.stock,
      createdAt: row.created_at
    }))
    
    // 筛选（如果前端需要的话）
    let filteredProducts = products
    
    if (category && category !== 'all') {
      // 由于没有 category 字段，这里按固定值筛选
      filteredProducts = filteredProducts.filter(p => p.category === category)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
    }
    
    res.status(200).json(filteredProducts)
    
  } catch (error) {
    console.error('获取产品列表失败:', error)
    res.status(500).json([]) // 保持返回空数组
  }
}