import { UsersDAL } from './users';
import { db } from '@/lib/db'; // This will be the manual mock
import bcrypt from 'bcryptjs';

// Since we are using a manual mock in __mocks__,
// we just need to tell Jest to use it.
jest.mock('@/lib/db');

// Mock bcrypt separately as it's a different module
jest.mock('bcryptjs');

// Cast the imported db object to our mock type to get type safety
const mockedDb = db as jest.Mocked<typeof db>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersDAL', () => {
  afterEach(() => {
    // Reset all mocks after each test to ensure a clean state
    jest.resetAllMocks();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const mockUser = { id: '1', nationalId: '123', firstName: 'John', lastName: 'Doe', email: 'j@j.com', role: 'employee' as const, passwordHash: 'hash' };
      mockedDb.select().from().where().limit.mockResolvedValue([mockUser]);

      const user = await UsersDAL.findById('1');

      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
      expect(mockedDb.select).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      mockedDb.select().from().where().limit.mockResolvedValue([]);
      const user = await UsersDAL.findById('1');
      expect(user).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should return a user when credentials are valid', async () => {
      const mockUser = { id: '1', nationalId: '123', firstName: 'John', lastName: 'Doe', email: 'j@j.com', role: 'employee' as const, passwordHash: 'hashedpassword' };
      mockedDb.select().from().where().limit.mockResolvedValue([mockUser]);
      mockedBcrypt.compare.mockResolvedValue(true);

      const user = await UsersDAL.authenticate('123', 'password');
      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
        mockedBcrypt.hash.mockResolvedValue('hashedpassword');
        const userData = { nationalId: '123', firstName: 'John', lastName: 'Doe', email: 'j@j.com', role: 'employee' as const, password: 'password' };

        mockedDb.insert().values.mockResolvedValue({ insertId: 1 });

        const userId = await UsersDAL.create(userData);
        expect(userId).toBeDefined();
        expect(mockedDb.insert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
        mockedDb.update().set().where.mockResolvedValue({ rowsAffected: 1 });
        const updates = { firstName: 'Jane' };
        const success = await UsersDAL.update('1', updates);
        expect(success).toBe(true);
        expect(mockedDb.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete a user', async () => {
        mockedDb.update().set().where.mockResolvedValue({ rowsAffected: 1 });
        const success = await UsersDAL.delete('1');
        expect(success).toBe(true);
    });
  });
});
