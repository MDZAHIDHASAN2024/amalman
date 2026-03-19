import { useState, useEffect } from 'react';

export function useEditableList(storageKey, defaultItems) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultItems;
    } catch { return defaultItems; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
  }, [items, storageKey]);

  const add = (item) => setItems(prev => [...prev, { ...item, id: Date.now() }]);
  const edit = (id, updated) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const reset = (defaults) => setItems(defaults);

  return { items, add, edit, remove, reset };
}
