// Constants & Fallback Quotes
const QUOTE_API_URL = "https://dummyjson.com/quotes/random";
const FALLBACK_QUOTES = [
  "Simplicity is prerequisite for reliability. Programming is the art of telling another human what one wants the computer to do.",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  "The most important property of a program is whether it accomplishes the intention of its user.",
  "First, solve the problem. Then, write the code."
];
const TEST_DURATION = 60; // Seconds

// DOM Elements
const quoteDisplay = document.getElementById("quote-display");
const hiddenInput = document.getElementById("hidden-input");
const testArea = document.getElementById("test-area");
const restartBtn = document.getElementById("restart-btn");

const timerVal = document.getElementById("timer-val");
const mistakesVal = document.getElementById("mistakes-val");
const wpmVal = document.getElementById("wpm-val");
const accuracyVal = document.getElementById("accuracy-val");

// State Variables
let timer = null;
let timeRemaining = TEST_DURATION;
let isTestRunning = false;
let currentQuote = "";
let totalTypedChars = 0;
let uncorrectedErrors = 0;
let isLoadingQuote = false;

// Initialize Application
function init() {
  resetTest();
  
  // Event Listeners
  testArea.addEventListener("click", () => hiddenInput.focus());
  hiddenInput.addEventListener("input", handleInput);
  restartBtn.addEventListener("click", resetTest);
}

// Fetch dynamic quote from API (with fallback support)
async function fetchQuoteText() {
  try {
    const response = await fetch(QUOTE_API_URL);
    if (!response.ok) throw new Error("Network response failed");
    const data = await response.json();
    return data.quote;
  } catch (error) {
    console.warn("API Fetch failed, using fallback quote:", error);
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  }
}

// Render dynamic quote into span nodes
async function loadNewQuote() {
  isLoadingQuote = true;
  hiddenInput.disabled = true;
  quoteDisplay.classList.add("loading");
  quoteDisplay.textContent = "Loading quote...";

  currentQuote = await fetchQuoteText();
  
  quoteDisplay.classList.remove("loading");
  quoteDisplay.innerHTML = "";
  
  // Split into individual <span> elements
  currentQuote.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    if (index === 0) span.classList.add("active");
    quoteDisplay.appendChild(span);
  });

  isLoadingQuote = false;
  hiddenInput.disabled = false;
  hiddenInput.focus();
}

// Start Timer on First Keypress
function startTimer() {
  isTestRunning = true;
  timer = setInterval(() => {
    timeRemaining--;
    timerVal.textContent = `${timeRemaining}s`;
    
    updateTelemetry();
    
    if (timeRemaining <= 0) {
      endTest();
    }
  }, 1000);
}

// Keystroke Audit Logic (Now Case-Insensitive)
function handleInput() {
  if (isLoadingQuote) return;

  if (!isTestRunning && hiddenInput.value.length > 0 && timeRemaining > 0) {
    startTimer();
  }

  const typedText = hiddenInput.value;
  const spans = quoteDisplay.querySelectorAll("span");
  let mistakes = 0;

  spans.forEach((span, index) => {
    const typedChar = typedText[index];
    
    // Clear active caret
    span.classList.remove("active");

    if (typedChar == null) {
      span.classList.remove("correct", "incorrect");
    } else if (typedChar.toLowerCase() === span.textContent.toLowerCase()) {
      // Case-insensitive match check
      span.classList.add("correct");
      span.classList.remove("incorrect");
    } else {
      span.classList.add("incorrect");
      span.classList.remove("correct");
      mistakes++;
    }
  });

  // Position caret on current active element
  if (typedText.length < spans.length) {
    spans[typedText.length].classList.add("active");
  }

  totalTypedChars = typedText.length;
  uncorrectedErrors = mistakes;
  mistakesVal.textContent = uncorrectedErrors;

  updateTelemetry();

  // If user completes quote before time is up, advance to next quote seamlessly
  if (typedText.length >= currentQuote.length && timeRemaining > 0) {
    hiddenInput.value = "";
    loadNewQuote();
  }
}

// Telemetry Calculations
function updateTelemetry() {
  const timeElapsed = TEST_DURATION - timeRemaining;
  const timeElapsedInMinutes = timeElapsed > 0 ? timeElapsed / 60 : 1 / 60;

  // Accuracy Percentage
  let accuracy = 100;
  if (totalTypedChars > 0) {
    accuracy = Math.max(
      0,
      Math.round(((totalTypedChars - uncorrectedErrors) / totalTypedChars) * 100)
    );
  }
  accuracyVal.textContent = `${accuracy}%`;

  // Net WPM calculation
  const netTypedWords = (totalTypedChars - uncorrectedErrors) / 5;
  const netWPM = Math.max(0, Math.round(netTypedWords / timeElapsedInMinutes));
  wpmVal.textContent = netWPM;
}

// Complete Test Session
function endTest() {
  clearInterval(timer);
  isTestRunning = false;
  hiddenInput.disabled = true;
  
  const activeSpan = quoteDisplay.querySelector("span.active");
  if (activeSpan) activeSpan.classList.remove("active");
}

// Reset Test & Fetch Next Quote
function resetTest() {
  clearInterval(timer);
  timer = null;
  timeRemaining = TEST_DURATION;
  isTestRunning = false;
  totalTypedChars = 0;
  uncorrectedErrors = 0;

  // Reset UI Telemetry
  timerVal.textContent = `${TEST_DURATION}s`;
  mistakesVal.textContent = "0";
  wpmVal.textContent = "0";
  accuracyVal.textContent = "100%";
  
  hiddenInput.value = "";
  
  loadNewQuote();
}

// Run on page load
document.addEventListener("DOMContentLoaded", init);