// ===== Task 3: Syncing Data with Server, Import/Export, and Notifications =====

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
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes available for "${selectedCategory}".</p>`;
    return;
  }

  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.innerHTML = `<p>"${randomQuote.text}"</p><p><em>- ${randomQuote.category}</em></p>`;
}

// --- Populate categories dynamically ---
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

// --- Filter quotes by category ---
function filterQuotes() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// --- Add Quote Form ---
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

// --- Add Quote Locally & POST to Mock API ---
async function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and category!");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();

  await postQuoteToServer(newQuote);
  showNotification("Quote added and synced with server!");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// --- Export Quotes ---
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

// --- Import Quotes ---
function importQuotes() {
  const file = importQuotesInput.files[0];
  if (!file) {
    alert("Please select a file first!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes = [...quotes, ...importedQuotes];
        localStorage.setItem("quotes", JSON.stringify(quotes));
        populateCategories();
        showRandomQuote();
        showNotification("Quotes imported successfully!");
      } else {
        alert("Invalid file format.");
      }
    } catch (error) {
      alert("Error reading file!");
    }
  };
  reader.readAsText(file);
}

// --- Show Notification Message ---
function showNotification(message) {
  notification.textContent = message;
  setTimeout(() => (notification.textContent = ""), 4000);
}

// --- Fetch Quotes from Server ---
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();
    return data.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

// --- POST Quote to Server (Mock API) ---
async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    const result = await response.json();
    console.log("Quote posted:", result);
  } catch (error) {
    console.error("Error posting to server:", error);
  }
}

// --- Sync Quotes with Server ---
async function syncWithServer() {
  const serverQuotes = await fetchQuotesFromServer();

  const mergedQuotes = [
    ...serverQuotes,
    ...quotes.filter(localQ => !serverQuotes.some(sq => sq.text === localQ.text))
  ];

  quotes = mergedQuotes;
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
  showRandomQuote();

  // ✅ Display required message
  showNotification("Quotes synced with server!");
}

// --- Event Listeners ---
newQuoteButton.addEventListener("click", showRandomQuote);
exportQuotesButton.addEventListener("click", exportQuotes);
syncQuotesButton.addEventListener("click", syncWithServer);
importQuotesBtn.addEventListener("click", importQuotes);

// --- Initialize ---
createAddQuoteForm();
populateCategories();
showRandomQuote();
