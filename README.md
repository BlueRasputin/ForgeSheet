# ForgeSheet

A D&D 5e character sheet app inspired by D&D Beyond's layout, with features it doesn't have: a custom class builder with shareable class codes, campaign sync with DM tools, PDF character import, split-view panels, and full offline support. Vanilla HTML/CSS/JS — no build step, no framework.

## Run locally

```sh
python3 -m http.server 8420
# open http://localhost:8420
```

Opening `index.html` directly from disk also works (cloud features need a server origin for Google sign-in).

## Firebase setup (cloud saves, sharing, campaign sync)

The app is client-only; cloud features connect to your own free Firebase project:

1. [console.firebase.google.com](https://console.firebase.google.com) → Add project → add a **Web app** → copy the config JSON → paste it into **Campaign → Firebase Web Config** in the app.
2. **Authentication → Sign-in method** → enable **Google**. Add your deployed domain under Authorized domains (`localhost` is pre-authorized).
3. **Firestore Database → Create database**, then set Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /campaigns/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /sharedClasses/{code} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

What the collections hold:
- `users/{uid}/characters/{sheetId}` — your character sheets (auto-saved, restored on sign-in from any device)
- `users/{uid}/classes/{classId}` — your custom classes
- `sharedClasses/{code}` — classes published with a share code (Class Builder → Share)
- `campaigns/{sessionCode}` — live session sync between a DM and players

## Deploy

Any static host works. With Firebase Hosting (config included):

```sh
npm install -g firebase-tools
firebase login
firebase init hosting   # select your project, keep existing firebase.json
firebase deploy
```

Alternatives: drag the folder into [Netlify Drop](https://app.netlify.com/drop), or enable GitHub Pages on the repo. After deploying, add the site's domain to Firebase Authentication → Authorized domains.

## Content note

Rules content is limited to the SRD 5.1 (via [dnd5eapi.co](https://www.dnd5eapi.co)) and original summaries. No D&D Beyond assets, trademarks, or non-SRD content are included.
