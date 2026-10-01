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

async function signInWithGoogle() {
  const status = document.querySelector("#accountStatus");
  if (!syncSettings.firebaseConfigText) {
    status.textContent = "Paste your Firebase web config below first, then sign in.";
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
    status.textContent = "Opening Google sign-in...";
    await syncState.authApi.signInWithPopup(syncState.auth, new syncState.authApi.GoogleAuthProvider());
  } catch {
    status.textContent = "Sign-in failed. Enable the Google provider under Firebase Authentication and allow localhost.";
  }
}

async function signOutOfAccount() {
  if (syncState.auth && syncState.authApi) await syncState.authApi.signOut(syncState.auth);
}

async function handleAuthState(user) {
  syncState.user = user;
  renderAccountPanel();
  if (!user) return;
  try {
    const fs = await ensureFirestore();
    const snap = await fs.getDocs(fs.collection(syncState.db, `users/${user.uid}/characters`));
    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data?.character?.sheetId) characterLibrary[data.character.sheetId] = normalizeCharacter(data.character);
    });
    saveCharacterLibrary();
    const classSnap = await fs.getDocs(fs.collection(syncState.db, `users/${user.uid}/classes`));
    classSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data?.class?.id && data.class.table) customClasses[data.class.id] = data.class;
    });
    localStorage.setItem(CUSTOM_CLASS_KEY, JSON.stringify(customClasses));
    if (characterLibrary[character.sheetId]) character = normalizeCharacter(characterLibrary[character.sheetId]);
    renderAll();
    queueCloudSave();
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

async function shareCustomClass() {
  const status = document.querySelector("#classShareStatus");
  const cls = classBuilderDraft?.name ? null : currentClass();
  if (!cls || BUILT_IN_CLASSES[cls.id]) {
    status.textContent = "Select one of your custom classes on the sheet first (built-in classes cannot be shared).";
    return;
  }
  if (!syncSettings.firebaseConfigText) {
    status.textContent = "Sharing needs the Firebase config from the Campaign tab.";
    return;
  }
  try {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const fs = await ensureFirestore();
    await fs.setDoc(fs.doc(syncState.db, `sharedClasses/${code}`), {
      class: cls,
      sharedBy: syncState.user?.displayName || syncSettings.playerName || "Anonymous",
      createdAt: fs.serverTimestamp()
    });
    status.textContent = `Share code for ${cls.name}: ${code} — anyone can import it from this box.`;
  } catch {
    status.textContent = "Sharing failed. Check the Firestore rules allow writes to sharedClasses.";
  }
}

