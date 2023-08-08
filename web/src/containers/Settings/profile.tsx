import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import {
  Grid,
  CircularProgress,
  Card,
  CardHeader,
  Divider,
  CardContent,
  TextField,
  CardActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { toast } from 'react-toastify'

import { AppContext, ModeType } from '../../context/appContext'
import UpdatePasswordModal from '../../components/passwordModal'

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false)
  const appContext = useContext(AppContext)
  const [user, setUser] = useState({} as any)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  useEffect(() => {
    if (appContext.userId) {
      setIsLoading(true)
      axios
        .get(`/SASjsApi/user/${appContext.userId}`)
        .then((res: any) => {
          setUser(res.data)
        })
        .catch((err) => {
          console.log(err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [appContext.userId])

  const handleChange = (event: any) => {
    const { name, value } = event.target

    setUser({ ...user, [name]: value })
  }
  const handleSubmit = () => {
    setIsLoading(true)
    axios
      .patch(`/SASjsApi/user/${appContext.userId}`, {
        username: user.username,
        displayName: user.displayName,
        autoExec: user.autoExec
      })
      .then((res: any) => {
        toast.success('User information updated', {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .catch((err) => {
        toast.error('Failed: ' + err.response?.data || err.text, {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const updatePassword = (currentPassword: string, newPassword: string) => {
    setIsLoading(true)
    setIsPasswordModalOpen(false)
    axios
      .patch(`/SASjsApi/auth/updatePassword`, {
        currentPassword,
        newPassword
      })
      .then((res: any) => {
        toast.success('Password updated', {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .catch((err) => {
        toast.error('Failed: ' + err.response?.data || err.text, {
          theme: 'dark',
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return isLoading ? (
    <CircularProgress
      style={{ position: 'absolute', left: '50%', top: '50%' }}
    />
  ) : (
    <>
      <Card>
        <CardHeader title="Profile Information" />
        <Divider />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item md={6} xs={12}>
              <TextField
                fullWidth
                error={user.displayName?.length === 0}
                helperText="Please specify display name"
                label="Display Name"
                name="displayName"
                onChange={handleChange}
                required
                value={user.displayName}
                variant="outlined"
                disabled={appContext.mode === ModeType.Desktop}
              />
            </Grid>

            <Grid item md={6} xs={12}>
              <TextField
                fullWidth
                error={user.username?.length === 0}
                helperText="Please specify username"
                label="Username"
                name="username"
                onChange={handleChange}
                required
                value={user.username}
                variant="outlined"
                disabled={appContext.mode === ModeType.Desktop}
              />
            </Grid>

            <Grid item lg={6} md={8} sm={12} xs={12}>
              <TextField
                fullWidth
                label="autoExec"
                name="autoExec"
                onChange={handleChange}
                multiline
                rows="10"
                value={user.autoExec}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={6}>
              <FormGroup row>
                <FormControlLabel
                  disabled
                  control={<Checkbox checked={user.isActive} />}
                  label="isActive"
                />
                <FormControlLabel
                  disabled
                  control={<Checkbox checked={user.isAdmin} />}
                  label="isAdmin"
                />
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Update Password
              </Button>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions>
          <Button type="submit" variant="contained" onClick={handleSubmit}>
            Save Changes
          </Button>
        </CardActions>
      </Card>
      <UpdatePasswordModal
        open={isPasswordModalOpen}
        setOpen={setIsPasswordModalOpen}
        title="Update Password"
        updatePassword={updatePassword}
      />
    </>
  )
}

export default Profile
