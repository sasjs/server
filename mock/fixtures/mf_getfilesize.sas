%macro example;
  %if &format=NO %then %do;
    &bytes
  %end;
  %else %do;
  %sysfunc(INPUTN(&bytes, best.),sizekmg.) %end;
%mend example;
