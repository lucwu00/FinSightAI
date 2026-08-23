import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./themes/theme.js";


import './assets/styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
           <App />
      </ThemeProvider>
  </StrictMode>
);
