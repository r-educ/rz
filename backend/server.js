const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import des routes
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (si vous voulez servir votre frontend)
app.use(express.static(path.join(__dirname, '../')));

// Routes API
app.use('/api', apiRoutes);

// Route par défaut
app.get('/', (req, res) => {
    res.json({
        name: 'API Pédagogie',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            data: 'GET /api/data - Récupérer toutes les données',
            data: 'POST /api/data - Sauvegarder les données',
            backup: 'GET /api/backup - Créer une sauvegarde',
            stats: 'GET /api/stats - Statistiques',
            restore: 'POST /api/restore - Restaurer une sauvegarde',
            backups: 'GET /api/backups - Lister les sauvegardes'
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({ 
        error: 'Erreur interne du serveur',
        message: err.message 
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
    
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
        console.log('📁 Dossier data créé');
    }
    
    // Créer le fichier de données par défaut s'il n'existe pas
    const dataFile = path.join(dataDir, 'pedagogie.json');
    if (!fs.existsSync(dataFile)) {
        const defaultData = {
            classes: [],
            lastUpdate: new Date().toISOString(),
            version: '1.0.0'
        };
        fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
        console.log('📄 Fichier de données créé');
    }
});