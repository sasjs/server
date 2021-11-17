FROM node:lts-alpine
WORKDIR /usr/server/web
COPY ["package.json","package-lock.json", "./"]
RUN npm ci
COPY . .
# RUN chown -R node /usr/server/api
# USER node
CMD ["npm","start"]
