export const db = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue({ insertId: 1 }),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};
