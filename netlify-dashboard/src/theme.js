import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#59f0b5' },
    secondary: { main: '#74c7ff' },
    success: { main: '#59f0b5' },
    warning: { main: '#ffbe6b' },
    error: { main: '#ff6b6b' },
    background: { default: '#07090f', paper: 'rgba(14, 20, 33, 0.82)' },
    text: { primary: '#e7f1ff', secondary: '#98b0c8' }
  },
  typography: {
    fontFamily: '"Sora", "Space Grotesk", system-ui, sans-serif',
    h1: { fontWeight: 700, letterSpacing: -1.4 },
    h2: { fontWeight: 700, letterSpacing: -1.1 },
    h3: { fontWeight: 700, letterSpacing: -0.6 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  shape: {
    borderRadius: 18
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '10px 16px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: '1px solid rgba(122, 155, 196, 0.2)'
        }
      }
    }
  }
});

export default theme;
