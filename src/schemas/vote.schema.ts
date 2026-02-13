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


export const VoteQuery = z.object({
  teamId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional()
}).openapi('VoteQuery')

export const VoteListResponse = z.array(z.object({
  id: z.string(),
  team_id: z.string(),
  type: z.string(),
  status: z.string(),
  title: z.string().nullable(),
  creator_qq: z.string(),
  deadline: z.date().or(z.string()),
  yes_votes: z.number().optional(),
  no_votes: z.number().optional()
})).openapi('VoteListResponse')
