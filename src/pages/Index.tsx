import { motion } from 'framer-motion';
import { Flame, Music, Sparkles, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { UniversalSearch } from '@/components/UniversalSearch';

const Index = () => {
  return (
    <div className="min-h-screen bg-background noise">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl animate-pulse-slow" />
        
        {/* Content */}
        <div className="container relative z-10 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Revivez vos souvenirs de festivals</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-6xl md:text-8xl lg:text-9xl leading-none"
            >
              <span className="text-foreground">CRÉEZ VOS</span>
              <br />
              <span className="text-gradient-fire">PLAYLISTS</span>
              <br />
              <span className="text-foreground">SOUVENIRS</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Retrouvez les concerts que vous avez vécus et générez automatiquement 
              des playlists basées sur les setlists réelles des artistes.
            </motion.p>

            {/* Universal Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <UniversalSearch />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/festivals">
                <Button variant="fire" size="xl" className="group">
                  <Flame className="w-5 h-5" />
                  Hellfest
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="glass" size="lg" className="gap-2">
                <Play className="w-4 h-4" />
                Voir la démo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto"
            >
              {[
                { value: '5+', label: 'Éditions' },
                { value: '500+', label: 'Artistes' },
                { value: '∞', label: 'Souvenirs' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-3xl md:text-4xl text-gradient-fire">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
              COMMENT ÇA <span className="text-gradient-fire">MARCHE</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              En 3 étapes simples, retrouvez vos moments préférés
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Music className="w-8 h-8" />,
                title: 'SÉLECTIONNEZ',
                description: 'Choisissez les festivals auxquels vous avez assisté',
                step: '01',
              },
              {
                icon: <Flame className="w-8 h-8" />,
                title: 'COCHEZ',
                description: 'Marquez les concerts que vous avez vécus',
                step: '02',
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'GÉNÉREZ',
                description: 'Créez votre playlist basée sur les vraies setlists',
                step: '03',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative group"
              >
                <div className="bg-gradient-card border border-border rounded-2xl p-8 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-fire">
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 font-display text-6xl text-primary/10 group-hover:text-primary/20 transition-colors">
                    {feature.step}
                  </div>
                  
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  
                  <h3 className="font-display text-2xl text-foreground mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-gradient-card border border-border rounded-3xl p-12 shadow-card"
          >
            <Flame className="w-16 h-16 text-primary mx-auto mb-6 glow-fire" />
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              PRÊT À REVIVRE VOS <span className="text-gradient-fire">CONCERTS</span> ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Commencez dès maintenant et créez votre première playlist souvenir.
            </p>
            <Link to="/festivals">
              <Button variant="fire" size="xl">
                <Flame className="w-5 h-5" />
                Démarrer maintenant
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="font-display text-lg">SETLISTFEST</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Fait avec 🔥 pour les passionnés de festivals metal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;