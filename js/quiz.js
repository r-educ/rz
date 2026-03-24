// ============================================
// CONFIGURATION
// ============================================

const API_URL = 'http://localhost:3000/api';

// État du quiz
let quizState = {
    currentQuestionIndex: 0,
    score: 0,
    questions: [],
    userAnswers: [],
    quizStarted: false,
    quizCompleted: false,
    classId: null,
    subjectId: null,
    chapterId: null
};

// ============================================
// CHARGEMENT DU QUIZ
// ============================================

async function loadQuiz() {
    try {
        // Récupérer les paramètres de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('class');
        const subjectId = urlParams.get('subject');
        const chapterId = urlParams.get('chapter');

        if (!classId || !subjectId || !chapterId) {
            showError('Paramètres de quiz invalides');
            return;
        }

        // Sauvegarder les IDs
        quizState.classId = classId;
        quizState.subjectId = subjectId;
        quizState.chapterId = chapterId;

        // Charger les données depuis l'API
        const response = await fetch(`${API_URL}/data`);
        
        if (!response.ok) {
            throw new Error('Erreur de chargement des données');
        }

        const data = await response.json();
        
        // Trouver la classe
        const classe = data.classes.find(c => c.id === classId);
        if (!classe) {
            throw new Error('Classe non trouvée');
        }

        // Trouver la matière
        const subject = classe.subjects.find(s => s.id === subjectId);
        if (!subject) {
            throw new Error('Matière non trouvée');
        }

        // Trouver le chapitre
        const chapter = subject.chapters.find(c => c.id === chapterId);
        if (!chapter) {
            throw new Error('Chapitre non trouvé');
        }

        // Vérifier si le chapitre a des questions
        if (!chapter.quiz || chapter.quiz.length === 0) {
            showNoQuestionsMessage(chapter.title);
            return;
        }

        // Initialiser le quiz
        initializeQuiz(chapter);
        
    } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        showError('Erreur de chargement du quiz: ' + error.message);
    }
}

// ============================================
// INITIALISATION DU QUIZ
// ============================================

function initializeQuiz(chapter) {
    quizState.questions = chapter.quiz;
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.userAnswers = new Array(chapter.quiz.length).fill(null);
    quizState.quizStarted = true;
    quizState.quizCompleted = false;

    // Afficher les informations du chapitre
    displayChapterInfo(chapter);
    
    // Afficher la première question
    displayQuestion();
    
    // Activer les contrôles
    enableControls();
}

// ============================================
// AFFICHAGE DES INFORMATIONS DU CHAPITRE
// ============================================

function displayChapterInfo(chapter) {
    const infoContainer = document.getElementById('chapterInfo');
    if (!infoContainer) return;

    infoContainer.innerHTML = `
        <div class="chapter-header">
            <div class="chapter-icon">${chapter.icon || '📚'}</div>
            <h2>${escapeHtml(chapter.title)}</h2>
            <div class="quiz-stats">
                <span class="stat-badge">
                    <i class="fas fa-question-circle"></i>
                    ${quizState.questions.length} questions
                </span>
                <span class="stat-badge" id="scoreDisplay">
                    <i class="fas fa-star"></i>
                    0 point
                </span>
            </div>
        </div>
    `;
}

// ============================================
// AFFICHAGE DE LA QUESTION COURANTE
// ============================================

