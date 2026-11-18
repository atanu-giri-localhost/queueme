import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, 'Title cannot exceed 200 characters')
    .optional()
    .default('Untitled Note'),
  content: z
    .string()
    .optional()
    .default(''),
  pinned: z
    .boolean()
    .optional()
    .default(false),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  content: z
    .string()
    .optional(),
  pinned: z
    .boolean()
    .optional(),
});

export function validateCreateNote(req, res, next) {
  const result = createNoteSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    return res.status(400).json({
      success: false,
      error: 'Invalid note data',
      details: issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.validatedBody = result.data;
  next();
}

export function validateUpdateNote(req, res, next) {
  const result = updateNoteSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    return res.status(400).json({
      success: false,
      error: 'Invalid note data',
      details: issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.validatedBody = result.data;
  next();
}
