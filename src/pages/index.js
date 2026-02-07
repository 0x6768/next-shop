// pages/index.js
import React from 'react'
import { 
  Card, 
  Button, 
  Row, 
  Col, 
  Typography,
  Space
} from 'antd'
import { Icon } from '@iconify/react'

const { Title, Text, Paragraph } = Typography

// VitePress 风格的卡片组件
const FeatureCard = ({ icon, title, description }) => (
  <Card
    style={{ 
      textAlign: 'center',
      height: '100%',
      border: '1px solid #eaecef',
      borderRadius: 8,
      transition: 'all 0.3s ease',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
    }}
    bodyStyle={{ padding: '32px 24px' }}
    hoverable
  >
    <div style={{ 
      fontSize: 48, 
      color: '#3eaf7c', // VitePress 的绿色
      marginBottom: 20
    }}>
      <Icon icon={icon} />
    </div>
    <Title level={4} style={{ marginBottom: 12, fontWeight: 600 }}>
      {title}
    </Title>
    <Text type="secondary" style={{ fontSize: 15 }}>
      {description}
    </Text>
  </Card>
)

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      paddingTop: 60, // 增加顶部间距，让内容不贴着导航栏
    }}>
      {/* Hero Section - 简洁的主标题区域 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 24px 60px 24px',
        maxWidth: 900,
        margin: '0 auto'
      }}>
        <Title level={1} style={{ fontSize: '3rem', fontWeight: 600, marginBottom: 24 }}>
          积分兑换
        </Title>
        <Paragraph style={{ fontSize: 20, color: '#6a8bad' }}>
          简单、快速、可靠的积分兑换服务
        </Paragraph>
      </div>

      {/* 核心功能卡片 */}
      <Row gutter={[24, 24]} justify="center" style={{ maxWidth: 1000, margin: '0 auto 80px auto', padding: '0 24px' }}>
        <Col xs={24} sm={12} md={8}>
          <FeatureCard 
            icon="carbon:flash" 
            title="快速兑换" 
            description="流程简化，一键操作，即时完成兑换。" 
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <FeatureCard 
            icon="carbon:security" 
            title="安全可靠" 
            description="系统稳定，交易安全，保障您的每一次兑换。" 
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <FeatureCard 
            icon="carbon:user-multiple" 
            title="无需注册" 
            description="打开即用，无需繁琐的注册和登录流程。" 
          />
        </Col>
      </Row>

      {/* 使用流程 - 更简洁的步骤 */}
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto 80px auto',
        textAlign: 'center',
        padding: '0 24px'
      }}>
        <Title level={2} style={{ marginBottom: 48 }}>
          如何使用
        </Title>
        
        <Row gutter={[48, 32]} justify="center">
          {[
            { icon: 'carbon:catalog', text: '在商品页选择您想要的商品' },
            { icon: 'carbon:checkmark-filled', text: '点击“立即兑换”进行确认' },
            { icon: 'carbon:gift', text: '获取兑换码或直接享受服务' }
          ].map((item, index) => (
            <Col xs={24} md={8} key={index}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 42, 
                  color: '#3eaf7c',
                  marginBottom: 16
                }}>
                  <Icon icon={item.icon} />
                </div>
                <Text style={{ fontSize: 16 }}>{item.text}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 行动号召 CTA */}
      <div style={{ 
        background: '#f9f9f9',
        padding: '60px 24px',
        textAlign: 'center',
        borderTop: '1px solid #eaecef',
        borderBottom: '1px solid #eaecef'
      }}>
        <Title level={2} style={{ marginBottom: 16 }}>
          准备好开始了吗？
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px auto' }}>
          浏览我们的精选商品，用积分兑换您的专属好礼。
        </Paragraph>
        <Space size="middle">
          <Button 
            type="primary" 
            size="large" 
            href="/shop"
            style={{ 
              padding: '0 32px', 
              height: 44, 
              fontSize: 16, 
              borderRadius: 6,
              background: '#3eaf7c',
              borderColor: '#3eaf7c'
            }}
          >
            浏览商品
            <Icon icon="carbon:arrow-right" style={{ marginLeft: 8, verticalAlign: 'middle' }} />
          </Button>
          <Button 
            size="large" 
            href="/help"
            style={{ 
              padding: '0 32px', 
              height: 44, 
              fontSize: 16, 
              borderRadius: 6 
            }}
          >
            使用帮助
          </Button>
        </Space>
      </div>

      {/* 页脚 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 24px',
      }}>
        <Text type="secondary" style={{ fontSize: 14 }}>
          积分兑换服务 © 2024
        </Text>
      </div>
    </div>
  )
}