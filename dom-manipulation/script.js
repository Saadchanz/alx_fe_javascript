// ===== Task 3: Syncing Data with Server and Conflict Resolution =====

// Load local quotes or use defaults
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
const newQuoteButton = document.getElementById("newQuote");
const exportQuotesButton = document.getElementById("exportQuotes");
const syncQuotesButton = document.getElementById("syncQuotes");
const notification = document.getElementById("notification");

// --- Show random quote ---
function showRandomQuote() {
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes available for "${selectedCategory}".</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const randomQuote = filtered[randomIndex];
  quoteDisplay.innerHTML = `<p>"${randomQuote.text}"</p><p><em>- ${randomQuote.category}</em></p>`;
}

// --- Populate dropdown with unique categories ---
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// --- Filter quotes ---
function filterQuotes() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// --- Create Add Quote Form ---
function createAddQuoteForm() {
  const form = document.createElement("div");
  form.innerHTML = `
    <h2>Add a New Quote</h2>
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;
  formContainer.appendChild(form);

  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
}

// --- Add new quote ---
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and category!");
    return;
  }

  quotes.push({ text, category });
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
  alert("Quote added successfully!");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// --- Export quotes as JSON file ---
function exportQuotes() {
  const quotesJSON = JSON.stringify(quotes, null, 2);
  const blob = new Blob([quotesJSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

// --- Fetch quotes from server simulation ---
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();

    // Simulate conversion to quote objects
    const serverQuotes = data.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

// --- Sync local quotes with server ---
async function syncWithServer() {
  notification.textContent = "Syncing with server...";
  const serverQuotes = await fetchQuotesFromServer();

  // Simple conflict resolution: server data takes precedence
  const mergedQuotes = [...serverQuotes, ...quotes.filter(
    localQ => !serverQuotes.some(sq => sq.text === localQ.text)
  )];

  quotes = mergedQuotes;
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
  showRandomQuote();

  notification.textContent = "Quotes synced successfully (Server data prioritized).";
  setTimeout(() => (notification.textContent = ""), 4000);
}

// --- Event Listeners ---
newQuoteButton.addEventListener("click", showRandomQuote);
exportQuotesButton.addEventListener("click", exportQuotes);
syncQuotesButton.addEventListener("click", syncWithServer);

// --- Initialize ---
createAddQuoteForm();
populateCategories();
showRandomQuote();

// Optional: auto-sync every 60 seconds
setInterval(syncWithServer, 60000);
