import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
  useCallback,
  ReactNode
} from 'react'
import axios from 'axios'
import { PermissionResponse } from '../utils/types'
import { useModal, useSnackbar } from '../utils/hooks'
import { AlertSeverityType } from '../components/snackbar'
import usePermissionResponseModal from '../containers/Settings/internal/hooks/usePermissionResponseModal'
import { PermissionResponsePayload } from '../containers/Settings/internal/components/permissionResponseModal'

interface PermissionsContextProps {
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  permissions: PermissionResponse[]
  setPermissions: Dispatch<React.SetStateAction<PermissionResponse[]>>
  selectedPermission: PermissionResponse | undefined
  setSelectedPermission: Dispatch<
    React.SetStateAction<PermissionResponse | undefined>
  >
  filteredPermissions: PermissionResponse[]
  setFilteredPermissions: Dispatch<React.SetStateAction<PermissionResponse[]>>
  filterApplied: boolean
  setFilterApplied: Dispatch<SetStateAction<boolean>>
  fetchPermissions: () => void
  Dialog: () => JSX.Element
  setOpenModal: Dispatch<SetStateAction<boolean>>
  setModalTitle: Dispatch<SetStateAction<string>>
  setModalPayload: Dispatch<SetStateAction<string>>
  Snackbar: () => JSX.Element
  setOpenSnackbar: Dispatch<React.SetStateAction<boolean>>
  setSnackbarMessage: Dispatch<React.SetStateAction<string>>
  setSnackbarSeverity: Dispatch<React.SetStateAction<AlertSeverityType>>
  PermissionResponseDialog: () => JSX.Element
  setOpenPermissionResponseModal: Dispatch<React.SetStateAction<boolean>>
  setPermissionResponsePayload: Dispatch<
    React.SetStateAction<PermissionResponsePayload>
  >
}

export const PermissionsContext = createContext<PermissionsContextProps>(
  undefined!
)

const PermissionsContextProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const { Dialog, setOpenModal, setModalTitle, setModalPayload } = useModal()
  const { Snackbar, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity } =
    useSnackbar()
  const {
    PermissionResponseDialog,
    setOpenPermissionResponseModal,
    setPermissionResponsePayload
  } = usePermissionResponseModal()
  const [isLoading, setIsLoading] = useState(false)
  const [permissions, setPermissions] = useState<PermissionResponse[]>([])
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionResponse>()
  const [filteredPermissions, setFilteredPermissions] = useState<
    PermissionResponse[]
  >([])
  const [filterApplied, setFilterApplied] = useState(false)

  const fetchPermissions = useCallback(() => {
    axios
      .get(`/SASjsApi/permission`)
      .then((res: any) => {
        if (res.data?.length > 0) {
          setPermissions(res.data)
        }
      })
      .catch((err) => {
        setModalTitle('Abort')
        setModalPayload(
          typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : err.response.data
        )
        setOpenModal(true)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PermissionsContext.Provider
      value={{
        isLoading,
        permissions,
        selectedPermission,
        filteredPermissions,
        filterApplied,
        Dialog,
        Snackbar,
        PermissionResponseDialog,
        fetchPermissions,
        setIsLoading,
        setPermissions,
        setSelectedPermission,
        setFilteredPermissions,
        setFilterApplied,
        setOpenModal,
        setModalTitle,
        setModalPayload,
        setOpenPermissionResponseModal,
        setPermissionResponsePayload,
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackbarSeverity
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export default PermissionsContextProvider
