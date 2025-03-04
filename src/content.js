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

  show(element, suggestion, cursorPosition) {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    const measureSpan = document.createElement("span");
    measureSpan.style.cssText = `
    position: absolute;
    visibility: hidden;
    font-family: ${computedStyle.fontFamily};
    font-size: ${computedStyle.fontSize};
    letter-spacing: ${computedStyle.letterSpacing};
    white-space: pre;
  `;
    measureSpan.textContent = element.value.slice(0, cursorPosition);
    document.body.appendChild(measureSpan);

    const textWidth = measureSpan.getBoundingClientRect().width;
    document.body.removeChild(measureSpan);

    this.overlay.style.top = `${rect.top + window.scrollY}px`;
    this.overlay.style.left = `${rect.left + window.scrollX + textWidth}px`;
    this.overlay.style.height = computedStyle.lineHeight;
    this.overlay.style.padding = computedStyle.padding;
    this.overlay.style.fontSize = computedStyle.fontSize;
    this.overlay.style.fontFamily = computedStyle.fontFamily;
    this.overlay.style.letterSpacing = computedStyle.letterSpacing;
    this.overlay.style.lineHeight = computedStyle.lineHeight;

    // Only show the suggestion
    this.overlay.textContent = suggestion;
    this.overlay.style.display = "block";
  }

  hide() {
    this.overlay.style.display = "none";
  }
}

class AICompletion {
  constructor() {
    this.currentElement = null;
    this.suggestion = "";
    this.overlay = new SuggestionOverlay();
    this.cursorPosition = 0;

    this.debouncedGetSuggestions = debounce(
      this.getSuggestions.bind(this),
      500
    );

    this.setupEventListeners();
  }

  async getSuggestions(text, cursorPosition) {
    if (!text.trim()) {
      this.suggestion = "";
      this.overlay.hide();
      return;
    }

    try {
      const suggestion = await getCompletion(text);
      this.suggestion = suggestion.trim();
      if (this.currentElement && this.suggestion) {
        this.overlay.show(this.currentElement, this.suggestion, cursorPosition);
      }
    } catch (error) {
      console.error("Error getting suggestions:", error);
      this.suggestion = "";
      this.overlay.hide();
    }
  }

  handleInput(event) {
    const element = event.target;
    this.currentElement = element;
    this.cursorPosition = element.selectionStart;
    this.debouncedGetSuggestions(element.value, this.cursorPosition);
  }

  handleKeyDown(event) {
    if (event.key === "Tab" && this.suggestion) {
      event.preventDefault();
      const element = event.target;
      const beforeCursor = element.value.slice(0, this.cursorPosition);
      const afterCursor = element.value.slice(this.cursorPosition);
      element.value = beforeCursor + this.suggestion + afterCursor;

      // Move cursor to end of inserted suggestion
      const newCursorPosition = this.cursorPosition + this.suggestion.length;
      element.setSelectionRange(newCursorPosition, newCursorPosition);

      this.suggestion = "";
      this.overlay.hide();
    }
  }

  handleSelectionChange(event) {
    if (this.currentElement === event.target) {
      this.cursorPosition = event.target.selectionStart;
      if (this.suggestion) {
        this.overlay.show(
          this.currentElement,
          this.suggestion,
          this.cusorPosition
        );
      }
    }
  }

  handleFocus(event) {
    this.currentElement = event.target;
    this.cursorPosition = event.target.selectionStart;
    if (event.target.value && this.suggestion) {
      this.overlay.show(event.target, this.suggestion, this.cursorPosition);
    }
  }

  handleBlur() {
    this.currentElement = null;
    this.overlay.hide();
  }

  setupEventListeners() {
    document.addEventListener("input", this.handleInput.bind(this), true);
    document.addEventListener("keydown", this.handleKeyDown.bind(this), true);
    document.addEventListener("focus", this.handleFocus.bind(this), true);
    document.addEventListener("blur", this.handleBlur.bind(this), true);
    document.addEventListener(
      "selectionchange",
      this.handleSelectionChange.bind(this),
      true
    );
  }
}

new AICompletion();
