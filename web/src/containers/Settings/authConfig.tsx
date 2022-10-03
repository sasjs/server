import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Grid,
  CircularProgress,
  Card,
  CardHeader,
  Divider,
  CardContent,
  TextField,
  CardActions,
  Button,
  Typography
} from '@mui/material'
import { toast } from 'react-toastify'

const AuthConfig = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [authDetail, setAuthDetail] = useState<any>({})

  useEffect(() => {
    setIsLoading(true)
    axios
      .get(`/SASjsApi/authConfig`)
      .then((res: any) => {
        setAuthDetail(res.data)
      })
      .catch((err) => {
        toast.error('Failed: ' + err.response?.data || err.text, {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .finally(() => setIsLoading(false))
  }, [])

  const synchronizeWithLDAP = () => {
    setIsLoading(true)
    axios
      .post(`/SASjsApi/authConfig/synchronizeWithLDAP`)
      .then((res: any) => {
        const { userCount, groupCount } = res.data
        toast.success(
          `Imported ${userCount} ${
            userCount > 1 ? 'users' : 'user'
          } and ${groupCount} ${groupCount > 1 ? 'groups' : 'group'}`,
          {
            theme: 'dark',
            position: toast.POSITION.BOTTOM_RIGHT
          }
        )
      })
      .catch((err) => {
        toast.error('Failed: ' + err.response?.data || err.text, {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .finally(() => setIsLoading(false))
  }

  return isLoading ? (
    <CircularProgress
      style={{ position: 'absolute', left: '50%', top: '50%' }}
    />
  ) : (
    <Box>
      {Object.entries(authDetail).length === 0 && (
        <Typography>No external Auth Provider is used</Typography>
      )}
      {authDetail.ldap && (
        <Card>
          <CardHeader title="LDAP Authentication" />
          <Divider />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item md={6} xs={12}>
                <TextField
                  fullWidth
                  label="LDAP_URL"
                  name="LDAP_URL"
                  value={authDetail.ldap.LDAP_URL}
                  variant="outlined"
                  disabled
                />
              </Grid>

              <Grid item md={6} xs={12}>
                <TextField
                  fullWidth
                  label="LDAP_BIND_DN"
                  name="LDAP_BIND_DN"
                  value={authDetail.ldap.LDAP_BIND_DN}
                  variant="outlined"
                  disabled={true}
                />
              </Grid>

              <Grid item md={6} xs={12}>
                <TextField
                  fullWidth
                  label="LDAP_BIND_PASSWORD"
                  name="LDAP_BIND_PASSWORD"
                  type="password"
                  value={authDetail.ldap.LDAP_BIND_PASSWORD}
                  variant="outlined"
                  disabled
                />
              </Grid>

              <Grid item md={6} xs={12}>
                <TextField
                  fullWidth
                  label="LDAP_USERS_BASE_DN"
                  name="LDAP_USERS_BASE_DN"
                  value={authDetail.ldap.LDAP_USERS_BASE_DN}
                  variant="outlined"
                  disabled={true}
                />
              </Grid>

              <Grid item md={6} xs={12}>
                <TextField
                  fullWidth
                  label="LDAP_GROUPS_BASE_DN"
                  name="LDAP_GROUPS_BASE_DN"
                  value={authDetail.ldap.LDAP_GROUPS_BASE_DN}
                  variant="outlined"
                  disabled={true}
                />
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
          <CardActions>
            <Button
              type="submit"
              variant="contained"
              onClick={synchronizeWithLDAP}
            >
              Synchronize
            </Button>
          </CardActions>
        </Card>
      )}
    </Box>
  )
}

export default AuthConfig
