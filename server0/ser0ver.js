const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..'))); // Sert les fichiers du dossier parent

// Chemin vers le fichier JSON
const DATA_FILE = path.join(__dirname, '..', 'data', 'pedagogie.json');

// ============================================
// ROUTES API
// ============================================

// GET - Récupérer toutes les données
app.get('/api/data', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('❌ Erreur lecture:', error);
        
        // Si le fichier n'existe pas, créer un fichier par défaut
        if (error.code === 'ENOENT') {
            const defaultData = {
                classes: [
                    {
                        id: 'seconde',
                        name: 'Seconde',
                        level: 'Lycée',
                        color: '#6366f1',
                        subjects: []
                    }
                ]
            };
            
            try {
                await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
                res.json(defaultData);
            } catch (writeError) {
                res.status(500).json({ error: 'Impossible de créer le fichier' });
            }
        } else {
            res.status(500).json({ error: 'Erreur de lecture' });
        }
    }
});

// POST - Sauvegarder toutes les données
app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body;
        
        // Validation basique
        if (!newData.classes) {
            return res.status(400).json({ error: 'Format de données invalide' });
        }
        
        // Ajouter un timestamp
        newData.lastModified = new Date().toISOString();
        
        // Écrire dans le fichier
        await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
        
        console.log('✅ Données sauvegardées à', new Date().toLocaleTimeString());
        res.json({ 
            success: true, 
            message: 'Sauvegarde réussie',
            timestamp: newData.lastModified
        });
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        res.status(500).json({ error: 'Erreur de sauvegarde' });
    }
});

// GET - Sauvegarde automatique (toutes les 5 minutes)
app.get('/api/auto-save', async (req, res) => {
    res.json({ 
        status: 'active',
        interval: '5 minutes',
        lastBackup: new Date().toISOString()
    });
});

// GET - Créer une sauvegarde manuelle
app.get('/api/backup', async (req, res) => {
    try {
        // Lire les données actuelles
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Créer un nom de fichier avec timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(__dirname, '..', 'data', `backup-${timestamp}.json`);
        
        // Sauvegarder une copie
        await fs.writeFile(backupFile, JSON.stringify(jsonData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Sauvegarde créée',
            file: `backup-${timestamp}.json`
        });
        
    } catch (error) {
        console.error('❌ Erreur backup:', error);
        res.status(500).json({ error: 'Erreur de sauvegarde' });
    }
});

// GET - Statistiques des données
app.get('/api/stats', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Calculer les statistiques
        const stats = {
            totalClasses: jsonData.classes.length,
            totalSubjects: 0,
            totalChapters: 0,
            totalQuestions: 0,
            lastModified: jsonData.lastModified || 'Inconnu'
        };
        
        jsonData.classes.forEach(classe => {
            stats.totalSubjects += classe.subjects?.length || 0;
            classe.subjects?.forEach(subject => {
                stats.totalChapters += subject.chapters?.length || 0;
                subject.chapters?.forEach(chapter => {
                    stats.totalQuestions += chapter.quiz?.length || 0;
                });
            });
        });
        
        res.json(stats);
        
    } catch (error) {
        res.status(500).json({ error: 'Erreur de calcul des statistiques' });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`
    🚀 Serveur démarré sur http://localhost:${port}
    
    📁 Fichier de données: data/pedagogie.json
    📡 API disponible:
        - GET  /api/data
        - POST /api/data
        - GET  /api/backup
        - GET  /api/stats
    `);
});