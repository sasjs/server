FROM mongo

COPY ./clients.json /clients.json
CMD mongoimport --host mongodb --db sasjs --collection clients --type json --file /clients.json --jsonArray
