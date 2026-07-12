let viewLayout = loadViewLayout();

function loadViewLayout() {
  try {
    const stored = JSON.parse(localStorage.getItem(VIEW_LAYOUT_KEY)) || {};
    return {
      active: validTab(stored.active, "actions"),
      split: Boolean(stored.split),
      left: validTab(stored.left, stored.active || "actions"),
      right: validTab(stored.right, "spells")
    };
  } catch {
    return { active: "actions", split: false, left: "actions", right: "spells" };
  }
}

function persistViewLayout() {
  localStorage.setItem(VIEW_LAYOUT_KEY, JSON.stringify(viewLayout));
}

function activateTab(tab) {
  if (viewLayout.split) {
    if (viewLayout.left === tab) {
      viewLayout.split = false;
      viewLayout.active = tab;
    } else if (viewLayout.right === tab) {
      viewLayout.left = viewLayout.right;
      viewLayout.right = viewLayout.active || "actions";
      if (viewLayout.left === viewLayout.right) viewLayout.right = nextDifferentTab(viewLayout.left);
      viewLayout.active = viewLayout.left;
    } else {
      viewLayout.left = tab;
      viewLayout.active = tab;
    }
  } else {
    viewLayout.active = tab;
  }
  persistViewLayout();
  renderViewLayout();
}

function renderViewLayout() {
  const activeTab = validTab(viewLayout.active, "actions");
  viewLayout.active = activeTab;
  viewLayout.left = validTab(viewLayout.left, activeTab);
  viewLayout.right = validTab(viewLayout.right, "spells");
  if (viewLayout.left === viewLayout.right) viewLayout.right = nextDifferentTab(viewLayout.left);

  document.body.classList.toggle("split-view", viewLayout.split);
  document.querySelector("#splitViewToggle").checked = viewLayout.split;
  setValue("splitLeftSelect", viewLayout.left);
  setValue("splitRightSelect", viewLayout.right);

  document.querySelectorAll(".tab").forEach(button => {
    const tab = button.dataset.tab;
    button.classList.toggle("active", !viewLayout.split && tab === activeTab);
    button.classList.toggle("split-active", viewLayout.split && tab === viewLayout.left);
    button.classList.toggle("split-secondary", viewLayout.split && tab === viewLayout.right);
  });

  document.querySelectorAll(".panel").forEach(panel => {
    const isSingleActive = !viewLayout.split && panel.id === activeTab;
    const isLeft = viewLayout.split && panel.id === viewLayout.left;
    const isRight = viewLayout.split && panel.id === viewLayout.right;
    panel.classList.toggle("active", isSingleActive);
    panel.classList.toggle("split-panel", isLeft || isRight);
    panel.classList.toggle("split-left", isLeft);
    panel.classList.toggle("split-right", isRight);
  });
}

function handleSplitToggle(event) {
  viewLayout.split = event.target.checked;
  if (viewLayout.split) {
    viewLayout.left = validTab(viewLayout.active, "actions");
    if (viewLayout.left === viewLayout.right) viewLayout.right = nextDifferentTab(viewLayout.left);
  } else {
    viewLayout.active = validTab(viewLayout.left, viewLayout.active || "actions");
  }
  persistViewLayout();
  renderViewLayout();
}

function handleSplitSelect(event) {
  const side = event.target.id === "splitLeftSelect" ? "left" : "right";
  viewLayout[side] = validTab(event.target.value, side === "left" ? "actions" : "spells");
  if (viewLayout.left === viewLayout.right) {
    const otherSide = side === "left" ? "right" : "left";
    viewLayout[otherSide] = nextDifferentTab(viewLayout[side]);
  }
  viewLayout.active = viewLayout.left;
  viewLayout.split = true;
  persistViewLayout();
  renderViewLayout();
}

function swapSplitPanels() {
  [viewLayout.left, viewLayout.right] = [viewLayout.right, viewLayout.left];
  viewLayout.active = viewLayout.left;
  viewLayout.split = true;
  persistViewLayout();
  renderViewLayout();
}

function validTab(tab, fallback) {
  return TAB_DEFS.some(([id]) => id === tab) ? tab : fallback;
}

function nextDifferentTab(tab) {
  return TAB_DEFS.find(([id]) => id !== tab)?.[0] || "actions";
}
