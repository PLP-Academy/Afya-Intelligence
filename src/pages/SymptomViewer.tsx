import { useEffect, useState } from 'react';
import { getSymptoms } from '@/integrations/supabase/client';

interface Symptom {
  // Correcting the type to match the actual data structure from Supabase
  id: string;
  user_id: string;
  symptom: string;
  timestamp: string; // The column is named timestamp, not created_at
  severity?: number | null; // Severity might be null for older records
}

const SymptomViewer = () => {
  const [symptoms, setSymptoms] = useState<Symptom[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const { data, error } = await getSymptoms();
        if (error) {
          throw new Error(typeof error === 'string' ? error : error.message || 'Unknown error');
        }
        setSymptoms(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  if (loading) {
    return <div className="p-4">Loading symptoms...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Symptom Records</h1>
      {symptoms && symptoms.length > 0 ? (
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          {JSON.stringify(symptoms, null, 2)}
        </pre>
      ) : (
        <p>No symptoms found.</p>
      )}
    </div>
  );
};

export default SymptomViewer;
