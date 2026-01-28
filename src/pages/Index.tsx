import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { UniversalSearch } from "@/components/UniversalSearch";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [status, setStatus] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      // Supprimer le code de l'URL pour la propreté
      window.history.replaceState({}, document.title, "/");
      processSpotify(code);
    }
  }, []);

  const processSpotify = async (code: string) => {
    const songs = JSON.parse(localStorage.getItem("pending_songs") || "[]");
    try {
      setStatus("Connexion Spotify...");
      const res = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token", code })
      });
      const { access_token } = await res.json();

      setStatus("Synchronisation des titres...");
      const uris = [];
      for (const s of songs.slice(0, 20)) {
        const sRes = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(s.title)}%20artist:${encodeURIComponent(s.artist)}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const sData = await sRes.json();
        if (sData.tracks?.items?.[0]) uris.push(sData.tracks.items[0].uri);
      }

      setStatus("Création de la playlist...");
      const cRes = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", accessToken: access_token, uris })
      });
      const cData = await cRes.json();
      setPlaylistUrl(cData.url);
    } catch (e) {
      alert("Erreur lors de la création");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-32 flex flex-col items-center">
        {status && !playlistUrl ? (
          <div className="text-center space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">{status}</h2>
          </div>
        ) : playlistUrl ? (
          <div className="max-w-md text-center bg-zinc-900 p-10 rounded-3xl border border-primary/20">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
            <Button variant="fire" className="w-full h-14" onClick={() => window.open(playlistUrl, "_blank")}>Ouvrir Spotify</Button>
          </div>
        ) : (
          <div className="w-full max-w-2xl text-center space-y-12">
            <h1 className="text-6xl font-black italic uppercase">Festival <span className="text-primary">Rewind</span></h1>
            <UniversalSearch />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
