// content.js

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const getCompletion = async message => {
  const response = await fetch("https://localhost:3000/api/chat", {
    methof: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Failed to get completion");
  }

  const data = await response.json();
  try {
    // Try to parse the response as JSON if it's a string
    const parsedResponse =
      typeof data.response === "string"
        ? JSON.parse(data.response)
        : data.response;

    return parsedResponse.response || parsedResponse;
  } catch (e) {
    // If parsing fails, return the original response
    return data.response;
  }
};

class SuggestionOverlay {
  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.className = "ai-suggestion-overlay";
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      color: #9CA3AF;
      font-family: monospace;
      white-space: pre;
      z-index: 10000;
      background: transparent;
    `;

    document.body.appendChild(this.overlay);
  }
}

document.addEventListener("input", async event => {
  if (event.target.tagName === "TEXTAREA" || event.target.type === "text") {
    const userInput = event.target.value;
    const completion = await getAICompletion(userInput);
    showSuggestion(event.target, completion);
  }
});

async function getAICompletion(input) {
  // Call AI API for suggestions (Placeholder function)
  return fetch("https://api.groq.com/chatgpt/autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "GROQ_API_KEY",
    },
    body: JSON.stringify({ prompt: input }),
  })
    .then(res => res.json())
    .then(data => data.suggestion)
    .catch(() => "");
}

function showSuggestion(inputElement, suggestion) {
  if (!suggestion) return;
  const rect = inputElement.getBoundingClientRect();
  let suggestionBox = document.getElementById("ai-suggestion-box");

  if (!suggestionBox) {
    suggestionBox = document.createElement("div");
    suggestionBox.id = "ai-suggestion-box";
    suggestionBox.style.position = "absolute";
    suggestionBox.style.background = "lightgray";
    suggestionBox.style.opacity = "0.7";
    suggestionBox.style.padding = "5px";
    suggestionBox.style.borderRadius = "5px";
    suggestionBox.style.pointerEvents = "none";
    document.body.appendChild(suggestionBox);
  }

  suggestionBox.textContent = suggestion;
  suggestionBox.style.left = `${rect.left + window.scrollX}px`;
  suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
}

document.addEventListener("keydown", event => {
  if (event.key === "Tab" && document.getElementById("ai-suggestion-box")) {
    event.preventDefault();
    const input = document.activeElement;
    const suggestionBox = document.getElementById("ai-suggestion-box");
    if (input && suggestionBox) {
      input.value += suggestionBox.textContent;
      suggestionBox.remove();
    }
  }
});
