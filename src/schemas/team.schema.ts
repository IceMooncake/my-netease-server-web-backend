// src/schemas/team.schema.ts
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const CreateTeamBody = z.object({
  name: z.string().min(1).openapi({ example: 'My Team' }),
}).openapi('CreateTeamBody')

export const CreateTeamResponse = z.object({
  id: z.string().openapi({ example: '100' }),
  name: z.string(),
  owner_id: z.string(),
  team_credits: z.string().openapi({ example: '0' }),
  created_at: z.date().or(z.string()).nullable(),
}).openapi('CreateTeamResponse')

export const JoinTeamBody = z.object({
  teamId: z.string().openapi({ example: '100', description: 'Team ID to join' }),
}).openapi('JoinTeamBody')

export const TransferBody = z.object({
  teamId: z.string().openapi({ example: '100' }),
  newOwnerId: z.string().openapi({ example: '12345678', description: 'QQ of the new owner' }),
}).openapi('TransferBody')

export const SuccessResponse = z.object({
  success: z.boolean(),
}).openapi('SuccessResponse')


export const TeamSummaryResponse = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.string(),
  team_credits: z.number(),
  members_count: z.number().optional(),
  territories_count: z.number().optional()
}).openapi('TeamSummaryResponse')

export const TeamDetailResponse = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.string(),
  team_credits: z.number(),
  members: z.array(z.object({ qq: z.string(), joined_at: z.date().or(z.string()) })),
  territories: z.array(z.object({ id: z.string(), name: z.string(), status: z.string(), area: z.number() }))
}).openapi('TeamDetailResponse')

export const MyTeamsResponse = z.array(TeamSummaryResponse).openapi('MyTeamsResponse')
