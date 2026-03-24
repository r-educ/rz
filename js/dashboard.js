// ============================================
// CONNEXION AU SERVEUR NODE.JS
// ============================================

const API_URL = 'http://localhost:3000/api';

// Charger les données depuis le serveur
async function loadDataFromServer() {
    try {
        const response = await fetch(`${API_URL}/data`);
        if (!response.ok) throw new Error('Erreur chargement');
        
        const serverData = await response.json();
        
        // Fusionner avec les données locales si nécessaire
        if (serverData.classes) {
            pedagogieData = serverData;
            localStorage.setItem('pedagogieData', JSON.stringify(pedagogieData));
            console.log('✅ Données chargées depuis le serveur');
            return true;
        }
    } catch (error) {
        console.log('⚠️ Serveur non disponible, utilisation des données locales');
        
        // Essayer de charger depuis localStorage
        const localData = localStorage.getItem('pedagogieData');
        if (localData) {
            pedagogieData = JSON.parse(localData);
            return true;
        }
    }
    return false;
}

// Sauvegarder les données sur le serveur
async function saveDataToServer() {
    try {
        const response = await fetch(`${API_URL}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pedagogieData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Données sauvegardées sur le serveur');
            showNotification('💾 Sauvegarde réussie', 'success');
            return true;
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (error) {
        console.log('⚠️ Serveur non disponible, sauvegarde locale uniquement');
        showNotification('📁 Sauvegarde locale', 'info');
        return false;
    }
}

// Sauvegarde automatique périodique
let autoSaveInterval;

function startAutoSave(intervalMinutes = 5) {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(async () => {
        console.log('💾 Sauvegarde automatique...');
        await saveDataToServer();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`⏰ Sauvegarde automatique toutes les ${intervalMinutes} minutes`);
}

// Créer une sauvegarde manuelle
async function createBackup() {
    try {
        const response = await fetch(`${API_URL}/backup`);
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Backup créé: ${result.file}`, 'success');
        }
    } catch (error) {
        showNotification('❌ Erreur de backup', 'error');
    }
}

// Voir les statistiques
async function showServerStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        console.log('📊 Statistiques du serveur:', stats);
        
        // Afficher dans une notification
        const statsMessage = `
            📚 ${stats.totalClasses} classes
            📖 ${stats.totalSubjects} matières
            📝 ${stats.totalChapters} chapitres
            ❓ ${stats.totalQuestions} questions
        `;
        
        showNotification(statsMessage, 'info');
        
    } catch (error) {
        console.log('Statistiques non disponibles');
    }
}

// MODIFIER la fonction saveData() existante
function saveData() {
    // Sauvegarde locale (toujours)
    localStorage.setItem('pedagogieData', JSON.stringify(pedagogieData));
    
    // Tentative de sauvegarde serveur (asynchrone)
    saveDataToServer().then(success => {
        if (success) {
            // Mettre à jour l'affichage du dernier sauvegarde
            updateLastSavedIndicator();
        }
    });
}

