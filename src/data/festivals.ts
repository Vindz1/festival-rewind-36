export interface Artist {
  id: string;
  name: string;
  stage: 'mainstage' | 'altar' | 'temple' | 'valley' | 'warzone';
  day: number;
  time: string;
  imageUrl?: string;
}

export interface Festival {
  id: string;
  name: string;
  year: number;
  location: string;
  dates: string;
  artists: Artist[];
  imageUrl?: string;
  hasDetailedPage: boolean;
  isPepite?: boolean; // <-- Permet de changer la couleur sur la carte

}

export const stages = {
  mainstage: { name: 'Mainstage', color: 'mainstage' as const },
  altar: { name: 'Altar', color: 'altar' as const },
  temple: { name: 'Temple', color: 'temple' as const },
  valley: { name: 'Valley', color: 'valley' as const },
  warzone: { name: 'Warzone', color: 'warzone' as const },
};

export const festivals: Festival[] = [
  {
    id: 'hellfest-2024',
    name: 'Hellfest',
    year: 2024,
    location: 'Clisson, France',
    dates: '27-30 Juin 2024',
    artists: [
      { id: 'metallica-2024', name: 'Metallica', stage: 'mainstage', day: 1, time: '22:30' },
      { id: 'avenged-2024', name: 'Avenged Sevenfold', stage: 'mainstage', day: 1, time: '20:00' },
      { id: 'gojira-2024', name: 'Gojira', stage: 'mainstage', day: 2, time: '22:30' },
      { id: 'ghost-2024', name: 'Ghost', stage: 'mainstage', day: 2, time: '20:00' },
      { id: 'mastodon-2024', name: 'Mastodon', stage: 'altar', day: 1, time: '19:00' },
      { id: 'behemoth-2024', name: 'Behemoth', stage: 'temple', day: 1, time: '21:00' },
      { id: 'meshuggah-2024', name: 'Meshuggah', stage: 'altar', day: 2, time: '21:00' },
      { id: 'kreator-2024', name: 'Kreator', stage: 'warzone', day: 1, time: '18:00' },
      { id: 'opeth-2024', name: 'Opeth', stage: 'temple', day: 3, time: '20:30' },
      { id: 'trivium-2024', name: 'Trivium', stage: 'mainstage', day: 3, time: '18:00' },
      { id: 'lamb-2024', name: 'Lamb of God', stage: 'altar', day: 3, time: '19:30' },
      { id: 'slayer-2024', name: 'Slayer', stage: 'mainstage', day: 3, time: '22:30' },
    ],
  },
  {
    id: 'hellfest-2023',
    name: 'Hellfest',
    year: 2023,
    location: 'Clisson, France',
    dates: '15-18 Juin 2023',
    artists: [
      { id: 'muse-2023', name: 'Muse', stage: 'mainstage', day: 1, time: '22:30' },
      { id: 'def-leppard-2023', name: 'Def Leppard', stage: 'mainstage', day: 2, time: '22:30' },
      { id: 'kiss-2023', name: 'KISS', stage: 'mainstage', day: 3, time: '22:30' },
      { id: 'iron-maiden-2023', name: 'Iron Maiden', stage: 'mainstage', day: 4, time: '22:30' },
      { id: 'megadeth-2023', name: 'Megadeth', stage: 'mainstage', day: 1, time: '20:00' },
      { id: 'pantera-2023', name: 'Pantera', stage: 'mainstage', day: 2, time: '20:00' },
      { id: 'slipknot-2023', name: 'Slipknot', stage: 'mainstage', day: 3, time: '20:00' },
      { id: 'architects-2023', name: 'Architects', stage: 'altar', day: 1, time: '19:00' },
      { id: 'parkway-2023', name: 'Parkway Drive', stage: 'altar', day: 2, time: '19:00' },
      { id: 'sabaton-2023', name: 'Sabaton', stage: 'mainstage', day: 4, time: '20:00' },
    ],
  },
  {
    id: 'hellfest-2022',
    name: 'Hellfest',
    year: 2022,
    location: 'Clisson, France',
    dates: '17-26 Juin 2022',
    artists: [
      { id: 'metallica-2022', name: 'Metallica', stage: 'mainstage', day: 1, time: '22:30' },
      { id: 'guns-2022', name: "Guns N' Roses", stage: 'mainstage', day: 2, time: '22:30' },
      { id: 'scorpions-2022', name: 'Scorpions', stage: 'mainstage', day: 3, time: '22:30' },
      { id: 'faith-no-more-2022', name: 'Faith No More', stage: 'mainstage', day: 4, time: '20:00' },
      { id: 'korn-2022', name: 'Korn', stage: 'mainstage', day: 5, time: '22:00' },
      { id: 'judas-priest-2022', name: 'Judas Priest', stage: 'mainstage', day: 6, time: '22:30' },
      { id: 'deftones-2022', name: 'Deftones', stage: 'mainstage', day: 7, time: '21:00' },
      { id: 'nine-inch-nails-2022', name: 'Nine Inch Nails', stage: 'mainstage', day: 6, time: '20:00' },
    ],
  },
  {
    id: 'hellfest-2019',
    name: 'Hellfest',
    year: 2019,
    location: 'Clisson, France',
    dates: '21-23 Juin 2019',
    artists: [
      { id: 'tool-2019', name: 'Tool', stage: 'mainstage', day: 1, time: '22:30' },
      { id: 'slayer-2019', name: 'Slayer', stage: 'mainstage', day: 2, time: '22:30' },
      { id: 'manson-2019', name: 'Marilyn Manson', stage: 'mainstage', day: 3, time: '22:30' },
      { id: 'slash-2019', name: 'Slash ft. Myles Kennedy', stage: 'mainstage', day: 1, time: '20:00' },
      { id: 'rob-zombie-2019', name: 'Rob Zombie', stage: 'mainstage', day: 2, time: '20:00' },
      { id: 'whitesnake-2019', name: 'Whitesnake', stage: 'mainstage', day: 3, time: '20:00' },
    ],
  },
];

export const getFestivalById = (id: string): Festival | undefined => {
  return festivals.find((f) => f.id === id);
};
