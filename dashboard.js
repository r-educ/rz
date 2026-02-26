// ============================================
// CONFIGURATION ET DONNÉES
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

function saveData() {
    localStorage.setItem('pedagogieData', JSON.stringify(pedagogieData));
}

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
document.addEventListener('click', function(event) {
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
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-success btn-sm" onclick="viewQuiz('${classId}', '${subjectId}', '${chapter.id}')">
                                <i class="fas fa-play"></i>
                                Voir quiz
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
                <button class="btn btn-success" style="width: 100%;">
                    <i class="fas fa-play"></i>
                    Commencer
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    chaptersDiv.innerHTML = html;
}

function startRevisionQuiz(classId, subjectId, chapterId) {
    const subject = findSubject(classId, subjectId);
    const chapter = subject?.chapters.find(c => c.id === chapterId);
    
    if (!chapter || !chapter.quiz || chapter.quiz.length === 0) {
        alert('Ce chapitre n\'a pas encore de quiz');
        return;
    }
    
    // Rediriger vers la page du quiz
    // À adapter selon votre structure
    window.location.href = `quiz.html?class=${classId}&subject=${subjectId}&chapter=${chapterId}`;
}

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

// function deleteClass(classId) {
//     const classe = findClass(classId);
//     if (!classe) return;
    
//     // Compter le nombre de matières et chapitres
//     const subjectCount = classe.subjects?.length || 0;
//     const chapterCount = classe.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) || 0;
    
//     showConfirmModal(
//         'Supprimer cette classe ?',
//         `La classe "${classe.name}" et ses ${subjectCount} matière(s) (${chapterCount} chapitre(s)) seront définitivement supprimées.`,
//         () => {
//             pedagogieData.classes = pedagogieData.classes.filter(c => c.id !== classId);
//             saveData();
//             navigateTo('home');
//         }
//     );
// }

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

// function deleteSubject(classId, subjectId) {
//     const subject = findSubject(classId, subjectId);
//     if (!subject) return;
    
//     const chapterCount = subject.chapters?.length || 0;
    
//     showConfirmModal(
//         'Supprimer cette matière ?',
//         `La matière "${subject.name}" et ses ${chapterCount} chapitre(s) seront définitivement supprimées.`,
//         () => {
//             const classe = findClass(classId);
//             if (classe) {
//                 classe.subjects = classe.subjects.filter(s => s.id !== subjectId);
//                 saveData();
//                 navigateTo('class', classId);
//             }
//         }
//     );
// }

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

// function deleteChapter(classId, subjectId, chapterId) {
//     const subject = findSubject(classId, subjectId);
//     const chapter = subject?.chapters.find(c => c.id === chapterId);
//     if (!chapter) return;
    
//     const quizCount = chapter.quiz?.length || 0;
    
//     showConfirmModal(
//         'Supprimer ce chapitre ?',
//         `Le chapitre "${chapter.title}" et ses ${quizCount} question(s) seront définitivement supprimés.`,
//         () => {
//             if (subject) {
//                 subject.chapters = subject.chapters.filter(c => c.id !== chapterId);
//                 saveData();
//                 navigateTo('subject', classId, subjectId);
//             }
//         }
//     );
// }

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
// INITIALISATION
//============================================

document.addEventListener('DOMContentLoaded', function() {
    showSettingsHome();
});