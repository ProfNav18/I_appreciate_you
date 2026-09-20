# I Appreciate You ☕

A cute, gamified mobile-first appreciation page with an 80s coffee-note theme. She plays
through 4 short, un-loseable mini games (catch the little things, match the memories, pop
the balloons, one last thing) and then unlocks a final coffee-stained letter that unfolds
on tap — fully self-contained, no video hosting or external accounts needed.

## Personalize it

Edit the letter text directly in `index.html` inside `#letterPaper .letter-text` — it's
plain HTML paragraphs. The signature line and footer both say "Purush"; update those too.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Deploy as a shareable link (GitHub Pages)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the repo settings → **Pages**, set source to the `main` branch, root folder.
3. GitHub gives you a URL like `https://profnav18.github.io/i_appreciate_you/` — that's
   the link to send on WhatsApp. It opens straight into the page, no login needed.

Progress is saved in the browser (`localStorage`), so if she closes the chat and taps the
link again later, it resumes where she left off instead of starting over.
