import { mlbApi } from '../services/mlb-api';

async function testMLBApi() {
  try {
    console.log('Fetching today\'s games...');
    const games = await mlbApi.getTodayGames();
    console.log('Games found:', games.length);
    console.log('Games:', JSON.stringify(games, null, 2));

    if (games.length > 0) {
      const firstGame = games[0];
      console.log(`\nFetching plays for game ${firstGame.id}...`);
      const plays = await mlbApi.getGamePlays(firstGame.id);
      console.log('Plays found:', plays.length);
      console.log('Latest play:', JSON.stringify(plays[plays.length - 1], null, 2));
    }

    console.log('\nMLB API test completed successfully');
  } catch (error) {
    console.error('Error testing MLB API:', error);
  }
}

// Run the test
testMLBApi(); 