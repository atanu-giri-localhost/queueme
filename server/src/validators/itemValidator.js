import { z } from 'zod';

export const MEDIA_TYPES = ['movie', 'video', 'article', 'book', 'course', 'audio'];
export const ITEM_STATUSES = ['queued', 'in_progress', 'completed'];
export const ITEM_PRIORITIES = ['high', 'medium', 'low'];

/**
 * Normalizes rating string/number to a 1–5 range string or null,
 * mirroring the frontend normalizeRating logic in storageService.js.
 */
export function normalizeRating(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const num = parseFloat(raw);
  if (isNaN(num)) return null;
  if (num > 5) {
    // Scale legacy 10-point scale to 1–5
    const scaled = Math.min(5, Math.max(1, Math.round((num / 2) * 10) / 10));
    return String(scaled);
  }
  if (num < 1) return '1';
  return String(Math.round(num * 10) / 10);
}

/**
 * Synchronizes status, progress, and progressLabel
 */
export function syncStatusAndProgress(data) {
  const synced = { ...data };
  const status = synced.status;

  if (status === 'completed') {
    synced.progress = 100;
    if (!synced.progressLabel) synced.progressLabel = 'Finished';
  } else if (status === 'queued') {
    synced.progress = 0;
    if (!synced.progressLabel) synced.progressLabel = 'Not started';
  } else if (status === 'in_progress') {
    if (typeof synced.progress !== 'number' || isNaN(synced.progress)) {
      synced.progress = 25;
    } else {
      synced.progress = Math.min(99, Math.max(0, Math.round(synced.progress)));
    }
    if (!synced.progressLabel) {
      synced.progressLabel = `In progress (${synced.progress}%)`;
    }
  }

  if (synced.rating !== undefined) {
    synced.rating = normalizeRating(synced.rating);
  }

  return synced;
}

// Transform tags from string or array to trimmed string array.
// Used in createItemSchema — always returns an array (empty if unset).
const tagsTransform = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean);
    }
    return String(val)
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  });

// Transform tags for PATCH/PUT updates:
// - When tags field is ABSENT (undefined), returns undefined so Prisma omits the field
//   and existing tags are preserved (critical: prevents silent tag erasure on partial updates).
// - When tags field IS present (even empty array), normalizes and stores it.
const tagsUpdateTransform = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined; // omit — do not overwrite existing tags
    if (!val || (Array.isArray(val) && val.length === 0)) return [];
    if (Array.isArray(val)) {
      return val.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean);
    }
    return String(val)
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  });

export const createItemSchema = z
  .object({
    id: z.string().trim().optional(),
    title: z.string().trim().min(1, 'Title is required').max(300, 'Title exceeds 300 characters'),
    type: z.enum(MEDIA_TYPES, {
      errorMap: () => ({ message: `Type must be one of: ${MEDIA_TYPES.join(', ')}` }),
    }),
    creator: z.string().trim().optional().default(''),
    platform: z.string().trim().optional().default(''),
    duration: z.string().trim().optional().default(''),
    progress: z.number().int().min(0).max(100).optional(),
    progressLabel: z.string().trim().optional(),
    status: z.enum(ITEM_STATUSES).optional().default('queued'),
    priority: z.enum(ITEM_PRIORITIES).optional().default('medium'),
    releaseYear: z.string().trim().optional().nullable(),
    rating: z.union([z.string(), z.number()]).optional().nullable(),
    tags: tagsTransform,
    coverImage: z.string().trim().optional().nullable(),
    url: z.string().trim().optional().nullable(),
    sourceUrl: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    addedDate: z.string().trim().optional().nullable(),
  })
  .transform((data) => syncStatusAndProgress(data));

export const updateItemSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(300).optional(),
    type: z.enum(MEDIA_TYPES).optional(),
    creator: z.string().trim().optional(),
    platform: z.string().trim().optional(),
    duration: z.string().trim().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    progressLabel: z.string().trim().optional(),
    status: z.enum(ITEM_STATUSES).optional(),
    priority: z.enum(ITEM_PRIORITIES).optional(),
    releaseYear: z.string().trim().optional().nullable(),
    rating: z.union([z.string(), z.number()]).optional().nullable(),
    tags: tagsUpdateTransform,
    coverImage: z.string().trim().optional().nullable(),
    url: z.string().trim().optional().nullable(),
    sourceUrl: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    addedDate: z.string().trim().optional().nullable(),
  })
  .transform((data) => {
    // Remove undefined tags so Prisma does not overwrite existing tags on partial updates.
    // tagsUpdateTransform returns undefined when tags was absent from the request body,
    // which is the signal to leave the DB column untouched.
    if (data.tags === undefined) {
      delete data.tags;
    }

    // If status is updated or progress is provided, sync them
    if (data.status !== undefined || data.progress !== undefined) {
      return syncStatusAndProgress(data);
    }
    if (data.rating !== undefined) {
      data.rating = normalizeRating(data.rating);
    }
    return data;
  });

export const queryParamsSchema = z.object({
  type: z.enum(['all', ...MEDIA_TYPES]).optional().default('all'),
  status: z.enum(['all', ...ITEM_STATUSES]).optional().default('all'),
  priority: z.enum(['all', ...ITEM_PRIORITIES]).optional().default('all'),
  search: z.string().trim().optional().default(''),
  sortBy: z.enum(['recent', 'priority', 'progress', 'title']).optional().default('recent'),
});

/**
 * Express Middleware helper to validate request bodies against a Zod schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        })),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Express Middleware helper to validate query params
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        })),
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}
