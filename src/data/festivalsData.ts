// src/data/festivalsData.ts

export interface Festival {
  id: string;
  name: string;
  location: string;
  country: string;
  coordinates: [number, number]; // [latitude, longitude]
  dates: string;
  year: number;
  genre: string[];
  website?: string;
  lineup?: string[]; // Top headliners SI CONFIRMÉS OFFICIELLEMENT
  hasDetailedPage: boolean;
}

export const FESTIVALS_2026: Festival[] = [
  // ===== EUROPE =====
  {
    id: 'hellfest-2026',
    name: 'Hellfest',
    location: 'Clisson, France',
    country: 'France',
    coordinates: [47.0875, -1.2815],
    dates: '18-21 juin 2026',
    year: 2026,
    genre: ['Metal', 'Hard Rock', 'Punk'],
    website: 'https://www.hellfest.fr',
    lineup: ['Iron Maiden', 'Bring Me The Horizon', 'Limp Bizkit', 'The Offspring'],
    hasDetailedPage: true
  },
  {
    id: 'download-uk-2026',
    name: 'Download Festival UK',
    location: 'Donington Park, UK',
    country: 'Royaume-Uni',
    coordinates: [52.8297, -1.3756],
    dates: '12-14 juin 2026',
    year: 2026,
    genre: ['Rock', 'Metal', 'Alternative'],
    website: 'https://downloadfestival.co.uk',
    lineup: ["Limp Bizkit", "Guns N' Roses", "Linkin Park"],
    hasDetailedPage: true
  },
  {
    id: 'wacken-2026',
    name: 'Wacken Open Air',
    location: 'Wacken, Allemagne',
    country: 'Allemagne',
    coordinates: [53.9833, 9.3833],
    dates: '30 juil - 1er août 2026',
    year: 2026,
    genre: ['Metal', 'Heavy Metal'],
    website: 'https://www.wacken.com',
    lineup: ['Judas Priest', 'Def Leppard', 'Powerwolf', 'In Flames', 'Arch Enemy'],
    hasDetailedPage: true
  },
  {
    id: 'motocultor-2026',
    name: 'Motocultor Festival',
    location: 'Carhaix, France',
    country: 'France',
    coordinates: [48.2766, -3.5709], 
    dates: '13-16 août 2026',
    year: 2026,
    genre: ['Metal', 'Hardcore', 'Rock'],
    website: 'https://www.motocultor-festival.com',
    lineup: ['Judas Priest', 'Within Temptation', 'Godsmack', 'Airbourne', 'Emperor'],
    hasDetailedPage: true
  },
  {
    id: 'graspop-2026',
    name: 'Graspop Metal Meeting',
    location: 'Dessel, Belgique',
    country: 'Belgique',
    coordinates: [51.2333, 5.1167],
    dates: '18-21 juin 2026',
    year: 2026,
    genre: ['Metal', 'Hard Rock'],
    website: 'https://www.graspop.be',
    hasDetailedPage: false
  },
  {
    id: 'rock-am-ring-2026',
    name: 'Rock am Ring',
    location: 'Nürburgring, Allemagne',
    country: 'Allemagne',
    coordinates: [50.3322, 6.9475],
    dates: '5-7 juin 2026',
    year: 2026,
    genre: ['Rock', 'Metal', 'Alternative'],
    website: 'https://www.rock-am-ring.com',
    lineup: ['Linkin Park', 'Iron Maiden', 'Volbeat', 'Slipknot', 'The Offspring'],
    hasDetailedPage: true
  },
  {
    id: 'copenhell-2026',
    name: 'Copenhell',
    location: 'Copenhague, Danemark',
    country: 'Danemark',
    coordinates: [55.6761, 12.5683],
    dates: '17-20 juin 2026',
    year: 2026,
    genre: ['Metal', 'Hard Rock'],
    website: 'https://www.copenhell.dk',
    hasDetailedPage: false
  },
  {
    id: 'resurrection-2026',
    name: 'Resurrection Fest',
    location: 'Viveiro, Espagne',
    country: 'Espagne',
    coordinates: [43.6614, -7.5947],
    dates: '1-4 juillet 2026',
    year: 2026,
    genre: ['Metal', 'Punk', 'Hardcore'],
    website: 'https://www.resurrectionfest.es',
    hasDetailedPage: false
  },
  {
    id: 'tuska-2026',
    name: 'Tuska Open Air',
    location: 'Helsinki, Finlande',
    country: 'Finlande',
    coordinates: [60.1695, 24.9354],
    dates: '26-28 juin 2026',
    year: 2026,
    genre: ['Metal'],
    website: 'https://www.tuska-festival.fi',
    hasDetailedPage: false
  },

  // ===== LES PÉPITES (FRANCE & BE) =====
  {
    id: 'sylak-2026',
    name: 'Sylak Open Air',
    location: 'Saint-Maurice-de-Gourdans, France',
    country: 'France',
    coordinates: [45.8239, 5.1956],
    dates: 'Août 2026',
    year: 2026,
    genre: ['Metal', 'Hardcore', 'Punk'],
    website: 'https://www.sylakopenair.com',
    hasDetailedPage: false
  },
  {
    id: 'planer-fest-2026',
    name: "Plane'R Fest",
    location: 'Colombier-Saugnieu, France',
    country: 'France',
    coordinates: [45.7119, 5.1158],
    dates: 'Juillet 2026',
    year: 2026,
    genre: ['Metal', 'Metalcore', 'Rock'],
    website: 'https://www.planerfest.com',
    hasDetailedPage: false
  },
  {
    id: 'xtreme-fest-2026',
    name: 'Xtreme Fest',
    location: 'Cap Découverte, France',
    country: 'France',
    coordinates: [44.0206, 2.1469],
    dates: 'Août 2026',
    year: 2026,
    genre: ['Punk', 'Hardcore', 'Thrash'],
    website: 'https://xtremefest.fr',
    hasDetailedPage: false
  },
  {
    id: 'rock-in-bourlon-2026',
    name: 'Rock in Bourlon',
    location: 'Bourlon, France',
    country: 'France',
    coordinates: [50.1772, 3.1186],
    dates: 'Juin 2026',
    year: 2026,
    genre: ['Stoner', 'Doom', 'Psych'],
    website: 'https://www.rockinbourlon.com',
    hasDetailedPage: false
  },
  {
    id: 'mennecy-metal-fest-2026',
    name: 'Mennecy Metal Fest',
    location: 'Mennecy, France',
    country: 'France',
    coordinates: [48.5667, 2.4333],
    dates: 'Septembre 2026',
    year: 2026,
    genre: ['Metal', 'Hard Rock'],
    website: 'https://mennecy-metal-fest.com',
    hasDetailedPage: false
  },
  {
    id: 'furios-fest-2026',
    name: 'Furios Fest',
    location: 'Saint-Flour, France',
    country: 'France',
    coordinates: [45.0333, 3.0833],
    dates: 'Août 2026',
    year: 2026,
    genre: ['Metal', 'Hardcore'],
    website: 'https://furiosfest.com',
    hasDetailedPage: false
  },
  {
    id: 'betizfest-2026',
    name: 'BetiZFest',
    location: 'Cambrai, France',
    country: 'France',
    coordinates: [50.1764, 3.2358],
    dates: 'Avril 2026',
    year: 2026,
    genre: ['Punk', 'Alternative', 'Metal'],
    website: 'https://betizfest.info',
    hasDetailedPage: false
  },
  {
    id: 'fertois-metal-fest-2026',
    name: 'Fertois Metal Fest',
    location: 'La Ferté-sous-Jouarre, France',
    country: 'France',
    coordinates: [48.9486, 3.1281],
    dates: 'Septembre 2026',
    year: 2026,
    genre: ['Metal', 'Death', 'Thrash'],
    website: 'https://fertoismetalfest.com',
    hasDetailedPage: false
  },
  {
    id: 'guitare-en-scene-2026',
    name: 'Guitare en Scène',
    location: 'Saint-Julien-en-Genevois, France',
    country: 'France',
    coordinates: [46.1436, 6.0822],
    dates: 'Juillet 2026',
    year: 2026,
    genre: ['Rock', 'Hard Rock', 'Blues'],
    website: 'https://www.guitare-en-scene.com',
    hasDetailedPage: false
  },
  {
    id: 'samarock-2026',
    name: "Sama'Rock",
    location: 'La Chaussée-Tirancourt, France',
    country: 'France',
    coordinates: [49.9536, 2.1492],
    dates: 'Juin 2026',
    year: 2026,
    genre: ['Pagan Metal', 'Folk Metal'],
    website: 'https://samarockfestival.com',
    hasDetailedPage: false
  },
  {
    id: 'alcatraz-2026',
    name: 'Alcatraz Metal Festival',
    location: 'Courtrai, Belgique',
    country: 'Belgique',
    coordinates: [50.8280, 3.2649],
    dates: 'Août 2026',
    year: 2026,
    genre: ['Metal', 'Hardcore', 'Thrash'],
    website: 'https://www.alcatraz.be',
    hasDetailedPage: false
  },
  {
    id: 'du-rock-chinon-rien-2026',
    name: 'Du Rock Chinon Rien',
    location: 'Chinon, France',
    country: 'France',
    coordinates: [47.1667, 0.2333],
    dates: 'Mai/Juin 2026',
    year: 2026,
    genre: ['Rock', 'Punk', 'Alternative'],
    hasDetailedPage: false
  },

  // ===== AMÉRIQUE DU NORD =====
  {
    id: 'coachella-2026',
    name: 'Coachella',
    location: 'Indio, California, USA',
    country: 'États-Unis',
    coordinates: [33.6803, -116.2373],
    dates: '10-19 avril 2026',
    year: 2026,
    genre: ['Rock', 'Pop', 'Electronic', 'Hip-Hop'],
    website: 'https://www.coachella.com',
    hasDetailedPage: false
  },
  {
    id: 'lollapalooza-2026',
    name: 'Lollapalooza Chicago',
    location: 'Chicago, Illinois, USA',
    country: 'États-Unis',
    coordinates: [41.8781, -87.6298],
    dates: '30 juil - 2 août 2026',
    year: 2026,
    genre: ['Rock', 'Alternative', 'Hip-Hop', 'Electronic'],
    website: 'https://www.lollapalooza.com',
    hasDetailedPage: false
  },
  {
    id: 'bonnaroo-2026',
    name: 'Bonnaroo',
    location: 'Manchester, Tennessee, USA',
    country: 'États-Unis',
    coordinates: [35.4828, -86.0069],
    dates: '11-14 juin 2026',
    year: 2026,
    genre: ['Rock', 'Alternative', 'Electronic', 'Hip-Hop'],
    website: 'https://www.bonnaroo.com',
    hasDetailedPage: false
  },
  {
    id: 'aftershock-2026',
    name: 'Aftershock Festival',
    location: 'Sacramento, California, USA',
    country: 'États-Unis',
    coordinates: [38.5816, -121.4944],
    dates: '8-11 octobre 2026',
    year: 2026,
    genre: ['Rock', 'Metal', 'Alternative'],
    website: 'https://aftershockfestival.com',
    hasDetailedPage: false
  },
  {
    id: 'rockville-2026',
    name: 'Welcome to Rockville',
    location: 'Daytona Beach, Florida, USA',
    country: 'États-Unis',
    coordinates: [29.2108, -81.0228],
    dates: '15-18 mai 2026',
    year: 2026,
    genre: ['Rock', 'Metal', 'Alternative'],
    website: 'https://welcometorockville.com',
    hasDetailedPage: false
  },

  // ===== AMÉRIQUE DU SUD =====
  {
    id: 'rock-in-rio-2026',
    name: 'Rock in Rio',
    location: 'Rio de Janeiro, Brésil',
    country: 'Brésil',
    coordinates: [-22.9068, -43.1729],
    dates: '18-27 septembre 2026',
    year: 2026,
    genre: ['Rock', 'Pop', 'Metal'],
    website: 'https://www.rockinrio.com',
    hasDetailedPage: false
  },
  {
    id: 'lollapalooza-brasil-2026',
    name: 'Lollapalooza Brasil',
    location: 'São Paulo, Brésil',
    country: 'Brésil',
    coordinates: [-23.5505, -46.6333],
    dates: '27-29 mars 2026',
    year: 2026,
    genre: ['Rock', 'Alternative', 'Electronic'],
    website: 'https://www.lollapaloozabr.com',
    hasDetailedPage: false
  },
  {
    id: 'lollapalooza-argentina-2026',
    name: 'Lollapalooza Argentina',
    location: 'Buenos Aires, Argentine',
    country: 'Argentine',
    coordinates: [-34.6037, -58.3816],
    dates: '20-22 mars 2026',
    year: 2026,
    genre: ['Rock', 'Alternative', 'Electronic'],
    website: 'https://www.lollapaloozaar.com',
    hasDetailedPage: false
  },
  {
    id: 'lollapalooza-chile-2026',
    name: 'Lollapalooza Chile',
    location: 'Santiago, Chili',
    country: 'Chili',
    coordinates: [-33.4489, -70.6693],
    dates: '13-15 mars 2026',
    year: 2026,
    genre: ['Rock', 'Alternative', 'Electronic'],
    website: 'https://www.lollapaloozacl.com',
    lineup: ['Sabrina Carpenter', 'Tyler, The Creator', 'Chappell Roan', 'Deftones', 'Skrillex'],
    hasDetailedPage: true
  },

  // ===== ASIE / OCÉANIE =====
  {
    id: 'download-sydney-2026',
    name: 'Download Festival Sydney',
    location: 'Sydney, Australie',
    country: 'Australie',
    coordinates: [-33.8688, 151.2093],
    dates: '21-22 mars 2026',
    year: 2026,
    genre: ['Rock', 'Metal', 'Punk'],
    website: 'https://downloadfestival.com.au',
    hasDetailedPage: false
  },
  {
    id: 'download-melbourne-2026',
    name: 'Download Festival Melbourne',
    location: 'Melbourne, Australie',
    country: 'Australie',
    coordinates: [-37.8136, 144.9631],
    dates: '20-21 mars 2026',
    year: 2026,
    genre: ['Rock', 'Metal', 'Punk'],
    website: 'https://downloadfestival.com.au',
    hasDetailedPage: false
  },
  {
    id: 'fuji-rock-2026',
    name: 'Fuji Rock Festival',
    location: 'Niigata, Japon',
    country: 'Japon',
    coordinates: [36.9147, 138.6889],
    dates: '24-26 juillet 2026',
    year: 2026,
    genre: ['Rock', 'Alternative', 'Electronic'],
    website: 'https://www.fujirockfestival.com',
    hasDetailedPage: false
  },
  {
    id: 'summer-sonic-2026',
    name: 'Summer Sonic',
    location: 'Tokyo/Osaka, Japon',
    country: 'Japon',
    coordinates: [35.6762, 139.6503],
    dates: '15-16 août 2026',
    year: 2026,
    genre: ['Rock', 'Pop', 'Electronic'],
    website: 'https://www.summersonic.com',
    hasDetailedPage: false
  },

  // ===== ROYAUME-UNI (autres) =====
  {
    id: 'glastonbury-2026',
    name: 'Glastonbury Festival',
    location: 'Pilton, UK',
    country: 'Royaume-Uni',
    coordinates: [51.1488, -2.5822],
    dates: '24-28 juin 2026',
    year: 2026,
    genre: ['Rock', 'Pop', 'Electronic', 'World'],
    website: 'https://www.glastonburyfestivals.co.uk',
    hasDetailedPage: false
  },
  {
    id: 'bloodstock-2026',
    name: 'Bloodstock Open Air',
    location: 'Derbyshire, UK',
    country: 'Royaume-Uni',
    coordinates: [52.8219, -1.6144],
    dates: '6-9 août 2026',
    year: 2026,
    genre: ['Metal', 'Hard Rock'],
    website: 'https://www.bloodstock.uk.com',
    hasDetailedPage: false
  }
];

export const getFestivalsByGenre = (genre: string): Festival[] => {
  return FESTIVALS_2026.filter(f => f.genre.includes(genre));
};

export const getFestivalsByCountry = (country: string): Festival[] => {
  return FESTIVALS_2026.filter(f => f.country === country);
};

export const getAllGenres = (): string[] => {
  const genres = new Set<string>();
  FESTIVALS_2026.forEach(f => f.genre.forEach(g => genres.add(g)));
  return Array.from(genres).sort();
};

export const getAllCountries = (): string[] => {
  const countries = new Set(FESTIVALS_2026.map(f => f.country));
  return Array.from(countries).sort();
};
