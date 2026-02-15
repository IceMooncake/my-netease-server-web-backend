import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const TerritoryTypeEnum = z.enum(['NO_ENTRY', 'NO_BREAK']).openapi({ example: 'NO_ENTRY' })

export const CreateTerritorySchema = z
  .object({
    name: z.string().min(1).max(100),
    type: TerritoryTypeEnum.optional(),
  })
  .openapi('CreateTerritoryRequest')

export const UpdateLocationSchema = z
  .object({
    x1: z.number().int(),
    z1: z.number().int(),
    x2: z.number().int(),
    z2: z.number().int(),
  })
  .openapi('UpdateLocationRequest')

export const InviteMemberSchema = z
  .object({
    qq: z.string().min(5).max(20),
  })
  .openapi('InviteMemberRequest')

export const DonateSchema = z
  .object({
    amount: z.number().int().positive(),
  })
  .openapi('DonateRequest')

export const RemoveMemberSchema = z
  .object({
    qq: z.string().min(5).max(20), // Member to remove
  })
  .openapi('RemoveMemberRequest')

// Responses

export const TerritoryResponse = z
  .object({
    id: z.string(),
    name: z.string(),
    owner_id: z.string(),
    credits: z.number(),
    x1: z.number(),
    z1: z.number(),
    x2: z.number(),
    z2: z.number(),
    area: z.number(),
    cost: z.number(),
    type: TerritoryTypeEnum,
    status: z.string(),
    created_at: z.string().optional(),
  })
  .openapi('TerritoryResponse')

export const TerritoryListResponse = z.array(TerritoryResponse).openapi('TerritoryListResponse')

export const InvitationResponse = z.object({
  id: z.string(),
  territory_id: z.string(),
  territory_name: z.string(),
  inviter_qq: z.string(),
  invitee_qq: z.string(),
  created_at: z.string(),
}).openapi('InvitationResponse')

export const InvitationListResponse = z.array(InvitationResponse).openapi('InvitationListResponse')

export const SuccessMessageResponse = z
  .object({
    message: z.string(),
  })
  .openapi('SuccessMessageResponse')

