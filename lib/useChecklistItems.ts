'use client';

import { useState, useEffect } from 'react';

interface ChecklistItem {
  item: string;
}

export function useChecklistItems(awardType: 'JOURNAL' | 'BOOK') {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/award-checklist/route?type=${awardType}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch checklist items');
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setItems((data.items || []).map((i: ChecklistItem) => i.item));
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [awardType]);

  return { items, loading, error };
}
