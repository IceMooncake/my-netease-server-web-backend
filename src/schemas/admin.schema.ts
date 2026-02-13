// src/schemas/admin.schema.ts
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

export const AdminTaskStatusEnum = z.enum(['PENDING', 'DONE', 'IGNORED', 'REJECTED']).openapi('AdminTaskStatus')
export const AdminTaskTypeEnum = z.enum([
  'REVIEW_TERRITORY_CREATE',
  'REVIEW_TERRITORY_DELETE',
  'REVIEW_TERRITORY_UPDATE',
  'CLEANUP_USER',
  'RECYCLE_TERRITORY_SIZE'
]).openapi('AdminTaskType')

export const ListTasksQuery = z.object({
  status: AdminTaskStatusEnum.optional(),
}).openapi('ListTasksQuery')

export const AdminTaskResponse = z.object({
  id: z.string(),
  type: AdminTaskTypeEnum,
  status: AdminTaskStatusEnum,
  payload: z.any(), // JSON payload
  created_at: z.date().or(z.string()),
  processed_at: z.date().or(z.string()).nullable(),
  processed_by: z.string().nullable(),
}).openapi('AdminTaskResponse')

export const ListTasksResponse = z.array(AdminTaskResponse).openapi('ListTasksResponse')

export const ProcessTaskBody = z.object({
  taskId: z.string().openapi({ example: '10' }),
  approved: z.boolean(),
  message: z.string().optional(),
}).openapi('ProcessTaskBody')

export const SuccessResponse = z.object({
  success: z.boolean(),
}).openapi('SuccessResponse')
