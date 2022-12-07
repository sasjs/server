import React from 'react'

import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

const Home = () => {
  return (
    <Box className="container">
      <CssBaseline />
      <h2>Welcome to SASjs Server!</h2>
      <p>
        SASjs Server provides a REST interface for executing Stored Programs and
        ad hoc code (studio) against SAS and JS executables. The source is
        available on{' '}
        <a
          href="https://github.com/sasjs/server"
          target="_blank"
          rel="noreferrer"
        >
          {' '}
          github
        </a>{' '}
        and contributions are welcomed.
      </p>
      <p>
        SASjs Server is maintained by the SAS Apps team -{' '}
        <a
          href="https://sasapps.io/contact-us"
          target="_blank"
          rel="noreferrer"
        >
          {' '}
          contact us
        </a>{' '}
        if you'd like help with SAS DevOps or SAS Application development!{' '}
      </p>
    </Box>
  )
}

export default Home
