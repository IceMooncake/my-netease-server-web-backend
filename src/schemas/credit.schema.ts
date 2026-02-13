// src/schemas/credit.schema.ts
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const ContributeBody = z.object({
  teamId: z.string().openapi({ example: '100' }),
  amount: z.number().int().positive().openapi({ example: 10, description: 'Amount of credits to contribute' }),
}).openapi('ContributeBody')

export const SuccessResponse = z.object({
  success: z.boolean(),
}).openapi('SuccessResponse')
