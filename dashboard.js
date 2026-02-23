// État global
let currentMode = 'settings';
let currentClass = null;
let currentSubject = null;

// Données (à charger depuis localStorage)
let pedagogieData = JSON.parse(localStorage.getItem('pedagogieData')) || {
    classes: []
};

// ============================================
// GESTION DES MODES
// ============================================

function switchMode(mode) {
    currentMode = mode;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Afficher le contenu approprié
    if (mode === 'settings') {
        showSettings();
    } else {
        showRevision();
    }
}

// ============================================
// MODE RÉGLAGES (Administration)
// ============================================

function showSettings() {
    const content = document.getElementById('contentArea');
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2><i class="fas fa-cog"></i> Administration</h2>
            
            <button class="btn-primary" onclick="showAddClassForm()">
                <i class="fas fa-plus"></i> Nouvelle classe
            </button>
        </div>
        <p style="color: #666; margin-bottom: 2rem;">Créer les classes, les matières et les chapitres</p>
    `;
    
    if (pedagogieData.classes.length === 0) {
        html += `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-school" style="font-size: 4rem; color: #ccc;"></i>
                <p style="color: #666; margin: 1rem 0;">Aucune classe pour le moment</p>
                <button class="btn-primary" onclick="showAddClassForm()">
                    Créer votre première classe
                </button>
            </div>
        `;
    } else {
        html += '<div class="classes-grid">';
        
        pedagogieData.classes.forEach(classe => {
            const subjectCount = classe.subjects?.length || 0;
            
            html += `
                <div class="class-card" onclick="showClassDetails('${classe.id}')">
                    <h3>${classe.name}</h3>
                    <p>${subjectCount} matière(s)</p>
                    <div style="margin-top: 1rem;">
                        <button class="btn-secondary" onclick="event.stopPropagation(); addSubject('${classe.id}')">
                            + Matière
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    content.innerHTML = html;
}

// Formulaire d'ajout de classe
function showAddClassForm() {
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto;">
            <button class="btn-secondary" onclick="showSettings()" style="margin-bottom: 1rem;">
                ← Retour
            </button>
            
            <h2>Nouvelle classe</h2>
            
            <form onsubmit="createClass(event)">
                <div class="form-group">
                    <label>Nom de la classe :</label>
                    <input type="text" id="className" required placeholder="ex: Seconde">
                </div>
                
                <div class="form-group">
                    <label>Niveau :</label>
                    <select id="classLevel">
                        <option value="lycee">Lycée</option>
                        <option value="college">Collège</option>
                    </select>
                </div>
                
                <button type="submit" class="btn-primary">Créer la classe</button>
            </form>
        </div>
    `;
}

function createClass(event) {
    event.preventDefault();
    
    const newClass = {
        id: 'classe-' + Date.now(),
        name: document.getElementById('className').value,
        level: document.getElementById('classLevel').value,
        subjects: []
    };
    
    pedagogieData.classes.push(newClass);
    localStorage.setItem('pedagogieData', JSON.stringify(pedagogieData));
    
    showSettings();
}

// Détails d'une classe (avec ses matières)
function showClassDetails(classId) {
    const classe = pedagogieData.classes.find(c => c.id === classId);
    if (!classe) return;
    
    const content = document.getElementById('contentArea');
    
    let html = `
        <div style="margin-bottom: 2rem;">
            <button class="btn-secondary" onclick="showSettings()" style="margin-bottom: 1rem;">
                ← Retour aux classes
            </button>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>${classe.name}</h2>
                <button class="btn-primary" onclick="showAddSubjectForm('${classId}')">
                    + Ajouter une matière
                </button>
            </div>
        </div>
    `;
    
    if (!classe.subjects || classe.subjects.length === 0) {
        html += `
            <div style="text-align: center; padding: 3rem; background: #f5f5f5; border-radius: 8px;">
                <p>Aucune matière pour le moment</p>
            </div>
        `;
    } else {
        html += '<div class="subjects-grid">';
        
        classe.subjects.forEach(subject => {
            const chapterCount = subject.chapters?.length || 0;
            
            html += `
                <div class="subject-card" onclick="showSubjectDetails('${classId}', '${subject.id}')">
                    <h3>${subject.icon || '📚'} ${subject.name}</h3>
                    <p>${chapterCount} chapitre(s)</p>
                    <p style="font-size: 0.9rem; color: #666;">${subject.description || ''}</p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    content.innerHTML = html;
}

