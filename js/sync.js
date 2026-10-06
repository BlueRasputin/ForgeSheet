let syncSettings = loadSyncSettings();
let syncState = {
  connected: false,
  db: null,
  firestore: null,
  unsubscribers: [],
  uploadTimer: null,
  lastSummary: null,
  applyingRemote: false,
  dmSheets: [],
  auth: null,
  authApi: null,
  user: null,
  cloudSaveTimer: null
};

async function ensureFirebaseApp() {
  const firebaseConfig = JSON.parse(syncSettings.firebaseConfigText);
  const appApi = await import(FIREBASE_APP_URL);
  const existing = appApi.getApps().find(app => app.name === "forgesheet-sync");
  return existing || appApi.initializeApp(firebaseConfig, "forgesheet-sync");
}

async function ensureFirestore() {
  if (syncState.firestore && syncState.db) return syncState.firestore;
  const app = await ensureFirebaseApp();
  const firestoreApi = await import(FIREBASE_FIRESTORE_URL);
  syncState.firestore = firestoreApi;
  syncState.db = firestoreApi.getFirestore(app);
  return firestoreApi;
}

async function initAccount() {
  renderAccountPanel();
  if (!syncSettings.firebaseConfigText) return;
  try {
    const app = await ensureFirebaseApp();
    const authApi = await import(FIREBASE_AUTH_URL);
    syncState.authApi = authApi;
    syncState.auth = authApi.getAuth(app);
    authApi.onAuthStateChanged(syncState.auth, handleAuthState);
  } catch {
    document.querySelector("#accountStatus").textContent = "Could not start Firebase. Check the pasted web config.";
  }
}

const AUTH_PROVIDERS = { google: ["GoogleAuthProvider", "Google"], github: ["GithubAuthProvider", "GitHub"] };

async function signInWith(provider) {
  const status = document.querySelector("#accountStatus");
  const [providerClass, label] = AUTH_PROVIDERS[provider];
  if (!syncSettings.firebaseConfigText) {
    status.textContent = "Cloud saves aren't set up yet: paste a Firebase web config under Game session first.";
    return;
  }
  try {
    if (!syncState.auth) {
      const app = await ensureFirebaseApp();
      const authApi = await import(FIREBASE_AUTH_URL);
      syncState.authApi = authApi;
      syncState.auth = authApi.getAuth(app);
      authApi.onAuthStateChanged(syncState.auth, handleAuthState);
    }
    status.textContent = `Opening ${label} sign-in...`;
    await syncState.authApi.signInWithPopup(syncState.auth, new syncState.authApi[providerClass]());
  } catch (error) {
    status.textContent = {
      "auth/account-exists-with-different-credential": `That email already signs in with another provider. Use that one instead of ${label}.`,
      "auth/popup-closed-by-user": "Sign-in was cancelled.",
      "auth/popup-blocked": "The browser blocked the sign-in window. Allow pop-ups for this site and try again.",
      "auth/operation-not-allowed": `${label} sign-in is off. Enable it under Firebase Authentication → Sign-in method.`,
      "auth/unauthorized-domain": "This site isn't an authorized domain. Add it under Firebase Authentication → Settings."
    }[error?.code] || `Sign-in failed (${error?.code || "unknown error"}).`;
  }
}

async function signOutOfAccount() {
  if (syncState.auth && syncState.authApi) await syncState.authApi.signOut(syncState.auth);
}

// Merge cloud and device copies by updatedAt, then upload what this device has newer.
// Characters signed to another account on this device are never uploaded to this one.
async function handleAuthState(user) {
  syncState.user = user;
  renderAccountPanel();
  if (!user) return;
  try {
    const fs = await ensureFirestore();
    const snap = await fs.getDocs(fs.collection(syncState.db, `users/${user.uid}/characters`));
    const cloud = new Map();
    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data?.character?.sheetId) cloud.set(data.character.sheetId, normalizeCharacter(data.character));
    });
    cloud.forEach((remote, sheetId) => {
      const local = characterLibrary[sheetId];
      if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) characterLibrary[sheetId] = remote;
    });
    saveCharacterLibrary();
    const uploads = Object.values(characterLibrary).filter(item => (!item.ownerUid || item.ownerUid === user.uid) && (!cloud.has(item.sheetId) || (item.updatedAt || 0) > (cloud.get(item.sheetId).updatedAt || 0)));
    await Promise.all(uploads.map(item => {
      item.ownerUid = user.uid;
      return fs.setDoc(fs.doc(syncState.db, `users/${user.uid}/characters/${item.sheetId}`), { character: item, updatedAt: fs.serverTimestamp() });
    }));
    saveCharacterLibrary();
    const classSnap = await fs.getDocs(fs.collection(syncState.db, `users/${user.uid}/classes`));
    classSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data?.class?.id && data.class.table) customClasses[data.class.id] = data.class;
    });
    saveCustomClasses();
    const featSnap = await fs.getDocs(fs.collection(syncState.db, `users/${user.uid}/feats`));
    featSnap.docs.forEach(docSnap => {
      const feat = sanitizeCustomFeat(docSnap.data()?.feat);
      if (feat) customFeats[feat.id] = feat;
    });
    saveCustomFeats();
    const spellSnap = await fs.getDocs(fs.collection(syncState.db, `users/${user.uid}/spells`));
    spellSnap.docs.forEach(docSnap => {
      const spell = sanitizeCustomSpell(docSnap.data()?.spell);
      if (spell) customSpells[spell.id] = spell;
    });
    saveCustomSpells();
    if (characterLibrary[character.sheetId]) character = normalizeCharacter(characterLibrary[character.sheetId]);
    renderAll();
    renderAccountPanel(`${cloud.size} in the cloud, ${uploads.length} uploaded from this device`);
  } catch {
    document.querySelector("#accountStatus").textContent = "Signed in, but loading cloud data failed. Check Firestore rules.";
  }
}

