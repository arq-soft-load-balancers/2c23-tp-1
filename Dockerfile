FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./app/. .
RUN npm i
RUN npm install -g nodemon mocha supervisor

# Install curl
RUN apk add --no-cache curl

# Typescript transpile
RUN npm run build

# Set grants SA and bundle app source
RUN chown -R node:node .

# Change SA
USER node

# Run app
CMD [ "npm", "run", "start" ]