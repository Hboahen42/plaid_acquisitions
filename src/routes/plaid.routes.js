import express from 'express';
import { authenticateToken } from '#middleware/auth.middleware.js';
import {
  deleteItemById,
  fetchAccountsById,
  fetchBalanceById,
  callCreateLinkToken,
  callExchangePublicToken,
  callSyncAccounts,
  callSyncTransactions,
  fetchTransactionById,
  callCreateSandboxToken,
} from '#controllers/plaid.controller.js';


const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get Routes

// Get accounts
router.get('/accounts', fetchAccountsById);

// Get balances
router.get('/balances', fetchBalanceById);

// Get transaction
router.get('/transactions', fetchTransactionById);


// Post Routes
// Sandbox token creation
router.post('/create-sandbox-token', callCreateSandboxToken);

// Link token creation
router.post('/create-link-token', callCreateLinkToken);

// Exchange public token
router.post('/exchange-token', callExchangePublicToken);

// Sync accounts for a specific item
router.post('/accounts/sync/:itemId', callSyncAccounts);

// Sync transactions
router.post('/transactions/sync', callSyncTransactions);


// Delete Routes

// Remove item
router.delete('/items/:itemId', deleteItemById);

export default router;
