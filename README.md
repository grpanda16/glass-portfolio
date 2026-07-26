# gyanaranjanpanda.com — glass edition

Multi-page React portfolio (Home / Work / Contact), React Router, glass UI.
Deployed on Vercel. `vercel.json` handles SPA routing so /work and /contact
survive a refresh.

## Run locally
    npm install
    npm run dev

## Replace your live site
1. Copy these files over your existing portfolio repo (or push to a new repo
   and point the Vercel project at it).
2. git add . && git commit -m "Glass redesign, multi-page" && git push
3. Vercel redeploys automatically — gyanaranjanpanda.com updates in ~1 min.

## Résumé button
Currently points to LinkedIn (accurate + current). To use a real PDF:
drop it at public/resume.pdf and set `resume: '/resume.pdf'` in src/data.js.

## Experience bullets
Edit src/data.js — replace the placeholder bullets for Boeing and CureBay
with your own specifics (what you built, scale, what you fixed).
