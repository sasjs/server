import { useState } from 'react'
import { Typography, Popover } from '@mui/material'
import { GroupDetailsResponse } from '../../../../utils/types'

type DisplayGroupProps = {
  group: GroupDetailsResponse
}

const DisplayGroup = ({ group }: DisplayGroupProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <div>
      <Typography
        aria-owns={open ? 'mouse-over-popover' : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      >
        {group.name}
      </Typography>
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none'
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Typography sx={{ p: 1 }} variant="h6" component="div">
          Group Members
        </Typography>
        {group.users.map((user, index) => (
          <Typography key={index} sx={{ p: 1 }} component="li">
            {user.username}
          </Typography>
        ))}
      </Popover>
    </div>
  )
}

export default DisplayGroup
