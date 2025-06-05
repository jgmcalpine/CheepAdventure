import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
	// Auth Stack
	Auth: undefined;
	Login: undefined;
	SignUp: undefined;

	// Main Stack
	Main: undefined;
	GamesList: undefined;
	GameDetails: {
		gameId: string;
		homeTeam: string;
		awayTeam: string;
	};
	Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
	RootStackParamList,
	T
>; 