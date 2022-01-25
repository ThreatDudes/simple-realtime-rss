FROM node:lts
WORKDIR /opt/simple-realtime-rss
COPY package.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start"]
