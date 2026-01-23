import express from 'express';
import { authenticateToken } from '#middleware/auth.middleware.js';
import {
  deleteItemById,
  fetchAccountsById,
  fetchBalanceById,
  fetchCreateLinkToken,
  fetchExchangePublicToken,
  fetchSyncAccounts,
  fetchSyncTransactions,
  fetchTransactionById,
} from '#controllers/plaid.controller.js';


const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Link token creation
router.post('/create-link-token', fetchCreateLinkToken);

// Exchange public token
router.post('/exchange-token', fetchExchangePublicToken);

// Get accounts
router.get('/accounts', fetchAccountsById);

// Sync accounts for a specific item
router.post('/accounts/sync/:itemId', fetchSyncAccounts);

// Get balances
router.get('/balances', fetchBalanceById);

// Sync transactions
router.post('transactions/sync', fetchSyncTransactions);

// Get transaction
router.get('/transactions', fetchTransactionById);

// Remove item
router.delete('/items/:itemId', deleteItemById);

export default router;
