import prisma from '../prisma.js';

/**
 * GET /api/notes
 * Retrieve all notes belonging to the authenticated user
 */
export async function getNotes(req, res, next) {
  try {
    const { search } = req.query || {};

    const where = {
      userId: req.userId,
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notes/:id
 * Retrieve a single note by id belonging to the authenticated user
 */
export async function getNoteById(req, res, next) {
  try {
    const { id } = req.params;
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: `Note with id '${id}' not found`,
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notes
 * Create a new note attached to the authenticated user
 */
export async function createNote(req, res, next) {
  try {
    const payload = {
      ...req.validatedBody,
      userId: req.userId,
    };

    const note = await prisma.note.create({
      data: payload,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notes/:id
 * Update an existing note belonging to the authenticated user
 */
export async function updateNote(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Note with id '${id}' not found`,
      });
    }

    const updated = await prisma.note.update({
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
 * DELETE /api/notes/:id
 * Delete a note belonging to the authenticated user
 */
export async function deleteNote(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Note with id '${id}' not found`,
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
