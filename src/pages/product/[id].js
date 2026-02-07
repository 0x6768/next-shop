// pages/product/[id].js
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Typography, 
  Form, 
  Input, 
  InputNumber,
  message,
  Tag,
  Space,
  Spin,
  Modal,
  Alert,
  Badge
} from 'antd'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/router'

const { Title, Text, Paragraph } = Typography
const { confirm } = Modal

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [formValues, setFormValues] = useState(null)

  // 获取商品详情
  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    setProductLoading(true)
    try {
      const response = await fetch(`/api/products/details?id=${id}`)
      if (!response.ok) throw new Error('商品不存在')
      const data = await response.json()
      setProduct(data)
      
      // 如果库存为0，重置表单数量
      if (data.stock === 0) {
        form.setFieldsValue({ quantity: 0 })
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setProductLoading(false)
    }
  }

  // 显示确认弹窗
  const showConfirm = (values) => {
    // 检查库存
    if (product.stock === 0) {
      message.error('商品已售罄，无法兑换')
      return
    }
    
    if (product.stock < 3 && product.stock > 0) {
      Modal.warning({
        title: '库存紧张',
        content: `该商品库存仅剩 ${product.stock} 件，请尽快兑换！`,
        okText: '知道了，继续兑换',
        onOk: () => {
          setFormValues(values)
          setShowConfirmModal(true)
        }
      })
    } else {
      setFormValues(values)
      setShowConfirmModal(true)
    }
  }

  // 确认兑换
  const handleConfirmExchange = async () => {
    setConfirmLoading(true)
    try {
      const response = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          email: formValues.email,
          quantity: formValues.quantity || 1
        })
      })
      
      const result = await response.json()
      
      if (response.status === 400 && result.error?.includes('库存')) {
        message.error(result.error)
        // 重新获取商品信息，更新库存
        fetchProduct()
        setConfirmLoading(false)
        setShowConfirmModal(false)
        return
      }
      
      if (!response.ok) {
        throw new Error(result.error || '兑换失败')
      }
      
      if (response.ok) {
        message.info('请稍后...')
        form.resetFields()
        setShowConfirmModal(false)
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push(`${result.pay_url}`)
        }, 1500)
      }
    } catch (error) {
      console.error('兑换错误:', error)
      message.error(error.message || '兑换失败，请重试')
      setConfirmLoading(false)
    }
  }

  // 取消兑换
  const handleCancelExchange = () => {
    setFormValues(null)
    setShowConfirmModal(false)
  }

  // 渲染库存状态标签
  const renderStockStatus = (stock) => {
    if (stock === 0) {
      return (
        <Badge 
          status="error" 
          text="已售罄" 
          style={{ 
            color: '#ff4d4f',
            fontSize: 14,
            fontWeight: 500
          }} 
        />
      )
    }
    
    if (stock < 3) {
      return (
        <Badge 
          status="warning" 
          text={`仅剩 ${stock} 件`} 
          style={{ 
            color: '#faad14',
            fontSize: 14,
            fontWeight: 500
          }} 
        />
      )
    }
    
    return (
      <Badge 
        status="success" 
        text={`库存 ${stock} 件`} 
        style={{ 
          color: '#52c41a',
          fontSize: 14,
          fontWeight: 500
        }} 
      />
    )
  }

  if (productLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ 
        padding: 100, 
        textAlign: 'center',
        minHeight: '100vh',
        background: '#fafafa'
      }}>
        <Icon 
          icon="mdi:alert-circle" 
          style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 20 }} 
        />
        <Title level={3}>商品不存在</Title>
        <Button 
          type="primary" 
          onClick={() => router.push('/shop')}
          style={{ marginTop: 20 }}
        >
          返回商城
        </Button>
      </div>
    )
  }

  return (
    <>
      <div style={{ 
        minHeight: '100vh', 
        background: '#fafafa',
        padding: 24
      }}>
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          {/* 返回按钮 */}
          <Button 
            type="link" 
            onClick={() => router.back()}
            style={{ alignSelf: 'flex-start', padding: 0 }}
          >
            ← 返回
          </Button>

          {/* 商品卡片 */}
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* 商品图标 */}
              <div style={{ 
                width: 80,
                height: 80,
                borderRadius: 12,
                background: product.color + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: product.color,
                fontSize: 32
              }}>
                <Icon icon={product.icon} width={40} height={40} />
              </div>

              {/* 商品信息 */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <div>
                    <Title level={3} style={{ marginBottom: 8 }}>
                      {product.name}
                    </Title>
                    {/* <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                      {product.description}
                    </Paragraph> */}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 32, 
                      fontWeight: 600,
                      color: '#ff4d4f',
                      lineHeight: 1
                    }}>
                      {product.points}
                    </div>
                    <Text type="secondary">积分</Text>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Tag color={product.color}>
                    {product.type === 'virtual' ? '虚拟商品' : '服务'}
                  </Tag>
                  {renderStockStatus(product.stock)}
                </div>
              </div>
            </div>
          </Card>

          {/* 库存警告提示 */}
          {product.stock < 3 && product.stock > 0 && (
            <Alert
              message="库存紧张"
              description={`该商品库存仅剩 ${product.stock} 件，欲购从速！`}
              type="warning"
              showIcon
              closable
            />
          )}

          {product.stock === 0 && (
            <Alert
              message="已售罄"
              description="该商品暂时缺货，请关注后续补货通知。"
              type="error"
              showIcon
              closable
            />
          )}

          {/* 商品详情 */}
          {product.detail && (
            <Card title="商品详情" style={{ borderRadius: 8 }}>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {product.detail}
              </Paragraph>
            </Card>
          )}

          {/* 兑换表单 */}
          <Card title="兑换" style={{ borderRadius: 8 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={showConfirm}
              initialValues={{ quantity: 1 }}
            >
              <Form.Item
                name="email"
                label="接收邮箱"
                rules={[
                  { required: true, message: '请输入接收邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
                help="兑换成功的卡密将发送到此邮箱"
              >
                <Input 
                  placeholder="输入您的邮箱地址" 
                  size="large"
                  type="email"
                  maxLength={50}
                  suffix={<Icon icon="mdi:email-outline" />}
                  disabled={product.stock === 0}
                />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="数量"
                initialValue={1}
                rules={[
                  { required: true, message: '请选择数量' },
                  { 
                    type: 'number', 
                    min: 1, 
                    max: product.stock,
                    message: `数量必须在1-${product.stock}之间` 
                  }
                ]}
                extra={product.stock > 0 ? `最多可购买 ${product.stock} 件` : '商品已售罄'}
              >
                <InputNumber
                  min={1}
                  max={product.stock}
                  style={{ width: '100%' }}
                  size="large"
                  disabled={product.stock === 0}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    style={{ padding: '0 40px' }}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? '已售罄' : '确认兑换'}
                  </Button>
                  <Button
                    size="large"
                    onClick={() => router.push('/shop')}
                  >
                    返回商城
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>

      {/* 确认兑换弹窗 */}
      <Modal
        title="请确认兑换信息"
        open={showConfirmModal}
        onOk={handleConfirmExchange}
        onCancel={handleCancelExchange}
        confirmLoading={confirmLoading}
        okText="确认兑换"
        cancelText="取消"
        width={480}
        okButtonProps={{
          danger: true,
        }}
        cancelButtonProps={{
          disabled: confirmLoading
        }}
      >
        <div style={{ lineHeight: '1.8' }}>
          {/* 库存警告 */}
          {product.stock < 3 && (
            <Alert
              message={product.stock === 1 ? '⚠️ 最后1件！' : '库存紧张'}
              description={`该商品库存仅剩 ${product.stock} 件`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <p>
            <Text strong>商品：</Text>
            <Text>{product.name}</Text>
          </p>
          <p>
            <Text strong>单价：</Text>
            <Text>{product.points} 积分</Text>
          </p>
          <p>
            <Text strong>数量：</Text>
            <Text>{formValues?.quantity}</Text>
          </p>
          <p>
            <Text strong>总计：</Text>
            <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>
              {product.points * (formValues?.quantity || 1)} 积分
            </Text>
          </p>
          <p>
            <Text strong>接收邮箱：</Text>
            <Text>{formValues?.email}</Text>
          </p>
          
          {/* 剩余库存信息 */}
          {product.stock > 0 && (
            <div style={{ 
              marginTop: 12, 
              padding: '8px 12px', 
              background: '#f6ffed', 
              borderRadius: 4,
              border: '1px solid #b7eb8f'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon icon="mdi:package-variant" style={{ color: '#52c41a' }} />
                <Text type="secondary">
                  兑换后库存将剩余: 
                  <Text strong style={{ marginLeft: 4, color: '#52c41a' }}>
                    {product.stock - (formValues?.quantity || 1)} 件
                  </Text>
                </Text>
              </div>
            </div>
          )}
          
          <div style={{ 
            marginTop: 20, 
            padding: '10px', 
            background: '#f5f5f5', 
            borderRadius: 4 
          }}>
            <Text type="secondary">
              兑换成功后，积分将立即扣除，商品卡密将发送至上述邮箱，请确保信息无误。
            </Text>
          </div>
        </div>
      </Modal>
    </>
  )
}