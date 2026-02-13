// src/schemas/territory.schema.ts
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const TerritoryTypeEnum = z.enum(['NO_ENTRY', 'NO_BREAK']).openapi('TerritoryType')

export const ProposeCreateBody = z.object({
  teamId: z.string().openapi({ example: '100' }),
  x1: z.number().int(),
  z1: z.number().int(),
  x2: z.number().int(),
  z2: z.number().int(),
  type: TerritoryTypeEnum,
  name: z.string().min(1),
}).openapi('ProposeCreateBody')

export const ProposeDeleteBody = z.object({
  territoryId: z.string().openapi({ example: '200' }),
}).openapi('ProposeDeleteBody')

export const ProposeCreateResponse = z.object({
  id: z.string(),
  team_id: z.string(),
  area: z.string(),
  cost: z.string(),
  name: z.string(),
  x1: z.number(),
  z1: z.number(),
  x2: z.number(),
  z2: z.number(),
  type: TerritoryTypeEnum,
  status: z.string(),
}).openapi('ProposeCreateResponse')

export const SuccessResponse = z.object({
  success: z.boolean(),
}).openapi('SuccessResponse')


export const TerritoryQuery = z.object({
  teamId: z.string().optional()
}).openapi('TerritoryQuery')

export const TerritoryListResponse = z.array(z.object({
  id: z.string(),
  name: z.string(),
  team_id: z.string(),
  x1: z.number(),
  z1: z.number(),
  x2: z.number(),
  z2: z.number(),
  area: z.number(),
  type: TerritoryTypeEnum,
  status: z.string()
})).openapi('TerritoryListResponse')
