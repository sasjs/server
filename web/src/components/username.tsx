import React from 'react'
import { Typography, IconButton } from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'

const Username = (props: any) => {
  return (
    <IconButton
      aria-label="account of current user"
      aria-controls="menu-appbar"
      aria-haspopup="true"
      onClick={props.onClickHandler}
      color="inherit"
    >
      {props.avatarContent ? (
        <img
          src={props.avatarContent}
          alt="user-avatar"
          style={{ width: '25px' }}
        />
      ) : (
        <AccountCircle></AccountCircle>
      )}
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          padding: '0 8px',
          display: { xs: 'none', md: 'flex' }
        }}
      >
        {props.username}
      </Typography>
    </IconButton>
  )
}

export default Username
