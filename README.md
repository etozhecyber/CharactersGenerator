# Role-Play (RP) Character Generator

This project uses modern web technologies: React, TypeScript, and the Vite bundler.
Because the code is written in TypeScript (`.tsx` and `.ts` files), it cannot simply be opened in a browser like a regular HTML file. It requires a local development server (Vite) to transpile the code on the fly into a browser-understandable format.

## Prerequisites

You must have **Node.js** installed (you can download it from the [official site](https://nodejs.org/)).

## Running Instructions

1. **Install dependencies**
   Open your terminal (command line) in the project folder and run:
   ```bash
   npm install
   ```
   *This will download all necessary libraries (React, Vite, etc.) into the `node_modules` folder.*

2. **Start the local HTTP server**
   Run the following command in the terminal:
   ```bash
   npm run dev
   ```
   After starting, the terminal will show a link (usually `http://localhost:3000` or `http://localhost:5173`). Open this link in your browser.

3. **Configure API Connection**
   On the first launch, the **Settings** window will open automatically. Enter:
   - Your **API Key** (from any OpenAI-compatible provider).
   - The **API Endpoint** (default is `https://api.openai.com/v1`, but you can specify your own).
   - The text models for generating concepts and full character cards.

## Running with a simple HTTP server

If you want a "clean" set of HTML/JS/CSS files that can be run with any simple server (e.g., `python -m http.server`), you need to "build" the project:

1. Run the command:
   ```bash
   npm run build
   ```
2. A `dist` folder will appear. Inside are the ready-to-use static files.
3. You can now run any simple server inside the `dist` folder. For example:
   ```bash
   cd dist
   python -m http.server 8000
   ```
   Then open `http://localhost:8000`.
