# 🚀 Espace Pédagogique

## 📖 Description
Plateforme web interactive de révision pédagogique. Offre un tableau de bord moderne avec modes **Réglages** et **Révision**, des quizzes progressifs, et une API backend pour gérer les données des classes et sauvegardes.

Langue: Français  
Statut: Projet en développement

## 📁 Structure du Projet
```
rz/
├── index.html              # Tableau de bord principal
├── quiz.html              # Interface des quizzes
├── css/                   # Styles (dashboard-modern.css, quiz.css, etc.)
├── js/                    # Scripts (dashboard.js, quiz.js)
└── backend/               # Serveur Node.js
    ├── server.js          # Serveur Express (port 3000)
    ├── package.json       # Dépendances backend
    ├── routes/api.js      # Routes API
    └── data/
        └── pedagogie.json # Données classes (CRUD via API)
        └── backups/       # Sauvegardes automatiques
```

## 🚀 Installation & Démarrage

### Backend
```bash
cd backend
npm install
npm start
```
Ou en dev: `npm run dev`

API dispo: `http://localhost:3000/api`

### Frontend
Ouvrir `index.html` dans le navigateur, ou via serveur: `http://localhost:3000`

## 📋 Fonctionnalités

**Frontend:**
- Mode switcher (Réglages/Révision)
- Navigation breadcrumb dynamique
- Quizzes avec barre de progression, navigation prev/next
- Design moderne responsive (Inter font, FontAwesome)

**Backend API (Express.js):**
- `GET/POST /api/data` : Récupérer/sauvegarder données pédagogiques
- `GET /api/stats` : Statistiques
- `GET /api/backup`, `POST /api/restore`, `GET /api/backups` : Gestion sauvegardes
- CORS activé, fichiers statiques servis

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JS
- **Backend**: Node.js, Express.js
- **Données**: JSON (pedagogie.json)
- **Outils**: Nodemon (dev)

## 🔌 Endpoints API
| Méthode | Endpoint          | Description                  |
|---------|-------------------|------------------------------|
| GET     | `/api/data`       | Récupérer toutes les données |
| POST    | `/api/data`       | Sauvegarder données          |
| GET     | `/api/stats`      | Statistiques                 |
| GET     | `/api/backup`     | Créer sauvegarde             |
| POST    | `/api/restore`    | Restaurer sauvegarde         |
| GET     | `/api/backups`    | Lister sauvegardes           |

## 📈 Améliorations Futures
- Authentification utilisateurs
- Base de données (MongoDB/SQLite)
- Tests unitaires
- Déploiement (Vercel/Heroku)
- Plus de quizzes/thèmes

## 👨‍💻 Auteur
Développé avec ❤️ pour l'éducation interactive

---

*Dernière mise à jour: Automatique via backend*

