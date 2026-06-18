# Image de base Alpine (déjà disponible localement)
FROM alpine:latest

# Installer Node.js et npm
RUN apk add --no-cache nodejs npm

# Créer le répertoire de travail dans le conteneur
WORKDIR /app

# Copier uniquement les fichiers de dépendances d'abord (optimisation)
COPY backend/package*.json ./backend/

# Installer les dépendances backend
WORKDIR /app/backend
RUN npm install

# Revenir au répertoire racine
WORKDIR /app

# Copier tout le projet
COPY . .

# Exposer le port utilisé par le serveur
EXPOSE 3000

# Démarrer le serveur
CMD ["node", "backend/server.js"]