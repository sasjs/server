sasjsPath=$(grep sasPath package.json | sed 's/.*"sasPath": "\(.*\)".*/\1/')

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

cp $sasjsPath ./
sasjs=$(basename $sasjsPath)

echo "SAS Executable name:" $sasjs

SAS_EXEC=$sasjs docker-compose -f docker-compose.prod.yml up --build -d