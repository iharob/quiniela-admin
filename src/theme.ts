import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', contrastText: '#ffffff' },
    secondary: { main: '#2979ff' }, // bright blue accent
  },
  shape: { borderRadius: 8 },
})
