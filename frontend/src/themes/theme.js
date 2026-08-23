import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#FF69B4", // hot pink
      light: "#FFB6C1", // light pink
      dark: "#C71585", // dark pink
    },
    secondary: {
      main: "#4A90E2", // blue
      light: "#64B5F6",
      dark: "#1976D2",
    },
    background: {
      default: "#F8F9FE", // light bluish-grey background
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2C3E50", // dark blue-grey
      secondary: "#7F8C8D", // medium grey
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 600,
      letterSpacing: "-0.5px"
    },
    h2: {
      fontWeight: 600,
      letterSpacing: "-0.5px"
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
        },
        contained: {
          boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
        }
      }
    }
  }
});

export default theme;
