import { createTheme } from '@mui/material/styles'
import palette from './palette'

export const theme = createTheme({
  palette,
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '21px',
          color: palette.white,
          '&.Mui-selected': {
            color: palette.secondary.main
          }
        }
      }
    }
  }
})
