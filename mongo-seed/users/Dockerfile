FROM mongo

COPY ./users.json /users.json
CMD mongoimport --host mongodb --db sasjs --collection users --type json --file /users.json --jsonArray
