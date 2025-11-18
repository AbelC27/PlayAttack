FROM node:20-bullseye

WORKDIR /usr/src/app

COPY exemplu/package.json exemplu/package-lock.json ./
RUN npm install --legacy-peer-deps

COPY exemplu ./

EXPOSE 3000
CMD ["npm", "start"]