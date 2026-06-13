const screens = {
    setup: document.getElementById('setup-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
};
const els = {
    paperSelect: document.getElementById('paper-select'),
    chapterSelect: document.getElementById('chapter-select'),
    questionCount: document.getElementById('question-count'),
    progressText: document.getElementById('progress-text'),
    chapterBadge: document.getElementById('chapter-badge'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    endBtn: document.getElementById('end-btn'),
    reviewContainer: document.getElementById('review-container')
};

let currentQuizData = [];
let currentQuestionIndex = 0;
let answersState = []; // Array to remember user's selected index for each question

document.getElementById('start-btn').addEventListener('click', startQuiz);
els.prevBtn.addEventListener('click', handlePrev);
els.nextBtn.addEventListener('click', handleNext);
els.endBtn.addEventListener('click', handleEndQuiz);
document.getElementById('restart-btn').addEventListener('click', () => switchScreen('setup'));

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startQuiz() {
    const selectedPaper = els.paperSelect.value;
    const chapter = els.chapterSelect.value;
    let count = parseInt(els.questionCount.value) || 30;

    // Fetch the correct bank from questions.js
    const activeBank = quizBanks[selectedPaper] || [];

    let filteredQuestions = chapter === 'all' 
        ? [...activeBank] 
        : activeBank.filter(q => q.chapter == chapter);

    filteredQuestions.sort(() => Math.random() - 0.5);
    currentQuizData = filteredQuestions.slice(0, count);

    if (currentQuizData.length === 0) {
        alert("該試卷/章節目前沒有題目！");
        return;
    }

    currentQuestionIndex = 0;
    answersState = new Array(currentQuizData.length).fill(null);
    switchScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    const q = currentQuizData[currentQuestionIndex];
    els.progressText.innerText = `問題 ${currentQuestionIndex + 1} / ${currentQuizData.length}`;
    els.chapterBadge.innerText = `第 ${q.chapter} 章`;
    els.questionText.innerText = q.question;
    els.optionsContainer.innerHTML = '';

    // Handle button visibility
    els.prevBtn.classList.toggle('hidden', currentQuestionIndex === 0);
    els.nextBtn.innerText = currentQuestionIndex === currentQuizData.length - 1 ? "完成測驗" : "下一題";
    
    const savedAnswer = answersState[currentQuestionIndex];
    const isAnswered = savedAnswer !== null;

    els.nextBtn.classList.toggle('hidden', !isAnswered);

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${String.fromCharCode(65 + index)}. ${opt}`;
        
        // If question was already answered, restore visual state
        if (isAnswered) {
            btn.disabled = true;
            if (index === q.answer) {
                btn.classList.add('correct');
            } else if (index === savedAnswer) {
                btn.classList.add('incorrect');
            }
        } else {
            btn.onclick = () => selectOption(btn, index, q.answer);
        }
        
        els.optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedBtn, selectedIndex, correctIndex) {
    // Save answer state
    answersState[currentQuestionIndex] = selectedIndex;
    
    const buttons = els.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    buttons[correctIndex].classList.add('correct');
    if (selectedIndex !== correctIndex) {
        selectedBtn.classList.add('incorrect');
    }

    els.nextBtn.classList.remove('hidden');
}

function handlePrev() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function handleNext() {
    if (currentQuestionIndex < currentQuizData.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showResults();
    }
}

function handleEndQuiz() {
    if (confirm("確定要提早結束測驗並檢視成績嗎？未作答的題目將視為錯誤。")) {
        showResults();
    }
}

function showResults() {
    switchScreen('result');
    let correctCount = 0;
    
    els.reviewContainer.innerHTML = '';

    currentQuizData.forEach((q, i) => {
        const userPickIndex = answersState[i];
        const isCorrect = userPickIndex === q.answer;
        const isSkipped = userPickIndex === null;

        if (isCorrect) correctCount++;

        let statusClass = isCorrect ? 'review-correct' : (isSkipped ? 'review-skipped' : 'review-incorrect');
        
        const reviewEl = document.createElement('div');
        reviewEl.className = `review-item ${statusClass}`;
        
        let userText = isSkipped ? "未作答" : q.options[userPickIndex];
        let correctText = q.options[q.answer];

        reviewEl.innerHTML = `
            <h4>Q${i + 1}. ${q.question}</h4>
            <p><strong>正確答案：</strong> ${correctText}</p>
            ${!isCorrect ? `<p style="color:var(--incorrect);"><strong>你的答案：</strong> ${userText}</p>` : ''}
        `;
        els.reviewContainer.appendChild(reviewEl);
    });

    const percentage = Math.round((correctCount / currentQuizData.length) * 100);
    document.getElementById('final-score').innerText = `${percentage}%`;
    document.getElementById('final-score').style.color = percentage >= 70 ? "var(--correct)" : "var(--incorrect)";
    document.getElementById('score-details').innerText = `答對 ${correctCount} 題，共 ${currentQuizData.length} 題`;
}
