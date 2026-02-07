// pages/api/products/[id].js
import { query } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: '商品不存在' })
  }
  
  try {
    const { id } = req.query
    
    if (!id) {
      return res.status(400).json({ error: '缺少商品ID' })
    }
    
    // 从数据库查询商品
    const result = await query(
      `SELECT 
        id, 
        name, 
        description, 
        price, 
        stock,
        card_keys as "cardKeys",
        created_at as "createdAt"
       FROM products 
       WHERE id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '商品不存在' })
    }
    
    const dbProduct = result.rows[0]
    
    // 映射旧接口的字段格式
    const product = {
      id: dbProduct.id,
      name: dbProduct.name,
      points: parseFloat(dbProduct.price), // 用 price 作为 points
      type: 'virtual', // 固定值
      icon: 'mdi:package-variant', // 默认图标
      color: '#1890ff', // 默认颜色
      description: dbProduct.description || '暂无描述',
      detail: dbProduct.description || '暂无详细描述',
      stock: dbProduct.stock
    }
    
    // 根据商品名称设置特定的图标和颜色
    if (product.name.includes('视频')) {
      product.icon = 'mdi:video'
      product.color = '#1890ff'
    } else if (product.name.includes('音乐')) {
      product.icon = 'mdi:music'
      product.color = '#52c41a'
    } else if (product.name.includes('云')) {
      product.icon = 'mdi:cloud'
      product.color = '#722ed1'
    } else if (product.name.includes('课程')) {
      product.icon = 'mdi:book-open'
      product.color = '#fa8c16'
    } else if (product.name.includes('游戏')) {
      product.icon = 'mdi:gamepad'
      product.color = '#eb2f96'
    } else if (product.name.includes('阅读') || product.name.includes('书')) {
      product.icon = 'mdi:book'
      product.color = '#13c2c2'
    }
    
    res.status(200).json(product)
    
  } catch (error) {
    console.error('获取商品详情失败:', error)
    res.status(500).json({ error: '获取商品详情失败' })
  }
}