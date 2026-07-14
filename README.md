# AI Author Spirit

> An Obsidian plugin for stylometric analysis and AI-powered writing insights.

Analyze your writing style and explore similarities with your favorite authors using AI-powered insights.

## Features

- **Stylometric Analysis**: Compare sentence length, vocabulary richness, punctuation, n-grams, and burstiness
- **AI Insights**: Get personalized feedback and recommendations based on your writing analysis (OpenAI-compatible API)
- **Chunk-based Comparison**: Finds the most similar and different text fragments between your writing and reference texts
- **Multilingual AI**: Responses in English, Russian, Chinese, French, German, Japanese, Spanish

## How to Use

1. Create a folder `AuthorSpirits` in your vault
2. Add subfolders for each author with their text files
3. Open any note and click the brain icon in the ribbon
4. View stylometry results and click "Analyze with AI" for insights
5. Customize the system prompt to adjust AI feedback to your goals

## AI Setup

- **Local**: Use [Ollama](https://ollama.com) at `http://localhost:11434/v1/chat/completions` (no API key needed)
- **Cloud**: Use OpenAI, Claude, or any OpenAI-compatible endpoint with your API key

## Installation

### From GitHub Releases

1. Download `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/artyd-developer/obsidian-ai-author-spirit/releases)
2. Create folder `ai-author-spirit` in `.obsidian/plugins/` of your vault
3. Copy the downloaded files there
4. Enable the plugin in Obsidian settings

### From Source

```bash
git clone https://github.com/artyd-developer/obsidian-ai-author-spirit.git
cd obsidian-ai-author-spirit
npm install
npm run build
```