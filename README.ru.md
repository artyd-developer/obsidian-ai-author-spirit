
```markdown
[English](README.md) | [Русский](README.ru.md)

# AI Author Spirit

> Плагин для Obsidian: стилометрический анализ и AI-аналитика вашего стиля письма.

Анализируйте свой стиль письма и исследуйте сходства с любимыми авторами с помощью AI.

<video src="https://github.com/user-attachments/assets/84658154-2a51-4686-bf9d-2fcbc4b5f6ea" controls width="800"></video>
<img width="1024" height="780" alt="prompt_ex" src="https://github.com/user-attachments/assets/10274d97-2e3e-4291-9400-289d9ecb5a0e" />


## Возможности

- **Стилометрический анализ**: Сравнение длины предложений, словарного богатства, пунктуации, n-грамм и burstiness
- **AI-аналитика**: Персональная обратная связь и рекомендации на основе анализа вашего стиля (совместим с OpenAI API)
- **Сравнение по фрагментам**: Поиск наиболее похожих и различающихся фрагментов между вашим текстом и эталонными текстами
- **Мультиязычный AI**: Ответы на русском, английском, китайском, французском, немецком, японском, испанском

## Как использовать

1. Создайте папку `AuthorSpirits` в вашем хранилище
2. Добавьте подпапки для каждого автора с их текстами
3. Откройте любую заметку и нажмите иконку мозга на ленте
4. Изучите результаты стилометрии и нажмите "Analyze with AI" для получения рекомендаций
5. Настройте системный промпт, чтобы адаптировать обратную связь AI под ваши цели

## Настройка AI

- **Локально**: Используйте [Ollama](https://ollama.com) на `http://localhost:11434/v1/chat/completions` (API ключ не нужен)
- **Облако**: Используйте OpenAI, Claude или любой совместимый эндпоинт с вашим API ключом

## Установка

### Из GitHub Releases

1. Скачайте `main.js`, `manifest.json`, `styles.css` из [последнего релиза](https://github.com/artyd-developer/obsidian-ai-author-spirit/releases)
2. Создайте папку `ai-author-spirit` в `.obsidian/plugins/` вашего хранилища
3. Скопируйте туда скачанные файлы
4. Включите плагин в настройках Obsidian

### Из исходников

```bash
git clone https://github.com/artyd-developer/obsidian-ai-author-spirit.git
cd obsidian-ai-author-spirit
npm install
npm run build
```
