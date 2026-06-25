import { useState, useEffect, useCallback } from 'react';
import { Submission, loadSubmissions, saveSubmissions } from '../data/bdData';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const refresh = useCallback(() => {
    setSubmissions(loadSubmissions());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'nursery_submissions') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(interval); window.removeEventListener('storage', onStorage); };
  }, [refresh]);

  const add = useCallback((sub: Submission) => {
    const current = loadSubmissions();
    const updated = [...current, sub];
    saveSubmissions(updated);
    setSubmissions(updated);
  }, []);

  const update = useCallback((sub: Submission) => {
    const current = loadSubmissions();
    const updated = current.map(s => s.id === sub.id ? sub : s);
    saveSubmissions(updated);
    setSubmissions(updated);
  }, []);

  const remove = useCallback((id: string) => {
    const current = loadSubmissions();
    const updated = current.filter(s => s.id !== id);
    saveSubmissions(updated);
    setSubmissions(updated);
  }, []);

  return { submissions, refresh, add, update, remove };
}
