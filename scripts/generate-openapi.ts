import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import 'dotenv/config'
import fs from 'fs'

import { registry as adminRegistry } from '../src/routes/admin.routes.js'
import { registry as authRegistry } from '../src/routes/auth.routes.js'
import { registry as notificationRegistry } from '../src/routes/notification.routes.js'
import { registry as territoriesRegistry } from '../src/routes/territories.routes.js'

// -----------------------------
// 注册 OpenAPI
// -----------------------------

// 合并所有的 Registry
const registry = new OpenAPIRegistry([
  authRegistry,
  adminRegistry,
  territoriesRegistry,
  notificationRegistry,
])

// 注册 Bearer Auth
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

// -----------------------------
// 生成 openapi 文档
// -----------------------------
const generator = new OpenApiGeneratorV3(registry.definitions)

const doc = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Minecraft Territory API',
    version: '1.0.0',
  },
  servers: [{ url: '/api', description: 'API v1' }],
})

// const basePath = process.env.OPEN_API_PATH || './docs/'
// Ensure directory exists or stick to what worked before
// The original script used `process.env.OPEN_API_PATH || ''`.
// And `fs.writeFileSync(basePath + 'openapi.json', ...)`
// If user sets paths relative to cwd.

const finalPath = (process.env.OPEN_API_PATH || '') + 'openapi.json'
fs.writeFileSync(finalPath, JSON.stringify(doc, null, 2))
console.log(`✅ OpenAPI document generated at ${finalPath}`)

process.exit(0)
