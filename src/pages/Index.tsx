import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function Index() {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const search = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/search?action=user&username=${user}`);
    const data = await res.json();
    if (res.ok) navigate('/search-results', { state: { results: data.results, username: user } });
    else alert("Utilisateur non trouvé");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-32 px-4">
      <Header />
      <h1 className="text-6xl font-black italic mb-4">FESTIVAL REWIND</h1>
      <p className="text-zinc-500 mb-12">Tes souvenirs Setlist.fm en playlist Spotify.</p>
      <form onSubmit={search} className="w-full max-w-md space-y-4">
        <Input placeholder="Pseudo Setlist.fm" value={user} onChange={e => setUser(e.target.value)} className="bg-zinc-900 border-zinc-800 h-14" />
        <Button className="w-full h-14 bg-primary text-black font-bold text-lg">
          {loading ? <Loader2 className="animate-spin" /> : "IMPORTER"}
        </Button>
      </form>
    </div>
  );
}