async function saveClassToCloud(cls) {
  if (!syncState.user || !cls?.id) return;
  try {
    const fs = await ensureFirestore();
    await fs.setDoc(fs.doc(syncState.db, `users/${syncState.user.uid}/classes/${cls.id}`), { class: cls, updatedAt: fs.serverTimestamp() });
  } catch {
    // Class stays in localStorage; it syncs on the next successful save.
  }
}

async function saveFeatToCloud(feat) {
  if (!syncState.user || !feat?.id) return;
  try {
    const fs = await ensureFirestore();
    await fs.setDoc(fs.doc(syncState.db, `users/${syncState.user.uid}/feats/${feat.id}`), { feat, updatedAt: fs.serverTimestamp() });
  } catch {
    // Feat stays in localStorage; it syncs on the next successful save.
  }
}

async function saveSpellToCloud(spell) {
  if (!syncState.user || !spell?.id) return;
  try {
    const fs = await ensureFirestore();
    await fs.setDoc(fs.doc(syncState.db, `users/${syncState.user.uid}/spells/${spell.id}`), { spell, updatedAt: fs.serverTimestamp() });
  } catch {
    // Spell stays in localStorage; it syncs on the next successful save.
  }
}

function shareStatus(kind, text) {
  if (kind === "feat") setCustomFeatStatus(text);
  else if (kind === "spell") document.querySelector("#spellShareStatus").textContent = text;
  else document.querySelector("#classShareStatus").textContent = text;
}

// Share codes for custom classes, feats and spells: sharedContent/{code} = { kind, payload, sharedBy, createdAt, schema }.
// A taken code fails the create rule, so try a fresh one (up to 3 times).
async function shareContent(kind, record) {
  if (!record) return;
  if (!syncSettings.firebaseConfigText) {
    shareStatus(kind, "Sharing needs the Firebase config from the Campaign tab.");
    return;
  }
  const payload = { ...record, id: /^custom-[a-z0-9-]{1,60}$/.test(record.id) ? record.id : `custom-${slug(record.id || record.name).slice(0, 50)}` };
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  try {
    const fs = await ensureFirestore();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
      try {
        await fs.setDoc(fs.doc(syncState.db, `sharedContent/${code}`), { kind, payload, sharedBy: syncState.user?.displayName || syncSettings.playerName || "Anonymous", createdAt: fs.serverTimestamp(), schema: 1 });
        shareStatus(kind, `Share code for ${record.name || "this spell"}: ${code}. Anyone can import it with that code.`);
        return;
      } catch (error) {
        if (error?.code !== "permission-denied" || attempt === 2) throw error;
      }
    }
  } catch {
    shareStatus(kind, "Sharing failed. Sign in, and check the Firestore rules allow writes to sharedContent.");
  }
}

async function shareCustomClass() {
  const cls = classBuilderDraft?.name ? null : currentClass();
  if (!cls || BUILT_IN_CLASSES[cls.id] || !customClasses[cls.id]) {
    shareStatus("class", "Select one of your custom classes on the sheet first (built-in classes cannot be shared).");
    return;
  }
  shareContent("class", cls);
}

// An imported class or feat never replaces a built-in, or a different homebrew with the same id: it is re-keyed.
function importClassRecord(record) {
  if (!record?.id || !Array.isArray(record.table) || !record.name) return null;
  const cls = { ...record, name: String(record.name).slice(0, 80), table: record.table.slice(0, 20) };
  const same = customClasses[cls.id] && JSON.stringify(customClasses[cls.id]) === JSON.stringify(cls);
  if (BUILT_IN_CLASSES[cls.id] || (customClasses[cls.id] && !same)) cls.id = uniqueCustomId(cls.name, { ...BUILT_IN_CLASSES, ...customClasses });
  // Subclass ids follow the class id (as saveCustomClass makes them), so a re-keyed import can't clash with another class's.
  if (Array.isArray(cls.subclasses)) cls.subclasses = cls.subclasses.filter(sub => sub?.name).map(sub => ({ ...sub, id: `${cls.id}-${slug(sub.name)}`.slice(0, 64) }));
  customClasses[cls.id] = cls;
  saveCustomClasses();
  saveClassToCloud(cls);
  return cls;
}

