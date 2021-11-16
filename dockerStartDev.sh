
# Copy SAS executable from source to current folder to make it available to docker
./dockerSASexe.sh

# Run docker-compose with default docker compose file i.e. docker-compose.yml
SAS_EXEC=sas_exe/sas docker-compose up --build -d
