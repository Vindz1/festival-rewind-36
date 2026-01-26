import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Import, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const UniversalSearch = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?action=getUserConcerts&username=${encodeURIComponent(username)}`);
      const data = await res.json();

      if (res.ok && data.concerts) {
        // On envoie vers la page de résultats avec la liste des concerts de l'utilisateur
        navigate('/search-results', { state: { results: data.concerts, username } });
      } else {
        toast.error(data.error || "Utilisateur introuvable");
      }
    } catch (err) {
      toast.error("Erreur lors de l'importation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6 text-primary">
        <User className="h-6 w-6" />
        <h2 className="text-xl font-bold text-white">Importe ton historique Setlist.fm</h2>
      </div>
      
      <form onSubmit={handleImport} className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Ton nom d'utilisateur (ex: JohnDoe)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-14 pl-4 bg-black border-zinc-700 text-white rounded-xl focus:ring-primary"
          />
        </div>
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl transition-all"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Import className="mr-2" />}
          Récupérer mes concerts
        </Button>
      </form>
      <p className="mt-4 text-xs text-center text-zinc-500 italic">
        Note : Ton profil Setlist.fm doit être public.
      </p>
    </div>
  );
};
