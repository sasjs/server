import { useState, useContext } from 'react'
import { PermissionsContext } from '../../../../context/permissionsContext'
import { PrincipalType } from './usePermission'
import FilterPermissions from '../components/filterPermissions'

const useFilterPermissions = () => {
  const { permissions, setFilteredPermissions, setFilterApplied } =
    useContext(PermissionsContext)

  const [filterModalOpen, setFilterModalOpen] = useState(false)

  /**
   * first find the permissions w.r.t each filter type
   * take intersection of resultant arrays
   */
  const applyFilter = (
    pathFilter: string[],
    principalFilter: string[],
    principalTypeFilter: PrincipalType[],
    settingFilter: string[]
  ) => {
    setFilterModalOpen(false)

    const uriFilteredPermissions =
      pathFilter.length > 0
        ? permissions.filter((permission) =>
            pathFilter.includes(permission.path)
          )
        : permissions

    const principalFilteredPermissions =
      principalFilter.length > 0
        ? permissions.filter((permission) => {
            if (permission.user) {
              return principalFilter.includes(permission.user.username)
            }
            if (permission.group) {
              return principalFilter.includes(permission.group.name)
            }
            return false
          })
        : permissions

    const principalTypeFilteredPermissions =
      principalTypeFilter.length > 0
        ? permissions.filter((permission) => {
            if (permission.user) {
              return principalTypeFilter.includes(PrincipalType.User)
            }
            if (permission.group) {
              return principalTypeFilter.includes(PrincipalType.Group)
            }
            return false
          })
        : permissions

    const settingFilteredPermissions =
      settingFilter.length > 0
        ? permissions.filter((permission) =>
            settingFilter.includes(permission.setting)
          )
        : permissions

    let filteredArray = uriFilteredPermissions.filter((permission) =>
      principalFilteredPermissions.some((item) => item.uid === permission.uid)
    )

    filteredArray = filteredArray.filter((permission) =>
      principalTypeFilteredPermissions.some(
        (item) => item.uid === permission.uid
      )
    )

    filteredArray = filteredArray.filter((permission) =>
      settingFilteredPermissions.some((item) => item.uid === permission.uid)
    )

    setFilteredPermissions(filteredArray)
    setFilterApplied(true)
  }

  const resetFilter = () => {
    setFilterModalOpen(false)
    setFilterApplied(false)
    setFilteredPermissions([])
  }

  const FilterPermissionsButton = () => (
    <FilterPermissions
      open={filterModalOpen}
      handleOpen={setFilterModalOpen}
      permissions={permissions}
      applyFilter={applyFilter}
      resetFilter={resetFilter}
    />
  )

  return { FilterPermissionsButton }
}

export default useFilterPermissions
