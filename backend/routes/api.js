const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Chemin du fichier de données
const DATA_FILE = path.join(__dirname, '../data/pedagogie.json');
const BACKUP_DIR = path.join(__dirname, '../data/backups');

// Créer le dossier de backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Fonction pour lire les données
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture données:', error);
        return { classes: [] };
    }
}

// Fonction pour écrire les données
function writeData(data) {
    try {
        // Ajouter la date de mise à jour
        data.lastUpdate = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur écriture données:', error);
        return false;
    }
}

// Fonction pour créer une sauvegarde
function createBackupFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    const data = readData();
    
    try {
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        return path.basename(backupFile);
    } catch (error) {
        console.error('Erreur création backup:', error);
        return null;
    }
}

// ==================== ROUTES ====================

// GET - Récupérer toutes les données
router.get('/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des données' });
    }
});

// POST - Sauvegarder les données
router.post('/data', (req, res) => {
    try {
        const newData = req.body;
        
        // Validation basique
        if (!newData || typeof newData !== 'object') {
            return res.status(400).json({ error: 'Données invalides' });
        }
        
        // S'assurer que la structure est correcte
        if (!newData.classes) {
            newData.classes = [];
        }
        
        // Ajouter les métadonnées
        newData.lastUpdate = new Date().toISOString();
        newData.version = '1.0.0';
        
        // Sauvegarder
        const success = writeData(newData);
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Données sauvegardées avec succès',
                timestamp: newData.lastUpdate
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur POST /data:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Créer une sauvegarde manuelle
router.get('/backup', (req, res) => {
    try {
        const backupFile = createBackupFile();
        
        if (backupFile) {
            res.json({ 
                success: true, 
                message: 'Sauvegarde créée avec succès',
                file: backupFile,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la création de la sauvegarde' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET - Statistiques
router.get('/stats', (req, res) => {
    try {
        const data = readData();
        
        let totalSubjects = 0;
        let totalChapters = 0;
        let totalQuestions = 0;
        
        if (data.classes) {
            data.classes.forEach(classe => {
                if (classe.subjects) {
                    totalSubjects += classe.subjects.length;
                    
                    classe.subjects.forEach(subject => {
                        if (subject.chapters) {
                            totalChapters += subject.chapters.length;
                            
                            subject.chapters.forEach(chapter => {
                                if (chapter.quiz) {
                                    totalQuestions += chapter.quiz.length;
                                }
                            });
                        }
                    });
                }
            });
        }
        
        res.json({
            totalClasses: data.classes.length,
            totalSubjects: totalSubjects,
            totalChapters: totalChapters,
            totalQuestions: totalQuestions,
            lastUpdate: data.lastUpdate || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
    }
});

// GET - Lister toutes les sauvegardes
router.get('/backups', (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const backups = files
            .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
            .map(file => {
                const stats = fs.statSync(path.join(BACKUP_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified);
        
        res.json({
            success: true,
            backups: backups,
            count: backups.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des sauvegardes' });
    }
});

// POST - Restaurer une sauvegarde
router.post('/restore', (req, res) => {
    try {
        const { backupFile } = req.body;
        
        if (!backupFile) {
            return res.status(400).json({ error: 'Nom du fichier de sauvegarde requis' });
        }
        
        const backupPath = path.join(BACKUP_DIR, backupFile);
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ error: 'Fichier de sauvegarde non trouvé' });
        }
        
        // Lire la sauvegarde
        const backupData = fs.readFileSync(backupPath, 'utf8');
        const data = JSON.parse(backupData);
        
        // Restaurer les données
        const success = writeData(data);
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Données restaurées avec succès',
                restoredFrom: backupFile
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la restauration' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la restauration' });
    }
});

// DELETE - Supprimer une sauvegarde
router.delete('/backup/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const backupPath = path.join(BACKUP_DIR, filename);
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }
        
        fs.unlinkSync(backupPath);
        
        res.json({ 
            success: true, 
            message: 'Sauvegarde supprimée avec succès' 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

// POST - Sauvegarde automatique (peut être appelée périodiquement)
router.post('/auto-backup', (req, res) => {
    try {
        const backupFile = createBackupFile();
        
        // Garder seulement les 10 dernières sauvegardes
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .sort()
            .reverse();
        
        if (files.length > 10) {
            files.slice(10).forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(`🗑️ Ancienne sauvegarde supprimée: ${file}`);
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Sauvegarde automatique effectuée',
            file: backupFile
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde automatique' });
    }
});

// GET - Exporter les données en CSV (optionnel)
router.get('/export/csv', (req, res) => {
    try {
        const data = readData();
        let csv = 'Classe,Matière,Chapitre,Question,Option1,Option2,Option3,Option4,Correct\n';
        
        data.classes.forEach(classe => {
            classe.subjects?.forEach(subject => {
                subject.chapters?.forEach(chapter => {
                    chapter.quiz?.forEach(question => {
                        const row = [
                            `"${classe.name}"`,
                            `"${subject.name}"`,
                            `"${chapter.title}"`,
                            `"${question.question.replace(/"/g, '""')}"`,
                            `"${question.options[0]?.replace(/"/g, '""') || ''}"`,
                            `"${question.options[1]?.replace(/"/g, '""') || ''}"`,
                            `"${question.options[2]?.replace(/"/g, '""') || ''}"`,
                            `"${question.options[3]?.replace(/"/g, '""') || ''}"`,
                            question.correct + 1
                        ].join(',');
                        csv += row + '\n';
                    });
                });
            });
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=pedagogie_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l\'export CSV' });
    }
});

module.exports = router;