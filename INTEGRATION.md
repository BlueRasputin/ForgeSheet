# Party status for other apps (Cartomancer)

ForgeSheet's campaign sync writes each player's live table state to Firestore. Any app on the same Firebase project can read it. That includes Cartomancer, which can show who is in the party and how they're doing without asking players to re-enter anything.

## Where it lives

```
campaigns/{campaignId}/sheets/{sheetId}
campaigns/{campaignId}/activity/{autoId}
```

- **Writes:** a player's sheet is written whenever they change it while connected (debounced) and when they connect.
- **Reads:** the DM view subscribes to the whole `sheets` collection, and Cartomancer can do the same. `campaignId` is the code the party types into ForgeSheet's Campaign sync panel.

## The `partyStatus` field

Each sheet document carries `partyStatus`, a small, flat object made for display.

- **Versioning:** it is versioned so it can grow without breaking readers. New fields may be added at any time. A field is never renamed or given a new meaning without raising `version`.
- **Other fields:** the document also has the full `character` object and older top-level summary fields (`characterName`, `hp`, `maxHp`, `ac`, `conditions`, ...). Prefer `partyStatus`. The rest is ForgeSheet's internal shape and can change.

```jsonc
{
  "schema": "forgesheet.partyStatus",
  "version": 1,
  "name": "Taliesin Hexblade",
  "playerName": "Taliesin",
  "ownerUid": "firebase-auth-uid-or-null",   // set when the player is signed in to ForgeSheet
  "level": 7,
  "classLabel": "Warlock · Hexblade",
  "species": "Tiefling",
  "hp": 14,
  "maxHp": 52,            // effective max: after max-HP reduction and exhaustion 4+
  "baseMaxHp": 52,        // the sheet's written max
  "tempHp": 0,
  "ac": 16,
  "speed": 30,            // after class bonuses, feats, exhaustion and grappled/restrained
  "initiativeBonus": 1,
  "initiative": 20,       // latest initiative roll this combat, or null (cleared when combat ends)
  "inParty": true,        // false when the sheet is unticked "In party" on the Party tab (NPCs, spare sheets)
  "state": "bloodied",    // "healthy" | "bloodied" | "down" | "stable" | "dead" (dead also at exhaustion 6)
  "deathSaves": { "successes": 0, "failures": 0 },
  "conditions": ["Poisoned"],
  "exhaustion": 0,
  "concentration": "Hex", // spell name or null
  "concentrationSaves": [10], // CON save DCs still owed for that concentration, one per hit taken; [] when none
  "raging": false,
  "wildShape": null,      // or { "name": "Brown bear", "hp": 5, "max": 34 } while in Wild Shape; damage hits these HP first
  "inspiration": 0,
  "passives": { "perception": 11, "investigation": 10, "insight": 11 }, // ±5 while the check has advantage/disadvantage
  "saves": { "str": -1, "dex": 1, "con": 2, "int": 0, "wis": 4, "cha": 6 },
  "spellSave": 14,        // first casting class's DC; null for non-casters (kept for older readers)
  "spellSaves": [{ "class": "warlock", "ability": "cha", "dc": 14 }], // one per casting class (multiclass DCs differ)
  "hemocraftDc": null,    // blood hunter curse/brand DC (8 + prof + INT or WIS), null without blood hunter levels
  "resources": [{ "name": "Hexblade's Curse", "current": 1, "max": 1, "reset": "short" }],
  "spellSlots": [{ "level": 4, "max": 2, "remaining": 2 }],
  "updatedAtMs": 1790873082599
}
```

The document's own `updatedAt` is a Firestore server timestamp. Use it to sort by freshness or to hide stale sheets.

## Reading it from Cartomancer

```js
import { collection, onSnapshot } from "firebase/firestore";

onSnapshot(collection(db, `campaigns/${campaignId}/sheets`), snapshot => {
  const party = snapshot.docs
    .map(doc => doc.data().partyStatus)
    .filter(status => status?.schema === "forgesheet.partyStatus" && status.version === 1);
  renderParty(party);
});
```

The `activity` collection holds short, human-readable events, newest first by `createdAt`. Examples are "Vex leveled from 4 to 5" and "DM sent Potion of Healing to Grog". It works as a party log feed.

## Requirements on the Cartomancer side

- **Same Firebase project.** Cartomancer must use the same `firebaseConfig` that players paste into ForgeSheet's sync panel. The alternative is to have ForgeSheet point at Cartomancer's project.
- **Same campaign code.** A Cartomancer party maps to one `campaignId`. Storing that ID on the Cartomancer party record is enough to link them.
- **Identity.** When a player is signed in to ForgeSheet, `partyStatus.ownerUid` is their Firebase Auth uid. If Cartomancer signs users in with the same project, it can match a sheet to a Cartomancer account by that uid.
- **Writes back.** ForgeSheet treats the `character` field as the source of truth and applies remote changes to it live. That's how the DM's "send item" works. Cartomancer should treat `partyStatus` as read-only. Any change should go through `character` and keep the same shape. The safest approach is to limit writes to appending to `activity`.
- **Telling the player.** A writer that changes `character` can also prepend an entry to `character.activity`:
  `{ "id": "<uuid>", "at": <ms epoch>, "who": "DM", "text": "DM sent you Potion of Healing" }` (newest first, keep at
  most 20). The open sheet shows each new entry as a toast and lists them under "Changes by others". ForgeSheet's own
  party-card actions and item cards write these entries.