// Formulaire d'ajout de matière
function showAddSubjectForm(classId) {
    const content = document.getElementById('contentArea');
    
    content.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto;">
            <button class="btn-secondary" onclick="showClassDetails('${classId}')" style="margin-bottom: 1rem;">
                ← Retour
            </button>
            
            <h2>Nouvelle matière</h2>
            
            <form onsubmit="createSubject(event, '${classId}')">
                <div class="form-group">
                    <label>Nom de la matière :</label>
                    <input type="text" id="subjectName" required placeholder="ex: Bureautique">
                </div>
                
                <div class="form-group">
                    <label>Description :</label>
                    <textarea id="subjectDescription" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Icône :</label>
                    <select id="subjectIcon">
                        <option value="💻">💻 Bureautique</option>
                        <option value="🔧">🔧 Programmation</option>
                        <option value="🌐">🌐 Réseaux</option>
                    </select>
                </div>
                
                <button type="submit" class="btn-primary">Créer la matière</button>
            </form>
        </div>
    `;
}

function createSubject(event, classId) {
    event.preventDefault();
    
    const classe = pedagogieData.classes.find(c => c.id === classId);
    if (!classe) return;
    
    if (!classe.subjects) classe.subjects = [];
    
    classe.subjects.push({
        id: 'matiere-' + Date.now(),
        name: document.getElementById('subjectName').value,
        description: document.getElementById('subjectDescription').value,
        icon: document.getElementById('subjectIcon').value,
        chapters: []
    });
    
    localStorage.setItem('pedagogieData', JSON.stringify(pedagogieData));
    showClassDetails(classId);
}

// Détails d'une matière (avec ses chapitres)
function showSubjectDetails(classId, subjectId) {
    const classe = pedagogieData.classes.find(c => c.id === classId);
    const subject = classe?.subjects.find(s => s.id === subjectId);
    if (!classe || !subject) return;
    
    const content = document.getElementById('contentArea');
    
    let html = `
        <div style="margin-bottom: 2rem;">
            <button class="btn-secondary" onclick="showClassDetails('${classId}')" style="margin-bottom: 1rem;">
                ← Retour à ${classe.name}
            </button>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>${subject.icon} ${subject.name}</h2>
                <button class="btn-primary" onclick="showAddChapterForm('${classId}', '${subjectId}')">
                    + Nouveau chapitre
                </button>
            </div>
            <p style="color: #666;">${subject.description || ''}</p>
        </div>
    `;
    
    if (!subject.chapters || subject.chapters.length === 0) {
        html += `
            <div style="text-align: center; padding: 3rem; background: #f5f5f5; border-radius: 8px;">
                <p>Aucun chapitre pour le moment</p>
                <button class="btn-primary" onclick="showAddChapterForm('${classId}', '${subjectId}')" style="margin-top: 1rem;">
                    Créer le premier chapitre
                </button>
            </div>
        `;
    } else {
        html += '<div class="chapters-grid">';
        
        subject.chapters.forEach(chapter => {
            html += `
                <div class="chapter-card">
                    <h3>${chapter.title}</h3>
                    <p>${chapter.quiz?.length || 0} question(s)</p>
                    <div style="margin-top: 1rem;">
                        <button class="btn-secondary" onclick="editChapter('${classId}', '${subjectId}', '${chapter.id}')">
                            Modifier
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    content.innerHTML = html;
}

// ============================================
// MODE RÉVISION (Pour les élèves)
// ============================================

function showRevision() {
    const content = document.getElementById('contentArea');
    
    let html = `
        <h2><i class="fas fa-pencil-alt"></i> Révisions</h2>
        <p style="color: #666; margin-bottom: 2rem;">Choisissez une classe et une matière pour commencer</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <!-- Sélection de la classe -->
            <div>
                <h3>1. Choisir une classe</h3>
                <select id="revisionClass" class="form-input" onchange="loadSubjectsForRevision()">
                    <option value="">Sélectionnez une classe</option>
    `;
    
    pedagogieData.classes.forEach(classe => {
        html += `<option value="${classe.id}">${classe.name}</option>`;
    });
    
    html += `
                </select>
            </div>
            
            <!-- Sélection de la matière -->
            <div>
                <h3>2. Choisir une matière</h3>
                <select id="revisionSubject" class="form-input" disabled onchange="loadChaptersForRevision()">
                    <option value="">Sélectionnez d'abord une classe</option>
                </select>
            </div>
        </div>
        
        <!-- Liste des chapitres disponibles -->
        <div id="chaptersList" style="margin-top: 2rem;">
            <!-- Les chapitres apparaîtront ici -->
        </div>
    `;
    
    content.innerHTML = html;
}

function loadSubjectsForRevision() {
    const classId = document.getElementById('revisionClass').value;
    const subjectSelect = document.getElementById('revisionSubject');
    const chaptersList = document.getElementById('chaptersList');
    
    if (!classId) {
        subjectSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="">Sélectionnez d\'abord une classe</option>';
        chaptersList.innerHTML = '';
        return;
    }
    
    const classe = pedagogieData.classes.find(c => c.id === classId);
    
    let options = '<option value="">Choisissez une matière</option>';
    if (classe.subjects) {
        classe.subjects.forEach(subject => {
            options += `<option value="${subject.id}">${subject.icon} ${subject.name}</option>`;
        });
    }
    
    subjectSelect.innerHTML = options;
    subjectSelect.disabled = false;
    chaptersList.innerHTML = '';
}

function loadChaptersForRevision() {
    const classId = document.getElementById('revisionClass').value;
    const subjectId = document.getElementById('revisionSubject').value;
    const chaptersList = document.getElementById('chaptersList');
    
    if (!classId || !subjectId) {
        chaptersList.innerHTML = '';
        return;
    }
    
    const classe = pedagogieData.classes.find(c => c.id === classId);
    const subject = classe?.subjects.find(s => s.id === subjectId);
    
    if (!subject || !subject.chapters || subject.chapters.length === 0) {
        chaptersList.innerHTML = `
            <div style="text-align: center; padding: 2rem; background: #f5f5f5; border-radius: 8px;">
                <p>Aucun chapitre disponible pour cette matière</p>
            </div>
        `;
        return;
    }
    
    let html = '<h3>Chapitres disponibles</h3><div class="chapters-grid">';
    
    subject.chapters.forEach(chapter => {
        html += `
            <div class="chapter-card" onclick="startQuiz('${classId}', '${subjectId}', '${chapter.id}')">
                <h4>${chapter.title}</h4>
                <p>${chapter.quiz?.length || 0} questions</p>
                <button class="btn-primary" style="margin-top: 1rem;">
                    Commencer le quiz
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    chaptersList.innerHTML = html;
}

function startQuiz(classId, subjectId, chapterId) {
    const classe = pedagogieData.classes.find(c => c.id === classId);
    const subject = classe?.subjects.find(s => s.id === subjectId);
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
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    showSettings(); // Mode par défaut
});