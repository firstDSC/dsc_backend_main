
FROM node:17

WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY . /app

EXPOSE 5000 5001 5002 6379 3306

CMD ["npm", "start"]
