// DOM 元素
const screens = {
    setup: document.getElementById('setup-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
};
const els = {
    chapterSelect: document.getElementById('chapter-select'),
    questionCount: document.getElementById('question-count'),
    progressText: document.getElementById('progress-text'),
    chapterBadge: document.getElementById('chapter-badge'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    nextBtn: document.getElementById('next-btn'),
    reviewContainer: document.getElementById('review-container')
};

// 狀態變數
let currentQuizData = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = []; // 紀錄用戶作答以便檢討

// 初始化事件監聽
document.getElementById('start-btn').addEventListener('click', startQuiz);
els.nextBtn.addEventListener('click', handleNext);
document.getElementById('restart-btn').addEventListener('click', () => switchScreen('setup'));

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startQuiz() {
    const chapter = els.chapterSelect.value;
    let count = parseInt(els.questionCount.value) || 30;

    // 根據章節過濾題庫 (questions 來自 questions.js)
    let filteredQuestions = chapter === 'all' 
        ? [...questions] 
        : questions.filter(q => q.chapter == chapter);

    // 隨機打亂並取指定數量
    filteredQuestions.sort(() => Math.random() - 0.5);
    currentQuizData = filteredQuestions.slice(0, count);

    if (currentQuizData.length === 0) {
        alert("該章節目前沒有題目！");
        return;
    }

    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    switchScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    els.nextBtn.classList.add('hidden');
    const q = currentQuizData[currentQuestionIndex];
    els.progressText.innerText = `問題 ${currentQuestionIndex + 1} / ${currentQuizData.length}`;
    els.chapterBadge.innerText = `第 ${q.chapter} 章`;
    els.questionText.innerText = q.question;
    els.optionsContainer.innerHTML = '';

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${String.fromCharCode(65 + index)}. ${opt}`;
        btn.onclick = () => selectOption(btn, index, q.answer);
        els.optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedBtn, selectedIndex, correctIndex) {
    const buttons = els.optionsContainer.querySelectorAll('.option-btn');
    
    // 禁用所有按鈕
    buttons.forEach(btn => btn.disabled = true);
    
    // 即時核對邏輯
    const isCorrect = (selectedIndex === correctIndex);
    if (isCorrect) score++;
    
    buttons[correctIndex].classList.add('correct');
    if (!isCorrect) {
        selectedBtn.classList.add('incorrect');
    }

    // 紀錄作答以供檢討
    userAnswers.push({
        question: currentQuizData[currentQuestionIndex].question,
        userPick: currentQuizData[currentQuestionIndex].options[selectedIndex],
        correctPick: currentQuizData[currentQuestionIndex].options[correctIndex],
        isCorrect: isCorrect
    });

    els.nextBtn.classList.remove('hidden');
}

function handleNext() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    switchScreen('result');
    document.getElementById('final-score').innerText = `${Math.round((score / currentQuizData.length) * 100)}%`;
    document.getElementById('score-details').innerText = `答對 ${score} 題，共 ${currentQuizData.length} 題`;
    
    els.reviewContainer.innerHTML = '';
    userAnswers.forEach((ans, i) => {
        const reviewEl = document.createElement('div');
        reviewEl.className = `review-item ${ans.isCorrect ? 'review-correct' : 'review-incorrect'}`;
        reviewEl.innerHTML = `
            <h4>Q${i + 1}. ${ans.question}</h4>
            <p><strong>正確答案：</strong> ${ans.correctPick}</p>
            ${!ans.isCorrect ? `<p style="color:var(--incorrect);"><strong>你的答案：</strong> ${ans.userPick}</p>` : ''}
        `;
        els.reviewContainer.appendChild(reviewEl);
    });
}
