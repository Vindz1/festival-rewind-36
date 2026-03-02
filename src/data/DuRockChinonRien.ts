export interface ArtistData {
  id: string;
  name: string;
  stage: string;
  day: string;
}

export const DU_ROCK_CHINON_RIEN_LINEUP: ArtistData[] = [
  // ==========================================
  // SAMEDI 4 AVRIL 2026
  // ==========================================
  { id: 'drcr-1', name: 'Boston Tea Party', stage: 'Espace Rabelais', day: 'Samedi 4 Avril' },
  { id: 'drcr-2', name: 'BallsInHead', stage: 'Espace Rabelais', day: 'Samedi 4 Avril' },
  { id: 'drcr-3', name: 'Upraise', stage: 'Espace Rabelais', day: 'Samedi 4 Avril' },
  { id: 'drcr-4', name: 'Celkilt', stage: 'Espace Rabelais', day: 'Samedi 4 Avril' },
  
  // Groupe jouant en extérieur pendant les changements de plateau
  { id: 'drcr-5', name: 'C Quartier Libre', stage: 'Extérieur (Inter-plateaux)', day: 'Samedi 4 Avril' },
];
