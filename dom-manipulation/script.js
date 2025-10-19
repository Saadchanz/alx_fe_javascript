// ===== Task 3: Syncing Data with Server, Import/Export, Notifications, Periodic Sync =====

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Knowledge is power.", category: "Wisdom" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Learning never exhausts the mind.", category: "Education" }
];

let selectedCategory = localStorage.getItem("selectedCategory") || "all";

const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const formContainer = document.getElementById("formContainer");
const notification = document.getElementById("notification");

const newQuoteButton = document.getElementById("newQuote");
const exportQuotesButton = document.getElementById("exportQuotes");
const syncQuotesButton = document.getElementById("syncQuotes");
const importQuotesInput = document.getElementById("importQuotes");
const importQuotesBtn = document.getElementById("importQuotesBtn");

// --- Display a random quote ---
function showRandomQuote() {
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q =>
