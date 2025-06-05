import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppBar, Toolbar, Typography, Container, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
});

export const metadata = {
  title: "MLB Play-by-Play Audio",
  description: "Listen to live MLB game play-by-play audio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  MLB Play-by-Play
                </Typography>
              </Toolbar>
            </AppBar>
            <Container component="main" sx={{ mt: 4 }}>
              {children}
            </Container>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
