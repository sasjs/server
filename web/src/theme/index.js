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
      },
      /**
       * The outline is the only thing that says where an input box is, so it
       * has to be visible on its own: MUI's default is 23% of the opposite ink,
       * which measures 1.74:1 against the light page background and 2.05:1
       * against the dark one - both below the 3:1 WCAG asks of a control's
       * boundary. In dark mode the box then all but disappears while the label
       * inside it stays bright, and the label reads as floating over the field
       * rather than sitting in it.
       *
       * 0.45 and 0.35 are the smallest alphas that clear 3:1 in each scheme
       * (3.32:1 and 3.21:1, measured against #F4F6F8 and #121212).
       */
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            borderColor:
              'rgba(var(--mui-palette-common-onBackgroundChannel) / 0.45)',
            '.dark &': {
              borderColor:
                'rgba(var(--mui-palette-common-onBackgroundChannel) / 0.35)'
            }
          }
        }
      }
    }
  })

export const theme = createAppTheme()