function displayQuestion() {
    if (!quizState.quizStarted || quizState.quizCompleted) return;

    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    
    if (!container) return;

    // Mettre à jour la progression
    updateProgress();

    // Afficher la question
    container.innerHTML = `
        <div class="question-card fade-in">
            <div class="question-header">
                <span class="question-number">
                    Question ${quizState.currentQuestionIndex + 1}/${quizState.questions.length}
                </span>
            </div>
            
            <div class="question-text">
                <h3>${escapeHtml(currentQuestion.question)}</h3>
            </div>
            
            <div class="options-container">
                ${currentQuestion.options.map((option, index) => `
                    <div class="option-card ${quizState.userAnswers[quizState.currentQuestionIndex] === index ? 'selected' : ''}" 
                         onclick="selectAnswer(${index})">
                        <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                        <div class="option-text">${escapeHtml(option)}</div>
                        ${quizState.userAnswers[quizState.currentQuestionIndex] === index ? '<i class="fas fa-check-circle check-icon"></i>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Mettre à jour l'état des boutons
    updateButtons();
}

// ============================================
// SÉLECTION D'UNE RÉPONSE
// ============================================

function selectAnswer(optionIndex) {
    if (quizState.quizCompleted) return;

    // Sauvegarder la réponse
    quizState.userAnswers[quizState.currentQuestionIndex] = optionIndex;
    
    // Mettre à jour l'affichage de la question
    displayQuestion();
    
    // Activer le bouton suivant
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

// ============================================
// QUESTION SUIVANTE
// ============================================

function nextQuestion() {
    // Vérifier si une réponse a été sélectionnée
    if (quizState.userAnswers[quizState.currentQuestionIndex] === null) {
        showNotification('Veuillez sélectionner une réponse', 'warning');
        return;
    }

    // Dernière question ?
    if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
        finishQuiz();
    } else {
        // Passer à la question suivante
        quizState.currentQuestionIndex++;
        displayQuestion();
        
        // Désactiver le bouton suivant jusqu'à sélection
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
        }
    }
}

// ============================================
// QUESTION PRÉCÉDENTE
// ============================================

function previousQuestion() {
    if (quizState.currentQuestionIndex > 0) {
        quizState.currentQuestionIndex--;
        displayQuestion();
        
        // Activer le bouton suivant si une réponse existe
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = quizState.userAnswers[quizState.currentQuestionIndex] === null;
        }
    }
}

// ============================================
// FIN DU QUIZ ET CALCUL DU SCORE
// ============================================

function finishQuiz() {
    // Calculer le score
    let correctCount = 0;
    quizState.questions.forEach((question, index) => {
        if (quizState.userAnswers[index] === question.correct) {
            correctCount++;
        }
    });
    
    quizState.score = correctCount;
    quizState.quizCompleted = true;
    
    // Afficher les résultats
    showResults();
}

// ============================================
// AFFICHAGE DES RÉSULTATS
// ============================================

