import { UsersDAL } from './users';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Mock bcrypt, as it's an external dependency.
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersDAL', () => {
  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const mockUser = { id: '1', nationalId: '123', firstName: 'John', lastName: 'Doe', email: 'j@j.com', role: 'employee' as const, passwordHash: 'hash' };
      const dbSpy = jest.spyOn(db, 'select').mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any);

      const user = await UsersDAL.findById('1');

      expect(user).toBeDefined();
      expect(user?.id).toBe('1');
      expect(dbSpy).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      jest.spyOn(db, 'select').mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);
      const user = await UsersDAL.findById('1');
      expect(user).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should return a user when credentials are valid', async () => {
      const mockUser = { id: '1', nationalId: '123', firstName: 'John', lastName: 'Doe', email: 'j@j.com', role: 'employee' as const, passwordHash: 'hashedpassword' };
      jest.spyOn(db, 'select').mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any);
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

        const dbSpy = jest.spyOn(db, 'insert').mockReturnValue({
            values: jest.fn().mockResolvedValue({ insertId: 1 }),
        } as any);

        const userId = await UsersDAL.create(userData);
        expect(userId).toBeDefined();
        expect(dbSpy).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
        const dbSpy = jest.spyOn(db, 'update').mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
            }),
        } as any);
        const updates = { firstName: 'Jane' };
        const success = await UsersDAL.update('1', updates);
        expect(success).toBe(true);
        expect(dbSpy).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete a user', async () => {
        const dbSpy = jest.spyOn(db, 'update').mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
            }),
        } as any);
        const success = await UsersDAL.delete('1');
        expect(success).toBe(true);
    });
  });
});
