FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