function showResults() {
    const container = document.getElementById('questionContainer');
    const percentage = (quizState.score / quizState.questions.length) * 100;
    let message = '';
    let emoji = '';
    
    if (percentage >= 80) {
        message = 'Excellent ! 🎉';
        emoji = '🏆';
    } else if (percentage >= 60) {
        message = 'Très bien ! 👏';
        emoji = '⭐';
    } else if (percentage >= 40) {
        message = 'Bon travail ! 📚';
        emoji = '👍';
    } else {
        message = 'Continuez vos efforts ! 💪';
        emoji = '📖';
    }
    
    container.innerHTML = `
        <div class="results-card fade-in">
            <div class="results-header">
                <div class="results-emoji">${emoji}</div>
                <h2>Quiz terminé !</h2>
                <p class="results-message">${message}</p>
            </div>
            
            <div class="score-circle">
                <div class="score-number">${quizState.score}</div>
                <div class="score-total">/${quizState.questions.length}</div>
                <div class="score-percentage">${Math.round(percentage)}%</div>
            </div>
            
            <div class="results-details">
                <h3>Récapitulatif</h3>
                <div class="answers-review">
                    ${quizState.questions.map((question, index) => `
                        <div class="review-item ${quizState.userAnswers[index] === question.correct ? 'correct' : 'incorrect'}">
                            <div class="review-question">
                                <span class="review-number">${index + 1}.</span>
                                <span>${escapeHtml(question.question)}</span>
                            </div>
                            <div class="review-answer">
                                ${quizState.userAnswers[index] === question.correct ? 
                                    '<i class="fas fa-check-circle"></i> Bonne réponse' : 
                                    `<i class="fas fa-times-circle"></i> Bonne réponse: ${escapeHtml(question.options[question.correct])}`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="results-actions">
                <button class="btn btn-primary" onclick="retryQuiz()">
                    <i class="fas fa-redo"></i>
                    Recommencer
                </button>
                <button class="btn btn-secondary" onclick="goBackToRevision()">
                    <i class="fas fa-arrow-left"></i>
                    Retour aux révisions
                </button>
            </div>
        </div>
    `;
    
    // Désactiver les boutons de navigation
    const navButtons = document.querySelector('.quiz-navigation');
    if (navButtons) {
        navButtons.style.display = 'none';
    }
    
    // Mettre à jour le score affiché
    updateScoreDisplay();
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function updateProgress() {
    const progress = document.getElementById('quizProgress');
    if (progress) {
        const percent = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
        progress.style.width = `${percent}%`;
    }
    
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = `Question ${quizState.currentQuestionIndex + 1}/${quizState.questions.length}`;
    }
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay && quizState.quizCompleted) {
        scoreDisplay.innerHTML = `<i class="fas fa-star"></i> ${quizState.score}/${quizState.questions.length} points`;
    }
}

function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = quizState.currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
        const hasAnswer = quizState.userAnswers[quizState.currentQuestionIndex] !== null;
        nextBtn.disabled = !hasAnswer;
        
        if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Terminer';
        } else {
            nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Suivant';
        }
    }
}

function enableControls() {
    const controls = document.getElementById('quizControls');
    if (controls) {
        controls.style.display = 'flex';
    }
}

function retryQuiz() {
    // Réinitialiser l'état
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.userAnswers = new Array(quizState.questions.length).fill(null);
    quizState.quizCompleted = false;
    
    // Réafficher la première question
    displayQuestion();
    
    // Réafficher les contrôles
    const navButtons = document.querySelector('.quiz-navigation');
    if (navButtons) {
        navButtons.style.display = 'flex';
    }
    
    // Mettre à jour le score
    updateScoreDisplay();
    
    // Désactiver le bouton suivant
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = true;
    }
}

function goBackToRevision() {
    window.location.href = 'index.html';
}

function showNoQuestionsMessage(chapterTitle) {
    const container = document.getElementById('questionContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-question-circle"></i>
            <h3>Aucune question disponible</h3>
            <p>Le chapitre "${escapeHtml(chapterTitle)}" n'a pas encore de questions.</p>
            <button class="btn btn-primary" onclick="goBackToRevision()">
                <i class="fas fa-arrow-left"></i>
                Retour aux révisions
            </button>
        </div>
    `;
}

function showError(message) {
    const container = document.getElementById('questionContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur</h3>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-primary" onclick="goBackToRevision()">
                <i class="fas fa-arrow-left"></i>
                Retour
            </button>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Ajouter les styles nécessaires si non présents
    addQuizStyles();
    
    // Charger le quiz
    loadQuiz();
    
    // Ajouter les écouteurs d'événements
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
});

function addQuizStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .option-card {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .option-card:hover {
            transform: translateX(5px);
        }
        
        .option-card.selected {
            background: linear-gradient(135deg, var(--primary-light), var(--primary));
            border-color: var(--primary);
        }
        
        .score-circle {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 20px auto;
            color: white;
        }
        
        .score-number {
            font-size: 48px;
            font-weight: bold;
        }
        
        .score-total {
            font-size: 24px;
        }
        
        .score-percentage {
            font-size: 18px;
            margin-top: 5px;
        }
        
        .review-item {
            padding: 10px;
            margin: 10px 0;
            border-radius: 8px;
            background: var(--gray-50);
        }
        
        .review-item.correct {
            border-left: 4px solid var(--success);
        }
        
        .review-item.incorrect {
            border-left: 4px solid var(--danger);
        }
        
        .stat-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            background: var(--gray-100);
            border-radius: 20px;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}