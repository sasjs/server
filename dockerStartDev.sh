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
cp $sasjsPath ./

# name of the sas executable file, placed at root of repository
sasjs=$(basename $sasjsPath)
echo "SAS Executable name:" $sasjs

# build and run docker-compose
SAS_EXEC=$sasjs docker-compose up --build -d

# remove copied sas executable
rm $sasjs