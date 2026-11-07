import { colors } from '@mui/material'

/**
 * The brand's colours, and the two palettes built from them.
 *
 * The Studio ships one black-and-yellow identity, so black and yellow are
 * brand constants: the header, the side bar and the selected tab are black or
 * yellow in both colour schemes. What changes with the scheme is the page
 * around them - surfaces, text, dividers - which is why the two palettes below
 * differ in those tokens and agree on the rest.
 */
export const brand = {
  white: '#FFFFFF',
  black: '#000000',
  yellow: '#F6E30F'
}

const light = {
  ...brand,
  primary: {
    contrastText: brand.white,
    main: brand.black
  },
  secondary: {
    contrastText: brand.white,
    main: brand.yellow
  },
  success: {
    contrastText: brand.white,
    dark: colors.green[900],
    main: colors.green[600],
    light: colors.green[400]
  },
  info: {
    contrastText: brand.white,
    dark: colors.blue[900],
    main: colors.blue[600],
    light: colors.blue[400]
  },
  warning: {
    contrastText: brand.white,
    dark: colors.orange[900],
    main: colors.orange[600],
    light: colors.orange[400]
  },
  error: {
    contrastText: brand.white,
    dark: colors.red[900],
    main: colors.red[600],
    light: colors.red[400]
  },
  text: {
    primary: colors.blueGrey[900],
    secondary: colors.blueGrey[600],
    link: colors.blue[600]
  },
  background: {
    default: '#F4F6F8',
    paper: brand.white
  },
  icon: colors.blueGrey[600],
  divider: colors.grey[200]
}

/**
 * The dark scheme.
 *
 * `primary` inverts to a light fill with black text. The brand's primary is
 * black, and a black filled button on a #121212 surface is an unlabeled dark
 * rectangle - so the one token that exists to be "the fill of a button" flips
 * with the mode while the header keeps the brand black it always had.
 */
const dark = {
  ...brand,
  mode: 'dark',
  primary: {
    contrastText: brand.black,
    main: colors.grey[300]
  },
  secondary: {
    contrastText: brand.black,
    main: brand.yellow
  },
  success: {
    contrastText: brand.black,
    dark: colors.green[900],
    main: colors.green[400],
    light: colors.green[200]
  },
  info: {
    contrastText: brand.black,
    dark: colors.blue[900],
    main: colors.blue[300],
    light: colors.blue[200]
  },
  warning: {
    contrastText: brand.black,
    dark: colors.orange[900],
    main: colors.orange[400],
    light: colors.orange[200]
  },
  error: {
    contrastText: brand.black,
    dark: colors.red[900],
    main: colors.red[300],
    light: colors.red[200]
  },
  text: {
    primary: colors.grey[100],
    secondary: colors.grey[400],
    link: colors.blue[300]
  },
  background: {
    default: '#121212',
    paper: '#1E1E1E'
  },
  icon: colors.grey[400],
  divider: colors.grey[800]
}

export const paletteFor = (mode) => (mode === 'dark' ? dark : light)

export default light
