import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define the mock object that will be returned by the mocked createClient
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  data: null,
  error: null,
};

// Mock the supabase-js module. This is hoisted by Vitest.
// The factory returns an object where createClient is a mock function
// that returns our mockSupabase object.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Now that the mock is set up, we can import the function to be tested.
// When client.ts is imported, its call to createClient will use the mock above.
import { logSymptom } from './client';

describe('Supabase Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Reset the properties of the mockSupabase object
    mockSupabase.from.mockReturnThis();
    mockSupabase.data = null;
    mockSupabase.error = null;
  });

  it('should successfully log a symptom', async () => {
    // Arrange: Set up the mock to return a successful response
    mockSupabase.insert.mockResolvedValueOnce({ data: [{ id: 1, symptom: 'Headache', severity: 'Mild' }], error: null });

    const symptomData = {
      symptom: 'Headache',
      severity: 'Mild',
      userId: 'test-user-id',
    };

    // Act: Call the function
    const { data, error } = await logSymptom(symptomData);

    // Assert: Check that the correct methods were called with the correct arguments
    expect(mockSupabase.from).toHaveBeenCalledWith('symptoms');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      { symptom: 'Headache', severity: 'Mild', user_id: 'test-user-id' },
    ]);
    expect(data).toEqual([{ id: 1, symptom: 'Headache', severity: 'Mild' }]);
    expect(error).toBeNull();
  });

  it('should handle error when logging a symptom', async () => {
    // Arrange: Set up the mock to return an error response
    const mockError = { message: 'Database error' };
    mockSupabase.insert.mockResolvedValueOnce({ data: null, error: mockError });

    const symptomData = {
      symptom: 'Fever',
      severity: 'High',
      userId: 'test-user-id',
    };

    // Act: Call the function
    const { data, error } = await logSymptom(symptomData);

    // Assert: Check that the correct methods were called and the error is returned
    expect(mockSupabase.from).toHaveBeenCalledWith('symptoms');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      { symptom: 'Fever', severity: 'High', user_id: 'test-user-id' },
    ]);
    expect(data).toBeNull();
    expect(error).toEqual(mockError);
  });
});
