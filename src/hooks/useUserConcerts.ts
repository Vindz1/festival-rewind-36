import { useState, useEffect } from 'react';

export const useUserConcerts = () => {
  const [concerts, setConcerts] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('selected_concerts');
    if (saved) setConcerts(JSON.parse(saved));
  }, []);

  const toggleConcert = (concert: any) => {
    const exists = concerts.find(c => c.id === concert.id);
    const newSelection = exists 
      ? concerts.filter(c => c.id !== concert.id) 
      : [...concerts, { id: concert.id, artist: concert.artist.name, date: concert.eventDate }];
    
    setConcerts(newSelection);
    localStorage.setItem('selected_concerts', JSON.stringify(newSelection));
  };

  return { 
    concerts, 
    toggleConcert, 
    isSelected: (id: string) => concerts.some(c => c.id === id) 
  };
};
