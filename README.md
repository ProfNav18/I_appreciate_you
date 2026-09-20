# I Appreciate You ☕

A cute, gamified mobile-first appreciation page with an 80s coffee-note theme. She plays
through 4 short, un-loseable mini games (catch the little things, match the memories, spin
the gratitude wheel, one last thing) and then unlocks a final coffee-stained letter that
unfolds on tap — fully self-contained, no video hosting or external accounts needed.

## Personalize it

**For your own link** (no code changes):
- **Letter**: edit the text directly in `index.html` inside `#letterPaper .letter-text` —
  it's plain HTML paragraphs. The signature line and footer both say "Purush"; update
  those too.
- **Couple photos**: add 6 photos at `assets/couple/1.jpg` through `assets/couple/6.jpg`
  (see `assets/couple/README.md`) for the Memory Match level. Until they're added, that
  level shows colored placeholder cards instead of broken images.

**For selling to other couples**: open `customize.html` — a form where a buyer fills in
their partner's name, letter, 6 gratitude-wheel messages, and 6 photos, and gets back a
unique link (`?order=<id>`). That link loads their own personalization from Supabase
instead of the hardcoded content above; a plain link with no `?order=` still shows the
original hardcoded version untouched. Backend: a Supabase project (`orders` table +
`couple-photos` storage bucket) — see the project's SQL Editor history or ask the person
who set this up for the schema.

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
