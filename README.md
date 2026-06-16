
```markdown
# AI Auditor Agent

An automated, AI-driven QA and Compliance Agent built to verify whether a live web application conforms to its official design and functional guidelines.
The system ingests a PDF guideline, authenticates and extracts live UI data from the web app, runs an agentic AI comparison loop, and generates a structured
 discrepancy report with visual evidence.

---

## 🏗️ System Architecture & Pipeline

The system operates as a seamless 4-step pipeline to decouple data extraction from semantic evaluation[cite: 41, 42]:

1. Ingest & Parse (Backend):** Reads the local `guide.pdf` using `pdf-parse` and converts unstructured text into checkable guidelines[cite: 43, 44, 50].
2. Extract & Capture (Puppeteer):** Automates browser navigation to the WaiverPro live application, authenticates using administrative credentials, extracts real-time DOM structure, and captures a full-page live screenshot[cite: 45, 46, 52, 54, 55, 77, 85].
3. Compare (Gemini AI Agent):** Synthesizes the extracted PDF data, DOM JSON array, and the base64 screenshot inside a multimodal prompt using `gemini-2.5-flash` to execute an agentic verification loop[cite: 56, 57].
4. Report (React Dashboard):** Renders a structured UI displaying compliance status (PASS/FAIL), mismatch severity, exact guideline citations, live observed discrepancies, and side-by-side screenshot evidence[cite: 59, 109].

---

## 🛠️ Tech Stack & Tool Justification

| Tool / Library | Selection Justification & Trade-offs |
| :--- | :--- |
| React.js** | Selected for the frontend dashboard to build an intuitive, componentized UI that visualizes dynamic state mismatches seamlessly. |
| Node.js & Express** | Provides a lightweight, asynchronous backend runtime well-suited for streaming I/O operations like PDF reading and web scraping. |
| Puppeteer** | [cite_start]Chosen over basic HTTP scraping to handle Javascript-rendered dynamic applications, complete user login authentication flows, and capture visual state screenshots[cite: 85]. |
| Gemini 2.5 Flash** | [cite_start]Selected for its superior native multimodal capabilities (processing text JSON alongside image screenshots) and native JSON schema output compliance[cite: 93, 97]. |

---

## 🚀 Getting Started & Installation

### Prerequisites
* Node.js (v18+ recommended)
* Gemini API Key

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd ui-verifier-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the backend folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```
4. Place your official design guidelines document in this folder and rename it to **`guide.pdf`**.
5. Start the backend server:
   ```bash
   node server.js
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ui-verifier-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser and click **"Start Audit"** to trigger the pipeline!

---

## 📊 Data Structure Expectations (JSON Output)

The AI Agent guarantees a canonical structured output mapping directly to the frontend reporting interface[cite: 70, 97]:

```json
{
  "summary": {
    "totalMismatches": 3,
    "status": "FAIL"
  },
  "mismatches": [
    {
      "type": "Content",
      "severity": "High",
      "guidelineCitation": "The main workspace must include a visible Heading 1 (H1) at the top reading exactly 'WaiverPro Automated AI Auditor'.",
      "liveObserved": "An H1 tag is present with the text 'Healthcare Waiver Management'.",
      "description": "The main H1 heading text does not match the exact string required by the guidelines."
    }
  ]
}
```

---

## 🛡️ Engineering Hygiene & Resilience
* Error Handling:** Robust `try-catch` blocks ensure gracefully bubbling errors if network latency impacts site scraping or API rate limits occur.
* Decoupled Architecture:** The system splits state extraction (Puppeteer) from verification (LLM inference), making it resilient to minor codebase
*  changes while tracking missing or mismatched features effectively.


📄 License & Credits

This project is developed, maintained, and licensed by Shubham.

Author: Shubham Divyanshu

Version: 1.0.0

Usage: All rights reserved. Under proper attribution, this repository can be used for compliance agent evaluation, testing, and training purposes.