// Ajouter un indicateur de dernière sauvegarde
function updateLastSavedIndicator() {
    let indicator = document.getElementById('lastSavedIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'lastSavedIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: var(--primary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 1000;
        `;
        document.body.appendChild(indicator);
    }
    
    const now = new Date();
    indicator.innerHTML = `💾 ${now.toLocaleTimeString()}`;
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', async function() {
    // Charger les données depuis le serveur
    await loadDataFromServer();
    
    // Démarrer la sauvegarde automatique
    startAutoSave(5); // Toutes les 5 minutes
    
    // Afficher l'interface
    showSettingsHome();
});




// ============================================
// CONFIGURATION ET DONNEES
// ============================================

let appState = {
    currentMode: 'settings',
    currentClass: null,
    currentSubject: null,
    navigation: ['home']
};

// Chargement des données
let pedagogieData = JSON.parse(localStorage.getItem('pedagogieData')) || {
    classes: [
        {
            id: 'seconde',
            name: 'Seconde',
            level: 'Lycée',
            color: '#6366f1',
            subjects: [
                {
                    id: 'bureautique',
                    name: 'Bureautique',
                    description: 'Maîtrise des outils bureautiques',
                    icon: '💻',
                    chapters: [
                        {
                            id: 'word-bases',
                            title: 'Word - Les bases',
                            fundamentals: {
                                objectives: 'Savoir créer et mettre en forme un document',
                                keyPoints: 'Raccourcis, styles, mise en page',
                                resources: 'Exercices pratiques'
                            },
                            quiz: [
                                {
                                    question: 'Quel raccourci pour copier ?',
                                    options: ['Ctrl+X', 'Ctrl+C', 'Ctrl+V', 'Ctrl+Z'],
                                    correct: 1
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// ============================================
// GESTION DES MODES
// ============================================

function switchMode(mode) {
    appState.currentMode = mode;
    appState.navigation = ['home'];

    // Mettre à jour les boutons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.mode-btn').classList.add('active');

    // Afficher le contenu approprié
    updateBreadcrumb();
    if (mode === 'settings') {
        showSettingsHome();
    } else {
        showRevisionHome();
    }
}

// ============================================
// FIL D'ARIANE
// ============================================

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    let html = '';

    appState.navigation.forEach((item, index) => {
        if (index > 0) {
            html += '<span class="breadcrumb-separator">›</span>';
        }

        let label = '';
        let onclick = '';

        if (item === 'home') {
            label = appState.currentMode === 'settings' ? 'Administration' : 'Révisions';
            onclick = `navigateTo('home')`;
        } else if (item.type === 'class') {
            const classe = findClass(item.id);
            label = classe ? classe.name : 'Classe';
            onclick = `navigateTo('class', '${item.id}')`;
        } else if (item.type === 'subject') {
            const subject = findSubject(item.classId, item.id);
            label = subject ? subject.name : 'Matière';
            onclick = `navigateTo('subject', '${item.classId}', '${item.id}')`;
        }

        const isLast = index === appState.navigation.length - 1;
        html += `
            <span class="breadcrumb-item ${isLast ? 'active' : ''}" onclick="${onclick}">
                ${label}
            </span>
        `;
    });

    breadcrumb.innerHTML = html;
}

function navigateTo(destination, classId, subjectId) {
    if (destination === 'home') {
        appState.navigation = ['home'];
    } else if (destination === 'class') {
        appState.navigation = [
            'home',
            { type: 'class', id: classId }
        ];
    } else if (destination === 'subject') {
        appState.navigation = [
            'home',
            { type: 'class', id: classId },
            { type: 'subject', classId: classId, id: subjectId }
        ];
    }

    updateBreadcrumb();

    if (appState.currentMode === 'settings') {
        if (destination === 'home') showSettingsHome();
        else if (destination === 'class') showClassDetails(classId);
        else if (destination === 'subject') showSubjectDetails(classId, subjectId);
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function findClass(classId) {
    return pedagogieData.classes.find(c => c.id === classId);
}

function findSubject(classId, subjectId) {
    const classe = findClass(classId);
    return classe?.subjects.find(s => s.id === subjectId);
}

// function saveData() {
//     localStorage.setItem('pedagogieData', JSON.stringify(pedagogieData));
//     console.log('✅ Données sauvegardées');
// }




function generateId(name) {
    return name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        + '-' + Date.now();
}

// ============================================
// MODE RÉGLAGES
// ============================================

function showSettingsHome() {
    const content = document.getElementById('mainContent');

    let html = `
        <div class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2><i class="fas fa-cog"></i> Administration</h2>
                <button class="btn btn-primary" onclick="showAddClassForm()">
                    <i class="fas fa-plus"></i>
                    Nouvelle classe
                </button>
            </div>
    `;

    if (pedagogieData.classes.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-school"></i>
                <h3>Aucune classe pour le moment</h3>
                <p>Commencez par créer votre première classe</p>
                <button class="btn btn-primary" onclick="showAddClassForm()" style="margin-top: 1rem;">
                    Créer une classe
                </button>
            </div>
        `;
    } else {
        html += '<div class="classes-grid">';

        pedagogieData.classes.forEach(classe => {
            const subjectCount = classe.subjects?.length || 0;
            const chapterCount = classe.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) || 0;

            html += `
                <div class="class-card" style="position: relative;">
                    <div class="card-actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); editClass('${classe.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteClass('${classe.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div onclick="navigateTo('class', '${classe.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h3 style="color: ${classe.color};">${classe.name}</h3>
                            <span class="badge" style="background: ${classe.color}20; color: ${classe.color};">
                                ${classe.level}
                            </span>
                        </div>
                        <p style="color: var(--gray-500); margin: 0.5rem 0;">
                            ${subjectCount} matière(s) • ${chapterCount} chapitre(s)
                        </p>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    html += '</div>';
    content.innerHTML = html;
}

// Formulaire d'ajout de classe
function showAddClassForm() {
    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 600px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('home')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem;">➕ Nouvelle classe</h2>
                
                <form onsubmit="createClass(event)">
                    <div class="form-group">
                        <label class="form-label">Nom de la classe</label>
                        <input type="text" class="form-input" id="className" 
                               placeholder="ex: Seconde, Première..." required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Niveau</label>
                        <select class="form-select" id="classLevel">
                            <option value="Lycée">Lycée</option>
                            <option value="Collège">Collège</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Couleur</label>
                        <input type="color" class="form-input" id="classColor" value="#6366f1">
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-save"></i>
                        Créer la classe
                    </button>
                </form>
            </div>
        </div>
    `;
}

function createClass(event) {
    event.preventDefault();

    const newClass = {
        id: generateId(document.getElementById('className').value),
        name: document.getElementById('className').value,
        level: document.getElementById('classLevel').value,
        color: document.getElementById('classColor').value,
        subjects: []
    };

    pedagogieData.classes.push(newClass);
    saveData();
    navigateTo('home');
}

// Détails d'une classe
function showClassDetails(classId) {
    const classe = findClass(classId);
    if (!classe) return;

    const content = document.getElementById('mainContent');

    let html = `
        <div class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <h2 style="color: ${classe.color};">${classe.name}</h2>
                    <p style="color: var(--gray-500);">${classe.level}</p>
                </div>
                <button class="btn btn-primary" onclick="showAddSubjectForm('${classId}')">
                    <i class="fas fa-plus"></i>
                    Nouvelle matière
                </button>
            </div>
    `;

    if (!classe.subjects || classe.subjects.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>Aucune matière</h3>
                <p>Ajoutez votre première matière pour cette classe</p>
                <button class="btn btn-primary" onclick="showAddSubjectForm('${classId}')" style="margin-top: 1rem;">
                    Créer une matière
                </button>
            </div>
        `;
    } else {
        html += '<div class="subjects-grid">';

        classe.subjects.forEach(subject => {
            const chapterCount = subject.chapters?.length || 0;

            html += `
                <div class="subject-card" style="position: relative;">
                    <div class="card-actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); editSubject('${classId}', '${subject.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteSubject('${classId}', '${subject.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div onclick="navigateTo('subject', '${classId}', '${subject.id}')">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${subject.icon || '📚'}</div>
                        <h3>${subject.name}</h3>
                        <p style="color: var(--gray-500); font-size: 0.9rem;">${subject.description || ''}</p>
                        <p style="margin-top: 0.5rem;">${chapterCount} chapitre(s)</p>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    html += '</div>';
    content.innerHTML = html;
}

// Formulaire d'ajout de matière
function showAddSubjectForm(classId) {
    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 600px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('class', '${classId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                    Nouvelle matière
                </h2>
                
                <form onsubmit="createSubject(event, '${classId}')">
                    <div class="form-group">
                        <label class="form-label">Nom de la matière</label>
                        <input type="text" class="form-input" id="subjectName" 
                               placeholder="ex: Bureautique, Programmation..." required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-textarea" id="subjectDescription" 
                                  rows="3" placeholder="Description de la matière..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Icône</label>
                        ${generateIconSelector()}
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                        <i class="fas fa-save"></i>
                        Créer la matière
                    </button>
                </form>
            </div>
        </div>
    `;
}

// Générateur de sélecteur d'icônes
// Base de données d'icônes (à placer en haut du fichier avec l'autre iconDatabase)
const iconDatabase = [
    // Matières (12)
    '📚', '💻', '📊', '📝', '🌐', '🔬', '📐', '🎨', '🎵', '🏛️', '🗺️', '⚗️',
    // Actions (12)
    '✏️', '📖', '🔍', '💡', '⭐', '🎯', '🏆', '📌', '🔔', '⏰', '⚡', '💪',
    // Communication (8)
    '💬', '👥', '🤝', '📢', '🗣️', '💭', '💌', '📞',
    // Personnes (8)
    '👨‍🏫', '👩‍🏫', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👴', '👵',
    // Outils (12)
    '📋', '📅', '✅', '❌', '⚠️', '📁', '🔒', '🔓', '🔑', '✂️', '📎', '📏',
    // Divers (8)
    '🎓', '🏫', '🍎', '📘', '📗', '📙', '📕', '📓'
];

// Remplacer l'ancienne fonction generateIconSelector par celle-ci
function generateIconSelector() {
    return `
        <div class="minimal-icon-picker">
            <button type="button" class="icon-picker-btn" onclick="toggleIconPopup(event)">
                <span id="selectedIconDisplay">📚</span>
            </button>
            <div class="icon-popup" id="iconPopup">
                <div class="icon-popup-grid" id="iconPopupGrid">
                    <!-- Les icônes seront générées par JavaScript -->
                </div>
            </div>
            <input type="hidden" id="selectedIconValue" name="icon" value="📚">
        </div>
    `;
}

// Ajoutez ces fonctions après generateIconSelector()

function toggleIconPopup(event) {
    event.stopPropagation();
    const popup = document.getElementById('iconPopup');
    popup.classList.toggle('show');

    // Générer les icônes si ce n'est pas déjà fait
    if (popup.classList.contains('show') && document.getElementById('iconPopupGrid').children.length === 0) {
        generateIconGrid();
    }
}

function generateIconGrid() {
    const grid = document.getElementById('iconPopupGrid');

    iconDatabase.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-popup-item';
        item.textContent = icon;
        item.setAttribute('data-icon', icon);
        item.onclick = (e) => {
            e.stopPropagation();
            selectMinimalIcon(icon);
        };
        grid.appendChild(item);
    });
}

function selectMinimalIcon(icon) {
    // Mettre à jour l'affichage
    document.getElementById('selectedIconDisplay').textContent = icon;

    // Mettre à jour le champ caché
    document.getElementById('selectedIconValue').value = icon;

    // Marquer visuellement l'icône sélectionnée
    document.querySelectorAll('.icon-popup-item').forEach(item => {
        item.classList.remove('selected');
        if (item.textContent === icon) {
            item.classList.add('selected');
        }
    });

    // Fermer la popup après un court délai pour voir la sélection
    setTimeout(() => {
        document.getElementById('iconPopup').classList.remove('show');
    }, 200);
}

// Fermer la popup si on clique ailleurs
document.addEventListener('click', function (event) {
    const popup = document.getElementById('iconPopup');
    const btn = document.querySelector('.icon-picker-btn');

    if (popup && popup.classList.contains('show')) {
        if (!btn.contains(event.target) && !popup.contains(event.target)) {
            popup.classList.remove('show');
        }
    }
});

function selectIcon(icon) {
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.classList.add('selected');
    document.getElementById('selectedIcon').value = icon;
}

function initIconSelector() {
    // La sélection se fait via l'attribut onclick
}

function createSubject(event, classId) {
    event.preventDefault();

    const classe = findClass(classId);
    if (!classe) return;

    if (!classe.subjects) classe.subjects = [];

    // Récupérer l'icône sélectionnée (📚 par défaut)
    const selectedIcon = document.getElementById('selectedIconValue')?.value || '📚';

    classe.subjects.push({
        id: generateId(document.getElementById('subjectName').value),
        name: document.getElementById('subjectName').value,
        description: document.getElementById('subjectDescription').value,
        icon: selectedIcon,
        chapters: []
    });

    saveData();
    navigateTo('class', classId);
}

// Détails d'une matière
function showSubjectDetails(classId, subjectId) {
    const subject = findSubject(classId, subjectId);
    if (!subject) return;

    const content = document.getElementById('mainContent');

    let html = `
        <div class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${subject.icon || '📚'}</div>
                    <h2>${subject.name}</h2>
                    <p style="color: var(--gray-500);">${subject.description || ''}</p>
                </div>
                <button class="btn btn-primary" onclick="showAddChapterForm('${classId}', '${subjectId}')">
                    <i class="fas fa-plus"></i>
                    Nouveau chapitre
                </button>
            </div>
    `;

    if (!subject.chapters || subject.chapters.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>Aucun chapitre</h3>
                <p>Créez votre premier chapitre pour cette matière</p>
                <button class="btn btn-primary" onclick="showAddChapterForm('${classId}', '${subjectId}')" style="margin-top: 1rem;">
                    Créer un chapitre
                </button>
            </div>
        `;
    } else {
        html += '<div class="chapters-grid">';

        subject.chapters.forEach(chapter => {
            const quizCount = chapter.quiz?.length || 0;

            html += `
            <div class="chapter-card" style="position: relative;">
                <div class="card-actions">
                    <button class="action-btn edit" onclick="event.stopPropagation(); editChapter('${classId}', '${subjectId}', '${chapter.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteChapter('${classId}', '${subjectId}', '${chapter.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.5rem;">${chapter.icon || '📚'}</span>
                        <h3>${chapter.title}</h3>
                    </div>
                    <p style="margin-top: 0.5rem;">
                        <span class="badge" style="background: var(--primary-light);">
                            ${quizCount} question(s)
                        </span>
                    </p>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button class="btn btn-success" style="flex: 1;" onclick="manageQuiz('${classId}', '${subjectId}', '${chapter.id}')">
                            <i class="fas fa-question-circle"></i>
                            Gérer le quiz
                        </button>
                    </div>
                </div>
            </div>`;
        });

        html += '</div>';
    }

    html += '</div>';
    content.innerHTML = html;
}


// ============================================
// Pages gestion du quiz
// ============================================

function manageQuiz(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    if (!chapter.quiz) chapter.quiz = [];

    const content = document.getElementById('mainContent');

    let questionsHtml = '';
    if (chapter.quiz.length === 0) {
        questionsHtml = `
            <div class="empty-state" style="padding: 2rem;">
                <i class="fas fa-question-circle"></i>
                <p>Aucune question pour le moment</p>
            </div>
        `;
    } else {
        chapter.quiz.forEach((question, index) => {
            questionsHtml += `
                <div class="question-item" style="background: white; border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1rem; border: 1px solid var(--gray-200);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <h4 style="color: var(--primary);">Question ${index + 1}</h4>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary btn-sm" onclick="editQuestion('${classId}', '${subjectId}', '${chapterId}', ${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${classId}', '${subjectId}', '${chapterId}', ${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p style="font-weight: 500; margin-bottom: 1rem;">${question.question}</p>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        ${question.options.map((opt, optIndex) => `
                            <div style="padding: 0.5rem; background: ${optIndex === question.correct ? 'var(--success-50)' : 'var(--gray-50)'}; border-radius: var(--radius-md); border: 1px solid ${optIndex === question.correct ? 'var(--success)' : 'var(--gray-200)'};">
                                ${optIndex === question.correct ? '✅ ' : '○ '} ${opt}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }

    content.innerHTML = `
        <div class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <button class="btn btn-secondary" onclick="showSubjectDetails('${classId}', '${subjectId}')" style="margin-bottom: 1rem;">
                        <i class="fas fa-arrow-left"></i>
                        Retour au chapitre
                    </button>
                    <h2><i class="fas fa-question-circle"></i> Quiz - ${chapter.title}</h2>
                </div>
                <button class="btn btn-primary" onclick="showAddQuestionForm('${classId}', '${subjectId}', '${chapterId}')">
                    <i class="fas fa-plus"></i>
                    Nouvelle question
                </button>
            </div>
            
            <div style="margin-top: 2rem;">
                ${questionsHtml}
            </div>
        </div>
    `;
}

// Formulaire d'ajout 

// ============================================
// MODE RÉVISION
// ============================================

function showRevisionHome() {
    const content = document.getElementById('mainContent');

    let html = `
        <div class="fade-in">
            <h2 style="margin-bottom: 2rem;"><i class="fas fa-pencil-alt"></i> Révisions</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <!-- Sélection de classe -->
                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: var(--radius-lg);">
                    <h3 style="margin-bottom: 1rem;">1. Choisir une classe</h3>
                    <select class="form-input" id="revisionClass" onchange="loadRevisionSubjects()">
                        <option value="">Sélectionnez une classe</option>
    `;

    pedagogieData.classes.forEach(classe => {
        html += `<option value="${classe.id}">${classe.name}</option>`;
    });

    html += `
                    </select>
                </div>
                
                <!-- Sélection de matière -->
                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: var(--radius-lg);">
                    <h3 style="margin-bottom: 1rem;">2. Choisir une matière</h3>
                    <select class="form-input" id="revisionSubject" disabled onchange="loadRevisionChapters()">
                        <option value="">Sélectionnez d'abord une classe</option>
                    </select>
                </div>
            </div>
            
            <!-- Liste des chapitres -->
            <div id="revisionChapters" style="margin-top: 2rem;"></div>
        </div>
    `;

    content.innerHTML = html;
}

function loadRevisionSubjects() {
    const classId = document.getElementById('revisionClass').value;
    const subjectSelect = document.getElementById('revisionSubject');
    const chaptersDiv = document.getElementById('revisionChapters');

    if (!classId) {
        subjectSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="">Sélectionnez d\'abord une classe</option>';
        chaptersDiv.innerHTML = '';
        return;
    }

    const classe = findClass(classId);

    let options = '<option value="">Choisissez une matière</option>';
    if (classe.subjects) {
        classe.subjects.forEach(subject => {
            options += `<option value="${subject.id}">${subject.icon || '📚'} ${subject.name}</option>`;
        });
    }

    subjectSelect.innerHTML = options;
    subjectSelect.disabled = false;
    chaptersDiv.innerHTML = '';
}

function loadRevisionChapters() {
    const classId = document.getElementById('revisionClass').value;
    const subjectId = document.getElementById('revisionSubject').value;
    const chaptersDiv = document.getElementById('revisionChapters');

    if (!classId || !subjectId) {
        chaptersDiv.innerHTML = '';
        return;
    }

    const subject = findSubject(classId, subjectId);

    if (!subject || !subject.chapters || subject.chapters.length === 0) {
        chaptersDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <p>Aucun chapitre disponible pour cette matière</p>
            </div>
        `;
        return;
    }

    let html = '<h3 style="margin-bottom: 1rem;">Chapitres disponibles</h3><div class="chapters-grid">';

    subject.chapters.forEach(chapter => {
        const quizCount = chapter.quiz?.length || 0;

        html += `
            <div class="chapter-card" onclick="startRevisionQuiz('${classId}', '${subjectId}', '${chapter.id}')">
                <h3>${chapter.title}</h3>
                <p style="color: var(--gray-500); margin: 0.5rem 0;">
                    ${quizCount} question(s)
                </p>
                <button class="btn btn-success btn-sm" onclick="startQuiz('${classId}', '${subjectId}', '${chapter.id}')">
                    <i class="fas fa-play"></i>
                    Commencer le quiz
                </button>
            </div>
        `;
    });

    html += '</div>';
    chaptersDiv.innerHTML = html;
}

function startQuiz(classId, subjectId, chapterId) {
    // Nettoyer les IDs (enlever les timestamps si nécessaire)
    const cleanClassId = classId.replace(/-\d+$/, '');
    const cleanSubjectId = subjectId.replace(/-\d+$/, '');
    const cleanChapterId = chapterId.replace(/-\d+$/, '');
    
    window.location.href = `quiz.html?class=${cleanClassId}&subject=${cleanSubjectId}&chapter=${cleanChapterId}`;
}

// function startRevisionQuiz(classId, subjectId, chapterId) {
//     const subject = findSubject(classId, subjectId);
//     const chapter = subject?.chapters.find(c => c.id === chapterId);

//     if (!chapter || !chapter.quiz || chapter.quiz.length === 0) {
//         alert('Ce chapitre n\'a pas encore de quiz');
//         return;
//     }

//     // Rediriger vers la page du quiz
//     // À adapter selon votre structure
//     window.location.href = `quiz.html?class=${classId}&subject=${subjectId}&chapter=${chapterId}`;
// }




// ============================================
// FONCTIONS D'ÉDITION ET SUPPRESSION
// ============================================

// ---- Pour les classes ----
function editClass(classId) {
    const classe = findClass(classId);
    if (!classe) return;

    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 600px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('home')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                    Modifier la classe
                </h2>
                
                <form onsubmit="updateClass(event, '${classId}')">
                    <div class="form-group">
                        <label class="form-label">Nom de la classe</label>
                        <input type="text" class="form-input" id="editClassName" 
                               value="${classe.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Niveau</label>
                        <select class="form-select" id="editClassLevel">
                            <option value="Lycée" ${classe.level === 'Lycée' ? 'selected' : ''}>Lycée</option>
                            <option value="Collège" ${classe.level === 'Collège' ? 'selected' : ''}>Collège</option>
                            <option value="Autre" ${classe.level === 'Autre' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Couleur</label>
                        <input type="color" class="form-input" id="editClassColor" value="${classe.color}">
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Enregistrer
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="navigateTo('home')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function updateClass(event, classId) {
    event.preventDefault();

    const classe = findClass(classId);
    if (!classe) return;

    classe.name = document.getElementById('editClassName').value;
    classe.level = document.getElementById('editClassLevel').value;
    classe.color = document.getElementById('editClassColor').value;

    saveData();
    navigateTo('home');
}

function deleteClass(classId) {
    const classe = findClass(classId);
    if (!classe) return;

    if (confirm(`Supprimer définitivement la classe "${classe.name}" ?`)) {
        pedagogieData.classes = pedagogieData.classes.filter(c => c.id !== classId);
        saveData();
        alert('Classe supprimée');
        navigateTo('home');
    }
}

// ---- Pour les matières ----
function editSubject(classId, subjectId) {
    const subject = findSubject(classId, subjectId);
    if (!subject) return;

    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 600px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('class', '${classId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                    Modifier la matière
                </h2>
                
                <form onsubmit="updateSubject(event, '${classId}', '${subjectId}')">
                    <div class="form-group">
                        <label class="form-label">Nom de la matière</label>
                        <input type="text" class="form-input" id="editSubjectName" 
                               value="${subject.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-textarea" id="editSubjectDescription" 
                                  rows="3">${subject.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Icône</label>
                        <div class="minimal-icon-picker">
                            <button type="button" class="icon-picker-btn" onclick="toggleIconPopup(event)">
                                <span id="editSubjectIcon">${subject.icon || '📚'}</span>
                            </button>
                            <div class="icon-popup" id="iconPopup">
                                <div class="icon-popup-grid" id="iconPopupGrid"></div>
                            </div>
                            <input type="hidden" id="editSubjectIconValue" value="${subject.icon || '📚'}">
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Enregistrer
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="navigateTo('class', '${classId}')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Régénérer la grille d'icônes pour l'édition
    setTimeout(() => {
        generateIconGridForEdit('editSubjectIcon', 'editSubjectIconValue');
    }, 100);
}

function updateSubject(event, classId, subjectId) {
    event.preventDefault();

    const subject = findSubject(classId, subjectId);
    if (!subject) return;

    subject.name = document.getElementById('editSubjectName').value;
    subject.description = document.getElementById('editSubjectDescription').value;
    subject.icon = document.getElementById('editSubjectIconValue')?.value || subject.icon;

    saveData();
    navigateTo('class', classId);
}


function deleteSubject(classId, subjectId) {
    const subject = findSubject(classId, subjectId);
    if (!subject) return;

    if (confirm(`Supprimer définitivement la matière "${subject.name}" ?`)) {
        const classe = findClass(classId);
        classe.subjects = classe.subjects.filter(s => s.id !== subjectId);
        saveData();
        alert('Matière supprimée');
        navigateTo('class', classId);
    }
}

// ---- Pour les chapitres ----
function editChapter(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 700px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                    Modifier le chapitre
                </h2>
                
                <form onsubmit="updateChapter(event, '${classId}', '${subjectId}', '${chapterId}')">
                    <div class="form-group">
                        <label class="form-label">Titre du chapitre</label>
                        <input type="text" class="form-input" id="editChapterTitle" 
                               value="${chapter.title}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Icône</label>
                        <div class="minimal-icon-picker">
                            <button type="button" class="icon-picker-btn" onclick="toggleIconPopup(event)">
                                <span id="editChapterIcon">${chapter.icon || '📚'}</span>
                            </button>
                            <div class="icon-popup" id="iconPopup">
                                <div class="icon-popup-grid" id="iconPopupGrid"></div>
                            </div>
                            <input type="hidden" id="editChapterIconValue" value="${chapter.icon || '📚'}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Objectifs pédagogiques</label>
                        <textarea class="form-textarea" id="editChapterObjectives" 
                                  rows="3">${chapter.fundamentals?.objectives || ''}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Enregistrer
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Régénérer la grille d'icônes pour l'édition
    setTimeout(() => {
        generateIconGridForEdit('editChapterIcon', 'editChapterIconValue');
    }, 100);
}

function updateChapter(event, classId, subjectId, chapterId) {
    event.preventDefault();

    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    chapter.title = document.getElementById('editChapterTitle').value;
    chapter.icon = document.getElementById('editChapterIconValue')?.value || chapter.icon;

    if (!chapter.fundamentals) chapter.fundamentals = {};
    chapter.fundamentals.objectives = document.getElementById('editChapterObjectives').value;

    saveData();
    navigateTo('subject', classId, subjectId);
}

function deleteChapter(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    if (confirm(`Supprimer définitivement le chapitre "${chapter.title}" ?`)) {
        subject.chapters = subject.chapters.filter(c => c.id !== chapterId);
        saveData();
        alert('Chapitre supprimé');
        navigateTo('subject', classId, subjectId);
    }
}


//====================== affichage formulaire d'ajout  chapitre ======================
function showAddChapterForm(classId, subjectId) {
    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour à la matière
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem;">➕ Nouveau chapitre</h2>
                
                <form onsubmit="createChapter(event, '${classId}', '${subjectId}')">
                    <!-- Informations de base -->
                    <div class="form-group">
                        <label class="form-label">Titre du chapitre</label>
                        <input type="text" class="form-input" id="chapterTitle" placeholder="ex: Word - Les bases" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Icône (optionnel)</label>
                        ${generateIconSelector()}
                        <input type="hidden" id="selectedIcon" value="📚">
                    </div>
                    
                    <h3 style="margin: 1.5rem 0 1rem;">Fondamentaux</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Objectifs pédagogiques</label>
                        <textarea class="form-textarea" id="chapterObjectives" rows="3" placeholder="Ce que l'élève doit savoir..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Points clés</label>
                        <textarea class="form-textarea" id="chapterKeyPoints" rows="3" placeholder="Les notions importantes..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Ressources</label>
                        <textarea class="form-textarea" id="chapterResources" rows="3" placeholder="Liens, vidéos, exercices..."></textarea>
                    </div>
                    
                    <!-- Section Quiz (optionnelle) -->
                    <h3 style="margin: 1.5rem 0 1rem;">Quiz</h3>
                    <p style="color: var(--gray-500); margin-bottom: 1rem;">Vous pourrez ajouter des questions plus tard.</p>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Créer le chapitre
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    function addQuestion() {
    const questionId = Date.now();
    const questionHtml = `
        <div class="question-card" id="question-${questionId}">
            <div class="question-header">
                <span class="question-number">Question ${questions.length + 1}</span>
                <button type="button" onclick="removeQuestion(${questionId})" class="btn-icon delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Question</label>
                <input type="text" class="form-input" 
                       placeholder="Ex: Quel est le raccourci pour copier ?"
                       onchange="updateQuestion(${questionId}, 'text', this.value)">
            </div>
            
            <div class="options-grid">
                ${[0,1,2,3].map(i => `
                    <div class="option-item">
                        <input type="radio" name="correct-${questionId}" 
                               value="${i}" onchange="setCorrectAnswer(${questionId}, ${i})">
                        <input type="text" class="form-input" 
                               placeholder="Option ${i+1}"
                               onchange="updateQuestion(${questionId}, 'option${i}', this.value)">
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 0.5rem; color: var(--gray-500); font-size: 0.9rem;">
                <i class="fas fa-info-circle"></i>
                Cochez la bonne réponse avec le bouton radio
            </div>
        </div>
    `;
    
    document.getElementById('questionsList').insertAdjacentHTML('beforeend', questionHtml);
    
    questions.push({
        id: questionId,
        text: '',
        options: ['', '', '', ''],
        correct: null
    });
}


    // Initialiser le sélecteur d'icônes
    initIconSelector();
}

//====================== Création de chapitre ======================
function createChapter(event, classId, subjectId) {
    event.preventDefault();

    const subject = findSubject(classId, subjectId);
    if (!subject) return;

    const newChapter = {
        id: generateId(document.getElementById('chapterTitle').value),
        title: document.getElementById('chapterTitle').value,
        icon: document.getElementById('selectedIcon')?.value || '📚',
        fundamentals: {
            objectives: document.getElementById('chapterObjectives').value,
            keyPoints: document.getElementById('chapterKeyPoints').value,
            resources: document.getElementById('chapterResources').value
        },
        quiz: [] // Sera rempli plus tard
    };

    if (!subject.chapters) subject.chapters = [];
    subject.chapters.push(newChapter);

    saveData();
    navigateTo('subject', classId, subjectId);
}

//====================== édition de chapitre ======================
function editChapter(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const content = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="fade-in" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour à la matière
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem;">✏️ Modifier le chapitre</h2>
                
                <form onsubmit="updateChapter(event, '${classId}', '${subjectId}', '${chapterId}')">
                    <div class="form-group">
                        <label class="form-label">Titre du chapitre</label>
                        <input type="text" class="form-input" id="editChapterTitle" value="${chapter.title}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Icône</label>
                        <div class="minimal-icon-picker">
                            <button type="button" class="icon-picker-btn" onclick="toggleIconPopup(event)">
                                <span id="editChapterIcon">${chapter.icon || '📚'}</span>
                            </button>
                            <div class="icon-popup" id="iconPopup">
                                <div class="icon-popup-grid" id="iconPopupGrid"></div>
                            </div>
                            <input type="hidden" id="editChapterIconValue" value="${chapter.icon || '📚'}">
                        </div>
                    </div>
                    
                    <h3 style="margin: 1.5rem 0 1rem;">Fondamentaux</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Objectifs pédagogiques</label>
                        <textarea class="form-textarea" id="editChapterObjectives" rows="3">${chapter.fundamentals?.objectives || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Points clés</label>
                        <textarea class="form-textarea" id="editChapterKeyPoints" rows="3">${chapter.fundamentals?.keyPoints || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Ressources</label>
                        <textarea class="form-textarea" id="editChapterResources" rows="3">${chapter.fundamentals?.resources || ''}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Enregistrer
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Régénérer la grille d'icônes pour l'édition
    setTimeout(() => {
        generateIconGridForEdit('editChapterIcon', 'editChapterIconValue');
    }, 100);
}

function updateChapter(event, classId, subjectId, chapterId) {
    event.preventDefault();

    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    chapter.title = document.getElementById('editChapterTitle').value;
    chapter.icon = document.getElementById('editChapterIconValue')?.value || chapter.icon;

    if (!chapter.fundamentals) chapter.fundamentals = {};
    chapter.fundamentals.objectives = document.getElementById('editChapterObjectives').value;
    chapter.fundamentals.keyPoints = document.getElementById('editChapterKeyPoints').value;
    chapter.fundamentals.resources = document.getElementById('editChapterResources').value;

    saveData();
    navigateTo('subject', classId, subjectId);
}

//====================== affichage des chapitres ======================

// Modifiez la partie des chapitres dans showSubjectDetails()
function showSubjectDetails(classId, subjectId) {
    const subject = findSubject(classId, subjectId);
    if (!subject) return;
    
    const content = document.getElementById('mainContent');
    
    let html = `
        <div class="fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <button class="btn btn-secondary" onclick="navigateTo('class', '${classId}')" style="margin-bottom: 1rem;">
                        <i class="fas fa-arrow-left"></i>
                        Retour à la classe
                    </button>
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${subject.icon || '📚'}</div>
                    <h2>${subject.name}</h2>
                    <p style="color: var(--gray-500);">${subject.description || ''}</p>
                </div>
                <button class="btn btn-primary" onclick="showAddChapterForm('${classId}', '${subjectId}')">
                    <i class="fas fa-plus"></i>
                    Nouveau chapitre
                </button>
            </div>
    `;
    
    if (!subject.chapters || subject.chapters.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>Aucun chapitre</h3>
                <p>Créez votre premier chapitre pour cette matière</p>
                <button class="btn btn-primary" onclick="showAddChapterForm('${classId}', '${subjectId}')" style="margin-top: 1rem;">
                    Créer un chapitre
                </button>
            </div>
        `;
    } else {
        html += '<div class="chapters-grid">';
        
        subject.chapters.forEach(chapter => {
            const quizCount = chapter.quiz?.length || 0;
            
            html += `
                <div class="chapter-card" style="position: relative;">
                    <div class="card-actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); editChapter('${classId}', '${subjectId}', '${chapter.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteChapter('${classId}', '${subjectId}', '${chapter.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">${chapter.icon || '📚'}</span>
                            <h3>${chapter.title}</h3>
                        </div>
                        
                        <!-- Aperçu des fondamentaux -->
                        <div style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--gray-600);">
                            ${chapter.fundamentals?.objectives?.substring(0, 100) || 'Aucun objectif'}...
                        </div>
                        
                        <!-- Stats du quiz -->
                        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                            <span class="badge" style="background: var(--primary-100);">
                                <i class="fas fa-question-circle"></i>
                                ${quizCount} question(s)
                            </span>
                        </div>
                        
                        <!-- Actions -->
                        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); startQuiz('${classId}', '${subjectId}', '${chapter.id}')">
                                <i class="fas fa-play"></i>
                                Voir quiz
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showQuizManager('${classId}', '${subjectId}', '${chapter.id}')">
                                <i class="fas fa-cog"></i>
                                Gérer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

// Optionnel : vue détaillée d'un chapitre (pour voir les fondamentaux et quiz)
function viewChapterDetails(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const content = document.getElementById('mainContent');

    html = `
        <div class="fade-in">
            <button class="btn btn-secondary" onclick="showSubjectDetails('${classId}', '${subjectId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour à la matière
            </button>
            
            <div style="background: white; border-radius: var(--radius-xl); padding: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                    <span style="font-size: 3rem;">${chapter.icon || '📚'}</span>
                    <h1>${chapter.title}</h1>
                </div>
                
                <h3>📚 Objectifs</h3>
                <p>${chapter.fundamentals?.objectives || 'Aucun objectif défini.'}</p>
                
                <h3>🔑 Points clés</h3>
                <p>${chapter.fundamentals?.keyPoints || 'Aucun point clé défini.'}</p>
                
                <h3>🔗 Ressources</h3>
                <p>${chapter.fundamentals?.resources || 'Aucune ressource.'}</p>
                
                <h3>🎯 Quiz</h3>
                ${chapter.quiz?.length > 0 ?
            `<p>${chapter.quiz.length} question(s) disponible(s).</p>` :
            '<p>Aucune question pour le moment.</p>'}
            </div>
        </div>
    `;

    content.innerHTML = html;
}


//====================== suppression de chapitre ======================
function deleteChapter(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    if (confirm(`⚠️ Supprimer le chapitre "${chapter.title}" ?`)) {
        subject.chapters = subject.chapters.filter(c => c.id !== chapterId);
        saveData();
        showSubjectDetails(classId, subjectId);
    }
}




// ============================================
// MODAL DE CONFIRMATION
// ============================================

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// GÉNÉRATION DE LA GRILLE D'ICÔNES POUR ÉDITION
// ============================================

function generateIconGridForEdit(displayId, inputId) {
    const grid = document.getElementById('iconPopupGrid');
    if (!grid) return;

    grid.innerHTML = '';

    iconDatabase.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-popup-item';
        item.textContent = icon;
        item.setAttribute('data-icon', icon);
        item.onclick = (e) => {
            e.stopPropagation();
            document.getElementById(displayId).textContent = icon;
            document.getElementById(inputId).value = icon;

            document.querySelectorAll('.icon-popup-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');

            setTimeout(() => {
                document.getElementById('iconPopup').classList.remove('show');
            }, 200);
        };
        grid.appendChild(item);
    });
}

// ============================================
// GESTION DES QUIZ DANS RÉGLAGES
// ============================================

function showQuizManager(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="fade-in">
            <!-- En-tête -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div>
                    <button class="btn btn-secondary" onclick="navigateTo('subject', '${classId}', '${subjectId}')" style="margin-bottom: 1rem;">
                        <i class="fas fa-arrow-left"></i>
                        Retour au chapitre
                    </button>
                    <h2 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 2rem;">${chapter.icon || '📚'}</span>
                        ${chapter.title} - Gestion du quiz
                    </h2>
                </div>
                <button class="btn btn-primary" onclick="showAddQuestionForm('${classId}', '${subjectId}', '${chapterId}')">
                    <i class="fas fa-plus"></i>
                    Nouvelle question
                </button>
            </div>
            
            <!-- Liste des questions existantes -->
            <div id="questionsList" class="questions-manager">
                ${generateQuestionsList(chapter.quiz || [], classId, subjectId, chapterId)}
            </div>
        </div>
    `;
}

function generateQuestionsList(questions, classId, subjectId, chapterId) {
    if (!questions || questions.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <h3>Aucune question</h3>
                <p>Commencez par ajouter votre première question</p>
                <button class="btn btn-primary" onclick="showAddQuestionForm('${classId}', '${subjectId}', '${chapterId}')">
                    <i class="fas fa-plus"></i>
                    Ajouter une question
                </button>
            </div>
        `;
    }
    
    let html = '<div class="questions-grid">';
    
    questions.forEach((q, index) => {
        const bonneReponse = q.options[q.correct];
        
        html += `
            <div class="question-manager-card">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                    <div class="card-actions">
                        <button class="action-btn edit" onclick="editQuestion('${classId}', '${subjectId}', '${chapterId}', ${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteQuestion('${classId}', '${subjectId}', '${chapterId}', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="question-content">
                    <p><strong>❓ ${q.question}</strong></p>
                    <div class="options-preview">
                        ${q.options.map((opt, i) => `
                            <div class="option-preview ${i === q.correct ? 'correct-option' : ''}">
                                ${i === q.correct ? '✓' : '○'} ${opt}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}


// **********  formulaire d'ajout de question ***************
function showAddQuestionForm(classId, subjectId, chapterId) {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="fade-in" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="showQuizManager('${classId}', '${subjectId}', '${chapterId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour à la gestion du quiz
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                    Nouvelle question
                </h2>
                
                <form onsubmit="addQuestion(event, '${classId}', '${subjectId}', '${chapterId}')">
                    <!-- Question -->
                    <div class="form-group">
                        <label class="form-label">Question</label>
                        <input type="text" class="form-input" id="questionText" 
                               placeholder="Ex: Quel est le raccourci pour copier du texte ?" required>
                    </div>
                    
                    <!-- Options -->
                    <div class="form-group">
                        <label class="form-label">Options de réponse</label>
                        <div class="options-editor">
                            ${[0,1,2,3].map(i => `
                                <div class="option-edit-row">
                                    <input type="radio" name="correctOption" value="${i}" id="opt${i}" required>
                                    <input type="text" class="form-input" 
                                           id="option${i}"
                                           placeholder="Option ${i+1}" 
                                           required>
                                </div>
                            `).join('')}
                        </div>
                        <small style="color: var(--gray-500);">
                            <i class="fas fa-info-circle"></i>
                            Cochez la bonne réponse
                        </small>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Ajouter la question
                        </button>
                        <button type="button" class="btn btn-secondary" 
                                onclick="showQuizManager('${classId}', '${subjectId}', '${chapterId}')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function addQuestion(event, classId, subjectId, chapterId) {
    event.preventDefault();
    
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    // Récupérer la question
    const questionText = document.getElementById('questionText').value;
    
    // Récupérer les options
    const options = [];
    for (let i = 0; i < 4; i++) {
        options.push(document.getElementById(`option${i}`).value);
    }
    
    // Récupérer la bonne réponse
    const correctOption = document.querySelector('input[name="correctOption"]:checked');
    if (!correctOption) {
        alert('Veuillez sélectionner la bonne réponse');
        return;
    }
    
    // Créer la nouvelle question
    const newQuestion = {
        question: questionText,
        options: options,
        correct: parseInt(correctOption.value)
    };
    
    // Ajouter au chapitre
    if (!chapter.quiz) chapter.quiz = [];
    chapter.quiz.push(newQuestion);
    
    // Sauvegarder
    saveData();
    
    // Retourner à la gestion du quiz
    showQuizManager(classId, subjectId, chapterId);
}

// *************** édition et suppresion de question ****************
function editQuestion(classId, subjectId, chapterId, questionIndex) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    const question = chapter?.quiz[questionIndex];
    if (!question) return;
    
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="fade-in" style="max-width: 800px; margin: 0 auto;">
            <button class="btn btn-secondary" onclick="showQuizManager('${classId}', '${subjectId}', '${chapterId}')" style="margin-bottom: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Retour à la gestion du quiz
            </button>
            
            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-xl);">
                <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-edit" style="color: var(--primary);"></i>
                    Modifier la question
                </h2>
                
                <form onsubmit="updateQuestion(event, '${classId}', '${subjectId}', '${chapterId}', ${questionIndex})">
                    <!-- Question -->
                    <div class="form-group">
                        <label class="form-label">Question</label>
                        <input type="text" class="form-input" id="editQuestionText" 
                               value="${question.question.replace(/"/g, '&quot;')}" required>
                    </div>
                    
                    <!-- Options -->
                    <div class="form-group">
                        <label class="form-label">Options de réponse</label>
                        <div class="options-editor">
                            ${question.options.map((opt, i) => `
                                <div class="option-edit-row">
                                    <input type="radio" name="correctOption" value="${i}" 
                                           ${i === question.correct ? 'checked' : ''} required>
                                    <input type="text" class="form-input" 
                                           id="editOption${i}"
                                           value="${opt.replace(/"/g, '&quot;')}" 
                                           required>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            <i class="fas fa-save"></i>
                            Enregistrer
                        </button>
                        <button type="button" class="btn btn-secondary" 
                                onclick="showQuizManager('${classId}', '${subjectId}', '${chapterId}')" style="flex: 1;">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function updateQuestion(event, classId, subjectId, chapterId, questionIndex) {
    event.preventDefault();
    
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.quiz) return;
    
    // Mettre à jour la question
    chapter.quiz[questionIndex] = {
        question: document.getElementById('editQuestionText').value,
        options: [
            document.getElementById('editOption0').value,
            document.getElementById('editOption1').value,
            document.getElementById('editOption2').value,
            document.getElementById('editOption3').value
        ],
        correct: parseInt(document.querySelector('input[name="correctOption"]:checked').value)
    };
    
    saveData();
    showQuizManager(classId, subjectId, chapterId);
}

function deleteQuestion(classId, subjectId, chapterId, questionIndex) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.quiz) return;
    
    const question = chapter.quiz[questionIndex];
    
    if (confirm(`Supprimer cette question ?\n\n"${question.question}"`)) {
        chapter.quiz.splice(questionIndex, 1);
        saveData();
        showQuizManager(classId, subjectId, chapterId);
    }
}


function getValidQuizUrl(classId, subjectId, chapterId) {
    // Nettoyer les IDs (enlever les timestamps si nécessaire)
    const cleanClassId = classId.replace(/-\d+$/, '');
    const cleanSubjectId = subjectId.replace(/-\d+$/, '');
    const cleanChapterId = chapterId.replace(/-\d+$/, '');
    
    return `quiz.html?class=${cleanClassId}&subject=${cleanSubjectId}&chapter=${cleanChapterId}`;
}


// ============================================
// INITIALISATION
//============================================

document.addEventListener('DOMContentLoaded', function () {
    showSettingsHome();
});

