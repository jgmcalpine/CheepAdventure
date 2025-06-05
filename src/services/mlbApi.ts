interface Game {
  id: string;
  title: string;
  status: 'scheduled' | 'live' | 'final';
  homeTeam: {
    name: string;
    score: number;
  };
  awayTeam: {
    name: string;
    score: number;
  };
  startTime: string;
  lastPlay?: string;
}

// TODO: Replace with actual MLB Stats API implementation
export async function fetchLiveGames(): Promise<Game[]> {
  // Simulated data for development
  return [
    {
      id: '1',
      title: 'NYY vs BOS',
      status: 'live',
      homeTeam: {
        name: 'Boston Red Sox',
        score: 3,
      },
      awayTeam: {
        name: 'New York Yankees',
        score: 2,
      },
      startTime: new Date().toISOString(),
      lastPlay: 'Judge strikes out swinging.',
    },
    {
      id: '2',
      title: 'LAD vs SF',
      status: 'scheduled',
      homeTeam: {
        name: 'San Francisco Giants',
        score: 0,
      },
      awayTeam: {
        name: 'Los Angeles Dodgers',
        score: 0,
      },
      startTime: new Date(Date.now() + 3600000).toISOString(),
    },
  ];
}

export async function fetchGameDetails(gameId: string): Promise<Game | null> {
  const games = await fetchLiveGames();
  return games.find(game => game.id === gameId) || null;
}

export async function fetchGameUpdates(gameId: string): Promise<string[]> {
  // Simulated play-by-play updates
  return [
    'Batter steps up to the plate',
    'Pitcher delivers a fastball',
    'Strike one',
    'Ball outside',
    'Foul ball',
    'Strike three, batter out',
  ];
}

export type { Game }; 