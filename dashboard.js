// Gestion du stockage local des chapitres
let chapters = JSON.parse(localStorage.getItem('chapters')) || [
    // Chapitres par défaut
    {
        id: 'word',
        name: 'Word',
        description: 'Raccourcis, mise en forme, styles... Tout pour maîtriser le traitement de texte.',
        icon: '📝',
        color: '#3498db',
        createdAt: new Date().toISOString(),
        quizCount: 0
    },
    {
        id: 'excel',
        name: 'Excel',
        description: 'Formules, tableaux, astuces... Le tableur n\'aura plus de secrets pour vous.',
        icon: '📊',
        color: '#27ae60',
        createdAt: new Date().toISOString(),
        quizCount: 0
    },
    {
        id: 'internet',
        name: 'Internet',
        description: 'Navigation, recherche, sécurité en ligne... Les bons réflexes à avoir.',
        icon: '🌐',
        color: '#e74c3c',
        createdAt: new Date().toISOString(),
        quizCount: 0
    }
];

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    renderChapters();
});

// Afficher le modal
function showAddChapterModal() {
    document.getElementById('addChapterModal').style.display = 'block';
}

// Fermer le modal
function closeModal() {
    document.getElementById('addChapterModal').style.display = 'none';
    document.getElementById('chapterForm').reset();
}

// Créer un nouveau chapitre
function createChapter(event) {
    event.preventDefault();
    
    const chapterName = document.getElementById('chapterName').value;
    const chapterDescription = document.getElementById('chapterDescription').value;
    const chapterIcon = document.getElementById('chapterIcon').value;
    const chapterColor = document.getElementById('chapterColor').value;
    
    // Créer un ID valide (sans accents, en minuscules)
    const chapterId = chapterName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');
    
    const newChapter = {
        id: chapterId,
        name: chapterName,
        description: chapterDescription,
        icon: chapterIcon,
        color: chapterColor,
        createdAt: new Date().toISOString(),
        quizCount: 0
    };
    
    chapters.push(newChapter);
    localStorage.setItem('chapters', JSON.stringify(chapters));
    
    // Créer les dossiers et fichiers du chapitre (simulé)
    createChapterStructure(newChapter);
    
    closeModal();
    updateStats();
    renderChapters();
}

// Créer la structure du chapitre
function createChapterStructure(chapter) {
    // Dans un environnement réel, on enverrait ces données au serveur
    console.log('Création du chapitre :', chapter);
    
    // Template pour la page du chapitre
    const chapterPageTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chapter.name} - Anti-Sèche Bureautique</title>
    <link rel="stylesheet" href="../dashboard-style.css">
    <style>
        :root { --chapter-color: ${chapter.color}; }
        .chapter-header { background: ${chapter.color}; }
    </style>
</head>
<body>
    <div class="chapter-container">
        <header class="chapter-header">
            <a href="../index.html" class="back-link">← Retour au tableau de bord</a>
            <h1>${chapter.icon} ${chapter.name}</h1>
            <p>${chapter.description}</p>
        </header>

        <section class="fundamentals">
            <h2>📚 Les fondamentaux</h2>
            <div class="content-card">
                <h3>Objectifs du chapitre</h3>
                <ul>
                    <li>Objectif 1 à définir</li>
                    <li>Objectif 2 à définir</li>
                    <li>Objectif 3 à définir</li>
                </ul>
            </div>

            <div class="content-card">
                <h3>Points clés à retenir</h3>
                <ul>
                    <li>Point clé 1</li>
                    <li>Point clé 2</li>
                    <li>Point clé 3</li>
                </ul>
            </div>
        </section>

        <section class="quiz-section">
            <h2>🎯 Quiz du chapitre</h2>
            <div class="quiz-actions">
                <button onclick="location.href='quiz.html'" class="btn-primary">
                    Commencer le quiz
                </button>
            </div>
        </section>
    </div>
</body>
</html>
    `;
    
    // Template pour le quiz du chapitre
    const quizTemplate = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz ${chapter.name} - Anti-Sèche Bureautique</title>
    <link rel="stylesheet" href="../dashboard-style.css">
    <style>
        :root { --chapter-color: ${chapter.color}; }
        .quiz-header { background: ${chapter.color}; }
    </style>
</head>
<body>
    <div class="quiz-container">
        <header class="quiz-header">
            <a href="index.html" class="back-link">← Retour au chapitre</a>
            <h1>${chapter.icon} Quiz : ${chapter.name}</h1>
            <p>Testez vos connaissances</p>
        </header>

        <form id="quizForm" class="quiz-form">
            <!-- Les questions seront ajoutées dynamiquement -->
        </form>

        <div class="quiz-actions">
            <button onclick="submitQuiz()" class="btn-primary">📋 Voir mes résultats</button>
        </div>

        <div id="results" class="results" style="display: none;">
            <h2>📊 Vos résultats</h2>
            <div id="scoreDisplay"></div>
            <div id="correctionDetails"></div>
        </div>
    </div>

    <script>
        const reponses = {}; // À définir avec les bonnes réponses
        const libelles = {}; // À définir avec les libellés

        function submitQuiz() {
            // Logique de correction (à implémenter)
            alert('Quiz en cours de construction ! Ajoutez vos questions.');
        }
    </script>
</body>
</html>
    `;
    
    // Note: Dans un environnement réel avec serveur, on créerait les fichiers
    // Pour GitHub Pages, on peut générer les URLs et guider l'utilisateur
    alert(`Chapitre "${chapter.name}" créé !\n\nPour finaliser :\n1. Créez un dossier "${chapter.id}"\n2. Ajoutez index.html et quiz.html\n3. Utilisez les templates fournis`);
}

