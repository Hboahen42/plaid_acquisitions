import plaidService from '#src/services/plaid.service.js';
import { plaidClient } from '#src/config/plaid.js';
import { db } from '#config/database.js';

jest.mock('#src/config/plaid.js', () => ({
  plaidClient: {
    linkTokenCreate: jest.fn(),
    itemPublicTokenExchange: jest.fn(),
  },
}));

jest.mock('#config/database.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  },
}));

describe('Plaid Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLinkToken', () => {
    it('should create a link token for a new item', async () => {
      const userId = 1;
      const mockResponse = { data: { link_token: 'test-token' } };
      plaidClient.linkTokenCreate.mockResolvedValue(mockResponse);

      const result = await plaidService.createLinkToken(userId);

      expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
        user: { client_user_id: '1' },
        client_name: 'Plaid Acquisition API',
        products: expect.any(Array),
        country_codes: expect.any(Array),
        language: 'en',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should include access_token when itemId is provided', async () => {
      const userId = 1;
      const itemId = 123;
      const mockItem = { plaidAccessToken: 'access-123' };

      db.returning.mockResolvedValue([mockItem]); // Not really returning for select but we need a mock
      // Actually select mock:
      db.limit.mockResolvedValue([mockItem]);

      const mockResponse = { data: { link_token: 'update-token' } };
      plaidClient.linkTokenCreate.mockResolvedValue(mockResponse);

      await plaidService.createLinkToken(userId, itemId);

      expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: 'access-123',
        })
      );
    });
  });

  describe('exchangePublicToken', () => {
    it('should exchange public token and save item', async () => {
      const userId = 1;
      const publicToken = 'public-123';
      const institutionId = 'ins_1';
      const institutionName = 'Chase';

      const mockExchangeResponse = {
        data: {
          access_token: 'access-123',
          item_id: 'plaid-item-123',
        },
      };
      plaidClient.itemPublicTokenExchange.mockResolvedValue(
        mockExchangeResponse
      );

      const mockSavedItem = { id: 1, userId, plaidItemId: 'plaid-item-123' };
      db.returning.mockResolvedValue([mockSavedItem]);

      const result = await plaidService.exchangePublicToken(
        userId,
        publicToken,
        institutionId,
        institutionName
      );

      expect(plaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
        public_token: publicToken,
      });
      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockSavedItem);
    });
  });
});
