// api/epay/callback.js
import { pool, query } from '@/lib/db'
import Epay from '@/lib/epay'
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465, // SSL端口
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // 注意保管！
  }
})

const epay = new Epay({
  pid: process.env.EPAY_PID,
  key: process.env.EPAY_KEY,
  baseUrl: process.env.EPAY_URL
})

export default async function handler(req, res) {
  // 开始计时
  const startTime = Date.now()
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method !== 'GET') {
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
 


  console.log('🔔 收到支付回调:', req.query)
   // 如果没有参数
   if (!req.query.out_trade_no || !req.query.trade_no || !req.query.money) {
    console.error('❌ 请求参数不完整')
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
  
  // 1. 验证签名
  if (!epay.verifyNotify(req.query)) {
    console.error('❌ 签名验证失败')
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

  // 2. 检查支付状态
  if (req.query.trade_status !== 'TRADE_SUCCESS') {
    console.log('⏸️ 支付未成功，状态:', req.query.trade_status)
    return res.status(200).send('success')
  }

  const { out_trade_no: orderNo, trade_no: epayNo, money } = req.query
  
  // 3. 解析订单号
  try {
    const [timestamp, encodedEmail, productId, randomNum] = orderNo.split('.')
    // 将邮箱的井号替换@
    const email = encodedEmail.replace(/#/g, '.')
    
    console.log('📦 订单信息:')
    console.log('  订单号:', orderNo)
    console.log('  商品ID:', productId)
    console.log('  用户邮箱:', email)
    console.log('  支付金额:', money)
    console.log('  易支付单号:', epayNo)
    const now = Date.now()
    if (now - timestamp > 3100000) {
      return res.status(404).json({
    success: false,
    error: {
      message: 'The requested API endpoint does not exist.',
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
    }
    // 4. 开始处理商品
    console.log('🔄 开始处理商品...')
    
    // 使用jsonb_array_elements和jsonb_agg来删除第一个元素
const result = await query(`
WITH 
-- 先获取要删除的卡密
old_data AS (
  SELECT 
    card_keys->>0 as card_key,  -- 直接获取文本
    name
  FROM products 
  WHERE id = $1
    AND status = 'active'
    AND stock > 0
    AND jsonb_array_length(card_keys) > 0
  FOR UPDATE
),
-- 更新商品
updated AS (
  UPDATE products 
  SET 
    card_keys = card_keys - 0,
    stock = stock - 1,
    updated_at = NOW()
  WHERE id = $1
  RETURNING stock as new_stock
)
SELECT 
  d.card_key,
  d.name,
  u.new_stock
FROM old_data d, updated u
WHERE d.card_key IS NOT NULL
`, [productId])
  
    // 5. 检查处理结果
    if (result.rows.length === 0) {
     
      console.log('❌ 商品处理失败，可能原因:')
      console.log('  1. 商品ID不存在')
      console.log('  2. 商品状态非active')
      console.log('  3. 库存不足')
      console.log('  4. 卡密已发完')
      console.log('⚠️ 需要人工处理订单:', orderNo)
    transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: `Szyang's Shop: 您于 ${new Date().toLocaleString('zh-CN')} 完成了一笔交易`,
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">交易失败通知</h2>
      <p>尊敬的用户，您好！</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>商品ID：</strong>${productId}</p>
            <p><strong>交易状态：</strong><span style="color: #ff4d4f; font-weight: bold;">交易失败</span></p>
            <p><strong>失败原因：</strong>商品处理异常，请稍后重试或联系客服</p>
            <p><strong>消费金额：</strong>${req.query.money || 0} LDC</p>
            <p><strong>通知时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
      </div>
      
      
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">
        本邮件为系统自动发送，请勿直接回复
      </p>
    </div>
  `
      });
    
      
      // TODO: 这里可以记录到文件或发送通知
    } else {
      const { name, card_key, new_stock } = result.rows[0]
      
      console.log('✅ 商品处理成功!')
      console.log('  商品名称:', name)
      console.log('  发放卡密:', card_key)
      console.log('  剩余库存:', new_stock)
      console.log('  用户邮箱:', email)
      
   
      
   const endTime = Date.now()
   console.log('Execution time:', endTime - startTime, 'ms')
    transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: `Szyang's Shop: 您于 ${new Date().toLocaleString('zh-CN')} 完成了一笔交易`,
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">交易成功通知</h2>
      <p>尊敬的用户，您好！</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>商品名称：</strong>${name}</p>
        <p><strong>卡密信息：</strong><span style="color: #ff4d4f; font-weight: bold;">${card_key}</span></p>
        <p><strong>消费金额：</strong>${req.query.money} LDC</p>
        <p><strong>发货时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
      </div>
      
      
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">
        本邮件为系统自动发送，请勿直接回复
      </p>
    </div>
  `
      });
    }
    
    // 7. 返回成功（必须返回success）
    console.log('🎉 回调处理完成\n')
    res.status(200).send('success')
    
  } catch (error) {
    console.error('💥 处理过程中出错:', error.message)
    console.error('错误详情:', error.stack)
    
    // 8. 即使出错也要返回success，避免支付平台重复回调
    console.log('⚠️ 返回success避免重复回调\n')
    res.status(200).send('success')
  }
}