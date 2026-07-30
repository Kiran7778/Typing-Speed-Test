// ============================================
//  TypeRush — Typing Speed Test Logic
// ============================================

(() => {
    "use strict";

    // --- Sample Texts ---
    const TEXTS = [
        "The quick brown fox jumps over the lazy dog near the riverbank, where the morning mist slowly rises into the golden sky above the mountains. Life moves forward, never pausing for a moment of reflection or doubt.",
        "Programming is the art of telling a computer what to do. Every line of code is a tiny instruction, building up to something powerful and meaningful. Great software begins with a single keystroke and a clear vision.",
        "In the quiet corners of the library, dusty books hold stories of adventure and mystery. Each page turned reveals a new world waiting to be explored by curious minds hungry for knowledge and discovery.",
        "Technology continues to reshape the way we live, work, and connect with one another. From smartphones to artificial intelligence, innovation drives progress and opens doors to possibilities once thought impossible.",
        "The ocean waves crash rhythmically against the sandy shore, creating a soothing melody that calms the restless mind. Seagulls soar overhead, riding the warm coastal breeze on a perfect summer afternoon.",
        "Success is not measured by the position one has reached in life but by the obstacles overcome while trying to succeed. Every setback is a setup for a comeback that will define your character and resilience.",
        "A good developer writes code that humans can understand. Clean code reads like well-written prose, guiding the reader through the logic effortlessly. Comments explain why, not what, and functions tell a story.",
        "The forest awakens at dawn with the chorus of songbirds filling the crisp morning air. Sunlight filters through the canopy, painting golden patterns on the forest floor while dew drops glisten like tiny diamonds.",
        "Creativity is intelligence having fun. The most innovative solutions come from those who dare to think differently and challenge the status quo. Imagination is the seed from which all great inventions grow.",
        "Mountains teach us patience and perseverance. Each step upward brings new challenges and breathtaking views. The journey to the summit is never easy, but the reward of standing at the top makes every struggle worthwhile.",
        "Artificial intelligence is transforming industries across the globe, from healthcare diagnostics to autonomous vehicles. Machine learning algorithms analyze vast datasets to discover patterns that human eyes might never detect.",
        "The city never sleeps, its streets alive with the hum of traffic and the glow of neon lights. Every corner holds a story, every building a history, and every person a dream waiting to unfold beneath the stars."
    ];

    // --- DOM Elements ---
    const textContent = document.getElementById("text-content");
    const typingInput = document.getElementById("typing-input");
    const wpmValue = document.getElementById("wpm-value");
    const accuracyValue = document.getElementById("accuracy-value");
    const timerValue = document.getElementById("timer-value");
    const errorsValue = document.getElementById("errors-value");
    const timerCard = document.getElementById("stat-timer");
    const restartBtn = document.getElementById("restart-btn");
    const newTextBtn = document.getElementById("new-text-btn");
    const timerBtns = document.querySelectorAll(".timer-btn");
    const resultsOverlay = document.getElementById("results-overlay");
    const resultsRestartBtn = document.getElementById("results-restart-btn");
    const textDisplay = document.getElementById("text-display");

    // Results elements
    const resultWpm = document.getElementById("result-wpm");
    const resultAccuracy = document.getElementById("result-accuracy");
    const resultCorrect = document.getElementById("result-correct");
    const resultWrong = document.getElementById("result-wrong");
    const resultTotal = document.getElementById("result-total");
    const resultRawWpm = document.getElementById("result-raw-wpm");
    const resultRank = document.getElementById("result-rank");

    // --- State ---
    let currentText = "";
    let charElements = [];
    let timerDuration = 60;
    let timeLeft = 60;
    let timerInterval = null;
    let isRunning = false;
    let isFinished = false;
    let startTime = null;

    // Tracking
    let correctChars = 0;
    let wrongChars = 0;
    let totalTyped = 0;

    // --- Initialization ---
    function init() {
        loadRandomText();
        setupEventListeners();
    }

    function loadRandomText() {
        const randomIndex = Math.floor(Math.random() * TEXTS.length);
        currentText = TEXTS[randomIndex];
        renderText();
        resetState();
    }

    function renderText() {
        textContent.innerHTML = "";
        charElements = [];
        for (let i = 0; i < currentText.length; i++) {
            const span = document.createElement("span");
            span.classList.add("char");
            span.textContent = currentText[i];
            textContent.appendChild(span);
            charElements.push(span);
        }
        // Set first char as current
        if (charElements.length > 0) {
            charElements[0].classList.add("current");
        }
    }

    function resetState() {
        // Stop timer
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        isFinished = false;
        startTime = null;

        // Reset counters
        correctChars = 0;
        wrongChars = 0;
        totalTyped = 0;

        // Reset timer
        timeLeft = timerDuration;
        timerValue.textContent = timeLeft;

        // Reset stats display
        wpmValue.textContent = "0";
        accuracyValue.innerHTML = '100<span class="stat-unit">%</span>';
        errorsValue.textContent = "0";

        // Reset input
        typingInput.value = "";
        typingInput.disabled = false;
        typingInput.focus();

        // Reset timer card animation
        timerCard.classList.remove("running");
        timerCard.style.removeProperty("--timer-duration");

        // Hide results
        resultsOverlay.classList.add("hidden");

        // Reset text display focus style
        textDisplay.classList.remove("focused");
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        typingInput.addEventListener("input", handleInput);
        typingInput.addEventListener("focus", () => textDisplay.classList.add("focused"));
        typingInput.addEventListener("blur", () => textDisplay.classList.remove("focused"));

        // Keyboard shortcut: Tab + Enter to restart
        document.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                typingInput.focus();
            }
            if (e.key === "Enter" && document.activeElement === typingInput) {
                // Only restart if the test hasn't started or is finished
                if (!isRunning || isFinished) {
                    restart();
                }
            }
        });

        restartBtn.addEventListener("click", restart);
        newTextBtn.addEventListener("click", () => {
            loadRandomText();
        });
        resultsRestartBtn.addEventListener("click", restart);

        // Timer selector
        timerBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (isRunning) return; // Don't change during test
                timerBtns.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                timerDuration = parseInt(btn.dataset.time);
                timeLeft = timerDuration;
                timerValue.textContent = timeLeft;
            });
        });

        // Click on text display to focus input
        textDisplay.addEventListener("click", () => {
            typingInput.focus();
        });
    }

    function restart() {
        renderText();
        resetState();
    }

    // --- Core Typing Logic ---
    function handleInput() {
        if (isFinished) return;

        const inputValue = typingInput.value;
        const inputLength = inputValue.length;

        // Start timer on first character
        if (!isRunning && inputLength > 0) {
            startTimer();
            isRunning = true;
            startTime = Date.now();
        }

        // Reset counters for recalculation
        correctChars = 0;
        wrongChars = 0;
        totalTyped = inputLength;

        // Update each character's state
        for (let i = 0; i < charElements.length; i++) {
            const charEl = charElements[i];

            // Remove all state classes
            charEl.classList.remove("correct", "wrong", "current");

            if (i < inputLength) {
                // This character has been typed
                if (inputValue[i] === currentText[i]) {
                    charEl.classList.add("correct");
                    correctChars++;
                } else {
                    charEl.classList.add("wrong");
                    wrongChars++;
                }
            } else if (i === inputLength) {
                // This is the current character to type
                charEl.classList.add("current");
            }
            // Remaining characters stay in default (upcoming) state
        }

        // Update live stats
        updateStats();

        // Check if all text typed
        if (inputLength >= currentText.length) {
            finishTest();
        }
    }

    // --- Timer ---
    function startTimer() {
        timerCard.style.setProperty("--timer-duration", timerDuration + "s");
        timerCard.classList.add("running");

        timerInterval = setInterval(() => {
            timeLeft--;
            timerValue.textContent = timeLeft;

            // Update WPM live
            updateStats();

            if (timeLeft <= 0) {
                finishTest();
            }
        }, 1000);
    }

    // --- Stats ---
    function updateStats() {
        if (!startTime) return;

        const elapsedMs = Date.now() - startTime;
        const elapsedMin = elapsedMs / 60000;

        if (elapsedMin <= 0) return;

        // WPM: (correct characters / 5) / elapsed minutes
        const wpm = Math.round((correctChars / 5) / elapsedMin);
        wpmValue.textContent = Math.max(0, wpm);

        // Accuracy
        const accuracy = totalTyped > 0
            ? Math.round((correctChars / totalTyped) * 100)
            : 100;
        accuracyValue.innerHTML = `${accuracy}<span class="stat-unit">%</span>`;

        // Errors
        errorsValue.textContent = wrongChars;
    }

    // --- Finish ---
    function finishTest() {
        isFinished = true;
        isRunning = false;
        clearInterval(timerInterval);
        timerCard.classList.remove("running");
        typingInput.disabled = true;

        const elapsedMs = Date.now() - startTime;
        const elapsedMin = elapsedMs / 60000;

        const wpm = elapsedMin > 0 ? Math.round((correctChars / 5) / elapsedMin) : 0;
        const rawWpm = elapsedMin > 0 ? Math.round((totalTyped / 5) / elapsedMin) : 0;
        const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;

        // Populate results
        resultWpm.textContent = Math.max(0, wpm);
        resultAccuracy.textContent = accuracy + "%";
        resultCorrect.textContent = correctChars;
        resultWrong.textContent = wrongChars;
        resultTotal.textContent = totalTyped;
        resultRawWpm.textContent = Math.max(0, rawWpm);

        // Rank
        let rankText = "";
        let rankEmoji = "";
        if (wpm >= 100) {
            rankEmoji = "⚡";
            rankText = "Legendary — You're a typing machine!";
        } else if (wpm >= 80) {
            rankEmoji = "🔥";
            rankText = "Expert — Blazing fast fingers!";
        } else if (wpm >= 60) {
            rankEmoji = "🚀";
            rankText = "Advanced — Great speed and control!";
        } else if (wpm >= 40) {
            rankEmoji = "💪";
            rankText = "Intermediate — Solid performance!";
        } else if (wpm >= 20) {
            rankEmoji = "🌱";
            rankText = "Beginner — Keep practicing!";
        } else {
            rankEmoji = "🐢";
            rankText = "Warming Up — You'll get faster!";
        }
        resultRank.innerHTML = `${rankEmoji} ${rankText}`;

        // Show results with slight delay for animation
        setTimeout(() => {
            resultsOverlay.classList.remove("hidden");
        }, 300);
    }

    // --- Start ---
    init();
})();