// Mettre à jour les statistiques
function updateStats() {
    document.getElementById('chapterCount').textContent = chapters.length;
    
    let totalQuizzes = 0;
    let totalQuestions = 0;
    
    chapters.forEach(chapter => {
        totalQuizzes += chapter.quizCount || 0;
        // Simulation : en vrai, on compterait les questions depuis les fichiers
        totalQuestions += 10; // 10 questions par défaut
    });
    
    document.getElementById('quizCount').textContent = totalQuizzes;
    document.getElementById('questionCount').textContent = totalQuestions;
}

// Afficher tous les chapitres
function renderChapters() {
    const grid = document.getElementById('chaptersGrid');
    grid.innerHTML = '';
    
    chapters.forEach(chapter => {
        const card = createChapterCard(chapter);
        grid.appendChild(card);
    });
}

// Créer une carte pour un chapitre
function createChapterCard(chapter) {
    const card = document.createElement('div');
    card.className = 'chapter-card';
    card.style.setProperty('--chapter-color', chapter.color);
    
    const createdDate = new Date(chapter.createdAt).toLocaleDateString('fr-FR');
    
    card.innerHTML = `
        <div class="chapter-icon">${chapter.icon}</div>
        <h3>${chapter.name}</h3>
        <p class="chapter-description">${chapter.description}</p>
        <div class="chapter-meta">
            <span>Créé le ${createdDate}</span>
            <span>${chapter.quizCount || 0} quiz</span>
        </div>
        <div class="chapter-actions">
            <a href="${chapter.id}/" class="btn-view">Voir</a>
            <button onclick="editChapter('${chapter.id}')" class="btn-edit">Modifier</button>
            <button onclick="deleteChapter('${chapter.id}')" class="btn-delete">Supprimer</button>
            <button onclick="addQuiz('${chapter.id}')" class="btn-add-quiz">+ Quiz</button>
        </div>
    `;
    
    return card;
}

// Modifier un chapitre
function editChapter(chapterId) {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
        // Remplir le formulaire avec les données existantes
        document.getElementById('chapterName').value = chapter.name;
        document.getElementById('chapterDescription').value = chapter.description;
        document.getElementById('chapterIcon').value = chapter.icon;
        document.getElementById('chapterColor').value = chapter.color;
        
        // Modifier le titre du modal
        document.querySelector('#addChapterModal h2').textContent = '✏️ Modifier le chapitre';
        
        // Changer le comportement du formulaire
        const form = document.getElementById('chapterForm');
        form.onsubmit = function(event) {
            event.preventDefault();
            updateChapter(chapterId);
        };
        
        showAddChapterModal();
    }
}

// Mettre à jour un chapitre
function updateChapter(chapterId) {
    const index = chapters.findIndex(c => c.id === chapterId);
    if (index !== -1) {
        chapters[index] = {
            ...chapters[index],
            name: document.getElementById('chapterName').value,
            description: document.getElementById('chapterDescription').value,
            icon: document.getElementById('chapterIcon').value,
            color: document.getElementById('chapterColor').value
        };
        
        localStorage.setItem('chapters', JSON.stringify(chapters));
        closeModal();
        renderChapters();
        
        // Remettre le formulaire en mode création
        resetFormToCreate();
    }
}

// Supprimer un chapitre
function deleteChapter(chapterId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ? Cette action est irréversible.')) {
        chapters = chapters.filter(c => c.id !== chapterId);
        localStorage.setItem('chapters', JSON.stringify(chapters));
        renderChapters();
        updateStats();
    }
}

// Ajouter un quiz à un chapitre
function addQuiz(chapterId) {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
        chapter.quizCount = (chapter.quizCount || 0) + 1;
        localStorage.setItem('chapters', JSON.stringify(chapters));
        updateStats();
        renderChapters();
        
        // Rediriger vers l'éditeur de quiz (à implémenter)
        alert(`Nouveau quiz ajouté au chapitre "${chapter.name}" !`);
    }
}

// Réinitialiser le formulaire en mode création
function resetFormToCreate() {
    document.querySelector('#addChapterModal h2').textContent = '➕ Ajouter un nouveau chapitre';
    const form = document.getElementById('chapterForm');
    form.onsubmit = createChapter;
}

// Fermer le modal si on clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('addChapterModal');
    if (event.target === modal) {
        closeModal();
        resetFormToCreate();
    }
}