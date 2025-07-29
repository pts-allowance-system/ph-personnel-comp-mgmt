import { AllowanceCalculationService } from './allowance-calculation-service';
import { RulesDAL } from '../dal/rules';
import { User, Rule } from '../models';

// Mock the RulesDAL
jest.mock('../dal/rules');

const mockedRulesDAL = RulesDAL as jest.Mocked<typeof RulesDAL>;

describe('AllowanceCalculationService', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    mockedRulesDAL.findAllActive.mockClear();
  });

  it('should return null when no rules are defined', async () => {
    mockedRulesDAL.findAllActive.mockResolvedValue([]);
    const user: Partial<User> = { position: 'Doctor' };
    const result = await AllowanceCalculationService.calculate(user);
    expect(result).toEqual({ allowanceGroup: null, tier: null });
  });

  it('should return null when no rules match the user profile', async () => {
    const mockRules: Rule[] = [
      {
        id: '1',
        name: 'Doctor Rule',
        priority: 100,
        isActive: true,
        conditions: { all: [{ fact: 'position', operator: 'Equal', value: 'Doctor' }] },
        outcome: { allowanceGroup: 'Doctor', tier: '1' },
      },
    ];
    mockedRulesDAL.findAllActive.mockResolvedValue(mockRules);
    const user: Partial<User> = { position: 'Nurse' };
    const result = await AllowanceCalculationService.calculate(user);
    expect(result).toEqual({ allowanceGroup: null, tier: null });
  });

  it('should return the correct allowance for a user matching a simple rule', async () => {
    const mockRules: Rule[] = [
      {
        id: '1',
        name: 'Doctor Rule',
        priority: 100,
        isActive: true,
        conditions: { all: [{ fact: 'position', operator: 'Equal', value: 'Doctor' }] },
        outcome: { allowanceGroup: 'Doctor', tier: '1' },
      },
    ];
    mockedRulesDAL.findAllActive.mockResolvedValue(mockRules);
    const user: Partial<User> = { position: 'Doctor' };
    const result = await AllowanceCalculationService.calculate(user);
    expect(result).toEqual({ allowanceGroup: 'Doctor', tier: '1' });
  });

  it('should return the correct allowance for a user matching a rule with multiple conditions (ALL)', async () => {
    const mockRules: Rule[] = [
      {
        id: '2',
        name: 'Specialist Nurse Rule',
        priority: 100,
        isActive: true,
        conditions: {
          all: [
            { fact: 'position', operator: 'Equal', value: 'Nurse' },
            { fact: 'certifications', operator: 'In', value: ['ICU Certified'] },
          ],
        },
        outcome: { allowanceGroup: 'Nurse', tier: '3' },
      },
    ];
    mockedRulesDAL.findAllActive.mockResolvedValue(mockRules);
    const user: Partial<User> = { position: 'Nurse', certifications: ['General', 'ICU Certified'] };
    const result = await AllowanceCalculationService.calculate(user);
    expect(result).toEqual({ allowanceGroup: 'Nurse', tier: '3' });
  });

  it('should return the correct allowance for a user matching a rule with multiple conditions (ANY)', async () => {
    const mockRules: Rule[] = [
        {
            id: '3',
            name: 'Pharmacist with Special Tasks or High-Risk Dept',
            priority: 100,
            isActive: true,
            conditions: {
                any: [
                    { fact: 'specialTasks', operator: 'In', value: ['Chemotherapy Prep'] },
                    { fact: 'department', operator: 'Equal', value: 'Oncology' },
                ],
            },
            outcome: { allowanceGroup: 'Pharmacist', tier: '2' },
        },
    ];
    mockedRulesDAL.findAllActive.mockResolvedValue(mockRules);
    const user: Partial<User> = { position: 'Pharmacist', department: 'Oncology' };
    const result = await AllowanceCalculationService.calculate(user);
    expect(result).toEqual({ allowanceGroup: 'Pharmacist', tier: '2' });
  });

  it('should prioritize the rule with the highest priority', async () => {
    const mockRules: Rule[] = [
      {
        id: '2',
        name: 'Specialist Nurse Rule',
        priority: 100, // Higher priority
        isActive: true,
        conditions: {
          all: [
            { fact: 'position', operator: 'Equal', value: 'Nurse' },
            { fact: 'certifications', operator: 'In', value: ['ICU Certified'] },
          ],
        },
        outcome: { allowanceGroup: 'Nurse', tier: '3' },
      },
      {
        id: '4',
        name: 'General Nurse Rule',
        priority: 50,
        isActive: true,
        conditions: { all: [{ fact: 'position', operator: 'Equal', value: 'Nurse' }] },
        outcome: { allowanceGroup: 'Nurse', tier: '1' },
      },
    ];
    mockedRulesDAL.findAllActive.mockResolvedValue(mockRules);
    const user: Partial<User> = { position: 'Nurse', certifications: ['ICU Certified'] };
    const result = await AllowanceCalculationService.calculate(user);
    expect(result).toEqual({ allowanceGroup: 'Nurse', tier: '3' });
  });
});
