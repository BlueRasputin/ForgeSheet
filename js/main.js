document.addEventListener("DOMContentLoaded", init);

function trackTabBarHeight() {
  const tabs = document.querySelector(".sheet-main .tabs");
  const update = () => document.documentElement.style.setProperty("--tabs-height", `${Math.ceil(tabs.getBoundingClientRect().height)}px`);
  new ResizeObserver(update).observe(tabs);
  update();
}

function init() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "beyond";
  document.body.dataset.theme = THEMES.includes(savedTheme) ? savedTheme : systemTheme;
  applyCustomBackground();
  ensureCharacterInLibrary();
  buildStaticControls();
  bindEvents();
  trackTabBarHeight();
  renderAll();
  hydrateSubclasses();
  hydrateSpells();
  initAccount();
}

function buildStaticControls() {
  const casterOptions = [
    ["none", "None"],
    ["full", "Full caster"],
    ["halfRoundDown", "Half caster"],
    ["halfRoundUp", "Half caster, rounded up"],
    ["third", "Third caster"],
    ["warlock", "Pact magic"]
  ];
  fillSelect(document.querySelector("#builderCasterType"), casterOptions);
  fillSelect(document.querySelector("#builderSpellAbility"), ABILITIES);
  fillSelect(document.querySelector("#builderPreparedFormula"), [
    ["none", "None"],
    ["known", "Known spells"],
    ["levelPlusMod", "Level + ability modifier"],
    ["halfLevelPlusMod", "Half level + ability modifier"]
  ]);
  fillSelect(document.querySelector("#splitLeftSelect"), TAB_DEFS);
  fillSelect(document.querySelector("#splitRightSelect"), TAB_DEFS);
  fillSelect(document.querySelector("#backgroundPreset"), BACKGROUND_PRESETS.map(([name]) => [name, name]));

  const abilities = document.querySelector("#abilities");
  abilities.innerHTML = ABILITIES.map(([id, name]) => `
    <div class="ability-box">
      <span class="ability-name"><span class="ability-long">${name}</span><span class="ability-short">${id.toUpperCase()}</span></span>
      <button type="button" class="ability-mod" id="${id}Mod" data-roll-ability="${id}" title="Roll ${name} check">+0</button>
      <input data-ability="${id}" type="number" min="1" max="30" aria-label="${name} score">
      <label class="ability-save" title="${name} saving throw proficiency">
        <input data-save="${id}" type="checkbox" aria-label="${name} save proficiency">
        <span>Save</span>
        <button type="button" class="mod-chip" id="${id}Save" data-roll-save="${id}" title="Roll ${name} save">+0</button>
      </label>
    </div>
  `).join("");

  const skills = document.querySelector("#skills");
  skills.innerHTML = SKILLS.map(([id, name, ability]) => `
    <label class="skill-row">
      <input data-skill="${id}" type="checkbox">
      <span class="skill-name">${name} <em>${ability.toUpperCase()}</em></span>
      <button type="button" class="expertise-toggle" data-expert-skill="${id}" title="Toggle expertise (double proficiency)">${icon("star")}</button>
      <button type="button" class="mod-chip" id="${id}Skill" data-roll-skill="${id}" title="Roll ${name}">+0</button>
    </label>
  `).join("");

  if (matchMedia("(max-width: 640px)").matches) document.querySelectorAll("details.side-section").forEach(section => { section.open = false; });
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
  document.querySelector("#splitViewToggle").addEventListener("input", handleSplitToggle);
  document.querySelector("#splitLeftSelect").addEventListener("input", handleSplitSelect);
  document.querySelector("#splitRightSelect").addEventListener("input", handleSplitSelect);
  document.querySelector("#swapSplitPanels").addEventListener("click", swapSplitPanels);

  const watched = [
    "characterName", "classSelect", "subclassName", "levelInput", "speciesInput", "backgroundInput", "alignmentInput",
    "hpInput", "maxHpInput", "tempHpInput", "acInput", "speedInput", "hitDiceInput", "attacksInput",
    "featuresInput", "inventoryInput", "notesInput", "subclassMode", "officialSubclassSelect",
    "subclassType", "subclassTemplate", "showAllSpells", "exhaustionInput", "sheetSearch", "concentrationInput",
    "coinCp", "coinSp", "coinEp", "coinGp", "coinPp", "prepMode",
    "personalityTraitInput", "idealInput", "bondInput", "flawInput", "languagesInput", "toolsInput",
    "armorTrainingInput", "weaponTrainingInput"
  ];
  watched.forEach(id => document.querySelector(`#${id}`).addEventListener("input", handleInput));
  document.addEventListener("focusout", event => {
    if (event.target.matches?.('input[type="number"]')) renderAll();
  });

  // Commit on change so half-typed scores (backspace, then "20") don't briefly rescale class resources.
  document.querySelectorAll("[data-ability]").forEach(input => input.addEventListener("change", handleAbilityInput));
  document.querySelectorAll("[data-skill]").forEach(input => input.addEventListener("input", handleSkillInput));
  document.querySelectorAll("[data-save]").forEach(input => input.addEventListener("input", handleSaveInput));
  document.querySelector("#abilities").addEventListener("click", event => {
    const save = event.target.closest("[data-roll-save]");
    if (save) {
      event.preventDefault();
      rollSavingThrow(save.dataset.rollSave);
      return;
    }
    const button = event.target.closest("[data-roll-ability]");
    if (button) rollAbilityCheck(button.dataset.rollAbility);
  });
  document.querySelector("#skills").addEventListener("click", event => {
    const expertButton = event.target.closest("[data-expert-skill]");
    if (expertButton) {
      event.preventDefault();
      toggleExpertise(expertButton.dataset.expertSkill);
      return;
    }
    const button = event.target.closest("[data-roll-skill]");
    if (button) {
      event.preventDefault();
      rollSkillCheck(button.dataset.rollSkill);
    }
  });
  document.querySelector("#deathSaveTracker").addEventListener("click", handleDeathSaveClick);
  document.querySelector("#rollInitiative").addEventListener("click", rollInitiativeCheck);
  document.querySelector("#acHint").addEventListener("click", () => {
    character.acAuto = true;
    character.ac = calculatedArmorClass();
    persistAndRender();
  });
  document.querySelector("#inspirationAdd").addEventListener("click", gainInspiration);
  document.querySelector("#inspirationSpend").addEventListener("click", spendInspiration);
  document.querySelectorAll(".file-menu").forEach(menu => {
    menu.addEventListener("click", event => {
      if (event.target.closest(".file-menu-items button")) menu.open = false;
    });
    menu.addEventListener("toggle", () => {
      if (menu.open) document.querySelectorAll(".file-menu").forEach(other => { if (other !== menu) other.open = false; });
    });
  });
  document.addEventListener("click", event => {
    document.querySelectorAll(".file-menu[open]").forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
  });
  document.querySelector("#rulesButton").addEventListener("click", () => {
    document.querySelector("#rulesDialog").showModal();
    document.querySelector("#rulesSearch").focus();
  });
  document.querySelector("#closeRulesDialog").addEventListener("click", () => document.querySelector("#rulesDialog").close());
  document.querySelector("#closeClassBuilder").addEventListener("click", () => document.querySelector("#classBuilderDialog").close());
  document.querySelector("#classBuilderDialog").addEventListener("input", event => {
    if (event.target.closest(".field-grid") || event.target.id === "builderTable") handleBuilderInput();
  });
  document.querySelector("#editCustomClassSelect").addEventListener("change", event => {
    if (event.target.value) startCustomClassDraft(event.target.value);
  });
  document.querySelector("#editCurrentClass").addEventListener("click", () => startCustomClassDraft(character.classId));
  document.querySelector("#classBuilderDialog").addEventListener("close", () => {
    classBuilderDraft = null;
    renderAll();
  });
  document.querySelector("#identityLock").addEventListener("click", toggleIdentityLock);
  document.querySelector("#identityDisplay").addEventListener("dblclick", toggleIdentityLock);
  document.querySelector("#backgroundUpload").addEventListener("click", handleBackgroundButton);
  document.querySelector("#backgroundFile").addEventListener("change", handleBackgroundFile);
  document.querySelector("#applyDamageButton").addEventListener("click", () => applyDamage());
  document.querySelector("#applyHealButton").addEventListener("click", () => applyHeal());
  document.querySelector("#concentrationPrompt").addEventListener("click", handleConcentrationPromptClick);
  document.querySelector("#damageAmount").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyDamage();
    }
  });
  const conditionsTile = document.querySelector("#conditionsTile");
  conditionsTile.addEventListener("click", () => goToTarget("#conditionGrid"));
  conditionsTile.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToTarget("#conditionGrid");
    }
  });
  document.querySelector("#dyingPrompt").addEventListener("click", event => {
    if (event.target.closest("[data-dying-roll]")) rollDeathSave();
  });
  document.querySelector("#spellRows").addEventListener("click", event => {
    const button = event.target.closest("[data-add-spell-level]");
    if (button) {
      const level = Number(button.dataset.addSpellLevel);
      const id = crypto.randomUUID();
      character.spells.push({ id, index: "", level, prepared: level > 0 && preparedSpellCount() < preparedLimitFor(currentClass()) });
      persistAndRender();
      const select = document.querySelector(`[data-spell-id="${id}"] .spell-select`);
      select?.scrollIntoView({ block: "center" });
      select?.focus();
      return;
    }
    handleSpellCastClick(event);
  });
  document.querySelector("#spellRows").addEventListener("change", event => {
    if (!event.target.classList.contains("cast-level-select")) return;
    const row = spellRowForElement(event.target);
    if (!row) return;
    row.castLevel = Number(event.target.value);
    persistAndRender();
  });
  document.querySelector("#slotGrid").addEventListener("click", handleSlotUsageClick);
  document.querySelector("#combatSpells").addEventListener("click", handleSpellCastClick);
  document.querySelector("#partyDashboard").addEventListener("click", event => {
    const card = event.target.closest("[data-party-sheet]");
    if (!card || card.dataset.partySheet === character.sheetId) return;
    switchToSheet(card.dataset.partySheet);
  });
  document.querySelector("#partySort").addEventListener("click", event => {
    const button = event.target.closest("[data-party-sort]");
    if (!button) return;
    partySort = button.dataset.partySort;
    renderPartyDashboard();
  });
  document.querySelector("#prepSuggestions").addEventListener("click", event => {
    const button = event.target.closest("[data-prep-add]");
    if (button) addSuggestedSpell(button.dataset.prepAdd);
  });
  document.querySelector("#saveCharacter").addEventListener("click", persistAndRender);
  document.querySelector("#resetCharacter").addEventListener("click", resetCharacter);
  document.querySelector("#newCharacterButton").addEventListener("click", openCreateDialog);
  document.querySelector("#createBack").addEventListener("click", createStepBack);
  document.querySelector("#levelInput").addEventListener("change", event => applyLevelChange(event.target.value));
  document.querySelector("#createNext").addEventListener("click", createStepNext);
  document.querySelector("#createStepBody").addEventListener("input", handleCreateFieldInput);
  document.querySelector("#createStepBody").addEventListener("change", handleCreateFieldChange);
  document.querySelector("#createDialog").addEventListener("click", handleCreateStepClick);
  document.querySelector("#createDialog").addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;
    event.preventDefault();
    if (event.target.dataset.createField === "name") createStepNext();
    else event.target.blur();
  });
  document.querySelector("#duplicateCharacterButton").addEventListener("click", duplicateCharacter);
  document.querySelector("#deleteCharacterButton").addEventListener("click", deleteCharacter);
  document.querySelector("#characterLibrarySelect").addEventListener("change", switchCharacter);
  document.querySelector("#exportJsonButton").addEventListener("click", exportCharacterJson);
  document.querySelector("#printSheetButton").addEventListener("click", () => window.print());
  window.addEventListener("beforeprint", preparePrintLayout);
  window.addEventListener("afterprint", resetPrintLayout);
  document.querySelector("#importJsonButton").addEventListener("click", () => document.querySelector("#jsonImportInput").click());
  document.querySelector("#jsonImportInput").addEventListener("change", importCharacterJson);
  document.querySelector("#themeSelect").addEventListener("input", handleThemeSelect);
  document.querySelector("#builderWizard").addEventListener("click", handleBuilderWizardClick);
  document.querySelector("#applyBackgroundPreset").addEventListener("click", applyBackgroundPreset);
  document.querySelector("#generatePersonalityButton").addEventListener("click", generatePersonality);
  document.querySelector("#applyFeatureAutomation").addEventListener("click", applyFeatureAutomation);
  document.querySelector("#multiclassSelect").addEventListener("input", renderPlanner);
  document.querySelector("#addMulticlassPlan").addEventListener("click", addMulticlassPlan);
  document.querySelector("#addFeatPlan").addEventListener("click", addFeatPlan);
  document.querySelector("#plannerSummary").addEventListener("click", handlePlannerClick);
  document.querySelector("#importSheetButton").addEventListener("click", openImportDialog);
  document.querySelector("#sheetImportPdf").addEventListener("change", handlePdfImport);
  document.querySelector("#parseSheetImport").addEventListener("click", parseImportDialogText);
  document.querySelector("#applySheetImport").addEventListener("click", applyPendingImport);
  document.querySelector("#levelUpButton").addEventListener("click", openLevelDialog);
  document.querySelector("#levelSubclass").addEventListener("change", event => {
    if (event.target.id !== "levelSubclassSelect") return;
    pendingLevelSubclass = event.target.value;
    renderLevelSummaryAndChoices();
  });
  document.querySelector("#checklistButton").addEventListener("click", () => document.querySelector("#checklistDialog").showModal());
  document.querySelector("#checklistBody").addEventListener("click", event => {
    const button = event.target.closest("[data-checklist-tab]");
    if (!button) return;
    document.querySelector("#checklistDialog").close();
    goToTarget(button.dataset.checklistTab);
  });
  document.querySelector("#confirmLevelUp").addEventListener("click", applyLevelUp);
  document.querySelector("#newCustomClass").addEventListener("click", startCustomClassDraft);
  document.querySelector("#saveClass").addEventListener("click", saveCustomClass);
  document.querySelector("#shortRestButton").addEventListener("click", () => takeRest("short"));
  document.querySelector("#longRestButton").addEventListener("click", () => takeRest("long"));
  document.querySelector("#spendHitDieButton").addEventListener("click", spendHitDie);
  document.querySelector("#restPreview").addEventListener("click", event => {
    if (event.target.closest("[data-undo-rest]")) undoLastRest();
  });
  document.querySelector("#rollDiceButton").addEventListener("click", () => rollFromInput());
  document.querySelector("#rollHistory").addEventListener("click", handleRollHistoryClick);
  document.querySelector("#addResourceButton").addEventListener("click", addResource);
  document.querySelector("#resourceRows").addEventListener("input", handleResourceInput);
  document.querySelector("#resourceRows").addEventListener("click", handleResourceClick);
  document.querySelector("#addEquipmentButton").addEventListener("click", addEquipment);
  document.querySelector("#addCatalogEquipment").addEventListener("click", addCatalogEquipment);
  document.querySelector("#equipmentRows").addEventListener("input", handleEquipmentInput);
  document.querySelector("#equipmentRows").addEventListener("click", handleEquipmentClick);
  document.querySelector("#addClassOptionButton").addEventListener("click", () => addClassOption());
  document.querySelector("#classOptionPreset").addEventListener("input", handleClassOptionPreset);
  document.querySelector("#classOptionRows").addEventListener("input", handleClassOptionInput);
  document.querySelector("#classOptionRows").addEventListener("click", handleClassOptionClick);
  document.querySelector("#conditionGrid").addEventListener("click", handleConditionClick);
  document.querySelector("#addActionButton").addEventListener("click", addAction);
  document.querySelector("#generateActionsButton").addEventListener("click", generateActions);
  document.querySelector("#actionRows").addEventListener("input", handleActionInput);
  document.querySelector("#actionRows").addEventListener("click", handleActionClick);
  document.querySelector("#clearConcentrationButton").addEventListener("click", clearConcentration);
  document.querySelector("#connectSync").addEventListener("click", connectCampaignSync);
  document.querySelector("#disconnectSync").addEventListener("click", disconnectCampaignSync);
  document.querySelector("#googleSignIn").addEventListener("click", signInWithGoogle);
  document.querySelector("#googleSignOut").addEventListener("click", signOutOfAccount);
  document.querySelector("#generateCode").addEventListener("click", generateSessionCode);
  document.querySelector("#shareClassButton").addEventListener("click", shareCustomClass);
  document.querySelector("#importClassButton").addEventListener("click", importSharedClass);
  document.querySelector("#actionFilter").addEventListener("click", handleActionFilterClick);
  document.querySelector("#copyPlayerLink").addEventListener("click", () => copySyncLink("player"));
  document.querySelector("#copyDmLink").addEventListener("click", () => copySyncLink("dm"));
  document.querySelector("#sendCatalogItem").addEventListener("click", () => sendDmItem("catalog"));
  document.querySelector("#sendCustomItem").addEventListener("click", () => sendDmItem("custom"));
  document.querySelector("#dmItemCatalog").addEventListener("input", renderDmItemPreview);
  document.querySelector("#dmItemTarget").addEventListener("input", renderDmItemPreview);
  ["customItemName", "customItemType", "customItemWeight", "customItemQuantity", "customItemRarity", "customItemContainer", "customItemNotes"].forEach(id => {
    document.querySelector(`#${id}`).addEventListener("input", renderDmItemPreview);
  });
  ["syncRole", "syncCampaignId", "syncPlayerName", "syncSheetId", "syncFirebaseConfig"].forEach(id => {
    document.querySelector(`#${id}`).addEventListener("input", handleSyncSettingsInput);
  });
  ["rulesSearch", "rulesCategory"].forEach(id => {
    document.querySelector(`#${id}`).addEventListener("input", renderRulesReference);
  });
  document.querySelector("#addSubclassSection").addEventListener("click", () => addNoteSection("subclass"));
  document.querySelector("#addGeneralNoteSection").addEventListener("click", () => addNoteSection("general"));
  document.querySelector("#subclassSections").addEventListener("input", event => handleNoteSectionInput(event, "subclass"));
  document.querySelector("#subclassSections").addEventListener("click", event => handleNoteSectionClick(event, "subclass"));
  document.querySelector("#generalNoteSections").addEventListener("input", event => handleNoteSectionInput(event, "general"));
  document.querySelector("#generalNoteSections").addEventListener("click", event => handleNoteSectionClick(event, "general"));
}

function renderAll() {
  renderViewLayout();
  renderCharacterManager();
  renderHeader();
  renderSheet();
  renderDynamicNoteSections("subclass");
  renderDynamicNoteSections("general");
  renderBuilderTools();
  renderPlayTools();
  renderSpells();
  renderBuilder();
  renderClassTable();
  renderPartyDashboard();
  renderSearchResults();
  renderSyncPanel();
  renderDmItemTools();
  renderRulesReference();
  renderChecklist();
}
