// src/pages/api/admin/universal.js
import { query } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST' })
  }

  const { password, action, data, table, where, ...params } = req.body
  
  console.log('收到管理员请求:', { 
    action, 
    table, 
    where,
    dataType: typeof data,
    hasData: !!data
  })
  
  // 密码验证
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    console.log('密码验证失败:', { provided: password, expected: process.env.ADMIN_PASSWORD })
    return res.status(401).json({ error: '密码错误' })
  }

  // 表名白名单
  const ALLOWED_TABLES = ['products', 'order_logs']
  if (table && !ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: '禁止访问该表' })
  }

  try {
    let result
    
    switch (action) {
      case 'tables':
        console.log('执行tables查询')
        result = await query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `)
        break
        
      case 'select':
        if (!table) {
          return res.status(400).json({ error: '缺少表名' })
        }
        
        console.log('执行select:', { table, where, limit: params.limit })
        
        let sql = `SELECT * FROM ${table}`
        const queryParams = []
        
        if (where && Object.keys(where).length > 0) {
          const conditions = []
          Object.entries(where).forEach(([key, value], index) => {
            conditions.push(`${key} = $${index + 1}`)
            queryParams.push(value)
          })
          sql += ' WHERE ' + conditions.join(' AND ')
        }
        
        // 排序
        sql += ' ORDER BY created_at DESC'
        
        // 分页
        if (params.limit) {
          sql += ` LIMIT $${queryParams.length + 1}`
          queryParams.push(params.limit)
        }
        
        console.log('执行SQL:', sql, queryParams)
        result = await query(sql, queryParams)
        break
        
      case 'insert':
        if (!table || !data) {
          return res.status(400).json({ error: '缺少表名或数据' })
        }
        
        console.log('执行insert:', { table, data })
        
        const insertKeys = Object.keys(data)
        const insertValues = []
        const placeholders = insertKeys.map((_, i) => `$${i + 1}`)
        
        // 处理每个字段的值
        insertKeys.forEach((key, index) => {
          let value = data[key]
          
          // 特殊处理JSON字段
          if (key === 'card_keys') {
            if (Array.isArray(value)) {
              // 已经是数组，转为JSON字符串
              insertValues.push(JSON.stringify(value))
            } else if (typeof value === 'string') {
              // 尝试解析JSON
              try {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                  insertValues.push(JSON.stringify(parsed))
                } else {
                  // 如果不是数组，按行分割
                  const lines = value.split('\n').map(k => k.trim()).filter(k => k)
                  insertValues.push(JSON.stringify(lines))
                }
              } catch (e) {
                // 解析失败，按行分割
                const lines = value.split('\n').map(k => k.trim()).filter(k => k)
                insertValues.push(JSON.stringify(lines))
              }
            } else if (value === null || value === undefined) {
              insertValues.push('[]')
            } else {
              // 其他类型，转为空数组
              insertValues.push('[]')
            }
          } else {
            // 其他字段直接使用
            insertValues.push(value)
          }
        })
        
        const insertSql = `
          INSERT INTO ${table} (${insertKeys.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `
        
        console.log('插入SQL:', insertSql)
        console.log('插入参数:', insertValues)
        
        result = await query(insertSql, insertValues)
        break
        
      case 'update':
        if (!table || !data || !where?.id) {
          return res.status(400).json({ error: '缺少参数' })
        }
        
        console.log('执行update:', { 
          table, 
          where, 
          data,
          cardKeys: data.card_keys,
          cardKeysType: typeof data.card_keys
        })
        
        const updateSets = []
        const updateValues = []
        let paramIndex = 1
        
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'id') { // 不更新ID
            // 特殊处理JSON字段
            if (key === 'card_keys') {
              if (Array.isArray(value)) {
                // 已经是数组，转为JSON字符串
                updateSets.push(`${key} = $${paramIndex}`)
                updateValues.push(JSON.stringify(value))
                paramIndex++
              } else if (typeof value === 'string') {
                // 尝试解析JSON
                try {
                  const parsed = JSON.parse(value)
                  if (Array.isArray(parsed)) {
                    updateSets.push(`${key} = $${paramIndex}`)
                    updateValues.push(JSON.stringify(parsed))
                    paramIndex++
                  } else {
                    // 如果不是数组，按行分割
                    const lines = value.split('\n').map(k => k.trim()).filter(k => k)
                    updateSets.push(`${key} = $${paramIndex}`)
                    updateValues.push(JSON.stringify(lines))
                    paramIndex++
                  }
                } catch (e) {
                  // 解析失败，按行分割
                  const lines = value.split('\n').map(k => k.trim()).filter(k => k)
                  updateSets.push(`${key} = $${paramIndex}`)
                  updateValues.push(JSON.stringify(lines))
                  paramIndex++
                }
              } else if (value === null || value === undefined) {
                updateSets.push(`${key} = $${paramIndex}`)
                updateValues.push('[]')
                paramIndex++
              } else {
                // 其他类型，转为空数组
                updateSets.push(`${key} = $${paramIndex}`)
                updateValues.push('[]')
                paramIndex++
              }
            } else {
              // 其他字段
              updateSets.push(`${key} = $${paramIndex}`)
              updateValues.push(value)
              paramIndex++
            }
          }
        })
        
        updateValues.push(where.id)
        const updateSql = `
          UPDATE ${table}
          SET ${updateSets.join(', ')}, updated_at = NOW()
          WHERE id = $${paramIndex}
          RETURNING *
        `
        
        console.log('更新SQL:', updateSql)
        console.log('更新参数:', updateValues)
        
        result = await query(updateSql, updateValues)
        break
        
      case 'delete':
        if (!table || !where?.id) {
          return res.status(400).json({ error: '缺少参数' })
        }
        
        console.log('执行delete:', { table, where })
        
        result = await query(
          `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
          [where.id]
        )
        break
        
      default:
        return res.status(400).json({ error: '不支持的action' })
    }
    
    console.log('操作成功:', { 
      action, 
      affectedRows: result?.rowCount,
      dataLength: result?.rows?.length 
    })
    
    res.json({
      success: true,
      data: result?.rows || [],
      affectedRows: result?.rowCount || 0
    })
    
  } catch (error) {
    console.error('管理员操作失败:', error.message)
    console.error('错误堆栈:', error.stack)
    console.error('请求体:', req.body)
    
    res.status(500).json({
      success: false,
      error: error.message,
      detail: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        body: req.body
      } : undefined
    })
  }
}