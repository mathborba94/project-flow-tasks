import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  ownerId: z.string().cuid(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).default('ACTIVE'),
  budget: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const projectFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  ownerId: z.string().cuid().optional(),
  search: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectFilter = z.infer<typeof projectFilterSchema>