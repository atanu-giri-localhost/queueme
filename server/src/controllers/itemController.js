import prisma from '../prisma.js';
import { INITIAL_ITEMS } from '../../../src/data/sampleData.js';

/**
 * GET /api/items
 * Retrieve all items with optional filtering and sorting
 */
export async function getItems(req, res, next) {
  try {
    const { type, status, priority, search, sortBy } = req.validatedQuery || {};

    const where = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (search && search.trim()) {
      const trimmed = search.trim();
      const isTagSearch = trimmed.startsWith('#');
      const cleanTerm = (isTagSearch ? trimmed.slice(1) : trimmed).trim();

      if (isTagSearch) {
        if (cleanTerm) {
          where.tags = {
            has: cleanTerm,
          };
        }
      } else {
        where.OR = [
          { title: { contains: cleanTerm, mode: 'insensitive' } },
          { creator: { contains: cleanTerm, mode: 'insensitive' } },
          { platform: { contains: cleanTerm, mode: 'insensitive' } },
          { tags: { has: cleanTerm } },
        ];
      }
    }

    let orderBy = [];
    if (sortBy === 'title') {
      orderBy = [{ title: 'asc' }];
    } else if (sortBy === 'progress') {
      orderBy = [{ progress: 'desc' }, { title: 'asc' }];
    } else if (sortBy === 'priority') {
      // In PostgreSQL enum priority is high, medium, low
      orderBy = [{ priority: 'asc' }, { createdAt: 'desc' }];
    } else {
      // default: recent
      orderBy = [{ addedDate: 'desc' }, { createdAt: 'desc' }];
    }

    const items = await prisma.item.findMany({
      where,
      orderBy,
    });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/items/:id
 * Retrieve a single item by id
 */
export async function getItemById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Item with id '${id}' not found`,
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/items
 * Create a new queue item
 */
export async function createItem(req, res, next) {
  try {
    const payload = { ...req.validatedBody };

    if (!payload.addedDate) {
      payload.addedDate = new Date().toISOString().split('T')[0];
    }

    const created = await prisma.item.create({
      data: payload,
    });

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/items/:id
 * Update an existing item
 */
export async function updateItem(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.item.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Item with id '${id}' not found`,
      });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: req.validatedBody,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/items/:id
 * Delete an item by id
 */
export async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.item.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Item with id '${id}' not found`,
      });
    }

    await prisma.item.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Item with id '${id}' deleted successfully`,
      id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/items/reset
 * Reset the database to the initial sample items (matches the client reset action)
 */
export async function resetItems(req, res, next) {
  try {
    await prisma.item.deleteMany({});

    for (const item of INITIAL_ITEMS) {
      await prisma.item.create({
        data: {
          id: item.id,
          title: item.title,
          type: item.type,
          creator: item.creator || '',
          platform: item.platform || '',
          duration: item.duration || '',
          progress: typeof item.progress === 'number' ? item.progress : 0,
          progressLabel:
            item.progressLabel ||
            (item.status === 'completed'
              ? 'Finished'
              : item.status === 'queued'
                ? 'Not started'
                : `In progress (${item.progress ?? 0}%)`),
          status: item.status || 'queued',
          priority: item.priority || 'medium',
          releaseYear: item.releaseYear || null,
          rating: item.rating ? String(item.rating) : null,
          tags: Array.isArray(item.tags) ? item.tags : [],
          coverImage: item.coverImage || null,
          url: item.url || null,
          sourceUrl: item.sourceUrl || null,
          notes: item.notes || null,
          addedDate: item.addedDate || new Date().toISOString().split('T')[0],
        },
      });
    }

    const items = await prisma.item.findMany({
      orderBy: [{ addedDate: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      message: 'Queue items reset to initial sample data successfully',
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}
