import { Response } from 'express'

/**
 * 封装异步请求处理，自动捕获错误并返回 HTTP 响应
 * @param res Express Response 对象
 * @param asyncFn 异步业务函数，需返回成功结果（可以是任何）
 */
export async function handleAsync<T>(
  res: Response,
  asyncFn: () => Promise<T>,
  errorCode: number = 400
) {
  try {
    const result = await asyncFn()
    return res.status(200).json(result)
  } catch (err: unknown) {
    if (err instanceof Error) {
      // 这里可以根据错误类型自定义状态码
      return res.status(errorCode).json({ msg: err.message })
    } else {
      console.error('Unexpected error:', err)
      return res.status(500).json({ msg: '服务器内部错误' })
    }
  }
}
