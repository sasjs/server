
# Copy SAS executable from source to current folder to make it available to docker
./dockerSASexe.sh

# Build & Run docker-compose with docker compose file i.e. docker-compose.prod.yml
# SAS_EXEC=sas_exe/sas docker-compose -f docker-compose.prod.yml up --build -d
