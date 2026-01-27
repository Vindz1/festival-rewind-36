import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { UniversalSearch } from "@/components/UniversalSearch";
import { Loader2, CheckCircle2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      handleSpotifyCallback(code);
    }
  }, []);

  const handleSpotifyCallback = async (code: string) => {
    setIsProcessing(true);
    const songs = JSON.parse(localStorage.getItem("pending_songs") || "[]");
    
    try {
      setStatus("Connexion Spotify...");
      const res = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token", code })
      });
      const data = await res.json();

      if (!data.access_token) throw new Error("Token error");

      setStatus("Recherche des titres...");
      const uris = [];
      for (const s of songs.slice(0, 15)) {
        const sRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        const sData = await sRes.json();
        if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
      }

      setStatus("Création de la playlist...");
      const cRes = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create", 
          accessToken: data.access_token, 
          playlistName: "Ma Time Capsule Live", 
          uris 
        })
      });
      const cData = await cRes.json();
      setPlaylistUrl(cData.url);
    } catch (e) {
      console.error(e);
      setStatus("Erreur lors de la création.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header />
      <main className="pt-32 px-4 flex flex-col items-center">
        {isProcessing ? (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold tracking-tighter">{status}</h2>
          </div>
        ) : playlistUrl ? (
          <div className="max-w-md w-full text-center bg-zinc-900 p-10 rounded-[2.5rem] border border-primary/20 shadow-2xl">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 italic">C'est prêt !</h2>
            <p className="text-zinc-500 mb-8">Ta playlist est disponible sur ton compte.</p>
            <Button 
              className="w-full h-16 bg-primary text-black font-bold text-xl rounded-2xl hover:scale-105 transition-transform" 
              onClick={() => window.open(playlistUrl, "_blank")}
            >
              <Music className="mr-2" /> Ouvrir Spotify
            </Button>
            <button onClick={() => window.location.href = "/"} className="mt-6 text-zinc-600 underline text-sm">
              En créer une autre
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl text-center space-y-12">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase">
                Festival <span className="text-primary">Rewind</span>
              </h1>
              <p className="text-zinc-500 text-lg md:text-xl max-w-lg mx-auto">
                Transforme tes souvenirs Setlist.fm en playlists Spotify immortelles.
              </p>
            </div>
            <UniversalSearch />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
