const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

// Chemin du fichier de données
const DATA_FILE = path.join(__dirname, '../data/pedagogie.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const BACKUP_DIR = path.join(__dirname, '../data/backups');

// Créer le dossier de backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Fonction pour hasher le mot de passe en SHA-256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Fonction pour lire les utilisateurs
function readUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            // Créer avec le compte admin par défaut si n'existe pas
            const defaultUsers = [{
                username: "admin",
                passwordHash: hashPassword("admin")
            }];
            fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
            return defaultUsers;
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture utilisateurs:', error);
        return [];
    }
}

// Fonction pour écrire les utilisateurs
function writeUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur écriture utilisateurs:', error);
        return false;
    }
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

// POST - Enregistrer un formateur
router.post('/auth/register', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
        }
        
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 2) {
            return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir au moins 2 caractères' });
        }
        if (password.length < 4) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 4 caractères' });
        }
        
        const users = readUsers();
        const userExists = users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
        
        if (userExists) {
            return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà utilisé' });
        }
        
        const newUser = {
            username: trimmedUsername,
            passwordHash: hashPassword(password)
        };
        
        users.push(newUser);
        const success = writeUsers(users);
        
        if (success) {
            res.status(201).json({ 
                success: true, 
                message: 'Compte formateur créé avec succès',
                username: trimmedUsername
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'utilisateur' });
        }
    } catch (error) {
        console.error('Erreur POST /auth/register:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Connecter un formateur
router.post('/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
        }
        
        const users = readUsers();
        const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
        
        if (!user) {
            return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
        
        const hash = hashPassword(password);
        if (user.passwordHash === hash) {
            res.json({
                success: true,
                message: 'Connexion réussie',
                username: user.username
            });
        } else {
            res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Erreur POST /auth/login:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

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