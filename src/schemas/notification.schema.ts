import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const NotificationResponse = z
  .object({
    id: z.string(),
    content: z.string(),
    is_read: z.boolean(),
    created_at: z.string(),
  })
  .openapi('NotificationResponse')

export const NotificationListResponse = z
  .array(NotificationResponse)
  .openapi('NotificationListResponse')

// For mark as read, usually param ID is enough.
export const MarkAsReadSchema = z.object({
  id: z.string(),
})
