import { jest } from '@jest/globals';
await import('#src/utils/crypto.js');

jest.unstable_mockModule('#src/config/plaid.js', () => ({
  plaidClient: {
    sandboxPublicTokenCreate: jest.fn(),
    itemPublicTokenExchange: jest.fn(),
    itemGet: jest.fn(),
    institutionsGetById: jest.fn(),
    accountsGet: jest.fn(),
    linkTokenCreate: jest.fn(),
  },
}));

jest.unstable_mockModule('#config/database.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}));

jest.unstable_mockModule('#src/utils/crypto.js', () => ({
  encrypt: jest.fn(val => `encrypted:${val}`),
  decrypt: jest.fn(val => val.replace('encrypted:', '')),
}));

const { plaidClient } = await import('#src/config/plaid.js');
const { db } = await import('#config/database.js');
const plaidService = await import('#src/services/plaid.service.js');

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
      expect(result).toEqual({
        linkToken: 'test-token',
        expiration: undefined,
      });
    });

    it('should include access_token when itemId is provided', async () => {
      const userId = 1;
      const itemId = 123;
      const mockItem = { plaidAccessToken: 'encrypted:access-123' };

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

      const mockExchangeResponse = {
        data: {
          access_token: 'access-123',
          item_id: 'plaid-item-123',
        },
      };
      plaidClient.itemPublicTokenExchange.mockResolvedValue(
        mockExchangeResponse
      );

      const mockItemResponse = {
        data: {
          item: {
            institution_id: 'ins_1',
          },
        },
      };
      plaidClient.itemGet.mockResolvedValue(mockItemResponse);

      const mockInstitutionResponse = {
        data: {
          institution: {
            name: 'Chase',
          },
        },
      };
      plaidClient.institutionsGetById.mockResolvedValue(
        mockInstitutionResponse
      );

      const mockAccountsResponse = {
        data: {
          accounts: [],
        },
      };
      plaidClient.accountsGet.mockResolvedValue(mockAccountsResponse);

      db.limit.mockResolvedValue([]);
      const mockSavedItem = { id: 1, userId, plaidItemId: 'plaid-item-123' };
      db.returning.mockResolvedValue([mockSavedItem]);

      const result = await plaidService.exchangePublicToken(
        userId,
        publicToken
      );

      expect(plaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
        public_token: publicToken,
      });
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          plaidAccessToken: 'encrypted:access-123',
        })
      );
      expect(result).toEqual({
        itemId: 1,
        institutionName: 'Chase',
      });
    });
  });
});
