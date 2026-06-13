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
let answersState = []; // 紀錄每題的作答狀況，null 表示未答

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
    // 檢查全域變數是否正常
    if (typeof quizBanks === 'undefined') {
        console.error("錯誤：questions.js 沒有成功載入，或 quizBanks 變數不存在！");
        alert("系統錯誤：找不到題庫資料，請檢查 questions.js 是否正確。");
        return;
    }

    const selectedPaper = els.paperSelect.value;
    const chapter = els.chapterSelect.value;
    let count = parseInt(els.questionCount.value) || 30;

    console.log("==== 開始抽題測試 ====");
    console.log("當前選擇的試卷代碼 (Value):", selectedPaper);
    console.log("當前選擇的章節:", chapter);

    const activeBank = quizBanks[selectedPaper];
    if (!activeBank) {
        console.error(`錯誤：在 quizBanks 中找不到對應 '${selectedPaper}' 的 Key！請檢查 questions.js`);
        alert("找不到該試卷的題庫，請檢查資料設定。");
        return;
    }
    console.log("該試卷的原始總題數:", activeBank.length);

    let filteredQuestions = chapter === 'all' 
        ? [...activeBank] 
        : activeBank.filter(q => q.chapter == chapter);
    
    console.log("經章節篩選後的題数:", filteredQuestions.length);

    filteredQuestions.sort(() => Math.random() - 0.5);
    currentQuizData = filteredQuestions.slice(0, count);
    console.log("最終抽取準備練習的題數:", currentQuizData.length);

    if (currentQuizData.length === 0) {
        alert("該試卷或章節目前沒有題目資料！");
        return;
    }

    currentQuestionIndex = 0;
    answersState = new Array(currentQuizData.length).fill(null);
    switchScreen('quiz');
    loadQuestion();
    console.log("==== 已成功執行跳轉 ====");
}

function loadQuestion() {
    const q = currentQuizData[currentQuestionIndex];
    els.progressText.innerText = `問題 ${currentQuestionIndex + 1} / ${currentQuizData.length}`;
    els.chapterBadge.innerText = `第 ${q.chapter} 章`;
    els.questionText.innerText = q.question;
    els.optionsContainer.innerHTML = '';

    // 控制按鈕顯示
    els.prevBtn.classList.toggle('hidden', currentQuestionIndex === 0);
    els.nextBtn.innerText = currentQuestionIndex === currentQuizData.length - 1 ? "完成測驗" : "下一題";
    
    // 檢查此題是否已經作答過
    const savedAnswer = answersState[currentQuestionIndex];
    const isAnswered = savedAnswer !== null;

    // 只有作答過才能進入下一題
    els.nextBtn.classList.toggle('hidden', !isAnswered);

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${String.fromCharCode(65 + index)}. ${opt}`;
        
        if (isAnswered) {
            // 【鎖定選項邏輯】已作答過，按鈕全部禁用並套用高亮/圖示
            btn.disabled = true;
            if (index === q.answer) {
                btn.classList.add('correct'); // 永遠顯示正確答案 (綠色 + ✅)
            } else if (index === savedAnswer) {
                btn.classList.add('incorrect'); // 標示用戶選錯的答案 (紅色 + ❌)
            }
        } else {
            // 未作答，綁定點擊事件
            btn.onclick = () => selectOption(btn, index, q.answer);
        }
        
        els.optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedBtn, selectedIndex, correctIndex) {
    // 紀錄作答
    answersState[currentQuestionIndex] = selectedIndex;
    
    const buttons = els.optionsContainer.querySelectorAll('.option-btn');
    
    // 用戶點擊後立即鎖定所有選項
    buttons.forEach(btn => btn.disabled = true);
    
    // 即時回饋：正確答案高亮綠色 ✅
    buttons[correctIndex].classList.add('correct');
    
    // 即時回饋：如果選錯，錯誤選項高亮紅色 ❌
    if (selectedIndex !== correctIndex) {
        selectedBtn.classList.add('incorrect');
    }

    // 顯示下一題按鈕
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
    const scoreEl = document.getElementById('final-score');
    scoreEl.innerText = `${percentage}%`;
    scoreEl.style.color = percentage >= 70 ? "var(--correct)" : "var(--incorrect)"; // 70% 合格線顏色
    document.getElementById('score-details').innerText = `答對 ${correctCount} 題，共 ${currentQuizData.length} 題`;
}
