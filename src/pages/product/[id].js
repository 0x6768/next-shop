'use client';
import React, { useState, useEffect } from 'react';
import { 
  Layout,
  Button, 
  Typography, 
  Form, 
  Input,
  message,
  Spin,
  Modal,
  Alert,
  Space,
  Card,
  Row,
  Col,
  Tag,
  Statistic,
  Result,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ShoppingCartOutlined, 
  GiftOutlined,
  MailOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 获取商品详情
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setProductLoading(true);
    try {
      const response = await fetch(`/api/products/details?id=${id}`);
      if (!response.ok) throw new Error('商品不存在');
      const data = await response.json();
      setProduct(data);
      
      // 如果库存为0，禁用表单
      if (data.stock === 0) {
        message.warning('该商品已售罄');
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setProductLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (product.stock === 0) {
      message.error('商品已售罄，无法兑换');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          email: values.email,
          quantity: 1  // 固定为1，简化交互
        })
      });
      
      const result = await response.json();
      
      if (response.status === 400 && result.error?.includes('库存')) {
        message.error(result.error);
        await fetchProduct(); // 刷新库存
        return;
      }
      
      if (!response.ok) {
        throw new Error(result.error || '兑换失败');
      }
      
      // 兑换成功，显示结果页面
      message.success('兑换成功！正在跳转支付页面...');
      
      // 跳转到支付页面
      setTimeout(() => {
        router.push(`${result.pay_url}`);
      }, 1500);
      
    } catch (error) {
      console.error('兑换错误:', error);
      message.error(error.message || '兑换失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'error', text: '已售罄', color: '#ff4d4f' };
    if (stock < 3) return { status: 'warning', text: '库存紧张', color: '#fa8c16' };
    return { status: 'success', text: '有货', color: '#52c41a' };
  };

  if (productLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="加载商品信息..." />
      </div>
    );
  }

  if (!product) {
    return (
      <Result
        status="404"
        title="商品不存在"
        subTitle="抱歉，您访问的商品可能已被下架或不存在"
        extra={
          <Button 
            type="primary"
            onClick={() => router.push('/shop')}
            icon={<ShoppingCartOutlined />}
          >
            返回商城
          </Button>
        }
      />
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 导航栏 */}
      <Header style={{
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px #f0f1f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
          >
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            商品兑换
          </Title>
        </div>
        <Button 
          type="primary" 
          onClick={() => router.push('/shop')}
          icon={<ShoppingCartOutlined />}
        >
          商城首页
        </Button>
      </Header>

      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            {/* 左侧商品信息 */}
            <Col xs={24} md={16}>
              <Card style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 20 }}>
                  <Space align="center" style={{ marginBottom: 12 }}>
                    <Title level={2} style={{ margin: 0 }}>
                      {product.name}
                    </Title>
                    <Tag 
                      color={stockStatus.color}
                      style={{ fontSize: 14, padding: '4px 8px' }}
                    >
                      {stockStatus.text}
                    </Tag>
                  </Space>
                  
                  <Paragraph 
                    type="secondary" 
                    style={{ 
                      fontSize: 16, 
                      lineHeight: 1.6,
                      marginBottom: 24
                    }}
                  >
                    {product.description}
                  </Paragraph>
                </div>

                {/* 商品详情 */}
                  {process.env.NEXT_PUBLIC_GISCUS_REPO && (
            <Card title="商品讨论" style={{ marginTop: 16 }}>
              <div 
                ref={(ref) => {
                  if (ref && !ref.hasAttribute('data-loaded')) {
                    const script = document.createElement('script');
                    script.src = 'https://giscus.app/client.js';
                    script.setAttribute('data-repo', process.env.NEXT_PUBLIC_GISCUS_REPO);
                    script.setAttribute('data-repo-id', process.env.NEXT_PUBLIC_GISCUS_REPO_ID);
                    script.setAttribute('data-category', process.env.NEXT_PUBLIC_GISCUS_CATEGORY);
                    script.setAttribute('data-category-id', process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID);
                    script.setAttribute('data-mapping', 'pathname');
                    script.setAttribute('data-strict', '0');
                    script.setAttribute('data-reactions-enabled', '1');
                    script.setAttribute('data-emit-metadata', '0');
                    script.setAttribute('data-input-position', 'bottom');
                    script.setAttribute('data-theme', 'light');
                    script.setAttribute('data-lang', 'zh-CN');
                    script.setAttribute('crossorigin', 'anonymous');
                    script.async = true;
                    script.setAttribute('data-loaded', 'true');
                    ref.appendChild(script);
                  }
                }}
                style={{ minHeight: 200 }}
              />
            </Card>
          )}
              </Card>
            </Col>

            {/* 右侧兑换区域 */}
            <Col xs={24} md={8}>
              <Card
                title={
                  <Space>
                    <GiftOutlined />
                    <span>立即兑换</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                {/* 价格卡片 */}
                <div style={{ 
                  textAlign: 'center', 
                  padding: 20,
                  marginBottom: 20,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: '#389fff'
                }}>
                  <Text style={{ color: '#fff', opacity: 0.9 }}>兑换价格</Text>
                  <div style={{ fontSize: 48, fontWeight: 700, color: '#fff', margin: '8px 0' }}>
                    {product.points}
                  </div>
                  <Text style={{ color: '#fff', opacity: 0.9 }}>积分</Text>
                </div>

                {/* 库存信息 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6
                }}>
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#52c41a' }} />
                    <Text>当前库存</Text>
                  </Space>
                  <Text strong style={{ color: stockStatus.color, fontSize: 18 }}>
                    {product.stock} 件
                  </Text>
                </div>

                {/* 兑换表单 */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  disabled={product.stock === 0}
                >
                  <Form.Item
                    name="email"
                    label="接收邮箱"
                    rules={[
                      { required: true, message: '请输入接收邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                    extra="兑换成功后，卡密将发送到此邮箱"
                  >
                    <Input 
                      size="large"
                      placeholder="请输入邮箱地址"
                      prefix={<MailOutlined style={{ color: '#999' }} />}
                      disabled={product.stock === 0}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 8 }}>
                    <Alert
                      type="info"
                      showIcon
                      message="兑换说明"
                      description="兑换成功后，商品卡密将通过邮件发送，请确保邮箱地址正确"
                      style={{ marginBottom: 16 }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      disabled={product.stock === 0}
                      block
                      icon={<GiftOutlined />}
                      style={{
                        height: 48,
                        fontSize: 16,
                        fontWeight: 500
                      }}
                    >
                      {product.stock === 0 ? '已售罄' : `兑换 (${product.points}积分)`}
                    </Button>
                  </Form.Item>
                </Form>

                {/* 兑换规则 */}
               
              </Card>
            </Col>
          </Row>

          {/* 评论区域 */}
        
        </div>
      </Content>
    </Layout>
  );
}