function importFeatRecord(record) {
  const feat = sanitizeCustomFeat(record);
  if (!feat) return null;
  const clash = customFeats[feat.id] && JSON.stringify(customFeats[feat.id]) !== JSON.stringify(feat);
  if (clash) feat.id = uniqueCustomId(feat.name, customFeats);
  if (FEAT_PRESETS.includes(feat.name) || Object.values(customFeats).some(item => item.name === feat.name && item.id !== feat.id)) feat.name = `${feat.name} (imported)`.slice(0, 80);
  customFeats[feat.id] = feat;
  saveCustomFeats();
  saveFeatToCloud(feat);
  return feat;
}

// A shared spell with an id this device already uses for a different spell gets a fresh id.
function importSpellRecord(record) {
  const spell = sanitizeCustomSpell(record);
  if (!spell) return null;
  if (customSpells[spell.id] && JSON.stringify(customSpells[spell.id]) !== JSON.stringify(spell)) spell.id = uniqueCustomId(spell.name || "spell", { ...customSpells, ...spellDetails });
  customSpells[spell.id] = spell;
  saveCustomSpells();
  registerCustomSpells();
  saveSpellToCloud(spell);
  return spell;
}

// Reads sharedContent/{code}; old class codes in sharedClasses/{code} still work.
async function importSharedContent(rawCode, kindHint = "class") {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return shareStatus(kindHint, "Enter a share code first.");
  if (!syncSettings.firebaseConfigText) return shareStatus(kindHint, "Importing needs the Firebase config from the Campaign tab.");
  try {
    const fs = await ensureFirestore();
    const snap = await fs.getDoc(fs.doc(syncState.db, `sharedContent/${code}`));
    let data = snap.exists() ? snap.data() : null;
    if (!data) {
      const legacy = await fs.getDoc(fs.doc(syncState.db, `sharedClasses/${code}`));
      data = legacy.exists() ? { kind: "class", payload: legacy.data().class, sharedBy: legacy.data().sharedBy } : null;
    }
    const importers = { feat: importFeatRecord, class: importClassRecord, spell: importSpellRecord };
    const imported = importers[data?.kind]?.(data.payload) || null;
    if (!imported) return shareStatus(kindHint, `Nothing to import for code ${code}.`);
    const field = document.querySelector({ feat: "#importFeatCode", class: "#importClassCode", spell: "#importSpellCode" }[data.kind]);
    if (field) field.value = "";
    shareStatus(data.kind, `Imported ${data.kind} ${imported.name || "Custom spell"} (shared by ${data.sharedBy || "another user"}).`);
    renderAll();
  } catch {
    shareStatus(kindHint, "Import failed. Check the code and your connection.");
  }
}

async function importSharedClass() {
  importSharedContent(document.querySelector("#importClassCode").value, "class");
}

function queueCloudSave() {
  if (!syncState.user) return;
  clearTimeout(syncState.cloudSaveTimer);
  syncState.cloudSaveTimer = setTimeout(saveCharacterToCloud, 1200);
}

