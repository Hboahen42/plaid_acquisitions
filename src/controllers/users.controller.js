import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users from server...');
    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users.',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error('Error getting users', e);
    next(e);
  }
};

export const fetchCurrentUser = async (req, res, next) => {
  try{
    const userId = req.user.id;

    logger.info(`Getting current user: ${userId}`);
    const user = await getUserById(userId);

    res.json({
      message: 'Successfully retrieved current user',
      user,
    });
  } catch (e) {
    logger.error('Error getting current user', e);

    if (e.message === 'User not Found') {
      return res.status(404).json({error: 'User not Found'});
    }

    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Getting user by ID: ${id}`);

    const user = await getUserById(id);

    res.json({
      message: 'Successfully retrieved user.',
      user,
    });
  } catch (e) {
    logger.error('Error getting user by ID', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);
    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    // Authorization checks
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Users can only update their own information
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own information',
      });
    }

    // Only admins can change roles
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can change user roles',
      });
    }

    logger.info(`Updating user ID: ${id}`);
    const updatedUser = await updateUser(id, updates);

    res.json({
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (e) {
    logger.error('Error updating user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Authorization checks
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Users can only delete their own account, or admins can delete any account
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own account',
      });
    }

    // Prevent users from deleting themselves if they are the last admin
    if (req.user.id === id && req.user.role === 'admin') {
      // This would require additional logic to check if they're the last admin
      // For now, we'll allow it but log a warning
      logger.warn(`Admin user ${id} is deleting their own account`);
    }

    logger.info(`Deleting user ID: ${id}`);
    const result = await deleteUser(id);

    res.json(result);
  } catch (e) {
    logger.error('Error deleting user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
