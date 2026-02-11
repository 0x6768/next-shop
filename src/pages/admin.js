// src/pages/admin.js
import { useState, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Select,
  Button, 
  Table, 
  Tag, 
  Space, 
  notification, 
  Alert,
  Form,
  InputNumber,
  Modal
} from 'antd'
import { Icon } from '@iconify/react'
import { 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  LogoutOutlined,
  ReloadOutlined,
  PlusOutlined,
  CloseOutlined
} from '@ant-design/icons'

const { TextArea } = Input

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentTable, setCurrentTable] = useState('products')
  const [tableData, setTableData] = useState([])
  const [tables, setTables] = useState([])
  const [queryWhere, setQueryWhere] = useState('')
  const [editingRow, setEditingRow] = useState(null)
  const [editSidebarVisible, setEditSidebarVisible] = useState(false)
  const [editForm] = Form.useForm()
  const [addForm] = Form.useForm()

  // 检查是否已登录
  const isLoggedIn = !!currentPassword

  // 封装fetch请求
  const apiRequest = async (endpoint, data) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || result.message || '请求失败')
      }
      
      if (!result.success) {
        throw new Error(result.error || result.message || '操作失败')
      }
      
      return result
    } catch (error) {
      console.error('API请求错误:', error)
      throw error
    }
  }

  // 显示错误通知
  const showError = (message, description = '') => {
    console.error('错误详情:', description || message)
    notification.error({ 
      message: message || '操作失败',
      description: description || '请检查输入或网络连接'
    })
  }

  // 显示成功通知
  const showSuccess = (message, description = '') => {
    notification.success({ 
      message,
      description
    })
  }

  // 登录
  const handleLogin = async () => {
    if (!password) {
      showError('请输入密码')
      return
    }

    setLoading(true)
    try {
      const result = await apiRequest('/api/admin/crud', {
        password,
        action: 'tables'
      })
      
      setCurrentPassword(password)
      const tableNames = result.data.map(t => t.table_name)
      setTables(tableNames)
      showSuccess('登录成功')
      
      if (tableNames.length > 0) {
        setCurrentTable(tableNames[0])
        setTimeout(() => loadTableData(), 0)
      }
    } catch (error) {
      showError('登录失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  // 加载表数据
  const loadTableData = async () => {
    if (!currentPassword || !currentTable) return
    
    setLoading(true)
    try {
      let where
      if (queryWhere.trim()) {
        try {
          where = JSON.parse(queryWhere)
        } catch (e) {
          showError('WHERE条件JSON格式错误')
          setLoading(false)
          return
        }
      }
      
      const result = await apiRequest('/api/admin/crud', {
        password: currentPassword,
        action: 'select',
        table: currentTable,
        where,
        limit: 100
      })
      
      if (Array.isArray(result.data)) {
        setTableData(result.data)
      } else {
        console.error('API返回的数据不是数组:', result.data)
        setTableData([])
        showError('数据格式错误', '服务器返回的数据格式不正确')
      }
    } catch (error) {
      setTableData([])
      showError('查询失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  // 更新数据
  const handleUpdate = async (values) => {
    if (!editingRow) return
    
    setLoading(true)
    try {
      // 处理卡密字段
      if (values.card_keys && typeof values.card_keys === 'string') {
        values.card_keys = values.card_keys
          .split('\n')
          .map(k => k.trim())
          .filter(k => k)
      }
      
      const result = await apiRequest('/api/admin/crud', {
        password: currentPassword,
        action: 'update',
        table: currentTable,
        where: { id: editingRow.id },
        data: values
      })
      
      showSuccess('更新成功', `已更新 ${result.affectedRows || 0} 条记录`)
      loadTableData()
      setEditingRow(null)
      setEditSidebarVisible(false)
      editForm.resetFields()
    } catch (error) {
      showError('更新失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  // 添加新记录
  const handleAddNew = async (values) => {
    setLoading(true)
    try {
      // 处理通用JSON输入
      if (currentTable !== 'products' && values.data) {
        try {
          values = JSON.parse(values.data)
        } catch (e) {
          showError('JSON格式错误')
          return
        }
      }
      
      // 处理商品表的卡密
      if (currentTable === 'products' && values.card_keys && typeof values.card_keys === 'string') {
        values.card_keys = values.card_keys
          .split('\n')
          .map(k => k.trim())
          .filter(k => k)
      }
      
      const result = await apiRequest('/api/admin/crud', {
        password: currentPassword,
        action: 'insert',
        table: currentTable,
        data: values
      })
      
      showSuccess('添加成功', `已添加 ${result.affectedRows || 0} 条记录`)
      loadTableData()
      setEditSidebarVisible(false)
      addForm.resetFields()
    } catch (error) {
      showError('添加失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  // 删除数据
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await apiRequest('/api/admin/crud', {
            password: currentPassword,
            action: 'delete',
            table: currentTable,
            where: { id }
          })
          
          showSuccess('删除成功')
          loadTableData()
        } catch (error) {
          showError('删除失败', error.message)
        }
      }
    })
  }

  // 字段渲染函数
  const renderFormField = (key, value) => {
    // 状态字段
    if (key === 'status') {
      return (
        <Select>
          <Select.Option value="active">上架</Select.Option>
          <Select.Option value="inactive">下架</Select.Option>
          <Select.Option value="pending">待处理</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
          <Select.Option value="failed">失败</Select.Option>
        </Select>
      )
    }
    
    // 价格字段
    if (key.includes('price')) {
      return (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.01}
          formatter={val => `¥ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={val => val.replace(/¥\s?|(,*)/g, '')}
        />
      )
    }
    
    // 库存字段
    if (key.includes('stock')) {
      return (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
        />
      )
    }
    
    // 卡密字段
    if (key.includes('card_keys')) {
      return (
        <TextArea
          rows={4}
          placeholder="每行一个卡密"
          style={{ fontFamily: 'monospace' }}
        />
      )
    }
    
    // 描述字段
    if (key.includes('description')) {
      return (
        <TextArea
          rows={3}
          showCount
          maxLength={500}
        />
      )
    }
    
    // 对象/数组字段
    if (typeof value === 'object' && value !== null) {
      return (
        <TextArea
          rows={4}
          style={{ fontFamily: 'monospace' }}
          placeholder="JSON格式"
        />
      )
    }
    
    // 默认文本输入
    return <Input />
  }

  // 使用Iconify图标渲染
  const renderIcon = (iconName, props = {}) => {
    return <Icon icon={iconName} {...props} />
  }

  // 生成表格列
  const generateTableColumns = (data) => {
    if (!data || data.length === 0) return []
    
    const firstRow = data[0]
    if (!firstRow || typeof firstRow !== 'object') return []
    
    const columns = Object.keys(firstRow).map(key => {
      return {
        title: (
          <div style={{ fontWeight: 600 }}>
            {key}
            {key === 'id' && (
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                {renderIcon('mdi:key')}
              </span>
            )}
            {key.includes('price') && (
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                {renderIcon('mdi:cash')}
              </span>
            )}
            {key.includes('stock') && (
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                {renderIcon('mdi:package-variant')}
              </span>
            )}
            {key.includes('key') && (
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                {renderIcon('mdi:key-chain')}
              </span>
            )}
          </div>
        ),
        dataIndex: key,
        key,
        width: 150,
        render: (value) => {
          if (value === null || value === undefined) {
            return <span style={{ color: '#999', fontStyle: 'italic' }}>NULL</span>
          }
          
          // 时间字段
          if (key.endsWith('_at')) {
            try {
              const date = new Date(value)
              return (
                <div style={{ fontSize: 12 }}>
                  <div>{date.toLocaleDateString()}</div>
                  <div style={{ color: '#666' }}>{date.toLocaleTimeString()}</div>
                </div>
              )
            } catch {
              return String(value)
            }
          }
          
          // 状态字段
          if (key === 'status') {
            const statusConfig = {
              active: { color: 'green', text: '上架', icon: 'mdi:check-circle' },
              inactive: { color: 'red', text: '下架', icon: 'mdi:close-circle' },
              pending: { color: 'orange', text: '待处理', icon: 'mdi:clock' },
              completed: { color: 'blue', text: '已完成', icon: 'mdi:check' },
              failed: { color: 'volcano', text: '失败', icon: 'mdi:alert-circle' }
            }
            const config = statusConfig[value] || { 
              color: 'default', 
              text: value,
              icon: 'mdi:help-circle'
            }
            return (
              <Tag color={config.color}>
                {renderIcon(config.icon, { style: { marginRight: 4, fontSize: 12 } })}
                {config.text}
              </Tag>
            )
          }
          
          // 价格字段
          if (key.includes('price')) {
            return (
              <span style={{ color: '#cf1322', fontWeight: 500 }}>
                {renderIcon('mdi:currency-cny', { 
                  style: { marginRight: 4, fontSize: 12 } 
                })}
                {parseFloat(value).toFixed(2)}
              </span>
            )
          }
          
          // 库存字段
          if (key.includes('stock')) {
            const stock = parseInt(value)
            const config = stock > 10 
              ? { color: 'green', icon: 'mdi:package-up' }
              : stock > 0 
                ? { color: 'orange', icon: 'mdi:package-down' }
                : { color: 'red', icon: 'mdi:package-variant-remove' }
            
            return (
              <Tag color={config.color}>
                {renderIcon(config.icon, { style: { marginRight: 4, fontSize: 12 } })}
                {stock} 个
              </Tag>
            )
          }
          
          // 卡密字段
          if (key.includes('card_keys') && Array.isArray(value)) {
            return (
              <div>
                <Tag color="blue">
                  {renderIcon('mdi:key-chain-variant', { 
                    style: { marginRight: 4, fontSize: 12 } 
                  })}
                  {value.length} 个
                </Tag>
                {value.length > 0 && (
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    {value[0]}
                    {value.length > 1 && ` 等${value.length}个`}
                  </div>
                )}
              </div>
            )
          }
          
          // JSON对象
          if (typeof value === 'object' && !Array.isArray(value)) {
            return (
              <div
                style={{ 
                  cursor: 'pointer',
                  padding: 4,
                  backgroundColor: '#f6f8fa',
                  borderRadius: 4,
                  fontSize: 11
                }}
                onClick={() => {
                  Modal.info({
                    title: `查看 ${key}`,
                    width: 600,
                    icon: renderIcon('mdi:code-json'),
                    content: (
                      <pre style={{ 
                        maxHeight: '400px', 
                        overflow: 'auto',
                        backgroundColor: '#f6f8fa',
                        padding: 12
                      }}>
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    )
                  })
                }}
              >
                {renderIcon('mdi:database-outline', { 
                  style: { 
                    marginRight: 4, 
                    fontSize: 12,
                    verticalAlign: 'middle'
                  } 
                })}
                {Object.keys(value).length} 个字段
              </div>
            )
          }
          
          // 长文本截断
          if (typeof value === 'string' && value.length > 30) {
            return (
              <span title={value}>
                {value.substring(0, 30)}...
              </span>
            )
          }
          
          return String(value)
        }
      }
    })
    
    // 添加操作列
    columns.push({
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRow(record)
              setEditSidebarVisible(true)
              editForm.setFieldsValue(record)
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    })
    
    return columns
  }

  // 登录界面
  if (!isLoggedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        <Card 
          style={{ width: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          title={
            <div style={{ textAlign: 'center', fontSize: 20 }}>
              {renderIcon('mdi:database', { style: { marginRight: 8, fontSize: 20 } })}
              管理员登录
            </div>
          }
        >
          <Input.Password
            size="large"
            placeholder="输入管理员密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onPressEnter={handleLogin}
            style={{ marginBottom: 16 }}
            prefix={renderIcon('mdi:lock', { style: { color: '#ccc' } })}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleLogin}
            loading={loading}
            icon={renderIcon('mdi:login')}
          >
            登录
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* 主界面 */}
      <div style={{ 
        padding: 20, 
        minHeight: '100vh', 
        backgroundColor: '#f0f2f5',
        marginRight: editSidebarVisible ? 500 : 0,
        transition: 'margin-right 0.3s'
      }}>
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {renderIcon('mdi:database', { style: { marginRight: 8, fontSize: 16 } })}
                数据管理后台
              </span>
              <Space>
                <Select
                  style={{ width: 200 }}
                  value={currentTable}
                  onChange={(value) => {
                    setCurrentTable(value)
                    setTimeout(() => loadTableData(), 0)
                  }}
                  options={tables.map(table => ({ label: table, value: table }))}
                  suffixIcon={renderIcon('mdi:database')}
                />
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadTableData}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingRow(null)
                    setEditSidebarVisible(true)
                    addForm.resetFields()
                  }}
                >
                  添加记录
                </Button>
                <Button
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    setCurrentPassword('')
                    setPassword('')
                    setTableData([])
                    showSuccess('已退出登录')
                  }}
                >
                  退出
                </Button>
              </Space>
            </div>
          }
        >
          {/* 查询条件 */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 500 }}>
              {renderIcon('mdi:filter', { style: { marginRight: 4 } })}
              WHERE条件:
            </div>
            <Input
              value={queryWhere}
              onChange={e => setQueryWhere(e.target.value)}
              style={{ width: 300 }}
              placeholder='JSON格式，如: {"status": "active"}'
              prefix={renderIcon('mdi:code-json', { style: { color: '#ccc' } })}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={loadTableData}
              loading={loading}
            >
              查询
            </Button>
          </div>

          {/* 数据表格 */}
          {tableData.length > 0 ? (
            <Table
              dataSource={tableData}
              rowKey="id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              size="small"
              columns={generateTableColumns(tableData)}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true
              }}
            />
          ) : (
            <Alert
              message="暂无数据"
              description="请选择表并点击查询，或添加新记录"
              type="info"
              showIcon
              icon={renderIcon('mdi:database-search')}
            />
          )}
        </Card>
      </div>

      {/* 编辑侧边栏 */}
      {editSidebarVisible && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 500,
          background: '#fff',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 标题栏 */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa'
          }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {editingRow ? renderIcon('mdi:pencil') : renderIcon('mdi:plus')}
              <span style={{ marginLeft: 8 }}>
                {editingRow ? `编辑 ${editingRow.id}` : '添加记录'}
              </span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => {
                setEditingRow(null)
                setEditSidebarVisible(false)
                editForm.resetFields()
                addForm.resetFields()
              }}
            />
          </div>
          
          {/* 表单内容 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {editingRow ? (
              <Form
                form={editForm}
                layout="vertical"
              >
                {Object.entries(editingRow).map(([key, value]) => {
                  // 跳过不需要编辑的字段
                  if (key === 'id' || key === 'created_at' || key === 'updated_at') {
                    return null
                  }
                  
                  return (
                    <Form.Item
                      key={key}
                      label={key}
                      name={key}
                      style={{ marginBottom: 16 }}
                    >
                      {renderFormField(key, value)}
                    </Form.Item>
                  )
                })}
              </Form>
            ) : (
              <Form
                form={addForm}
                layout="vertical"
              >
                {currentTable === 'products' ? (
                  <>
                    <Form.Item
                      label="商品ID"
                      name="id"
                      rules={[{ required: true, message: '请输入商品ID' }]}
                    >
                      <Input 
                        prefix={renderIcon('mdi:identifier', { style: { color: '#ccc' } })}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="商品名称"
                      name="name"
                      rules={[{ required: true, message: '请输入商品名称' }]}
                    >
                      <Input 
                        prefix={renderIcon('mdi:tag', { style: { color: '#ccc' } })}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="价格"
                      name="price"
                      rules={[{ required: true, message: '请输入价格' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.01}
                        prefix="¥"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="库存"
                      name="stock"
                      initialValue={0}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        prefix={renderIcon('mdi:package-variant', { 
                          style: { color: '#ccc', marginRight: 4 } 
                        })}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="卡密"
                      name="card_keys"
                    >
                      <TextArea
                        rows={4}
                        placeholder="每行一个卡密"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="状态"
                      name="status"
                      initialValue="active"
                    >
                      <Select>
                        <Select.Option value="active">上架</Select.Option>
                        <Select.Option value="inactive">下架</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item
                    label="数据 (JSON格式)"
                    name="data"
                    rules={[
                      { required: true, message: '请输入数据' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve()
                          try {
                            JSON.parse(value)
                            return Promise.resolve()
                          } catch {
                            return Promise.reject('JSON格式错误')
                          }
                        }
                      }
                    ]}
                  >
                    <TextArea
                      rows={10}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Form.Item>
                )}
              </Form>
            )}
          </div>
          
          {/* 底部按钮 */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa',
            textAlign: 'right'
          }}>
            <Space>
              <Button
                onClick={() => {
                  setEditingRow(null)
                  setEditSidebarVisible(false)
                  editForm.resetFields()
                  addForm.resetFields()
                }}
                icon={renderIcon('mdi:close')}
              >
                取消
              </Button>
              {editingRow ? (
                <Button
                  type="primary"
                  onClick={() => editForm.validateFields().then(handleUpdate)}
                  loading={loading}
                  icon={renderIcon('mdi:content-save')}
                >
                  保存
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    addForm.validateFields()
                      .then(handleAddNew)
                      .catch(info => console.log('验证失败:', info))
                  }}
                  loading={loading}
                  icon={renderIcon('mdi:plus-circle')}
                >
                  添加
                </Button>
              )}
            </Space>
          </div>
        </div>
      )}
    </>
  )
}