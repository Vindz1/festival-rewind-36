import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const UniversalSearch = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?action=user&username=${username}`);
      const data = await res.json();
      if (res.ok) {
        navigate('/search-results', { state: { results: data.results, username } });
      } else {
        alert("Utilisateur non trouvé");
      }
    } catch (err) {
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="max-w-md mx-auto space-y-4">
      <Input 
        placeholder="Ton pseudo Setlist.fm" 
        value={username} 
        onChange={e => setUsername(e.target.value)}
        className="h-14 bg-zinc-900 border-zinc-800 text-white"
      />
      <Button type="submit" disabled={loading} className="w-full h-14 bg-primary text-black font-bold">
        {loading ? <Loader2 className="animate-spin" /> : "Importer mes souvenirs"}
      </Button>
    </form>
  );
};
