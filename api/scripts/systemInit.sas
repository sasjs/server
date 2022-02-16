/**
  @file
  @brief The systemInit program
  @details This program is inserted into every sasjs/server program invocation,
  _before_ any user-provided content.

  A number of useful CORE macros are also compiled below, so that they can be
  available "out of the box".

  <h4> SAS Macros </h4>
  @li mcf_stpsrv_header.sas
  @li mf_getuser.sas
  @li mf_getvarlist.sas
  @li mf_mkdir.sas
  @li mf_nobs.sas
  @li mf_uid.sas
  @li mfs_httpheader.sas
  @li mp_dirlist.sas
  @li mp_ds2ddl.sas
  @li mp_ds2md.sas
  @li mp_getdbml.sas
  @li mp_init.sas
  @li mp_makedata.sas
  @li mp_zip.sas

**/

