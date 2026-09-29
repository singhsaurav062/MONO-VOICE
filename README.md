# Hush — One-Time Voice Messages

**Say it once. Keep it private.**

Hush is a web application that lets you create a voice message and share it through a private link. The recipient can listen to the message once, after which the message is designed to self-destruct.

## Features

* 🎙️ Record a voice message directly from the browser
* 📁 Upload an existing audio file
* 🔗 Generate a private, shareable link
* ⏳ Set an expiry time for the link
* 🔥 One-listen / self-destruct experience
* 📱 Responsive design for desktop and mobile
* 🔒 Privacy-focused, minimal interface

## Tech Stack

* **HTML5**
* **CSS3**
* **JavaScript**
* **MediaRecorder API** — browser-based voice recording
* **IndexedDB** — current local audio storage
* **GitHub Pages** — static website hosting

## Project Structure

```text
MONO-VOICE/
│
├── index.html       # Voice message creation page
├── listen.html      # Recipient listening page
├── compose.js       # Recording and link generation
├── listen.js        # Audio playback and self-destruction
├── store.js         # Local audio storage
├── styles.css       # Website styling
├── README.md        # Project documentation
│
├── outputs/         # Generated files
└── work/            # Working files
```

## How It Works

```text
Record / Upload Audio
        ↓
Create Private Link
        ↓
Share Link
        ↓
Recipient Opens Link
        ↓
Confirm One-Time Listen
        ↓
Play Audio
        ↓
Message Self-Destructs
```

## Run Locally

Clone the repository:

```bash
git clone https://github.com/singhsaurav062/MONO-VOICE.git
```

Move into the project:

```bash
cd MONO-VOICE
```

Start a local server:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Deployment

This project is designed to be deployed using **GitHub Pages**.

Go to:

```text
Repository
→ Settings
→ Pages
→ Build and deployment
→ Deploy from a branch
→ main
→ / (root)
```

GitHub Pages will then publish the website.

## Current Limitation

The current version uses **IndexedDB** to store audio locally in the browser.

Therefore, the generated link currently does **not provide true cross-device audio sharing**. The audio exists in the browser where it was created.

For example:

```text
Your Computer
     │
     ▼
IndexedDB
     │
     │
     X  Recipient's phone
        cannot access this storage
```

This is the next major part of the project.

## Planned Architecture

The production version will use cloud storage and a backend:

```text
              SENDER
                │
                ▼
           Web Application
                │
                ▼
             Backend
             /     \
            /       \
       Database    Storage
          │           │
          │         Audio
          │           │
          └─────┬─────┘
                │
                ▼
          Private Link
                │
                ▼
            RECIPIENT
                │
                ▼
            Listen Once
                │
                ▼
        Mark as Consumed
                │
                ▼
          Delete Audio
```

The backend will eventually handle:

* Unique message IDs
* Audio storage
* Link expiration
* One-time access
* Server-side consumption
* Audio deletion
* Secure access tokens

## Security Note

A web application cannot guarantee that a recipient physically cannot copy a recording. Someone could, for example, use another device or recording software.

The application's guarantee is instead:

> **One legitimate playback through the application.**

The production version should use HTTPS, secure random tokens, server-side access control, short-lived audio URLs and server-side deletion.

## Roadmap

* [x] Voice recording interface
* [x] Audio file upload
* [x] Private link generation
* [x] Recipient listening interface
* [x] One-listen UI
* [x] Self-destruct behaviour
* [ ] Cloud audio storage
* [ ] Backend API
* [ ] Cross-device sharing
* [ ] Server-side one-time access
* [ ] Automatic cloud deletion
* [ ] Production security hardening

## Author

**Saurav Singh**

GitHub: `https://github.com/singhsaurav062`

---

**Hush** — *Messages that don't linger.*
