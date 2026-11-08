import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Paper, Typography } from '@mui/material'

const defaultAppLogo = '/sasjs-logo.svg'

/**
 * One tile: a thing the caller can open.
 *
 * The Apps screen and the dashboard's "recently used" both draw tiles, so the
 * component lives here rather than inside either - a recent tile and a full
 * tile must look like the same object, or the dashboard reads as a different
 * kind of thing.
 */
const AppTile = (props: {
  title: string
  subtitle?: string
  logo?: string | null
  to?: string
  href?: string
  /** Called when the tile is followed, for recording the open. */
  onOpen?: () => void
  /** A smaller tile, for the dashboard's row. */
  compact?: boolean
  children?: ReactNode
}) => {
  const { title, subtitle, logo, to, href, onOpen, compact, children } = props

  const content = (
    <Paper
      elevation={compact ? 1 : 3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        height: compact ? 112 : 160,
        p: 2,
        // Rounded rather than rectangular: the grid reads as tiles people tap
        // rather than as panels, and 16px matches the rest of the app's corners.
        borderRadius: '16px',
        textAlign: 'center',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': { boxShadow: 6 }
      }}
    >
      {logo && (
        <img
          src={logo}
          alt=""
          style={{ maxHeight: compact ? 40 : 64, maxWidth: '100%' }}
          onError={(e) => {
            const img = e.currentTarget
            if (img.src.endsWith(defaultAppLogo)) return
            img.src = defaultAppLogo
          }}
        />
      )}
      <Typography variant="subtitle1">{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  )

  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: 'none' }}
        onClick={onOpen}
      >
        {content}
      </a>
    )

  return (
    <Link to={to ?? '/'} style={{ textDecoration: 'none' }} onClick={onOpen}>
      {content}
    </Link>
  )
}

export default AppTile
