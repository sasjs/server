sasjsPath=$(grep sasPath ./api/package.json | sed 's/.*"sasPath": "\(.*\)".*/\1/')

if [ -z "$sasjsPath" ]
then
  echo "Please enter path to SAS executable:"
  read sasjsPath

fi

if [ -e $sasjsPath ]
then
    echo "Using sas executable:" \"$sasjsPath\"
else
    echo "No file present at:" \"$sasjsPath\"
    exit 1
fi

# copy sas executable to current directory, because docker cannot copy files outside of context.
rm -rf sas_exe
mkdir sas_exe
cp $sasjsPath ./sas_exe/sas