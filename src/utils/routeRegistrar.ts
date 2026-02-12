import { Router, RequestHandler } from 'express'
import { OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi'

// 扩展 RouteConfig 以包含 Express 处理器
interface AppRouteConfig extends RouteConfig {
  handler: RequestHandler | RequestHandler[]
}

export class RouteRegistrar {
  constructor(
    private registry: OpenAPIRegistry,
    private basePath: string = ''
  ) {}

  // 这是一个辅助函数，既注册 Express 路由，又注册 OpenAPI
  register(router: Router, config: AppRouteConfig) {
    // 1. 注册 OpenAPI 文档
    // 为了防止运行时修改原始对象，这里浅拷贝一份
    const openApiConfig = { ...config }

    // 拼接 basePath
    if (this.basePath) {
      openApiConfig.path = this.basePath + openApiConfig.path
    }

    delete (openApiConfig as any).handler
    this.registry.registerPath(openApiConfig)

    // 2. 注册 Express 路由
    // 转换 OpenAPI 的 path 参数 /users/{id} -> Express 的 /users/:id
    const expressPath = config.path.replace(/{([^}]+)}/g, ':$1')

    const method = config.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'

    const handlers = Array.isArray(config.handler) ? config.handler : [config.handler]

    // @ts-ignore
    router[method](expressPath, ...handlers)
  }
}
