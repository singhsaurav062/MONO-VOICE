# Hush — voice message links

Hush provides two ways to make a listener page:

- **Google Drive link:** upload the audio to Drive, share it as “Anyone with the link” with the Viewer role, then paste the sharing link into Hush. This mode is static and works on GitHub Pages. The listener page embeds Drive’s player.
- **Private one-time upload:** record or choose an audio file on Hush. This mode uses the `/api/messages` Vercel Function and a private Vercel Blob store. The first recipient to claim it receives the audio; later requests cannot claim it again.

## Google Drive mode (works on GitHub Pages)

1. Upload the audio file to Google Drive.
2. Open **Share → General access → Anyone with the link**, set the role to **Viewer**, and copy the sharing link.
3. Open Hush, paste the Drive link into the Google Drive field, and create the listener page.
4. Send the Hush listener link to the recipient.

Drive remains the audio host. Hush cannot delete the file or tell when playback ends, and people with the Drive link can replay or download it. Anyone with the Drive link can access it according to the file’s sharing settings. See [Google’s sharing instructions](https://support.google.com/drive/answer/2494822?hl=en).

## Private one-time upload mode (Vercel)

1. Create a **private** Vercel Blob store and connect it to the Vercel project.
2. Confirm `BLOB_READ_WRITE_TOKEN` is available in the project’s Production environment, then redeploy.
3. Keep the repository root as the Vercel project root so `/api/messages` is deployed as a Function.

Audio uploads are limited to 4 MB; recordings stop at 2 minutes. Links expire after 1 hour, 24 hours, or 7 days. Do not expose the Blob token in browser code or commit it to GitHub.

## GitHub Pages

GitHub Pages can host the static pages and Google Drive listener links. It does not run `api/messages.js`; the private one-time upload button requires Vercel or another backend with private storage. To publish the Drive mode, configure GitHub Pages to deploy from the repository’s `main` branch and root folder, then paste Drive links into the site.

## Local preview

Open the pages through an HTTP server rather than double-clicking the HTML files:

```bash
python -m http.server 8000
```

The Google Drive mode can be previewed on localhost. The private one-time upload API still needs the Vercel Function and Blob configuration.

## Project structure

```text
MONO-VOICE/
├── api/messages.js   # Vercel upload and one-time consume endpoint
├── index.html        # Record, upload, and Drive-link page
├── listen.html       # Recipient page
├── compose.js        # Recording, upload, and link creation
├── listen.js         # Warning, Drive player, and one-time playback
├── store.js          # Same-origin API client
└── styles.css        # Shared design
```
