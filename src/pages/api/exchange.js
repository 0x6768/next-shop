import Epay from '@/lib/epay'
import { query } from '@/lib/db'

// 读环境变量
const epay = new Epay({
  pid: process.env.EPAY_PID, 
  key: process.env.EPAY_KEY,
  baseUrl: process.env.EPAY_URL
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { productId, email,quantity } = req.body
    
    if (!productId || !email || !quantity) {
      return res.status(400).json({ error: '参数不完整' })
    }
  
    if (quantity !== 1) {
      return res.status(400).json({ error: '商品数量只能为1' })
    }
    
    try {
      // 修正SQL查询，确保语法正确
      const productResult = await query('SELECT name, price, stock FROM products WHERE id = $1', [productId])
      
      if (!productResult || productResult.rows.length === 0) {
        return res.status(404).json({ error: '商品不存在' })
      }
      
      const product = productResult.rows[0]
      
      if (product.stock <= 0) {
        return res.status(400).json({ error: '商品库存不足' })
      }
      
      const timestamp = new Date().getTime()
      const randomNum = Math.floor(Math.random() * 1000000)
      // 将邮箱中的点替换成井号，避免解析问题
      const encode_email = email.replace(/\./g, '#')
      const orderId = `${timestamp}.${encode_email}.${productId}.${randomNum}`
      
      const result = await epay.pay({
        out_trade_no: orderId,
        name: product.name,
        money: product.price,
        return_url: process.env.EPAY_RETURN_URL,
      });
      
      // 检查返回中存不存在data.pay_url
      if (!result.data || !result.data.pay_url) {
        return res.status(500).json({
          success: false,
          error: '支付创建失败'
        })
      }
      
      res.status(201).json({
        success: true,
        orderId,
        message: '操作成功',
        pay_url: result.data.pay_url
      })
      
    } catch (error) {
      console.error('支付创建失败:', error)
      res.status(500).json({
        success: false,
        error: '支付创建失败: ' + error.message
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}