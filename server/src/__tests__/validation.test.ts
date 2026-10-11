import {
  createObligationSchema,
  createRiskSchema,
  createTaskSchema,
  createVendorSchema,
} from '../validators/schemas';

describe('Server-side Zod Schema Validation', () => {
  test('Validates compliant obligation input correctly', () => {
    const valid = {
      title: 'Annual VAT Filing & Return Submission',
      description: 'Prepare monthly and annual VAT return for NBR review.',
      framework: 'National Board of Revenue (NBR)',
      category: 'Corporate & Tax',
      priority: 'high',
      dueDate: '2026-12-31',
    };

    const result = createObligationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test('Rejects obligation input with invalid priority or missing title', () => {
    const invalid = {
      title: 'A', // too short
      description: 'Test',
      priority: 'super-urgent', // invalid enum
      dueDate: '2026-12-31',
    };

    const result = createObligationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test('Validates risk scoring matrix input bounds (1-5)', () => {
    const validRisk = {
      title: 'Server Room Air Conditioning Failure',
      description: 'Hardware failure during peak summer heat in Dhaka datacenter.',
      likelihood: 4,
      impact: 5,
    };
    expect(createRiskSchema.safeParse(validRisk).success).toBe(true);

    const invalidRisk = {
      title: 'Test Risk',
      description: 'Testing bounds',
      likelihood: 6, // Exceeds max 5
      impact: 0, // Below min 1
    };
    expect(createRiskSchema.safeParse(invalidRisk).success).toBe(false);
  });

  test('Validates vendor email formatting and contract fields', () => {
    const validVendor = {
      name: 'CyberDefend Security Audits Ltd.',
      contactPerson: 'Saif Islam',
      email: 'saif@cyberdefend.com.bd',
    };
    expect(createVendorSchema.safeParse(validVendor).success).toBe(true);

    const invalidVendor = {
      name: 'Vendor',
      contactPerson: 'Contact',
      email: 'not-an-email',
    };
    expect(createVendorSchema.safeParse(invalidVendor).success).toBe(false);
  });
});
