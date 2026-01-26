import { useState, useEffect } from 'react';

export const useUserConcerts = () => {
  const [concerts, setConcerts] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('my_concerts');
    if (saved) setConcerts(JSON.parse(saved));
  }, []);

  const toggleConcert = (concert: any) => {
    const exists = concerts.find(c => c.id === concert.id);
    let newSelection;
    if (exists) {
      newSelection = concerts.filter(c => c.id !== concert.id);
    } else {
      newSelection = [...concerts, concert];
    }
    setConcerts(newSelection);
    localStorage.setItem('my_concerts', JSON.stringify(newSelection));
  };

  return { concerts, toggleConcert, isSelected: (id: string) => concerts.some(c => c.id === id) };
};
