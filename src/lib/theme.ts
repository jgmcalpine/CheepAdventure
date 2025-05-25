import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Create a color-blind-safe palette
// Based on https://davidmathlogic.com/colorblind/
const palette = {
	primary: {
		main: '#0077BB', // Blue
		light: '#40A6FF',
		dark: '#005588',
		contrastText: '#FFFFFF'
	},
	secondary: {
		main: '#EE7733', // Orange
		light: '#FF9955',
		dark: '#CC5511',
		contrastText: '#FFFFFF'
	},
	error: {
		main: '#EE3377', // Magenta
		light: '#FF5599',
		dark: '#CC1155',
		contrastText: '#FFFFFF'
	},
	warning: {
		main: '#CCBB44', // Yellow
		light: '#EEDD66',
		dark: '#AA9922',
		contrastText: '#000000'
	},
	success: {
		main: '#009988', // Teal
		light: '#22BBAA',
		dark: '#007766',
		contrastText: '#FFFFFF'
	},
	info: {
		main: '#0077BB', // Blue
		light: '#40A6FF',
		dark: '#005588',
		contrastText: '#FFFFFF'
	},
	text: {
		primary: '#1A1A1A',
		secondary: '#666666',
		disabled: '#999999'
	},
	background: {
		default: '#F5F5F5',
		paper: '#FFFFFF'
	}
};

// Create the base theme
let theme = createTheme({
	palette,
	typography: {
		fontFamily: inter.style.fontFamily,
		h1: {
			fontWeight: 700
		},
		h2: {
			fontWeight: 600
		},
		h3: {
			fontWeight: 600
		},
		h4: {
			fontWeight: 500
		},
		h5: {
			fontWeight: 500
		},
		h6: {
			fontWeight: 500
		}
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					borderRadius: 8,
					fontWeight: 600
				}
			}
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					boxShadow:
						'0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 8px rgba(0, 0, 0, 0.05)'
				}
			}
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: 12
				}
			}
		}
	}
});

// Make typography responsive
theme = responsiveFontSizes(theme);

export { theme }; 