async function importSharedClass() {
  const status = document.querySelector("#classShareStatus");
  const code = document.querySelector("#importClassCode").value.trim().toUpperCase();
  if (!code) {
    status.textContent = "Enter a share code first.";
    return;
  }
  if (!syncSettings.firebaseConfigText) {
    status.textContent = "Importing needs the Firebase config from the Campaign tab.";
    return;
  }
  try {
    const fs = await ensureFirestore();
    const snap = await fs.getDoc(fs.doc(syncState.db, `sharedClasses/${code}`));
    const data = snap.exists() ? snap.data() : null;
    if (!data?.class?.id || !data.class.table) {
      status.textContent = `No shared class found for code ${code}.`;
      return;
    }
    customClasses[data.class.id] = data.class;
    localStorage.setItem(CUSTOM_CLASS_KEY, JSON.stringify(customClasses));
    saveClassToCloud(data.class);
    document.querySelector("#importClassCode").value = "";
    status.textContent = `Imported ${data.class.name} (shared by ${data.sharedBy || "another user"}). It is now in your class list.`;
    renderAll();
  } catch {
    status.textContent = "Import failed. Check the code and your connection.";
  }
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
    const ref = fs.doc(syncState.db, `users/${syncState.user.uid}/characters/${character.sheetId}`);
    await fs.setDoc(ref, { character, updatedAt: fs.serverTimestamp() });
    renderAccountPanel(`Cloud save ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
  } catch {
    renderAccountPanel("Cloud save failed — data kept locally.");
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
  const signIn = document.querySelector("#googleSignIn");
  const signOut = document.querySelector("#googleSignOut");
  if (!status) return;
  if (syncState.user) {
    status.textContent = `Signed in as ${syncState.user.displayName || syncState.user.email}. Characters sync to your Firebase database.${note ? ` ${note}.` : ""}`;
    signIn.hidden = true;
    signOut.hidden = false;
  } else {
    status.textContent = syncSettings.firebaseConfigText
      ? "Not signed in. Sign in with Google to save characters to the cloud and restore them after closing the browser."
      : "Paste a Firebase web config below, then sign in with Google to enable cloud saves.";
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
      firebaseConfigText: stored.firebaseConfigText || "",
      campaignId: params.get("campaign") || stored.campaignId || "",
      role: params.get("role") || stored.role || "player",
      playerName: stored.playerName || "",
      sheetId: params.get("sheet") || stored.sheetId || crypto.randomUUID()
    };
  } catch {
    return { firebaseConfigText: "", campaignId: "", role: "player", playerName: "", sheetId: crypto.randomUUID() };
  }
}

function saveSyncSettings() {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncSettings));
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
  persist();
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
    classId: character.classId,
    subclassName: character.subclassName,
    level: character.level,
    hp: character.hp,
    maxHp: character.maxHp,
    ac: character.ac,
    passivePerception: passivePerception(character),
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
    preparedSignature: prepared.join("|")
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
        <span>${escapeHtml(sheet.playerName || "Player")} · ${escapeHtml(sheet.className || "Class")} ${sheet.level || "?"}${sheet.subclassName ? ` · ${escapeHtml(sheet.subclassName)}` : ""}</span>
      </div>
      <div class="dm-sheet-stats">
        <span>AC ${escapeHtml(sheet.ac ?? "-")}</span>
        <span>HP ${escapeHtml(sheet.hp ?? "-")} / ${escapeHtml(sheet.maxHp ?? "-")}</span>
        <span>PP ${escapeHtml(sheet.passivePerception ?? "-")}</span>
      </div>
      <p>${escapeHtml((sheet.conditions || []).join(", ") || "No conditions")}</p>
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
  if (targets.some(item => item.id === currentTarget)) target.value = currentTarget;
  catalog.innerHTML = ITEM_CATALOG.map(item => `<option value="${item.index}">${escapeHtml(item.name)} (${escapeHtml(item.type)})</option>`).join("");
  renderDmItemPreview();
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
  return {
    index: `custom-${slug(name)}`,
    name,
    type: document.querySelector("#customItemType").value.trim() || "Custom Item",
    weight: Number(document.querySelector("#customItemWeight").value || 0),
    quantity: clamp(Number(document.querySelector("#customItemQuantity").value || 1), 1, 999),
    rarity: document.querySelector("#customItemRarity").value.trim() || "Custom",
    container: document.querySelector("#customItemContainer").value || "carried",
    notes: document.querySelector("#customItemNotes").value.trim()
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
  renderDmItemPreview();
}

function sendLocalItem(sheetId, equipmentItem) {
  const target = characterLibrary[sheetId];
  if (!target) return;
  target.equipment = [...(target.equipment || []), equipmentItem];
  target.updatedAt = Date.now();
  characterLibrary[sheetId] = normalizeCharacter(target);
  if (character.sheetId === sheetId) character = normalizeCharacter(characterLibrary[sheetId]);
  saveCharacterLibrary();
  persistAndRender();
}

async function sendRemoteItem(sheet, equipmentItem) {
  if (!syncState.connected || syncSettings.role !== "dm") {
    sendLocalItem(sheet.sheetId, equipmentItem);
    return;
  }
  const fs = syncState.firestore;
  const nextCharacter = normalizeCharacter({
    ...(sheet.character || {}),
    equipment: [...(sheet.character?.equipment || []), equipmentItem]
  });
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
