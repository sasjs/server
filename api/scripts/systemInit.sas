/**
  @file
  @brief The systemInit program
  @details This program is inserted into every sasjs/server program invocation,
  _before_ any user-provided content.

  A number of useful CORE macros are also compiled below, so that they can be
  available "out of the box".

  <h4> SAS Macros </h4>
  @li mcf_stpsrv_header.sas
  @li mf_abort.sas
  @li mf_dedup.sas
  @li mf_existds.sas
  @li mf_existfeature.sas
  @li mf_existfileref.sas
  @li mf_existfunction.sas
  @li mf_existvar.sas
  @li mf_existvarlist.sas
  @li mf_getapploc.sas
  @li mf_getattrc.sas
  @li mf_getattrn.sas
  @li mf_getengine.sas
  @li mf_getfilesize.sas
  @li mf_getfmtlist.sas
  @li mf_getfmtname.sas
  @li mf_getkeyvalue.sas
  @li mf_getplatform.sas
  @li mf_getquotedstr.sas
  @li mf_getschema.sas
  @li mf_getuniquefileref.sas
  @li mf_getuniquelibref.sas
  @li mf_getuniquename.sas
  @li mf_getuser.sas
  @li mf_getvalue.sas
  @li mf_getvarcount.sas
  @li mf_getvarformat.sas
  @li mf_getvarlen.sas
  @li mf_getvarlist.sas
  @li mf_getvarnum.sas
  @li mf_getvartype.sas
  @li mf_getxengine.sas
  @li mf_isblanks.sas
  @li mf_isint.sas
  @li mf_islibds.sas
  @li mf_loc.sas
  @li mf_mkdir.sas
  @li mf_mval.sas
  @li mf_nobs.sas
  @li mf_trimstr.sas
  @li mf_uid.sas
  @li mf_verifymacvars.sas
  @li mf_wordsinstr1andstr2.sas
  @li mf_wordsinstr1butnotstr2.sas
  @li mf_writefile.sas
  @li mfs_httpheader.sas
  @li mp_abort.sas
  @li mp_dirlist.sas
  @li mp_ds2ddl.sas
  @li mp_ds2md.sas
  @li mp_getdbml.sas
  @li mp_init.sas
  @li mp_makedata.sas
  @li mp_zip.sas

**/

