import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUserById,
  deleteUserById,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = express.Router();

// Public route for getting all users (could be restricted based on requirements)
router.get('/', authenticateToken, requireRole(['admin']), fetchAllUsers);

// Protected routes - require authentication
router.get('/:id', authenticateToken, fetchUserById);
router.put('/:id', authenticateToken, updateUserById);
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  deleteUserById
);

export default router;
