# Hush — One-Time Voice Messages

Hush lets someone record or upload an audio note, share a private link, and let the recipient play it once. The audio is uploaded to a **private Vercel Blob store**. A Vercel Function streams it to the first recipient who confirms playback and conditionally deletes it before returning the audio, preventing a second successful claim.

## Vercel setup

1. In the Vercel project, open **Storage → Create Database → Blob**.
2. Choose **Private** access and connect the store to this Vercel project.
3. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project. Redeploy if the site was already deployed.
4. Keep the Vercel project root set to the repository root so `/api/messages` is deployed as a Function.

Without the private Blob store, uploads return a setup message and no recipient link is created. Never put the Blob token in frontend JavaScript or commit it to GitHub.

## Project structure

```text
MONO-VOICE/
├── api/messages.js   # Vercel upload and one-time consume endpoint
├── index.html        # Record/upload page
├── listen.html       # Recipient page
├── compose.js        # Recording, upload, and link creation
├── listen.js         # Warning, playback, and consumed state
├── store.js          # Same-origin API client
├── styles.css        # Shared design
├── package.json      # Vercel Blob SDK
└── .env.example      # Documents the required server variable
```

## Message flow

1. `POST /api/messages` stores the audio in private Blob storage with a random, expiring link token.
2. The recipient opens `listen.html` and confirms the one-time listen.
3. `DELETE /api/messages?id=…` fetches the private blob, then deletes it using its ETag as a conditional one-time claim.
4. Only the request that successfully claims the blob receives the audio. Later requests get an unavailable response.

Links expire after 1 hour, 24 hours, or 7 days. Audio uploads are limited to 4 MB because Vercel Functions limit request and response payloads to 4.5 MB. The recording control stops at 2 minutes.

## Local preview

Open the site through an HTTP server, not by double-clicking `index.html`:

```bash
python -m http.server 8000
```

This only serves the static pages; the `/api/messages` function and Blob storage require Vercel. To test the complete flow locally, use the Vercel CLI and connect the private Blob environment variable.

## Deployment

Vercel should deploy from the repository root. The static pages and `api/messages.js` are both deployed by Vercel. GitHub Pages cannot run the API function or store the audio.

## Privacy limits

The share link is a bearer link: anyone who receives it can claim the note once. A recipient can still make an external recording of playback. The app prevents repeat playback through its endpoint; it cannot prevent copying the sound outside the app.
