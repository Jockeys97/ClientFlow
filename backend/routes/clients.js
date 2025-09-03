import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../lib/auth.js';
import { getPaginationParams, createPaginationResponse, buildWhereClause } from '../lib/pagination.js';
import emailService from '../lib/email.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/clients - List clients with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where = {
      userId: req.user.id,
      ...buildWhereClause(['name', 'email', 'company'], search)
    };

    const orderBy = { [sortBy]: sortOrder };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          projects: {
            select: { id: true, title: true, status: true }
          },
          _count: {
            select: { projects: true }
          }
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json(createPaginationResponse(clients, total, page, limit));
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/clients/:id - Get single client
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        projects: {
          include: {
            _count: {
              select: { tickets: true }
            }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/clients - Create client
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail(),
  body('company').trim().isLength({ min: 2 }).withMessage('Company must be at least 2 characters'),
  body('city').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingClient = await prisma.client.findUnique({
      where: { email: req.body.email }
    });

    if (existingClient) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }

    const client = await prisma.client.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(client).catch(err => 
      console.error('Welcome email failed for client', client.id, ':', err.message)
    );

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('company').optional().trim().isLength({ min: 2 }),
  body('city').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (req.body.email && req.body.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: req.body.email }
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;