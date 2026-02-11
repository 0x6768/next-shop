// pages/exchange/waiting.js
import { useEffect, useState } from 'react'
import { Spin, message, Button } from 'antd'
import { useRouter } from 'next/router'

export default function ExchangeWaiting() {
  const router = useRouter()
  const { orderId } = router.query
  
  useEffect(() => {
    // 显示toast
    // message.success('兑换请求已提交')
  }, [])
  
  const handleContact = () => {
  const messages = [
    '本站没有客服，只有一只会敲代码的猫',
    '客服正在睡觉，明天也不一定醒',
    '别找了，这里只有404和寂寞',
    '您呼叫的客服不存在，请检查号码',
    '建议对着屏幕大喊三声，看看会不会有奇迹',
    '客服工资还没发，罢工了',
    '我们采用了先进的无人值守技术（就是没人）'
  ]
  const randomMsg = messages[Math.floor(Math.random() * messages.length)]
  message.info(randomMsg)
}
  
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 20
    }}>
      <div>
        {/* 转圈loading */}
        <Spin size="large" style={{ marginBottom: 24 }} />
        
        <h2 style={{ marginBottom: 12 }}>
          交易正在处理中
        </h2>
        
        <p style={{ 
          color: '#666', 
          marginBottom: 8,
          lineHeight: 1.5
        }}>
          坐等收邮件就行，别搁这儿刷新了
        </p>
        
        <p style={{ 
          color: '#666',
          marginBottom: 24,
          lineHeight: 1.5
        }}>
            没收到？看看垃圾邮件箱
        </p>
        
        <div>
          <Button 
            type="primary" 
            onClick={() => router.push('/shop')}
            style={{ marginRight: 12 }}
          >
            返回商城
          </Button>
          
          <Button onClick={handleContact}>
            联系客服
          </Button>
        </div>
      </div>
    </div>
  )
}