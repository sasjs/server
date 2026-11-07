import { createTheme } from '@mui/material/styles'
import { brand, paletteFor } from './palette'

/**
 * The app's one theme, carrying both colour schemes.
 *
 * Both schemes live in a single theme object on purpose. Rebuilding the theme
 * when the mode changes produces a second set of generated classes, and the
 * older rules keep winning on the properties a component does not restate -
 * measured: a contained primary button stayed black-on-black after switching
 * to the dark scheme, while the same button in a dark-only page was correct.
 * One theme with `colorSchemes` switches the values in place instead.
 *
 * Both schemes keep the brand's tab styling: the header is black in each, so
 * an unselected tab is white-on-black and the selected one is the brand yellow
 * either way.
 */
export const createAppTheme = () =>
  createTheme({
    // each scheme is a colour system, so the palette is nested under `palette`
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: { palette: paletteFor('light') },
      dark: { palette: paletteFor('dark') }
    },
    // The stored preference is authoritative and is applied by the app; this is
    // only the starting point before that has been read.
    defaultMode: 'system',
    components: {
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: '21px',
            // the header is black in both schemes, and the tabs live on it
            color: brand.white,
            '&.Mui-selected': {
              color: brand.yellow
            }
          }
        }
      }
    }
  })

export const theme = createAppTheme()
