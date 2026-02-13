// src/schemas/vote.schema.ts
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const CastVoteBody = z.object({
  voteId: z.string().openapi({ example: '500' }),
  decision: z.boolean().openapi({ description: 'true for approve, false for reject' }),
}).openapi('CastVoteBody')

export const SuccessResponse = z.object({
  success: z.boolean(),
}).openapi('SuccessResponse')
