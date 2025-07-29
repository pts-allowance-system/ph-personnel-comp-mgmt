// A very simple mock to test if the file is being picked up at all.
export const db = {
  select: jest.fn(() => ({
    from: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn().mockResolvedValue([]),
      })),
    })),
  })),
  insert: jest.fn(() => ({
      values: jest.fn().mockResolvedValue({ insertId: 1 })
  })),
  update: jest.fn(() => ({
      set: jest.fn(() => ({
          where: jest.fn().mockResolvedValue({ rowsAffected: 1 })
      }))
  }))
};
