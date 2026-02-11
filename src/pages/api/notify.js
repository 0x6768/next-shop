// api/epay/callback.js
import { query } from '@/lib/db'
import Epay from '@/lib/epay'
import nodemailer from 'nodemailer'

// 初始化邮件传输
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
})

// 初始化支付
const epay = new Epay({
  pid: process.env.EPAY_PID,
  key: process.env.EPAY_KEY,
  baseUrl: process.env.EPAY_URL
})

// 站点配置
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || '商城'

// 邮件模板
const EMAIL_TEMPLATES = {
  success: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">交易成功通知</h2>
      <p>尊敬的用户，您好！</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>商品名称：</strong>${data.productName}</p>
        <p><strong>卡密信息：</strong><span style="color: #ff4d4f; font-weight: bold;">${data.cardKey}</span></p>
        <p><strong>消费金额：</strong>${data.amount} LDC</p>
        <p><strong>发货时间：</strong>${data.time}</p>
      </div>
      
      <p>请妥善保管您的卡密信息，请勿泄露给他人。</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">
        本邮件为系统自动发送，请勿直接回复<br>
        ${SITE_NAME}
      </p>
    </div>
  `,
  
  failure: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff4d4f;">交易异常通知</h2>
      <p>尊敬的用户，您好！</p>
      
      <div style="background: #fff2f0; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffccc7;">
        <p><strong>交易状态：</strong><span style="color: #ff4d4f; font-weight: bold;">处理异常</span></p>
        <p><strong>异常原因：</strong>商品处理失败，请联系客服处理</p>
        <p><strong>消费金额：</strong>${data.amount} LDC</p>
        <p><strong>通知时间：</strong>${data.time}</p>
      </div>
      
  
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 12px;">
        本邮件为系统自动发送，请勿直接回复<br>
        ${SITE_NAME}
      </p>
    </div>
  `
}

// 发送邮件函数
async function sendEmail(to, type, data) {
  const subject = type === 'success' 
    ? `${SITE_NAME}: 交易成功 - ${data.productName}`
    : `${SITE_NAME}: 交易异常通知`
  
  const html = EMAIL_TEMPLATES[type]({
    ...data,
    time: new Date().toLocaleString('zh-CN')
  })
  
  try {
    await transporter.sendMail({
      from: `"${SITE_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    })
    console.log(`📧 ${type === 'success' ? '成功' : '异常'}邮件已发送至:`, to)
  } catch (error) {
    console.error('邮件发送失败:', error.message)
    // 邮件发送失败不应该影响支付回调，只记录日志
  }
}

// 验证回调签名
function validateRequest(query) {
  if (!query.out_trade_no || !query.trade_no || !query.money) {
    console.error('❌ 请求参数不完整')
    return false
  }
  
  if (!epay.verifyNotify(query)) {
    console.error('❌ 签名验证失败')
    return false
  }
  
  if (query.trade_status !== 'TRADE_SUCCESS') {
    console.log('⏸️ 支付未成功，状态:', query.trade_status)
    return false
  }
  
  return true
}

// 解析订单号
function parseOrderNo(orderNo) {
  const [timestamp, encodedEmail, productId, randomNum] = orderNo.split('.')
  
  // 验证时间戳（30分钟有效期）
  const now = Date.now()
  if (now - parseInt(timestamp) > 30 * 60 * 1000) {
    throw new Error('订单已过期')
  }
  
  // 解码邮箱（.替换#）
  const email = encodedEmail.replace(/#/g, '.')
  
  return {
    timestamp: parseInt(timestamp),
    email,
    productId,
    randomNum
  }
}

// 处理商品发货 - 简洁版本
async function processProduct(productId) {
  try {
    // 使用你原始的查询逻辑，但优化结构
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
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  } catch (error) {
    console.error('处理商品失败:', error)
    throw error
  }
}

// 简单记录日志到控制台（不需要数据库表）
async function logTransaction(orderInfo, productResult, epayNo, amount) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      orderNo: orderInfo.orderNo,
      epayNo,
      productId: orderInfo.productId,
      productName: productResult?.name || '未知商品',
      email: orderInfo.email,
      amount,
      cardKey: productResult?.card_key,
      status: productResult ? 'success' : 'failed',
      remainingStock: productResult?.new_stock
    }
    
    console.log('📊 交易日志:', JSON.stringify(logEntry, null, 2))
    
    // 可以选择将日志写入文件
    // const fs = require('fs')
    // fs.appendFileSync('transactions.log', JSON.stringify(logEntry) + '\n')
    
  } catch (error) {
    console.error('记录交易日志失败:', error.message)
    // 不中断主流程
  }
}

export default async function handler(req, res) {
  const startTime = Date.now()
  
  // 设置响应头
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // 只处理GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['GET']
    })
  }
  
  console.log('🔔 收到支付回调:', req.query)
  
  try {
    // 1. 验证请求
    if (!validateRequest(req.query)) {
      // 返回success防止支付平台重复回调
      return res.status(200).send('success')
    }
    
    const { out_trade_no: orderNo, trade_no: epayNo, money } = req.query
    
    // 2. 解析订单信息
    const orderInfo = parseOrderNo(orderNo)
    const { email, productId } = orderInfo
    
    console.log('📦 订单信息解析:')
    console.log('  - 订单号:', orderNo)
    console.log('  - 商品ID:', productId)
    console.log('  - 用户邮箱:', email)
    console.log('  - 支付金额:', money)
    console.log('  - 支付平台单号:', epayNo)
    
    // 3. 处理商品发货
    console.log('🔄 处理商品发货...')
    const productResult = await processProduct(productId)
    
    // 4. 发送邮件通知
    const mailData = {
      orderNo,
      productName: productResult?.name || '未知商品',
      cardKey: productResult?.card_key,
      amount: money,
      time: new Date().toLocaleString('zh-CN')
    }
    
    if (productResult) {
      console.log('✅ 商品处理成功:')
      console.log('  - 商品名称:', productResult.name)
      console.log('  - 发放卡密:', productResult.card_key)
      console.log('  - 剩余库存:', productResult.new_stock)
      
      await sendEmail(email, 'success', {
        ...mailData,
        productName: productResult.name,
        cardKey: productResult.card_key
      })
      
      // 记录成功交易（到控制台）
      await logTransaction(
        { ...orderInfo, orderNo },
        productResult,
        epayNo,
        money
      )
    } else {
      console.error('❌ 商品处理失败')
      console.error('  - 可能原因: 商品不存在/库存不足/状态异常')
      
      // 发送失败邮件
      await sendEmail(email, 'failure', mailData)
      
      // 记录失败交易
      await logTransaction(
        { ...orderInfo, orderNo },
        null,
        epayNo,
        money
      )
      
      console.error('⚠️ 需要人工处理的订单:', orderNo)
      
  
    
    // 5. 记录处理时间
    const endTime = Date.now()
    console.log(`⏱️ 处理耗时: ${endTime - startTime}ms`)
    console.log('🎉 回调处理完成\n')
    
    // 必须返回success，否则支付平台会重复回调
    res.status(200).send('success')
    
  }} catch (error) {
    console.error('💥 回调处理异常:')
    console.error('  - 错误信息:', error.message)
    if (process.env.NODE_ENV === 'development') {
      console.error('  - 错误堆栈:', error.stack)
    }
    console.error('  - 请求参数:', req.query)
    
    // 即使出错也要返回success，避免支付平台重复回调
    console.log('⚠️ 返回success避免重复回调\n')
    res.status(200).send('success')
  }
}