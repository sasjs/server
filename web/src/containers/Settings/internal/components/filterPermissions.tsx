import React, { Dispatch, SetStateAction, useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { FilterList } from '@mui/icons-material'
import { PermissionResponse } from '../../../../utils/types'
import PermissionFilterModal from './permissionFilterModal'
import { PrincipalType } from '../hooks/usePermission'

type Props = {
  open: boolean
  handleOpen: Dispatch<SetStateAction<boolean>>
  permissions: PermissionResponse[]
  applyFilter: (
    pathFilter: string[],
    principalFilter: string[],
    principalTypeFilter: PrincipalType[],
    settingFilter: string[]
  ) => void
  resetFilter: () => void
}

const FilterPermissions = ({
  open,
  handleOpen,
  permissions,
  applyFilter,
  resetFilter
}: Props) => {
  const [pathFilter, setPathFilter] = useState<string[]>([])
  const [principalFilter, setPrincipalFilter] = useState<string[]>([])
  const [principalTypeFilter, setPrincipalTypeFilter] = useState<
    PrincipalType[]
  >([])
  const [settingFilter, setSettingFilter] = useState<string[]>([])
  const handleApplyFilter = () => {
    applyFilter(pathFilter, principalFilter, principalTypeFilter, settingFilter)
  }

  const handleResetFilter = () => {
    setPathFilter([])
    setPrincipalFilter([])
    setPrincipalFilter([])
    setSettingFilter([])
    resetFilter()
  }

  return (
    <>
      <Tooltip title="Filter Permissions">
        <IconButton onClick={() => handleOpen(true)}>
          <FilterList />
        </IconButton>
      </Tooltip>
      <PermissionFilterModal
        open={open}
        handleOpen={handleOpen}
        permissions={permissions}
        pathFilter={pathFilter}
        setPathFilter={setPathFilter}
        principalFilter={principalFilter}
        setPrincipalFilter={setPrincipalFilter}
        principalTypeFilter={principalTypeFilter}
        setPrincipalTypeFilter={setPrincipalTypeFilter}
        settingFilter={settingFilter}
        setSettingFilter={setSettingFilter}
        applyFilter={handleApplyFilter}
        resetFilter={handleResetFilter}
      />
    </>
  )
}

export default FilterPermissions
