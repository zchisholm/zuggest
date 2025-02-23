// content.js
document.addEventListener("input", async (event) => {
  if (event.target.tagName === "TEXTAREA" || event.target.type === "text") {
    const userInput = event.target.value;
    const completion = await getAICompletion(userInput);
    showSuggestion(event.target, completion);
  }
});

async function getAICompletion(input) {
  // Call AI API for suggestions (Placeholder function)
  return fetch("https://your-ai-api.com/autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input }),
  })
    .then((res) => res.json())
    .then((data) => data.suggestion)
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

document.addEventListener("keydown", (event) => {
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
