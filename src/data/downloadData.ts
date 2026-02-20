export interface ArtistData {
  id: string;
  name: string;
  stage: string;
  day: string;
}

export const DOWNLOAD_LINEUP: ArtistData[] = [
  // ==========================================
  // VENDREDI 12 JUIN 2026
  // ==========================================
  { id: 'dl-v-apex-1', name: 'Limp Bizkit', stage: 'Apex Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-apex-2', name: 'Cypress Hill', stage: 'Apex Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-apex-3', name: 'Electric Callboy', stage: 'Apex Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-apex-4', name: 'Tom Morello', stage: 'Apex Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-apex-5', name: 'Drowning Pool', stage: 'Apex Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-opus-1', name: 'Pendulum', stage: 'Opus Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-opus-2', name: 'Hollywood Undead', stage: 'Opus Stage', day: 'Vendredi 12 Juin' },
  { id: 'dl-v-ava-1', name: 'Scooter', stage: 'Avalanche Stage', day: 'Vendredi 12 Juin' },

  // ==========================================
  // SAMEDI 13 JUIN 2026
  // ==========================================
  { id: 'dl-s-apex-1', name: "Guns N' Roses", stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-apex-2', name: 'Halestorm', stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-apex-3', name: 'BABYMETAL', stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-apex-4', name: 'The Pretty Reckless', stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-apex-5', name: 'Mammoth', stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-apex-6', name: 'Those Damn Crows', stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-apex-7', name: 'Ego Kill Talent', stage: 'Apex Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-opus-1', name: 'Architects', stage: 'Opus Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-opus-2', name: 'Behemoth', stage: 'Opus Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-ava-1', name: 'The All-American Rejects', stage: 'Avalanche Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-ava-2', name: 'Magnolia Park', stage: 'Avalanche Stage', day: 'Samedi 13 Juin' },
  { id: 'dl-s-ava-3', name: 'As It Is', stage: 'Avalanche Stage', day: 'Samedi 13 Juin' },

  // ==========================================
  // DIMANCHE 14 JUIN 2026
  // ==========================================
  { id: 'dl-d-apex-1', name: 'Linkin Park', stage: 'Apex Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-apex-2', name: 'Bad Omens', stage: 'Apex Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-apex-3', name: 'Ice Nine Kills', stage: 'Apex Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-apex-4', name: 'Black Veil Brides', stage: 'Apex Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-opus-1', name: 'Trivium', stage: 'Opus Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-opus-2', name: 'Mastodon', stage: 'Opus Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-opus-3', name: 'Bush', stage: 'Opus Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-opus-4', name: 'Dogstar', stage: 'Opus Stage', day: 'Dimanche 14 Juin' },
  { id: 'dl-d-opus-5', name: 'Corrosion of Conformity', stage: 'Opus Stage', day: 'Dimanche 14 Juin' },

  // ==========================================
  // GROUPES ANNONCÉS - JOURS/SCÈNES À CONFIRMER
  // (Ordre alphabétique strict)
  // ==========================================
  { id: 'dl-tbc-1', name: 'Ankor', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-2', name: 'As Everything Unfolds', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-3', name: 'Ash', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-4', name: 'Blood Incantation', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-5', name: 'Bloodywood', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-6', name: 'Boundaries', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-7', name: 'Catch Your Breath', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-8', name: 'Cavalera', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-9', name: 'Decapitated', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-10', name: 'Die Spitz', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-11', name: 'Drain', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-12', name: 'Elder', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-13', name: 'Feeder', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-14', name: 'Gatecreeper', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-15', name: 'Headwreck', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-16', name: 'Holywatr', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-17', name: 'Imminence', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-18', name: 'Incantation', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-19', name: 'Ivri', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-20', name: 'James and the Cold Gun', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-21', name: 'Kublai Khan TX', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-22', name: 'Lake Malice', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-23', name: 'Lakeview', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-24', name: 'Last Train', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-25', name: 'Letlive.', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-26', name: 'Lowen', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-27', name: 'Melrose Avenue', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-28', name: 'Mouth Culture', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-29', name: 'Nasty', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-30', name: 'Native James', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-31', name: 'Nevertel', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-32', name: 'P.O.D.', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-33', name: 'Paleface Swiss', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-34', name: 'Periphery', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-35', name: 'Pussyliquor', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-36', name: 'Rain City Drive', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-37', name: 'Return to Dust', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-38', name: 'RØRY', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-39', name: 'Scene Queen', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-40', name: 'Self Deception', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-41', name: 'Set It Off', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-42', name: 'Sleep Theory', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-43', name: 'Social Distortion', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-44', name: 'South Arcade', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-45', name: 'Spineshank', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-46', name: 'Static-X', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-47', name: 'Story of the Year', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-48', name: 'Sweet Pill', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-49', name: 'Sweet Savage', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-50', name: 'Tailgunner', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-51', name: 'The Plot In You', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-52', name: 'The Pretty Wild', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-53', name: 'Thornhill', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-54', name: 'Thrown', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-55', name: 'Wayside', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-56', name: 'We Came As Romans', stage: 'À confirmer', day: 'À confirmer' },
  { id: 'dl-tbc-57', name: 'Zero 9:36', stage: 'À confirmer', day: 'À confirmer' }
];
