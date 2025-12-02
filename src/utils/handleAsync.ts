import { Response } from 'express'
import z, { ZodType } from 'zod'

export async function handleAsync<T>(
  res: Response,
  asyncFn: () => Promise<z.infer<T>>,
  options?: { schema?: T; errorCode?: number }
) {
  const { schema, errorCode = 400 } = options || {}

  try {
    const result = await asyncFn()
    const parsed = schema instanceof ZodType ? schema.parse(result) : result
    return res.status(200).json(parsed)
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(errorCode).json({ msg: err.message })
    } else {
      console.error('Unexpected error:', err)
      return res.status(500).json({ msg: '服务器内部错误' })
    }
  }
}
