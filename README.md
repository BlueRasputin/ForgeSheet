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

1. [console.firebase.google.com](https://console.firebase.google.com) → Add project → add a **Web app** → copy the config JSON. Paste it into `FIREBASE_DEFAULT_CONFIG` in `js/data.js` so players never have to (the web config is public by design), or paste it into **Campaign → Firebase web config** in the app.
2. **Authentication → Sign-in method** → enable **Google** and **GitHub**. For GitHub, create an OAuth app at github.com → Settings → Developer settings → OAuth Apps, use the callback URL Firebase shows you, and paste the client ID and secret back into Firebase. Add your deployed domain under Authorized domains (`localhost` is pre-authorized).
3. **Firestore Database → Create database**, then deploy the rules in `firestore.rules`: `firebase deploy --only firestore:rules`.

On sign-in, characters on the device and in the cloud are merged by last edit, and anything newer on the device is uploaded. A character saved under one account is never uploaded to a different account that signs in on the same device.

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

## Files and backups

- **Download this character (PDF)** builds a readable sheet and embeds the full character data in the PDF, so importing that PDF restores the character exactly. Other PDFs are read as text.
- **JSON**: download one character, or back up every character on the device. Importing adds to the library and never deletes local characters.
- **Copy sheet as an AI prompt** produces the full sheet plus instructions to follow your rules edition, ready to paste into any AI chat.

## Rules

Rules default to the 2014 Player's Handbook. Optional rules (Tasha's optional class features and expanded spell lists, feats, variant encumbrance) are switched per character in **Settings**. Each class on a character can be switched to 2024 in **Settings** (the edition shows as a badge on the sheet); 2024 classes are labeled, but ForgeSheet's automation still follows the 2014 tables. When you do something the rules don't allow (over-preparing spells, multiclassing without the prerequisites, a fourth attunement), ForgeSheet asks once per character whether to allow it as a homebrew rule. Allowed rules are listed, and can be turned off, in Settings.

## Content note

ForgeSheet is free, unofficial fan content and is not affiliated with Wizards of the Coast.

- **SRD 5.1:** `js/srd-spells.js` bundles the 319 SRD 5.1 spells and `js/srd-beasts.js` the 87 SRD beasts for Wild Shape and familiars (regenerate with `node tools/build_srd_spells.js` / `node tools/build_srd_beasts.js`). This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.
- **Everything else** (non-SRD spells, class and subclass features, feats, species, backgrounds and options from the 2014-era books, the Blood Hunter and Tal'Dorei Reborn) is an original mechanical summary in `js/rules-*.js` and `js/expansions.js`. The numbers follow the books; the wording does not. Spell names drop Wizards of the Coast character names the way the SRD does ("Caustic Brew", "Arcane Hand"); saved characters keep working because the spell ids are unchanged.
- No D&D Beyond assets or trademarks are included.
