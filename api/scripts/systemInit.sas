/**
  @file
  @brief The systemInit program
  @details This program is inserted into every sasjs/server program invocation,
  _before_ any user-provided content.

  <h4> SAS Macros </h4>
  @li mcf_stpsrv_header.sas

**/


proc fcmp outcat=work.sasjs.utils;
%mcf_stpsrv_header()
quit;