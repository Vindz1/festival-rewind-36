import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Import } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const UniversalSearch = () => {
  const [user, setUser] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?action=user&username=${user}`);
      const data = await res.json();
      if (res.ok) {
        navigate('/search-results', { state: { list: data.concerts, username: user } });
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={startImport} className="max-w-md mx-auto space-y-4 bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
      <h2 className="text-xl font-bold text-center mb-6">Importe ton profil Setlist.fm</h2>
      <Input 
        placeholder="Ton pseudo (ex: Vindz)" 
        value={user} 
        onChange={e => setUser(e.target.value)}
        className="h-14 bg-black border-zinc-700"
      />
      <Button className="w-full h-14 bg-primary font-bold text-lg">
        {loading ? <Loader2 className="animate-spin" /> : "Récupérer mes concerts"}
      </Button>
    </form>
  );
};
