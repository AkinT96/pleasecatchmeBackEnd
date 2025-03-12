# Nutzt eine Node.js-Basisversion
FROM node:18

# Setzt das Arbeitsverzeichnis im Container
WORKDIR /usr/src/app

# Kopiert package.json und installiert Dependencies
COPY package*.json ./
RUN npm install

# Kopiert den Rest des Codes
COPY server .

# Startet den Server
CMD ["node", "server.js"]

# Exponiert Port 8080 (Cloud Run Standard-Port)
EXPOSE 8080
