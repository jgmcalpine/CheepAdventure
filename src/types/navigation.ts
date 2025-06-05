export type RootStackParamList = {
	// Auth stack
	Login: undefined;
	SignUp: undefined;

	// Main stack
	GameList: undefined;
	GameDetail: {
		gameId: string;
		homeTeam: string;
		awayTeam: string;
	};
	Profile: undefined;
}; 