async function saveCharacterToCloud() {
  if (!syncState.user) return;
  try {
    const fs = await ensureFirestore();
    if (character.ownerUid && character.ownerUid !== syncState.user.uid) return;
    character.ownerUid = syncState.user.uid;
    const ref = fs.doc(syncState.db, `users/${syncState.user.uid}/characters/${character.sheetId}`);
    await fs.setDoc(ref, { character, updatedAt: fs.serverTimestamp() });
    renderAccountPanel(`Cloud save ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
  } catch {
    renderAccountPanel("Cloud save failed. Your data is kept on this device.");
  }
}

async function deleteCharacterFromCloud(sheetId) {
  if (!syncState.user) return;
  try {
    const fs = await ensureFirestore();
    await fs.deleteDoc(fs.doc(syncState.db, `users/${syncState.user.uid}/characters/${sheetId}`));
  } catch {
    // Local delete already happened; the orphaned doc is reloaded on next sign-in at worst.
  }
}

function renderAccountPanel(note = "") {
  const status = document.querySelector("#accountStatus");
  const signIn = document.querySelector("#signInButtons");
  const signOut = document.querySelector("#googleSignOut");
  if (!status) return;
  if (syncState.user) {
    status.textContent = `Signed in as ${syncState.user.displayName || syncState.user.email || "your account"}. Every character on this device syncs to your account and comes back on any device you sign in from.${note ? ` ${note}.` : ""}`;
    signIn.hidden = true;
    signOut.hidden = false;
  } else {
    status.textContent = syncSettings.firebaseConfigText
      ? "Not signed in. Sign in with Google or GitHub to save your characters online and open them on any device."
      : "Cloud saves need a Firebase project: paste its web config under Game session, then sign in.";
    signIn.hidden = false;
    signOut.hidden = true;
  }
}

function generateSessionCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  syncSettings.campaignId = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  syncSettings.role = "dm";
  saveSyncSettings();
  renderSyncPanel();
  document.querySelector("#syncStatus").textContent = `Session code ${syncSettings.campaignId} ready. Connect, then share the code or the player link.`;
}

function loadSyncSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)) || {};
    const params = new URLSearchParams(location.search);
    return {
      firebaseConfigText: stored.firebaseConfigText || FIREBASE_DEFAULT_CONFIG,
      campaignId: params.get("campaign") || stored.campaignId || "",
      // The role is per tab (sessionStorage), so picking DM in one tab doesn't flip every player tab on the device.
      role: params.get("role") || tabSyncRole() || "player",
      playerName: stored.playerName || "",
      sheetId: params.get("sheet") || stored.sheetId || crypto.randomUUID()
    };
  } catch {
    return { firebaseConfigText: "", campaignId: "", role: "player", playerName: "", sheetId: crypto.randomUUID() };
  }
}

function tabSyncRole() {
  try {
    return sessionStorage.getItem(SYNC_ROLE_KEY);
  } catch {
    return null;
  }
}

function saveSyncSettings() {
  const { role, ...shared } = syncSettings;
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(shared));
  try {
    sessionStorage.setItem(SYNC_ROLE_KEY, role);
  } catch {
    // Without sessionStorage the role lasts until the tab reloads.
  }
}

function renderSyncPanel() {
  document.body.classList.toggle("role-dm", syncSettings.role === "dm");
  setValue("syncRole", syncSettings.role);
  setValue("syncCampaignId", syncSettings.campaignId);
  setValue("syncPlayerName", syncSettings.playerName || character.name);
  setValue("syncSheetId", syncSettings.sheetId || character.sheetId);
  setValue("syncFirebaseConfig", syncSettings.firebaseConfigText);
  document.querySelector("#syncStatus").textContent = syncState.connected
    ? `Connected as ${syncSettings.role.toUpperCase()} to ${syncSettings.campaignId}.`
    : "Not connected.";
  if (!syncState.connected) {
    document.querySelector("#dmRoster").innerHTML = `<p class="empty-state">Connect as DM to watch player sheets.</p>`;
    document.querySelector("#syncActivity").innerHTML = `<p class="empty-state">Connect to a campaign to see level-up and prepared-spell changes.</p>`;
    document.querySelector("#syncRosterCount").textContent = "0 sheets";
    syncState.dmSheets = [];
  }
}

function handleSyncSettingsInput(event) {
  const map = {
    syncRole: "role",
    syncCampaignId: "campaignId",
    syncPlayerName: "playerName",
    syncSheetId: "sheetId",
    syncFirebaseConfig: "firebaseConfigText"
  };
  syncSettings[map[event.target.id]] = event.target.value;
  if (event.target.id === "syncSheetId") character.sheetId = event.target.value || character.sheetId;
  saveSyncSettings();
  if (event.target.id === "syncSheetId") persist();
  if (event.target.id === "syncRole") renderSyncPanel();
}

async function connectCampaignSync() {
  const status = document.querySelector("#syncStatus");
  if (!syncSettings.campaignId || !syncSettings.firebaseConfigText) {
    status.textContent = "Add a campaign ID and Firebase web config first.";
    return;
  }
  disconnectCampaignSync(false);
  syncSettings.playerName = syncSettings.playerName || character.name;
  syncSettings.sheetId = character.sheetId;
  saveSyncSettings();

  try {
    status.textContent = "Connecting to campaign...";
    await ensureFirestore();
    syncState.connected = true;
    syncState.lastSummary = syncCharacterSummary();
    subscribeCampaign();
    if (syncSettings.role === "player") await uploadSheetSnapshot("connected");
    status.textContent = `Connected as ${syncSettings.role.toUpperCase()} to ${syncSettings.campaignId}.`;
    renderSyncPanel();
  } catch (error) {
    syncState.connected = false;
    status.textContent = "Could not connect. Check the Firebase config and Firestore rules.";
  }
}

function disconnectCampaignSync(updateStatus = true) {
  syncState.unsubscribers.forEach(unsubscribe => unsubscribe());
  syncState.unsubscribers = [];
  syncState.connected = false;
  syncState.db = null;
  syncState.firestore = null;
  clearTimeout(syncState.uploadTimer);
  if (updateStatus) {
    document.querySelector("#syncStatus").textContent = "Disconnected.";
    document.querySelector("#dmRoster").innerHTML = "";
    document.querySelector("#syncActivity").innerHTML = "";
    document.querySelector("#syncRosterCount").textContent = "0 sheets";
  }
}

function subscribeCampaign() {
  const fs = syncState.firestore;
  const campaignPath = `campaigns/${syncSettings.campaignId}`;
  if (syncSettings.role === "dm") {
    const sheetsRef = fs.collection(syncState.db, `${campaignPath}/sheets`);
    syncState.unsubscribers.push(fs.onSnapshot(sheetsRef, snapshot => {
      const sheets = snapshot.docs.map(doc => doc.data()).sort((a, b) => (a.characterName || "").localeCompare(b.characterName || ""));
      syncState.dmSheets = sheets;
      renderDmRoster(sheets);
      renderDmItemTools();
    }));
  } else if (syncSettings.sheetId) {
    const sheetRef = fs.doc(syncState.db, `${campaignPath}/sheets/${syncSettings.sheetId}`);
    syncState.unsubscribers.push(fs.onSnapshot(sheetRef, snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (!data?.character || syncState.applyingRemote) return;
      applyRemoteCharacter(data.character);
    }));
  }
  const activityRef = fs.query(
    fs.collection(syncState.db, `${campaignPath}/activity`),
    fs.orderBy("createdAt", "desc"),
    fs.limit(30)
  );
  syncState.unsubscribers.push(fs.onSnapshot(activityRef, snapshot => {
    renderActivity(snapshot.docs.map(doc => doc.data()));
  }));
}

function applyRemoteCharacter(remoteCharacter) {
  const incoming = normalizeCharacter(remoteCharacter);
  if (JSON.stringify(incoming) === JSON.stringify(character)) return;
  syncState.applyingRemote = true;
  try {
    character = incoming;
    persist();
    syncState.lastSummary = syncCharacterSummary();
    renderAll();
  } finally {
    syncState.applyingRemote = false;
  }
}

function queueSyncUpload() {
  if (!syncState.connected || syncSettings.role !== "player" || syncState.applyingRemote) return;
  clearTimeout(syncState.uploadTimer);
  syncState.uploadTimer = setTimeout(() => uploadSheetSnapshot("updated"), 700);
}

async function uploadSheetSnapshot(reason) {
  if (!syncState.connected || syncSettings.role !== "player") return;
  const fs = syncState.firestore;
  const summary = syncCharacterSummary();
  const sheetRef = fs.doc(syncState.db, `campaigns/${syncSettings.campaignId}/sheets/${syncSettings.sheetId}`);
  await fs.setDoc(sheetRef, {
    ...summary,
    sheetId: syncSettings.sheetId,
    playerName: syncSettings.playerName || character.name,
    character,
    updatedAt: fs.serverTimestamp()
  }, { merge: true });
  await maybeLogSyncActivity(summary, reason);
  syncState.lastSummary = summary;
}

async function maybeLogSyncActivity(summary, reason) {
  const previous = syncState.lastSummary;
  const changes = [];
  if (!previous || reason === "connected") {
    changes.push("shared their sheet");
  } else {
    if (previous.level !== summary.level) changes.push(`leveled from ${previous.level} to ${summary.level}`);
    if (previous.preparedSignature !== summary.preparedSignature) changes.push("changed prepared spells");
  }
  if (!changes.length) return;
  const fs = syncState.firestore;
  await fs.addDoc(fs.collection(syncState.db, `campaigns/${syncSettings.campaignId}/activity`), {
    sheetId: syncSettings.sheetId,
    characterName: summary.characterName,
    playerName: syncSettings.playerName || character.name,
    message: `${summary.characterName} ${changes.join(" and ")}.`,
    createdAt: fs.serverTimestamp()
  });
}

function syncCharacterSummary() {
  const cls = currentClass();
  const prepared = character.spells
    .filter(row => row.prepared && spellRowHasSpell(row))
    .map(spellDisplayName)
    .filter(Boolean)
    .sort();
  return {
    characterName: character.name,
    className: cls.name,
    classLabel: classLabel(),
    classId: character.classId,
    subclassName: character.subclassName,
    level: totalLevel(),
    hp: character.hp,
    maxHp: effectiveMaxHp(),
    ac: effectiveArmorClass(),
    passivePerception: passivePerception(character),
    exhaustion: Number(character.exhaustion || 0),
    conditions: character.conditions || [],
    equipmentWeight: equipmentWeight(character),
    carryingCapacity: carryingCapacity(character),
    classOptions: (character.classOptions || []).map(option => ({
      kind: option.kind,
      name: option.name,
      current: option.current,
      max: option.max,
      reset: option.reset
    })),
    preparedSpells: prepared,
    preparedSignature: prepared.join("|"),
    partyStatus: partyStatusPayload()
  };
}

// Live table state other apps (Cartomancer) read from campaigns/{campaignId}/sheets/{sheetId}.partyStatus.
// The shape is versioned; see INTEGRATION.md. Add fields freely, never rename or repurpose one without bumping the version.
function partyStatusPayload() {
  const hp = Number(character.hp || 0);
  const failures = Number(character.deathSaveFailures || 0);
  const successes = Number(character.deathSaveSuccesses || 0);
  const maxHp = effectiveMaxHp();
  return {
    schema: "forgesheet.partyStatus",
    version: 1,
    name: character.name || "",
    playerName: syncSettings.playerName || "",
    ownerUid: syncState.user?.uid || null,
    level: totalLevel(),
    classLabel: character.multiclasses?.length ? classLabel() : [currentClass().name, character.subclassName].filter(Boolean).join(" · "),
    species: character.species || "",
    hp,
    maxHp,
    baseMaxHp: Number(character.maxHp || 0),
    tempHp: Number(character.tempHp || 0),
    ac: effectiveArmorClass(),
    speed: effectiveSpeed(),
    initiativeBonus: initiativeBonus(),
    initiative: latestInitiative(character),
    inParty: inParty(character),
    state: isDead() ? "dead" : hp > 0 ? (hp <= maxHp / 2 ? "bloodied" : "healthy") : character.stable ? "stable" : "down",
    deathSaves: { successes, failures },
    conditions: [...(character.conditions || [])],
    exhaustion: Number(character.exhaustion || 0),
    concentration: concentrationName(character) || null,
    // Constitution saves still owed for concentration, one DC per hit taken (PHB p.203).
    concentrationSaves: concentrationSavesOwed(character),
    raging: Boolean(character.raging),
    // Wild Shape (PHB p.67): the beast form's HP take damage first, so the DM needs both.
    wildShape: character.wildShape ? { name: character.wildShape.name || "Beast form", hp: Number(character.wildShape.hp || 0), max: Number(character.wildShape.max || 0) } : null,
    inspiration: Number(character.inspiration || 0),
    passives: { perception: passiveScore("perception"), investigation: passiveScore("investigation"), insight: passiveScore("insight") },
    saves: Object.fromEntries(ABILITIES.map(([id]) => [id, saveBonus(id)])),
    // Aura of Protection for allies within range while the paladin is conscious (PHB p.85).
    aura: auraOfProtection() ? { bonus: auraOfProtection(), range: classLevel("paladin") >= 18 ? 30 : 10 } : null,
    spellSave: casterEntries().length ? spellStats(entryClass(casterEntries()[0]).spellAbility, entryClass(casterEntries()[0]).id).dc : null,
    // Each casting class uses its own ability (PHB p.164); a blood hunter's curses use the hemocraft DC.
    spellSaves: casterEntries().map(entry => ({ class: entryClass(entry).id, ability: entryClass(entry).spellAbility, dc: spellStats(entryClass(entry).spellAbility, entryClass(entry).id).dc })),
    hemocraftDc: classLevel("bloodhunter") ? hemocraftDc() : null,
    resources: (character.resources || []).map(item => ({ name: item.name, current: Number(item.current), max: Number(item.max), reset: item.reset })),
    spellSlots: characterSpellSlots().map((count, index) => ({ level: index + 1, max: count, remaining: slotRemaining(index + 1, count) })).filter(slot => slot.max > 0),
    updatedAtMs: Date.now()
  };
}

function renderDmRoster(sheets) {
  document.querySelector("#syncRosterCount").textContent = `${sheets.length} sheet${sheets.length === 1 ? "" : "s"}`;
  const root = document.querySelector("#dmRoster");
  if (!sheets.length) {
    root.innerHTML = `<p class="empty-state">No player sheets connected yet.</p>`;
    return;
  }
  root.innerHTML = sheets.map(sheet => `
    <article class="dm-sheet">
      <div>
        <strong>${escapeHtml(sheet.characterName || "Unnamed")}</strong>
        <span>${escapeHtml(sheet.playerName || "Player")} · ${escapeHtml(sheet.classLabel || `${sheet.className || "Class"} ${sheet.level || "?"}`)}${sheet.subclassName ? ` · ${escapeHtml(sheet.subclassName)}` : ""}</span>
      </div>
      <div class="dm-sheet-stats">
        <span>AC ${escapeHtml(sheet.ac ?? "-")}</span>
        <span>HP ${escapeHtml(sheet.hp ?? "-")} / ${escapeHtml(sheet.maxHp ?? "-")}</span>
        <span>PP ${escapeHtml(sheet.passivePerception ?? "-")}</span>
      </div>
      <p>${escapeHtml([...(sheet.conditions || []), ...(Number(sheet.exhaustion) ? [`Exhaustion ${sheet.exhaustion}`] : [])].join(", ") || "No conditions")}</p>
      <p>${escapeHtml(`Load ${formatWeight(sheet.equipmentWeight || 0)} / ${sheet.carryingCapacity || "-"} lb · ${(sheet.classOptions || []).map(item => `${item.name} ${item.max ? `${item.current}/${item.max}` : ""}`.trim()).join(", ") || "No class modules"}`)}</p>
      <p>${escapeHtml((sheet.preparedSpells || []).join(", ") || "No prepared spells listed.")}</p>
    </article>
  `).join("");
}

function renderDmItemTools() {
  const target = document.querySelector("#dmItemTarget");
  const catalog = document.querySelector("#dmItemCatalog");
  if (!target || !catalog) return;
  const targets = dmItemTargets();
  const currentTarget = target.value;
  target.innerHTML = targets.length
    ? targets.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")
    : `<option value="">No players available</option>`;
  const preferred = preferredItemTarget(targets);
  if (preferred) target.value = preferred.id;
  const currentItem = catalog.value;
  catalog.innerHTML = ITEM_CATALOG.map(item => `<option value="${item.index}">${escapeHtml(item.name)} (${escapeHtml(item.type)})</option>`).join("");
  if (currentItem) catalog.value = currentItem;
  const base = document.querySelector("#customItemBase");
  if (base && base.options.length < 2) base.innerHTML = `<option value="">None</option>` + ITEM_CATALOG.filter(item => item.type === "Weapon" && item.cost).map(item => `<option value="${item.index}">${escapeHtml(item.name)}</option>`).join("");
  renderDmItemPreview();
}

// Recipient: the one picked (here or with a party card's "Send item"), else the sheet being viewed if it's in the
// party, else the first party member.
let itemCardRecipient = "";

function preferredItemTarget(targets) {
  const member = item => inParty(item.sheet);
  return targets.find(item => item.sheet.sheetId === itemCardRecipient)
    || targets.find(item => item.sheet.sheetId === character.sheetId && member(item))
    || targets.find(member) || targets[0];
}

// Party card "Send item": open the item cards with that member chosen.
function openItemCards(sheetId) {
  itemCardRecipient = sheetId;
  renderDmItemTools();
  const section = document.querySelector("#itemCardsSection");
  section.open = true;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#dmItemCatalog").focus({ preventScroll: true });
}

function clearCustomItemForm() {
  ["customItemName", "customItemType", "customItemWeight", "customItemQuantity", "customItemRarity", "customItemBase", "customItemBonus", "customItemNotes"]
    .forEach(id => { document.querySelector(`#${id}`).value = ""; });
  document.querySelector("#customItemContainer").value = "carried";
  document.querySelector("#customItemCursed").checked = false;
}

function dmItemTargets() {
  if (syncSettings.role === "dm" && syncState.dmSheets.length) {
    return syncState.dmSheets.map(sheet => ({
      id: `remote:${sheet.sheetId}`,
      label: `${sheet.characterName || "Unnamed"} - ${sheet.playerName || "Player"}`,
      sheet
    }));
  }
  return Object.values(characterLibrary).map(item => ({
    id: `local:${item.sheetId}`,
    label: `${item.name || "Unnamed"} - local`,
    sheet: item
  }));
}

function renderDmItemPreview() {
  const root = document.querySelector("#dmItemPreview");
  if (!root) return;
  const selected = ITEM_CATALOG.find(item => item.index === document.querySelector("#dmItemCatalog")?.value) || ITEM_CATALOG[0];
  const custom = customItemFromFields();
  root.innerHTML = [selected, custom].map(item => item ? itemCardHtml(item) : "").join("");
}

function itemCardHtml(item) {
  return `
    <article class="item-card">
      <span>${escapeHtml(item.type || "Item")} · ${escapeHtml(item.rarity || "Custom")}</span>
      <strong>${escapeHtml(item.name || "Unnamed item")}</strong>
      <p>${escapeHtml(item.notes || "No notes.")}</p>
      <em>${formatWeight(item.weight || 0)} lb</em>
    </article>
  `;
}

function customItemFromFields() {
  const name = document.querySelector("#customItemName")?.value.trim();
  if (!name) return null;
  // A base weapon gives the item that weapon's damage and properties, so it attacks like the catalog weapon;
  // the magic bonus adds to attack and damage rolls (DMG p.213 "Weapon, +1, +2, or +3").
  const base = ITEM_CATALOG.find(item => item.index === document.querySelector("#customItemBase")?.value);
  const magicBonus = clamp(Math.round(Number(document.querySelector("#customItemBonus")?.value || 0)), 0, 3);
  const notes = document.querySelector("#customItemNotes").value.trim();
  return {
    index: `custom-${slug(name)}`,
    name,
    type: document.querySelector("#customItemType").value.trim() || (base ? "Weapon" : "Custom Item"),
    weight: Number(document.querySelector("#customItemWeight").value || base?.weight || 0),
    ...(magicBonus ? { magicBonus } : {}),
    ...(base ? { notes: [`${base.rarity}: ${base.notes}`, magicBonus ? `+${magicBonus} to attack and damage rolls.` : "", notes].filter(Boolean).join(" ") } : {}),
    quantity: clamp(Number(document.querySelector("#customItemQuantity").value || 1), 1, 999),
    rarity: document.querySelector("#customItemRarity").value.trim() || "Custom",
    container: document.querySelector("#customItemContainer").value || "carried",
    cursed: Boolean(document.querySelector("#customItemCursed")?.checked),
    ...(base ? {} : { notes })
  };
}

async function sendDmItem(kind) {
  const status = document.querySelector("#dmItemStatus");
  const targetId = document.querySelector("#dmItemTarget").value;
  const target = dmItemTargets().find(item => item.id === targetId);
  if (!target) {
    status.textContent = "Choose a player first.";
    return;
  }
  const item = kind === "custom"
    ? customItemFromFields()
    : ITEM_CATALOG.find(entry => entry.index === document.querySelector("#dmItemCatalog").value);
  if (!item?.name) {
    status.textContent = "Choose or create an item first.";
    return;
  }
  const equipmentItem = equipmentFromItemCard(item);
  if (targetId.startsWith("remote:")) {
    await sendRemoteItem(target.sheet, equipmentItem);
  } else {
    sendLocalItem(target.sheet.sheetId, equipmentItem);
  }
  status.textContent = `${item.name} sent to ${target.label}.`;
  // Cleared so the same item isn't sent twice by accident.
  if (kind === "custom") clearCustomItemForm();
  renderDmItemPreview();
}

function sendLocalItem(sheetId, equipmentItem) {
  const target = characterLibrary[sheetId];
  if (!target) return;
  target.equipment = [...(target.equipment || []), equipmentItem];
  logSheetChange(target, null, `${actorName()} sent you ${equipmentItem.name}`);
  target.updatedAt = Date.now();
  characterLibrary[sheetId] = normalizeCharacter(target);
  saveCharacterLibrary();
  if (character.sheetId === sheetId) {
    character = normalizeCharacter(characterLibrary[sheetId]);
    persistAndRender();
  } else {
    renderAll();
  }
  showToast(`<span class="toast-label">${escapeHtml(equipmentItem.name)} sent</span><span>to ${escapeHtml(target.name || "player")}</span>`);
}

async function sendRemoteItem(sheet, equipmentItem) {
  if (!syncState.connected || syncSettings.role !== "dm") {
    sendLocalItem(sheet.sheetId, equipmentItem);
    return;
  }
  const fs = syncState.firestore;
  const nextCharacter = addActivity(normalizeCharacter({
    ...(sheet.character || {}),
    equipment: [...(sheet.character?.equipment || []), equipmentItem]
  }), `${actorName()} sent you ${equipmentItem.name}`);
  const sheetRef = fs.doc(syncState.db, `campaigns/${syncSettings.campaignId}/sheets/${sheet.sheetId}`);
  await fs.setDoc(sheetRef, {
    character: nextCharacter,
    equipmentWeight: equipmentWeight(nextCharacter),
    updatedAt: fs.serverTimestamp()
  }, { merge: true });
  await fs.addDoc(fs.collection(syncState.db, `campaigns/${syncSettings.campaignId}/activity`), {
    sheetId: sheet.sheetId,
    characterName: sheet.characterName,
    playerName: syncSettings.playerName || "DM",
    message: `DM sent ${equipmentItem.name} to ${sheet.characterName || "a player"}.`,
    createdAt: fs.serverTimestamp()
  });
}

function renderActivity(items) {
  const root = document.querySelector("#syncActivity");
  if (!items.length) {
    root.innerHTML = `<p class="empty-state">No campaign activity yet.</p>`;
    return;
  }
  root.innerHTML = items.map(item => `
    <article class="activity-item">
      <strong>${escapeHtml(item.message || "Sheet updated.")}</strong>
      <span>${escapeHtml(item.playerName || "")}</span>
    </article>
  `).join("");
}

async function copySyncLink(role) {
  const status = document.querySelector("#syncStatus");
  if (!syncSettings.campaignId) {
    status.textContent = "Enter or generate a session code before sharing a link.";
    return;
  }
  const url = new URL(location.href);
  url.searchParams.set("campaign", syncSettings.campaignId);
  url.searchParams.set("role", role);
  if (role === "player") url.searchParams.set("sheet", syncSettings.sheetId || character.sheetId);
  const label = role === "dm" ? "DM" : "Player";
  try {
    await navigator.clipboard.writeText(url.toString());
    status.textContent = `${label} link copied.`;
  } catch {
    status.textContent = `Couldn't copy automatically. ${label} link: ${url}`;
  }
}
