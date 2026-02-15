import { Response } from 'express'
import z, { ZodType } from 'zod'

export async function handleAsync<T>(
  res: Response,
  asyncFn: () => Promise<z.infer<T>>,
  options?: { response?: T; errorCode?: number }
) {
  const { response, errorCode = 400 } = options || {}

  try {
    const result = await asyncFn()
    const parsed = response instanceof ZodType ? response.parse(result) : result
    res.status(200).json(parsed)
  } catch (err: unknown) {
    console.error('Error in handleAsync:', err)
    if (err instanceof Error) {
      res.status(errorCode).json({ msg: err.message })
    } else {
      console.error('Unexpected error:', err)
      res.status(500).json({ msg: '服务器内部错误' })
    }
  }
}
