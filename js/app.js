/* =========================================================
   STELLAR DRAW · application
   ========================================================= */
(function (NS) {
  "use strict";

  const core = NS.core;
  const $ = function (selector) { return document.querySelector(selector); };
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const el = {
    body: document.body,
    eventEditButton: $("#eventEditButton"),
    eventTagline: $("#eventTagline"),
    eventTitle: $("#eventTitle"),
    dateMain: $("#dateMain"),
    dateYear: $("#dateYear"),
    musicQuickBtn: $("#musicQuickBtn"),
    historyQuickBtn: $("#historyQuickBtn"),
    historyCountBadge: $("#historyCountBadge"),
    fullscreenBtn: $("#fullscreenBtn"),
    openConsoleBtn: $("#openConsoleBtn"),
    edgePoolCount: $("#edgePoolCount"),
    edgeSession: $("#edgeSession"),
    roundStateCn: $("#roundStateCn"),
    roundStateEn: $("#roundStateEn"),
    prizeNowBtn: $("#prizeNowBtn"),
    currentPrizeName: $("#currentPrizeName"),
    currentPrizeNote: $("#currentPrizeNote"),
    currentPrizeStock: $("#currentPrizeStock"),
    roundIndex: $("#roundIndex"),
    orbitalZone: $("#orbitalZone"),
    orbitPeople: $("#orbitPeople"),
    orbWrap: $("#orbWrap"),
    orb: $("#orb"),
    orbKicker: $("#orbKicker"),
    orbSequence: $("#orbSequence"),
    displayName: $("#displayName"),
    nameGhost: $("#nameGhost"),
    displayMeta: $("#displayMeta"),
    orbPoolLabel: $("#orbPoolLabel"),
    orbStateLabel: $("#orbStateLabel"),
    winnerMark: $("#winnerMark"),
    winnerMarkNo: $("#winnerMarkNo"),
    openPeopleBtn: $("#openPeopleBtn"),
    peopleToolCount: $("#peopleToolCount"),
    drawButton: $("#drawButton"),
    drawLabel: $("#drawLabel"),
    drawMeta: $("#drawMeta"),
    drawCaptionText: $("#drawCaptionText"),
    drawCaptionCount: $("#drawCaptionCount"),
    undoDrawBtn: $("#undoDrawBtn"),
    openPrizesBtn: $("#openPrizesBtn"),
    prizeToolCount: $("#prizeToolCount"),
    prizeTray: $("#prizeTray"),
    managePrizesBtn: $("#managePrizesBtn"),
    footerStatus: $("#footerStatus"),
    cursorLight: $("#cursorLight"),
    starCanvas: $("#starCanvas"),
    confettiCanvas: $("#confettiCanvas"),
    drawerLayer: $("#drawerLayer"),
    drawerBackdrop: $("#drawerBackdrop"),
    consoleDrawer: $("#consoleDrawer"),
    drawerSession: $("#drawerSession"),
    closeConsoleBtn: $("#closeConsoleBtn"),
    drawerTabs: document.querySelectorAll(".drawer-tab"),
    tabPeopleCount: $("#tabPeopleCount"),
    tabPrizeCount: $("#tabPrizeCount"),
    tabHistoryCount: $("#tabHistoryCount"),
    drawerBody: $("#drawerBody"),
    peopleMetricCount: $("#peopleMetricCount"),
    peopleMetricWon: $("#peopleMetricWon"),
    addPeopleForm: $("#addPeopleForm"),
    peopleInput: $("#peopleInput"),
    peopleSearch: $("#peopleSearch"),
    clearPeopleBtn: $("#clearPeopleBtn"),
    peopleList: $("#peopleList"),
    peopleEmpty: $("#peopleEmpty"),
    removeWinnersToggle: $("#removeWinnersToggle"),
    prizeMetricRemaining: $("#prizeMetricRemaining"),
    prizeMetricAwarded: $("#prizeMetricAwarded"),
    prizeForm: $("#prizeForm"),
    prizeEditId: $("#prizeEditId"),
    prizeFormTitle: $("#prizeFormTitle"),
    cancelPrizeEdit: $("#cancelPrizeEdit"),
    prizeNameInput: $("#prizeNameInput"),
    prizeQtyInput: $("#prizeQtyInput"),
    prizeNoteInput: $("#prizeNoteInput"),
    prizeAccentChoices: $("#prizeAccentChoices"),
    prizeSubmitBtn: $("#prizeSubmitBtn"),
    prizeManageList: $("#prizeManageList"),
    prizeEmpty: $("#prizeEmpty"),
    synthSourceBtn: $("#synthSourceBtn"),
    fileSourceBtn: $("#fileSourceBtn"),
    trackCountLabel: $("#trackCountLabel"),
    playerOrb: $("#playerOrb"),
    playerKicker: $("#playerKicker"),
    playerTitle: $("#playerTitle"),
    playerSubtitle: $("#playerSubtitle"),
    musicPlayBtn: $("#musicPlayBtn"),
    volumeSlider: $("#volumeSlider"),
    volumeValue: $("#volumeValue"),
    musicDropzone: $("#musicDropzone"),
    musicFileInput: $("#musicFileInput"),
    musicTrackList: $("#musicTrackList"),
    musicEmpty: $("#musicEmpty"),
    historyMetricCount: $("#historyMetricCount"),
    historyList: $("#historyList"),
    historyEmpty: $("#historyEmpty"),
    undoLatestBtn: $("#undoLatestBtn"),
    clearHistoryBtn: $("#clearHistoryBtn"),
    settingsForm: $("#settingsForm"),
    eventTitleInput: $("#eventTitleInput"),
    eventTaglineInput: $("#eventTaglineInput"),
    themeChoices: document.querySelectorAll(".theme-choice"),
    sfxToggle: $("#sfxToggle"),
    particlesToggle: $("#particlesToggle"),
    exportBtn: $("#exportBtn"),
    importBtn: $("#importBtn"),
    importInput: $("#importInput"),
    resetBtn: $("#resetBtn"),
    confirmLayer: $("#confirmLayer"),
    confirmBackdrop: $("#confirmBackdrop"),
    confirmCard: $(".confirm-card"),
    confirmTitle: $("#confirmTitle"),
    confirmMessage: $("#confirmMessage"),
    confirmCancelBtn: $("#confirmCancelBtn"),
    confirmOkBtn: $("#confirmOkBtn"),
    toastRegion: $("#toastRegion"),
    liveRegion: $("#liveRegion"),
    bgAudio: $("#bgAudio"),
    historyPanels: document.querySelectorAll(".tab-panel")
  };

  let state = core.loadState();
  const mediaStore = new core.MediaStore();
  const audioEngine = new NS.AudioEngine(el.bgAudio);
  const starfield = new NS.Starfield(el.starCanvas);
  const confetti = new NS.Confetti(el.confettiCanvas);
  const trackUrls = new Map();

  const view = {
    stage: "idle",
    drawing: false,
    round: null,
    winnerRecord: null,
    tab: "people",
    search: "",
    editingPrizeId: null,
    prizeAccent: core.PRIZE_ACCENTS[0],
    orbitSignature: "",
    orbitChips: [],
    orbitAngle: Math.random() * Math.PI * 2,
    orbitBounds: { width: 0, height: 0, radius: 0 },
    lastFocus: null,
    confirmResolver: null,
    confirmOpen: false,
    toastTimerIds: new Set(),
    lastOrbitTime: 0,
    hasStartedOrbit: false,
    soundNoticeShown: false
  };

  let drawFrame = 0;
  let drawStartTime = 0;
  let drawLastTick = 0;
  let drawTickCount = 0;

  /* ---------- derived state ---------- */

  function getActivePrize() {
    if (!state.prizes.length) return null;
    const active = state.prizes.find(function (prize) { return prize.id === state.activePrizeId; }) || null;
    const available = state.prizes.find(function (prize) { return prize.remaining > 0; }) || null;
    if (active && active.remaining > 0) return active;
    return available || active || state.prizes[0];
  }

  function getPrizeById(id) {
    return state.prizes.find(function (prize) { return prize.id === id; }) || null;
  }

  function getNextAvailablePrize() {
    const active = getActivePrize();
    if (active && active.remaining > 0) return active;
    return state.prizes.find(function (prize) { return prize.remaining > 0; }) || null;
  }

  function getTotalRemaining() {
    return state.prizes.reduce(function (sum, prize) { return sum + Math.max(0, prize.remaining); }, 0);
  }

  function getDisplayPrize() {
    if (view.stage === "winner" && view.winnerRecord) {
      return getPrizeById(view.winnerRecord.prizeId) || {
        id: view.winnerRecord.prizeId,
        name: view.winnerRecord.prizeName,
        note: view.winnerRecord.prizeNote,
        accent: view.winnerRecord.prizeAccent,
        remaining: 0,
        total: 0
      };
    }
    return getActivePrize();
  }

  function getDisplayPrizeId() {
    if (view.stage === "winner" && view.winnerRecord) return view.winnerRecord.prizeId;
    const prize = getActivePrize();
    return prize ? prize.id : null;
  }

  function getRoundForDisplay() {
    if (view.stage === "winner" && view.winnerRecord) return view.winnerRecord.round;
    if (view.drawing && view.round) return view.round;
    return state.history.length + 1;
  }

  function roundLabel(value) {
    return core.pad(value, value >= 100 ? 3 : 2);
  }

  function getVisualLength(text) {
    return Array.from(text || "").reduce(function (total, character) {
      return total + (character.charCodeAt(0) > 255 ? 1 : 0.58);
    }, 0);
  }

  function setDisplayName(text) {
    const name = text || "静候启封";
    el.displayName.textContent = name;
    el.displayName.classList.remove("is-medium", "is-long", "is-xlong");
    const length = getVisualLength(name);
    if (length > 8.5) {
      el.displayName.classList.add("is-xlong");
    } else if (length > 6.2) {
      el.displayName.classList.add("is-long");
    } else if (length > 4.4) {
      el.displayName.classList.add("is-medium");
    }
  }

  function participantCountLabel() {
    return state.participants.length + " 位候选人";
  }

  function getStageAvailability() {
    if (!state.participants.length) {
      return { ok: false, reason: "participants", label: "等待入场", meta: "ADD PARTICIPANTS" };
    }
    if (!state.prizes.length) {
      return { ok: false, reason: "prizes", label: "设置奖品", meta: "SET THE PRIZE" };
    }
    if (getTotalRemaining() <= 0) {
      return { ok: false, reason: "prizes", label: "奖池已空", meta: "REFILL THE VAULT" };
    }
    return { ok: true, reason: null, label: "启封命运", meta: "PRESS SPACE" };
  }

  /* ---------- persistence ---------- */

  let storageWarningShown = false;

  function persist() {
    const saved = core.saveState(state);
    if (!saved && !storageWarningShown) {
      storageWarningShown = true;
      showToast("浏览器拒绝了本地保存，本轮改动可能不会保留。", { type: "warning", duration: 5000 });
    }
    return saved;
  }

  function setFooterStatus(text) {
    if (!el.footerStatus) return;
    el.footerStatus.textContent = text;
  }

  /* ---------- theme & chrome ---------- */

  function applyTheme(theme) {
    const nextTheme = core.THEMES.indexOf(theme) > -1 ? theme : "aurora";
    el.body.dataset.theme = nextTheme;
    el.themeChoices.forEach(function (button) {
      const active = button.dataset.theme === nextTheme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#050806");
  }

  function setChromeDate() {
    const parts = core.getDateParts();
    el.dateMain.textContent = parts.dateMain;
    el.dateYear.textContent = parts.dateYear;
    el.edgeSession.textContent = parts.session;
    el.drawerSession.textContent = "SESSION " + parts.session;
  }

  function renderChrome() {
    el.eventTitle.textContent = state.event.title;
    el.eventTagline.textContent = state.event.tagline;
    el.edgePoolCount.textContent = state.participants.length;
    el.peopleToolCount.textContent = state.participants.length;
    el.prizeToolCount.textContent = getTotalRemaining();
    el.historyCountBadge.textContent = state.history.length;
    el.tabPeopleCount.textContent = state.participants.length;
    el.tabPrizeCount.textContent = state.prizes.length;
    el.tabHistoryCount.textContent = state.history.length;
    el.peopleMetricCount.textContent = state.participants.length;
    el.peopleMetricWon.textContent = state.history.length;
    el.prizeMetricRemaining.textContent = getTotalRemaining();
    el.prizeMetricAwarded.textContent = state.prizes.reduce(function (total, prize) {
      return total + Math.max(0, prize.total - prize.remaining);
    }, 0);
    el.historyMetricCount.textContent = state.history.length;
    el.drawCaptionCount.textContent = state.participants.length;
  }

  function renderPrizeInfo() {
    const prize = getDisplayPrize();
    const round = getRoundForDisplay();
    el.roundIndex.textContent = roundLabel(round);
    el.orbSequence.textContent = "SEQ. " + roundLabel(round);

    if (!prize) {
      el.currentPrizeName.textContent = "尚未设置奖项";
      el.currentPrizeNote.textContent = "先为这一轮准备一份礼物";
      el.currentPrizeStock.textContent = "余 0";
      return;
    }

    el.currentPrizeName.textContent = prize.name;
    el.currentPrizeNote.textContent = prize.note || "星轨为这一份礼物亮起";
    const remaining = Math.max(0, Number(prize.remaining) || 0);
    el.currentPrizeStock.textContent = view.stage === "winner"
      ? (remaining > 0 ? "还余 " + remaining : "已送出")
      : "余 " + remaining;
  }

  function stageStateClass() {
    el.body.classList.toggle("is-drawing", view.stage === "drawing");
    el.body.classList.toggle("is-winner", view.stage === "winner");
  }

  function renderStage() {
    if (view.stage === "drawing") {
      stageStateClass();
      return;
    }

    const winner = view.stage === "winner" ? view.winnerRecord : null;
    stageStateClass();

    if (winner) {
      el.orb.dataset.state = "winner";
      el.orbKicker.textContent = "LUCKY WINNER · 恭喜";
      setDisplayName(winner.participant.name);
      const prizeLine = winner.prizeName + (winner.prizeNote ? " · " + winner.prizeNote : "");
      el.displayMeta.textContent = prizeLine;
      el.orbPoolLabel.textContent = state.participants.length
        ? state.participants.length + " 位候选仍在等待"
        : "本轮候选已全部离场";
      el.orbStateLabel.textContent = "SELECTED";
      el.nameGhost.textContent = roundLabel(winner.round);
      el.winnerMark.hidden = false;
      el.winnerMarkNo.textContent = roundLabel(winner.round);
      return;
    }

    el.orb.dataset.state = view.stage === "idle" ? "idle" : "idle";
    el.orbKicker.textContent = "DESTINY AWAITS";
    setDisplayName("静候启封");
    el.orbPoolLabel.textContent = participantCountLabel();
    el.winnerMark.hidden = true;
    el.nameGhost.textContent = roundLabel(getRoundForDisplay());

    const active = getNextAvailablePrize();
    if (!state.participants.length) {
      el.displayMeta.textContent = "名册还是空的，先请几位名字入场";
      el.orbStateLabel.textContent = "WAITING";
    } else if (!active) {
      el.displayMeta.textContent = "奖池已经见底，再添一份期待";
      el.orbStateLabel.textContent = "EMPTY";
    } else {
      el.displayMeta.textContent = "星轨已校准，等待你的第一声号令";
      el.orbStateLabel.textContent = "READY";
    }
  }

  function renderDrawControls() {
    const availability = getStageAvailability();
    const isWinner = view.stage === "winner";
    const prize = getNextAvailablePrize();
    let label = availability.label;
    let meta = availability.meta;

    if (view.stage === "winner" && !availability.ok) {
      label = "奖池已空";
      meta = "REFILL THE VAULT";
    } else if (isWinner) {
      label = "继续抽取";
      meta = "PRESS SPACE";
    }

    el.drawButton.disabled = view.drawing;
    el.drawButton.classList.toggle("is-busy", view.drawing);
    el.drawButton.classList.toggle("is-unavailable", !availability.ok && !view.drawing);
    el.undoDrawBtn.hidden = !isWinner || !state.history.length || view.drawing;
    el.drawCaptionCount.textContent = state.participants.length;
    el.roundStateCn.textContent = view.drawing ? "命运流转中" : (isWinner ? "幸运已揭晓" : (availability.ok ? "等待启封" : (availability.reason === "participants" ? "等待入场" : "等待补给")));
    el.roundStateEn.textContent = view.drawing ? "THE ORBIT IS MOVING" : (isWinner ? "FORTUNE REVEALED" : (availability.ok ? "STANDING BY" : "ADD TO BEGIN"));

    if (view.drawing) {
      el.drawLabel.textContent = "命运流转中";
      el.drawMeta.textContent = "SCANNING THE STARS";
      el.drawCaptionText.textContent = "正在扫描星轨，请稍候…";
      el.drawCaptionCount.textContent = state.participants.length;
      setFooterStatus("LOCAL SESSION · 命运正在流转");
      return;
    }

    el.drawLabel.textContent = label;
    el.drawMeta.textContent = meta;

    if (isWinner) {
      el.drawCaptionText.textContent = state.participants.length
        ? "本轮结果已加入记录"
        : "本轮结果已记录，候选池已经清空";
    } else if (!availability.ok) {
      if (availability.reason === "participants") {
        el.drawCaptionText.textContent = "添加候选人后即可开始";
      } else if (!state.prizes.length) {
        el.drawCaptionText.textContent = "先为这一轮设置一份奖品";
      } else {
        el.drawCaptionText.textContent = "所有奖品都已送出，补充后继续";
      }
    } else {
      el.drawCaptionText.innerHTML = "";
      el.drawCaptionText.append(document.createTextNode("从 "));
      const bold = document.createElement("b");
      bold.textContent = state.participants.length;
      el.drawCaptionText.append(bold, document.createTextNode(" 位候选人中随机抽选"));
    }

    if (prize && !isWinner) {
      setFooterStatus("LOCAL SESSION · " + prize.name + " · 数据自动保存");
    } else if (!isWinner) {
      setFooterStatus("LOCAL SESSION · 数据自动保存");
    }
    if (isWinner) {
      setFooterStatus("LOCAL SESSION · 幸运已记录 · 数据自动保存");
    }
  }

  function appendTextElement(parent, tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function renderPrizeTray() {
    el.prizeTray.innerHTML = "";
    if (!state.prizes.length) {
      const empty = document.createElement("div");
      empty.className = "prize-tray-empty";
      empty.append(document.createTextNode("奖池还未布置。"));
      const action = document.createElement("button");
      action.type = "button";
      action.textContent = "去添加一份礼物";
      action.addEventListener("click", function () { openConsole("prizes", { focusPrizeForm: true }); });
      empty.appendChild(action);
      el.prizeTray.appendChild(empty);
      window.requestAnimationFrame(updatePrizeTrayFade);
      return;
    }

    const displayPrizeId = getDisplayPrizeId();
    state.prizes.forEach(function (prize, index) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "prize-chip";
      chip.setAttribute("role", "option");
      chip.setAttribute("aria-selected", prize.id === displayPrizeId ? "true" : "false");
      chip.dataset.id = prize.id;
      chip.style.setProperty("--prize-accent", prize.accent);
      chip.classList.toggle("is-active", prize.id === displayPrizeId);
      chip.classList.toggle("is-exhausted", prize.remaining <= 0);
      chip.title = prize.remaining > 0
        ? prize.name + " · 剩余 " + prize.remaining + " 份"
        : prize.name + " · 已抽完";

      appendTextElement(chip, "span", "prize-chip__index", roundLabel(index + 1));
      appendTextElement(chip, "span", "prize-chip__dot", "");
      const copy = appendTextElement(chip, "span", "prize-chip__copy", "");
      appendTextElement(copy, "span", "prize-chip__name", prize.name);
      appendTextElement(copy, "span", "prize-chip__stock", prize.remaining > 0 ? "余 " + prize.remaining + " / " + prize.total : "已抽完");
      chip.addEventListener("click", function () {
        selectPrize(prize.id);
      });
      el.prizeTray.appendChild(chip);
    });
    window.requestAnimationFrame(updatePrizeTrayFade);
  }

  function updatePrizeTrayFade() {
    const tray = el.prizeTray;
    const overflow = tray.scrollWidth - tray.clientWidth;
    const canScroll = overflow > 2;
    tray.classList.toggle("has-left-fade", canScroll && tray.scrollLeft > 2);
    tray.classList.toggle("has-right-fade", canScroll && tray.scrollLeft < overflow - 2);
  }

  function selectPrize(id) {
    if (view.drawing) {
      showToast("星轨正在流转，请等待这一轮揭晓。");
      return;
    }
    const prize = getPrizeById(id);
    if (!prize) return;
    if (prize.remaining <= 0) {
      showToast("「" + prize.name + "」已经抽完，换一份礼物吧。", { type: "warning" });
      return;
    }
    if (state.activePrizeId === id && view.stage === "idle") return;
    state.activePrizeId = id;
    view.stage = "idle";
    view.winnerRecord = null;
    view.round = null;
    persist();
    renderAll();
    showToast("下一轮奖品： " + prize.name, { type: "success", duration: 2200 });
  }

  /* ---------- orbit labels ---------- */

  function rebuildOrbitPeople() {
    const maxLabels = window.innerWidth <= 700 ? 0 : (window.innerWidth <= 1024 ? 12 : 16);
    const signature = state.participants.map(function (person) { return person.id + ":" + person.name; }).join("|") + "@" + maxLabels;
    if (signature === view.orbitSignature) return;
    view.orbitSignature = signature;
    el.orbitPeople.innerHTML = "";
    view.orbitChips = [];

    if (!maxLabels || state.participants.length < 2) {
      return;
    }

    const count = Math.min(maxLabels, state.participants.length);
    const used = new Set();
    for (let index = 0; index < count; index += 1) {
      let personIndex = Math.floor((index * state.participants.length) / count);
      while (used.has(personIndex)) personIndex = (personIndex + 1) % state.participants.length;
      used.add(personIndex);
      const person = state.participants[personIndex];
      const chip = document.createElement("span");
      chip.className = "orbit-person" + (index % 5 === 0 ? " orbit-person--featured" : "");
      const dot = document.createElement("span");
      dot.className = "orbit-person__dot";
      const name = document.createElement("span");
      name.className = "orbit-person__name";
      name.textContent = person.name;
      name.title = person.name;
      chip.append(dot, name);
      el.orbitPeople.appendChild(chip);
      view.orbitChips.push({ element: chip, index: index, count: count, offset: Math.random() * 0.3 });
    }
    layoutOrbitPeople();
  }

  function updateOrbitMetrics() {
    const rect = el.orbitalZone.getBoundingClientRect();
    view.orbitBounds.width = rect.width;
    view.orbitBounds.height = rect.height;
    view.orbitBounds.radius = el.orb.offsetWidth / 2;
    layoutOrbitPeople();
  }

  function layoutOrbitPeople() {
    const width = view.orbitBounds.width || el.orbitalZone.clientWidth;
    const height = view.orbitBounds.height || el.orbitalZone.clientHeight;
    const radius = view.orbitBounds.radius || el.orb.offsetWidth / 2;
    if (!width || !height || !radius) return;
    const rx = Math.max(radius * 1.08, Math.min(width / 2 - 54, radius * 1.72));
    const ry = Math.max(radius * 0.76, Math.min(height / 2 - 24, radius * 1.08));
    view.orbitChips.forEach(function (chip) {
      const angle = view.orbitAngle + (chip.index / chip.count) * Math.PI * 2 + chip.offset;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = 0.72 + depth * 0.34;
      const opacity = 0.24 + depth * 0.7;
      chip.element.style.transform = "translate(-50%, -50%) translate(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px) scale(" + scale.toFixed(3) + ")";
      chip.element.style.opacity = opacity.toFixed(3);
    });
  }

  function animateOrbit(time) {
    requestAnimationFrame(animateOrbit);
    if (reducedMotionQuery.matches) return;
    if (!view.lastOrbitTime) view.lastOrbitTime = time;
    const delta = Math.min(48, time - view.lastOrbitTime);
    view.lastOrbitTime = time;
    if (!view.orbitChips.length) return;
    const speed = view.stage === "drawing" ? 0.00105 : 0.000058;
    view.orbitAngle += delta * speed;
    if (view.orbitAngle > Math.PI * 200) view.orbitAngle -= Math.PI * 200;
    layoutOrbitPeople();
  }

  function createIcon(symbol, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", className || "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#icon-" + symbol);
    svg.appendChild(use);
    return svg;
  }

  /* ---------- people panel ---------- */

  function renderPeopleList() {
    const query = view.search.trim().toLocaleLowerCase();
    el.peopleList.innerHTML = "";
    el.peopleEmpty.hidden = state.participants.length > 0;

    if (!state.participants.length) {
      el.peopleList.hidden = true;
      return;
    }
    el.peopleList.hidden = false;

    const records = state.participants.map(function (person, index) {
      return { person: person, index: index };
    }).filter(function (record) {
      return !query || record.person.name.toLocaleLowerCase().includes(query);
    });

    if (!records.length) {
      appendTextElement(el.peopleList, "div", "people-list-more", "没有找到这个名字，换一个关键词试试。");
      return;
    }

    const maxRows = 200;
    records.slice(0, maxRows).forEach(function (record) {
      const row = document.createElement("div");
      row.className = "person-row";

      appendTextElement(row, "span", "person-index", core.pad(record.index + 1, 2));
      const avatar = appendTextElement(row, "span", "person-avatar", "");
      avatar.textContent = Array.from(record.person.name)[0] || "?";
      const name = appendTextElement(row, "span", "person-name", record.person.name);
      name.title = record.person.name;
      appendTextElement(row, "span", "person-order", "IN POOL");

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "person-remove";
      remove.setAttribute("aria-label", "从名册中移除 " + record.person.name);
      remove.title = "移出候选池";
      remove.appendChild(createIcon("trash"));
      remove.addEventListener("click", function () {
        removeParticipant(record.person.id);
      });
      row.appendChild(remove);
      el.peopleList.appendChild(row);
    });

    if (records.length > maxRows) {
      appendTextElement(el.peopleList, "div", "people-list-more", "还有 " + (records.length - maxRows) + " 位未显示，请使用搜索定位。");
    }
  }

  function renderPeoplePanel() {
    renderPeopleList();
    el.removeWinnersToggle.checked = state.options.removeWinners;
    el.peopleMetricCount.textContent = state.participants.length;
    el.peopleMetricWon.textContent = state.history.length;
  }

  function addPeople(rawText) {
    const parts = rawText.split(/[\n\r,，、;；]+/);
    const existing = new Set(state.participants.map(function (person) { return person.name.toLocaleLowerCase(); }));
    const added = [];
    let skipped = 0;

    parts.forEach(function (part) {
      const name = core.cleanString(part, core.MAX_NAME_LENGTH);
      if (!name) return;
      const key = name.toLocaleLowerCase();
      if (existing.has(key)) {
        skipped += 1;
        return;
      }
      if (state.participants.length + added.length >= core.MAX_PARTICIPANTS) {
        skipped += 1;
        return;
      }
      existing.add(key);
      added.push({ id: core.uid("person"), name: name });
    });

    if (!added.length) {
      showToast(skipped ? "这些名字已经在名册里了。" : "先输入一个名字吧。", { type: skipped ? "warning" : "" });
      return;
    }

    state.participants.push.apply(state.participants, added);
    persist();
    view.search = "";
    el.peopleSearch.value = "";
    el.peopleInput.value = "";
    renderAll();
    showToast("已加入 " + added.length + " 位候选人" + (skipped ? "，忽略 " + skipped + " 个重复项" : "") + "。", { type: "success" });
  }

  function removeParticipant(id) {
    const index = state.participants.findIndex(function (person) { return person.id === id; });
    if (index < 0) return;
    const name = state.participants[index].name;
    state.participants.splice(index, 1);
    persist();
    renderAll();
    showToast("已将「" + name + "」移出候选池。");
  }

  /* ---------- prizes panel ---------- */

  function setPrizeAccent(color) {
    view.prizeAccent = core.PRIZE_ACCENTS.indexOf(color) > -1 ? color : core.PRIZE_ACCENTS[0];
    const swatches = el.prizeAccentChoices.querySelectorAll(".accent-swatch");
    swatches.forEach(function (button) {
      const active = button.dataset.accent === view.prizeAccent;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function resetPrizeForm() {
    view.editingPrizeId = null;
    el.prizeEditId.value = "";
    el.prizeNameInput.value = "";
    el.prizeQtyInput.value = "1";
    el.prizeNoteInput.value = "";
    el.prizeFormTitle.textContent = "新增奖项";
    el.cancelPrizeEdit.hidden = true;
    el.prizeSubmitBtn.innerHTML = "";
    el.prizeSubmitBtn.append(createIcon("plus"), document.createTextNode(" 加入奖池"));
    setPrizeAccent(core.PRIZE_ACCENTS[0]);
  }

  function beginPrizeEdit(id) {
    const prize = getPrizeById(id);
    if (!prize) return;
    view.editingPrizeId = id;
    el.prizeEditId.value = id;
    el.prizeNameInput.value = prize.name;
    el.prizeQtyInput.value = String(prize.total);
    el.prizeNoteInput.value = prize.note || "";
    el.prizeFormTitle.textContent = "编辑奖项";
    el.cancelPrizeEdit.hidden = false;
    el.prizeSubmitBtn.innerHTML = "";
    el.prizeSubmitBtn.append(createIcon("check"), document.createTextNode(" 保存修改"));
    setPrizeAccent(prize.accent);
    activateTab("prizes", { skipRender: true });
    el.prizeForm.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(function () { el.prizeNameInput.focus(); }, 220);
  }

  function renderPrizeAdminList() {
    el.prizeManageList.innerHTML = "";
    el.prizeEmpty.hidden = state.prizes.length > 0;

    state.prizes.forEach(function (prize, index) {
      const active = prize.id === getDisplayPrizeId() && view.stage !== "winner";
      const row = document.createElement("div");
      row.className = "prize-admin" + (active ? " is-active" : "") + (prize.remaining <= 0 ? " is-exhausted" : "");
      row.style.setProperty("--prize-accent", prize.accent);

      const select = document.createElement("button");
      select.type = "button";
      select.className = "prize-admin__select";
      select.title = prize.remaining > 0 ? "设为本轮奖品" : "该奖品已抽完";
      select.setAttribute("aria-label", select.title);
      select.setAttribute("aria-pressed", active ? "true" : "false");
      select.appendChild(createIcon("check"));
      select.addEventListener("click", function () {
        selectPrize(prize.id);
      });
      row.appendChild(select);

      const body = document.createElement("div");
      body.className = "prize-admin__body";
      const nameLine = document.createElement("div");
      nameLine.className = "prize-admin__name-line";
      const dot = document.createElement("span");
      dot.className = "prize-admin__dot";
      const name = appendTextElement(nameLine, "span", "prize-admin__name", prize.name);
      name.title = prize.name;
      nameLine.prepend(dot);
      body.appendChild(nameLine);
      appendTextElement(body, "span", "prize-admin__note", prize.note || "未填写颁奖文案");
      row.appendChild(body);

      const side = document.createElement("div");
      side.className = "prize-admin__side";
      appendTextElement(side, "span", "prize-admin__stock", prize.remaining + " / " + prize.total);

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "row-icon-button";
      edit.title = "编辑 " + prize.name;
      edit.setAttribute("aria-label", "编辑 " + prize.name);
      edit.appendChild(createIcon("edit"));
      edit.addEventListener("click", function () { beginPrizeEdit(prize.id); });
      side.appendChild(edit);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "row-icon-button row-icon-button--danger";
      remove.title = "删除 " + prize.name;
      remove.setAttribute("aria-label", "删除 " + prize.name);
      remove.appendChild(createIcon("trash"));
      remove.addEventListener("click", function () { deletePrize(prize.id); });
      side.appendChild(remove);

      row.appendChild(side);
      el.prizeManageList.appendChild(row);
    });
  }

  function renderPrizesPanel() {
    renderPrizeAdminList();
    el.prizeMetricRemaining.textContent = getTotalRemaining();
    el.prizeMetricAwarded.textContent = state.prizes.reduce(function (total, prize) {
      return total + Math.max(0, prize.total - prize.remaining);
    }, 0);
  }

  function savePrizeFromForm() {
    const name = core.cleanString(el.prizeNameInput.value, 32);
    if (!name) {
      showToast("请先给这份奖品起一个名字。", { type: "warning" });
      el.prizeNameInput.focus();
      return;
    }
    const numericQuantity = Number(el.prizeQtyInput.value);
    const quantity = Math.max(1, Math.min(999, Math.floor(Number.isFinite(numericQuantity) ? numericQuantity : 1)));
    const note = core.cleanString(el.prizeNoteInput.value, 60);
    const duplicate = state.prizes.find(function (prize) {
      return prize.name.toLocaleLowerCase() === name.toLocaleLowerCase() && prize.id !== view.editingPrizeId;
    });
    if (duplicate) {
      showToast("奖池里已经有一份同名奖品了。", { type: "warning" });
      return;
    }

    if (view.editingPrizeId) {
      const prize = getPrizeById(view.editingPrizeId);
      if (!prize) {
        resetPrizeForm();
        return;
      }
      const delta = quantity - prize.total;
      prize.name = name;
      prize.note = note;
      prize.total = quantity;
      prize.remaining = Math.max(0, Math.min(quantity, prize.remaining + delta));
      prize.accent = view.prizeAccent;
      persist();
      resetPrizeForm();
      renderAll();
      showToast("「" + prize.name + "」已更新。", { type: "success" });
      return;
    }

    const prize = {
      id: core.uid("prize"),
      name: name,
      note: note,
      total: quantity,
      remaining: quantity,
      accent: view.prizeAccent
    };
    state.prizes.push(prize);
    state.activePrizeId = prize.id;
    persist();
    resetPrizeForm();
    renderAll();
    showToast("「" + prize.name + "」已加入奖池，并设为下一轮。", { type: "success" });
  }

  async function deletePrize(id) {
    const prize = getPrizeById(id);
    if (!prize) return;
    const related = state.history.filter(function (record) { return record.prizeId === id; }).length;
    const confirmed = await confirmAction({
      title: "删除这份奖品？",
      message: "「" + prize.name + "」将从奖池中移除。" + (related ? "已产生的 " + related + " 条中奖记录会保留，但奖品内容无法再恢复。" : ""),
      confirmText: "删除奖品",
      danger: true
    });
    if (!confirmed) return;

    state.prizes = state.prizes.filter(function (item) { return item.id !== id; });
    if (state.activePrizeId === id) {
      const next = state.prizes.find(function (item) { return item.remaining > 0; }) || state.prizes[0] || null;
      state.activePrizeId = next ? next.id : null;
    }
    if (view.editingPrizeId === id) resetPrizeForm();
    if (view.stage === "winner" && view.winnerRecord && view.winnerRecord.prizeId === id) {
      view.stage = "idle";
      view.winnerRecord = null;
    }
    persist();
    renderAll();
    showToast("已删除「" + prize.name + "」。");
  }

  /* ---------- history panel ---------- */

  function renderHistoryPanel() {
    el.historyList.innerHTML = "";
    el.historyEmpty.hidden = state.history.length > 0;
    el.undoLatestBtn.hidden = !state.history.length || view.drawing;
    el.clearHistoryBtn.hidden = !state.history.length;
    el.historyMetricCount.textContent = state.history.length;

    state.history.forEach(function (record, index) {
      const row = document.createElement("div");
      row.className = "history-row";

      appendTextElement(row, "span", "history-row__no", "#" + roundLabel(record.round));
      const body = document.createElement("div");
      body.className = "history-row__body";
      const nameLine = document.createElement("div");
      nameLine.className = "history-row__name-line";
      const name = appendTextElement(nameLine, "span", "history-row__name", record.participant.name);
      name.title = record.participant.name;
      if (index === 0) {
        const badge = appendTextElement(nameLine, "span", "history-row__badge", "LATEST");
        badge.style.borderColor = record.prizeAccent + "55";
        badge.style.color = record.prizeAccent;
      }
      body.appendChild(nameLine);
      appendTextElement(body, "div", "history-row__prize", record.prizeName + (record.prizeNote ? " · " + record.prizeNote : ""));
      row.appendChild(body);
      appendTextElement(row, "span", "history-row__time", core.formatTime(record.at));
      el.historyList.appendChild(row);
    });
  }

  /* ---------- music panel ---------- */

  function getSelectedTrack() {
    return state.music.tracks.find(function (track) { return track.id === state.music.selectedTrackId; }) || null;
  }

  function renderTrackList() {
    el.musicTrackList.innerHTML = "";
    el.musicEmpty.hidden = state.music.tracks.length > 0;
    el.trackCountLabel.textContent = state.music.tracks.length;

    state.music.tracks.forEach(function (track) {
      const active = track.id === state.music.selectedTrackId;
      const row = document.createElement("div");
      row.className = "track-row" + (active ? " is-active" : "");

      const play = document.createElement("button");
      play.type = "button";
      play.className = "track-play";
      play.title = active && audioEngine.musicPlaying ? "暂停" : "播放 " + track.name;
      play.setAttribute("aria-label", play.title);
      play.appendChild(createIcon(active && audioEngine.musicPlaying ? "pause" : "play"));
      play.addEventListener("click", function () {
        activateTrack(track.id, true);
      });
      row.appendChild(play);

      const copy = document.createElement("div");
      copy.className = "track-copy";
      const name = appendTextElement(copy, "strong", "", track.name);
      name.title = track.name;
      const meta = appendTextElement(copy, "small", "", core.formatFileSize(track.size) + " · LOCAL AUDIO");
      if (track.temporary) {
        meta.append(document.createTextNode(" · 本次会话"));
      }
      row.appendChild(copy);

      if (active) {
        appendTextElement(row, "span", "track-source-badge", "当前");
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "track-remove";
      remove.title = "删除音乐 " + track.name;
      remove.setAttribute("aria-label", "删除音乐 " + track.name);
      remove.appendChild(createIcon("trash"));
      remove.addEventListener("click", function () { deleteTrack(track.id); });
      row.appendChild(remove);

      el.musicTrackList.appendChild(row);
    });
  }

  function renderMusicPanel() {
    const source = state.music.source;
    el.synthSourceBtn.classList.toggle("is-active", source === "synth");
    el.fileSourceBtn.classList.toggle("is-active", source === "file");
    el.synthSourceBtn.setAttribute("aria-pressed", source === "synth" ? "true" : "false");
    el.fileSourceBtn.setAttribute("aria-pressed", source === "file" ? "true" : "false");
    el.synthSourceBtn.classList.toggle("is-playing", source === "synth" && audioEngine.musicPlaying);
    el.fileSourceBtn.classList.toggle("is-playing", source === "file" && audioEngine.musicPlaying);
    el.trackCountLabel.textContent = state.music.tracks.length;
    const selected = getSelectedTrack();
    const playerCard = el.musicPlayBtn.closest(".music-player-card");
    if (playerCard) playerCard.classList.toggle("is-playing", audioEngine.musicPlaying);
    el.musicQuickBtn.classList.toggle("is-playing", audioEngine.musicPlaying);
    el.musicQuickBtn.setAttribute("aria-pressed", audioEngine.musicPlaying ? "true" : "false");
    el.musicQuickBtn.setAttribute("aria-label", audioEngine.musicPlaying ? "暂停背景音乐" : "播放背景音乐");

    if (source === "file") {
      el.playerKicker.textContent = "LOCAL TRACKS";
      el.playerTitle.textContent = selected ? selected.name : "选择一首你的音乐";
      el.playerSubtitle.textContent = selected
        ? core.formatFileSize(selected.size) + " · 本地文件"
        : "从下方上传一段专属配乐";
    } else {
      el.playerKicker.textContent = "AURORA SYNTH";
      el.playerTitle.textContent = "极光生成式声景";
      el.playerSubtitle.textContent = "为抽选而生 · 无版权限制";
    }

    const volume = state.music.volume;
    el.volumeSlider.value = String(volume);
    el.volumeSlider.style.setProperty("--volume", volume + "%");
    el.volumeValue.textContent = String(volume);
    el.musicPlayBtn.setAttribute("aria-label", audioEngine.musicPlaying ? "暂停音乐" : "播放音乐");
    el.musicPlayBtn.title = audioEngine.musicPlaying ? "暂停音乐" : "播放音乐";

    renderTrackList();
  }

  /* ---------- global render ---------- */

  function syncToggles() {
    el.removeWinnersToggle.checked = state.options.removeWinners;
    el.sfxToggle.checked = state.options.sfx;
    el.particlesToggle.checked = state.options.particles;
  }

  function renderAll() {
    applyTheme(state.options.theme);
    renderChrome();
    renderStage();
    renderPrizeInfo();
    renderDrawControls();
    renderPrizeTray();
    renderPeoplePanel();
    renderPrizesPanel();
    renderHistoryPanel();
    renderMusicPanel();
    syncToggles();
    rebuildOrbitPeople();
    updateOrbitMetrics();
  }

  /* ---------- music ---------- */

  let musicRequestToken = 0;

  async function ensureTrackUrl(track) {
    if (!track) return null;
    if (trackUrls.has(track.id)) return trackUrls.get(track.id);
    const record = await mediaStore.get(track.id);
    if (!record || !record.blob) return null;
    const url = URL.createObjectURL(record.blob);
    trackUrls.set(track.id, url);
    return url;
  }

  async function playCurrentMusic() {
    const requestId = ++musicRequestToken;
    audioEngine.ensureContext();

    if (state.music.source === "synth") {
      const started = audioEngine.startSynth();
      if (!started) {
        showToast("当前浏览器无法启动内置声景。", { type: "warning" });
      }
      renderMusicPanel();
      return started;
    }

    const track = getSelectedTrack();
    if (!track) {
      showToast("先在音律页上传一首音乐吧。", { type: "warning" });
      openConsole("music");
      return false;
    }
    showToast("正在载入「" + track.name + "」…", { duration: 1600 });
    const url = await ensureTrackUrl(track);
    if (requestId !== musicRequestToken) return false;
    if (!url) {
      showToast("找不到「" + track.name + "」的本地文件，请重新上传。", { type: "warning", duration: 4500 });
      renderMusicPanel();
      return false;
    }
    const played = await audioEngine.playFile(url);
    if (!played) {
      showToast("音乐播放被浏览器拦截，再点击一次播放按钮即可。", { type: "warning" });
    }
    renderMusicPanel();
    return played;
  }

  async function toggleMusicPlayback() {
    if (audioEngine.musicPlaying) {
      audioEngine.pauseMusic();
      renderMusicPanel();
      return;
    }
    await playCurrentMusic();
  }

  function pauseMusicIfPlaying() {
    if (audioEngine.musicPlaying) {
      audioEngine.pauseMusic();
      renderMusicPanel();
    }
  }

  async function setMusicSource(source) {
    if (source !== "synth" && source !== "file") return;
    if (source === "file" && !state.music.tracks.length) {
      showToast("先上传一首本地音乐，才能使用这个音源。", { type: "warning" });
      el.musicFileInput.click();
      return;
    }
    const wasPlaying = audioEngine.musicPlaying;
    if (wasPlaying) audioEngine.pauseMusic();
    state.music.source = source;
    if (source === "file" && !getSelectedTrack() && state.music.tracks.length) {
      state.music.selectedTrackId = state.music.tracks[0].id;
    }
    persist();
    renderMusicPanel();
    if (wasPlaying) {
      await playCurrentMusic();
    } else {
      showToast(source === "synth" ? "已切换到极光合成器。" : "已切换到本地音乐。", { duration: 1800 });
    }
  }

  async function activateTrack(id, autoPlay) {
    const track = state.music.tracks.find(function (item) { return item.id === id; });
    if (!track) return;
    const wasPlaying = audioEngine.musicPlaying;
    if (wasPlaying) audioEngine.pauseMusic();
    state.music.source = "file";
    state.music.selectedTrackId = id;
    persist();
    renderMusicPanel();
    if (autoPlay || wasPlaying) {
      await playCurrentMusic();
    }
  }

  function currentTrackFileValid(file) {
    if (!file) return false;
    const type = (file.type || "").toLowerCase();
    if (type.startsWith("audio/")) return true;
    return /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(file.name || "");
  }

  async function handleMusicFiles(fileList) {
    const files = Array.from(fileList || []).filter(currentTrackFileValid);
    if (!files.length) {
      showToast("请选择有效的音频文件。", { type: "warning" });
      return;
    }

    const added = [];
    let rejected = 0;
    const wasPlaying = audioEngine.musicPlaying;
    if (wasPlaying) audioEngine.pauseMusic();
    el.musicDropzone.classList.add("is-loading");
    el.musicDropzone.setAttribute("aria-busy", "true");

    for (const file of files) {
      if (file.size > 80 * 1024 * 1024) {
        rejected += 1;
        continue;
      }
      if (state.music.tracks.length >= 60) {
        rejected += 1;
        continue;
      }
      const id = core.uid("track");
      const record = {
        id: id,
        name: file.name.replace(/\.[^.]+$/, ""),
        blob: file,
        type: file.type,
        size: file.size
      };
      const persisted = await mediaStore.put(record);
      const url = URL.createObjectURL(file);
      trackUrls.set(id, url);
      const track = {
        id: id,
        name: record.name || file.name,
        size: file.size,
        type: file.type,
        addedAt: Date.now(),
        temporary: !persisted
      };
      state.music.tracks.push(track);
      added.push(track);
    }

    el.musicDropzone.classList.remove("is-loading");
    el.musicDropzone.removeAttribute("aria-busy");
    el.musicFileInput.value = "";

    if (!added.length) {
      showToast("没有可用的音乐文件，请换一个再试。", { type: "warning" });
      return;
    }

    state.music.source = "file";
    state.music.selectedTrackId = added[0].id;
    persist();
    renderAll();
    showToast(
      "已载入 " + added.length + " 首音乐" +
      (rejected ? "，跳过 " + rejected + " 个文件" : "") +
      (added.some(function (track) { return track.temporary; }) ? "。部分文件仅在本次会话可用。" : "。"),
      { type: "success", duration: 4200 }
    );
    if (wasPlaying) await playCurrentMusic();
  }

  async function deleteTrack(id) {
    const track = state.music.tracks.find(function (item) { return item.id === id; });
    if (!track) return;
    const confirmed = await confirmAction({
      title: "删除这首音乐？",
      message: "「" + track.name + "」将从本地曲库中移除。",
      confirmText: "删除音乐",
      danger: true
    });
    if (!confirmed) return;

    if (state.music.selectedTrackId === id && audioEngine.musicPlaying) {
      audioEngine.pauseMusic();
    }
    await mediaStore.delete(id);
    if (trackUrls.has(id)) {
      URL.revokeObjectURL(trackUrls.get(id));
      trackUrls.delete(id);
    }
    state.music.tracks = state.music.tracks.filter(function (item) { return item.id !== id; });
    if (state.music.selectedTrackId === id) {
      state.music.selectedTrackId = state.music.tracks[0] ? state.music.tracks[0].id : null;
      if (!state.music.selectedTrackId) state.music.source = "synth";
    }
    persist();
    renderAll();
    showToast("已删除音乐「" + track.name + "」。");
  }

  async function validateSelectedTrack() {
    if (state.music.source !== "file") return;
    const selected = getSelectedTrack();
    if (!selected) {
      state.music.source = "synth";
      persist();
      renderMusicPanel();
      return;
    }
    const url = await ensureTrackUrl(selected);
    if (!url) {
      showToast("上次使用的音乐文件已不可用，已切换到内置声景。", { type: "warning", duration: 5000 });
      state.music.source = "synth";
      persist();
      renderMusicPanel();
    }
  }

  audioEngine.onChange = function () {
    renderMusicPanel();
  };
  audioEngine.onError = function (message) {
    showToast(message, { type: "warning" });
  };

  /* ---------- draw ritual ---------- */

  function announce(message) {
    el.liveRegion.textContent = "";
    window.setTimeout(function () {
      el.liveRegion.textContent = message;
    }, 40);
  }

  function getOrbCenter() {
    const rect = el.orb.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function celebrate(record) {
    if (!state.options.particles) return;
    if (reducedMotionQuery.matches) return;
    const center = getOrbCenter();
    const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#d7ff7a";
    const colors = [accent, record.prizeAccent, "#f4f1e4", "#7ef0c8", "#efd49b"];
    confetti.burst(center.x, center.y, colors, window.innerWidth < 700 ? 90 : 170);
    window.setTimeout(function () {
      if (!state.options.particles) return;
      confetti.burst(center.x - 100, center.y + 40, colors, window.innerWidth < 700 ? 40 : 70);
    }, 170);
    window.setTimeout(function () {
      if (!state.options.particles) return;
      confetti.burst(center.x + 130, center.y - 20, colors, window.innerWidth < 700 ? 35 : 60);
    }, 360);
  }

  function startDraw() {
    if (view.drawing) return;
    const availability = getStageAvailability();
    if (!availability.ok) {
      handleDrawAttempt();
      return;
    }

    const prize = getNextAvailablePrize();
    if (!prize) {
      handleDrawAttempt();
      return;
    }

    if (state.activePrizeId !== prize.id) {
      state.activePrizeId = prize.id;
      persist();
    }

    const winnerIndex = core.secureRandomInt(state.participants.length);
    if (winnerIndex < 0) return;
    const winner = {
      id: state.participants[winnerIndex].id,
      name: state.participants[winnerIndex].name
    };
    const round = state.history.length + 1;

    view.drawing = true;
    view.stage = "drawing";
    view.round = round;
    view.winnerRecord = null;
    drawTickCount = 0;
    drawLastTick = 0;

    audioEngine.ensureContext();
    stageStateClass();
    el.orb.dataset.state = "drawing";
    el.orbKicker.textContent = "SCANNING THE STARS";
    setDisplayName("命运流转中");
    el.displayMeta.textContent = "命运正在经过你的名字";
    el.orbPoolLabel.textContent = participantCountLabel();
    el.orbStateLabel.textContent = "DRAWING";
    el.nameGhost.textContent = roundLabel(round);
    el.winnerMark.hidden = true;
    el.drawButton.setAttribute("aria-busy", "true");
    renderDrawControls();
    renderPrizeInfo();
    renderChrome();

    const duration = reducedMotionQuery.matches ? 700 : 3800;
    drawStartTime = performance.now();

    function step(now) {
      if (!view.drawing) return;
      const progress = Math.min(1, (now - drawStartTime) / duration);
      const interval = reducedMotionQuery.matches ? 110 : 45 + 290 * Math.pow(progress, 2.65);

      if (now - drawLastTick >= interval) {
        drawLastTick = now;
        drawTickCount += 1;
        const tickIndex = core.secureRandomInt(state.participants.length);
        const tickWinner = state.participants[tickIndex] || winner;
        setDisplayName(tickWinner.name);
        if (state.options.sfx && drawTickCount % 1 === 0) {
          audioEngine.playTick();
        }
      }

      if (progress >= 1) {
        finishDraw(winner, prize, round, winnerIndex);
        return;
      }
      drawFrame = requestAnimationFrame(step);
    }

    drawFrame = requestAnimationFrame(step);
  }

  function finishDraw(winner, prize, round, winnerIndex) {
    view.drawing = false;
    view.stage = "winner";
    view.round = round;

    const prizeRecord = {
      prizeId: prize.id,
      prizeName: prize.name,
      prizeNote: prize.note,
      prizeAccent: prize.accent
    };
    const livePrize = getPrizeById(prize.id);
    if (livePrize) {
      livePrize.remaining = Math.max(0, livePrize.remaining - 1);
      if (livePrize.remaining === 0) {
        const nextAvailable = state.prizes.find(function (item) { return item.remaining > 0; });
        if (nextAvailable) state.activePrizeId = nextAvailable.id;
      }
    }

    let wasRemoved = false;
    const currentIndex = state.participants.findIndex(function (person) { return person.id === winner.id; });
    if (state.options.removeWinners && currentIndex > -1) {
      state.participants.splice(currentIndex, 1);
      wasRemoved = true;
    }

    const record = {
      round: round,
      participant: { id: winner.id, name: winner.name },
      participantIndex: winnerIndex,
      prizeId: prizeRecord.prizeId,
      prizeName: prizeRecord.prizeName,
      prizeNote: prizeRecord.prizeNote,
      prizeAccent: prizeRecord.prizeAccent,
      at: Date.now(),
      wasRemoved: wasRemoved
    };

    state.history.unshift(record);
    view.winnerRecord = record;
    persist();

    renderAll();
    celebrate(record);
    if (state.options.sfx) audioEngine.playWin();
    announce("恭喜 " + winner.name + "，获得 " + prize.name + "。");
    el.drawButton.removeAttribute("aria-busy");
    if (navigator.vibrate) {
      try { navigator.vibrate([28, 50, 40]); } catch (error) { /* noop */ }
    }
  }

  function undoLatestDraw(options) {
    if (view.drawing) return;
    const record = state.history[0];
    if (!record) {
      showToast("还没有可以撤销的抽选记录。");
      return;
    }
    const settings = options || {};
    state.history.shift();

    const prize = getPrizeById(record.prizeId);
    if (prize) {
      prize.remaining = Math.min(prize.total, prize.remaining + 1);
      state.activePrizeId = prize.id;
    }

    if (record.wasRemoved) {
      const exists = state.participants.some(function (person) { return person.id === record.participant.id; });
      if (!exists) {
        const insertAt = Math.max(0, Math.min(state.participants.length, record.participantIndex));
        state.participants.splice(insertAt, 0, {
          id: record.participant.id,
          name: record.participant.name
        });
      }
    }

    view.stage = "idle";
    view.winnerRecord = null;
    view.round = null;
    view.drawing = false;
    persist();
    renderAll();
    showToast("已撤销「" + record.participant.name + "」的中奖结果。", { type: "success" });
    announce("已撤销 " + record.participant.name + " 的中奖结果。");
    if (!settings.silent) setFooterStatus("LOCAL SESSION · 撤销完成 · 数据自动保存");
  }

  function resetStageToIdle(showMessage) {
    if (view.drawing) return;
    view.stage = "idle";
    view.winnerRecord = null;
    view.round = null;
    renderAll();
    if (showMessage) showToast("已返回等待状态，中奖记录仍然保留。");
  }

  function handleDrawAttempt() {
    if (view.drawing) return;
    if (!state.participants.length) {
      showToast("候选池是空的，先请几位名字入场吧。", { type: "warning" });
      openConsole("people", { focusPeopleForm: true });
      return;
    }
    if (!state.prizes.length) {
      showToast("还没有设置奖品，先为这一轮准备一份礼物。", { type: "warning" });
      openConsole("prizes", { focusPrizeForm: true });
      return;
    }
    if (getTotalRemaining() <= 0) {
      showToast("奖池已经空了，再补充一些奖品吧。", { type: "warning" });
      openConsole("prizes");
      return;
    }
    startDraw();
  }

  /* ---------- toasts ---------- */

  function showToast(message, options) {
    if (!message || !el.toastRegion) return;
    const settings = options || {};
    while (el.toastRegion.children.length >= 3) {
      el.toastRegion.firstElementChild.remove();
    }

    const node = document.createElement("div");
    node.className = "toast" + (settings.type ? " toast--" + settings.type : "");
    node.setAttribute("role", "status");
    node.appendChild(appendTextElement(document.createElement("span"), "span", "toast__dot", ""));
    node.appendChild(appendTextElement(document.createElement("span"), "span", "toast__text", message));
    el.toastRegion.appendChild(node);

    const duration = Math.max(1600, Number(settings.duration) || 3200);
    const leaveTimer = window.setTimeout(function () {
      node.classList.add("is-leaving");
      const removeTimer = window.setTimeout(function () {
        if (node.isConnected) node.remove();
        view.toastTimerIds.delete(removeTimer);
      }, 280);
      view.toastTimerIds.add(removeTimer);
      view.toastTimerIds.delete(leaveTimer);
    }, duration);
    view.toastTimerIds.add(leaveTimer);
  }

  /* ---------- control room ---------- */

  const TAB_NAMES = ["people", "prizes", "music", "history", "settings"];
  let drawerCloseTimer = 0;
  let confirmLastFocus = null;

  function activateTab(name, options) {
    const settings = options || {};
    const tab = TAB_NAMES.indexOf(name) > -1 ? name : "people";
    view.tab = tab;

    el.drawerTabs.forEach(function (button) {
      const active = button.dataset.tab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    el.historyPanels.forEach(function (panel) {
      const active = panel.dataset.panel === tab;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });

    if (!settings.keepScroll) el.drawerBody.scrollTop = 0;

    if (tab === "people") renderPeoplePanel();
    else if (tab === "prizes") renderPrizesPanel();
    else if (tab === "music") renderMusicPanel();
    else if (tab === "history") renderHistoryPanel();
    else if (tab === "settings") {
      fillSettingsForm();
      syncToggles();
    }
  }

  function openConsole(name, options) {
    const settings = options || {};
    if (view.confirmOpen) return;
    const wasHidden = el.drawerLayer.hidden;
    if (wasHidden) {
      view.lastFocus = document.activeElement;
      el.drawerLayer.hidden = false;
      el.openConsoleBtn.setAttribute("aria-expanded", "true");
      el.body.classList.add("is-drawer-open");
    }

    activateTab(name || view.tab, { skipRender: settings.skipRender });
    el.consoleDrawer.focus({ preventScroll: true });

    window.setTimeout(function () {
      if (settings.focusPeopleForm) {
        el.peopleInput.focus();
        el.peopleInput.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (settings.focusPrizeForm) {
        el.prizeNameInput.focus();
        el.prizeForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (settings.focusEventTitle) {
        el.eventTitleInput.focus();
        el.eventTitleInput.select();
        el.settingsForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 90);
  }

  function closeConsole() {
    if (el.drawerLayer.hidden || view.confirmOpen) return;

    function finish() {
      el.drawerLayer.hidden = true;
      el.drawerLayer.classList.remove("is-closing");
      el.openConsoleBtn.setAttribute("aria-expanded", "false");
      el.body.classList.remove("is-drawer-open");
      const target = view.lastFocus;
      view.lastFocus = null;
      if (target && target !== document.body && document.contains(target) && typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    }

    if (reducedMotionQuery.matches) {
      finish();
      return;
    }

    el.drawerLayer.classList.add("is-closing");
    window.clearTimeout(drawerCloseTimer);
    drawerCloseTimer = window.setTimeout(finish, 340);
  }

  function getFocusable(container) {
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled]):not([type='hidden'])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");
    return Array.from(container.querySelectorAll(selector)).filter(function (node) {
      return node.getClientRects().length > 0;
    });
  }

  function trapFocus(event, container) {
    if (event.key !== "Tab") return;
    const items = getFocusable(container);
    if (!items.length) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const outside = active === container || !container.contains(active);

    if (event.shiftKey && (outside || active === first)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (outside || active === last)) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------- confirmation ---------- */

  function confirmAction(options) {
    const settings = options || {};
    if (view.confirmOpen) resolveConfirm(false);

    confirmLastFocus = document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : null;

    el.confirmTitle.textContent = settings.title || "确认操作";
    el.confirmMessage.textContent = settings.message || "这一操作无法撤销。";
    el.confirmOkBtn.textContent = settings.confirmText || "确认";
    el.confirmCancelBtn.textContent = settings.cancelText || "取消";
    el.confirmOkBtn.classList.toggle("is-danger", Boolean(settings.danger));
    el.confirmLayer.hidden = false;
    el.body.classList.add("is-modal-open");
    view.confirmOpen = true;

    return new Promise(function (resolve) {
      view.confirmResolver = resolve;
      window.setTimeout(function () {
        if (!view.confirmOpen) return;
        (settings.danger ? el.confirmCancelBtn : el.confirmOkBtn).focus();
      }, 60);
    });
  }

  function resolveConfirm(value) {
    if (!view.confirmOpen) return;
    const resolver = view.confirmResolver;
    view.confirmOpen = false;
    view.confirmResolver = null;
    el.confirmLayer.hidden = true;
    el.body.classList.remove("is-modal-open");

    const target = confirmLastFocus;
    confirmLastFocus = null;
    if (target && document.contains(target) && typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
    if (typeof resolver === "function") resolver(Boolean(value));
  }

  /* ---------- fullscreen ---------- */

  function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function updateFullscreenButton() {
    const active = isFullscreen();
    el.fullscreenBtn.classList.toggle("is-active", active);
    el.fullscreenBtn.setAttribute("aria-label", active ? "退出全屏" : "进入全屏");
    el.fullscreenBtn.title = active ? "退出全屏" : "全屏";
  }

  async function toggleFullscreen() {
    try {
      if (isFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exit) await exit.call(document);
      } else {
        const root = document.documentElement;
        const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
        if (!request) {
          showToast("当前浏览器不支持全屏模式。", { type: "warning" });
          return;
        }
        await request.call(root);
      }
    } catch (error) {
      showToast("无法切换全屏，可能是浏览器权限限制。", { type: "warning" });
    }
    updateFullscreenButton();
  }

  /* ---------- settings ---------- */

  function fillSettingsForm() {
    el.eventTitleInput.value = state.event.title;
    el.eventTaglineInput.value = state.event.tagline;
  }

  function chooseTheme(theme) {
    if (core.THEMES.indexOf(theme) < 0) return;
    state.options.theme = theme;
    applyTheme(theme);
    persist();
  }

  function saveSettings() {
    const title = core.cleanString(el.eventTitleInput.value, 32) || "星轨抽选夜";
    const tagline = core.cleanString(el.eventTaglineInput.value, 60) || "FORTUNE, IN MOTION";

    state.event.title = title;
    state.event.tagline = tagline;
    state.options.sfx = el.sfxToggle.checked;
    state.options.particles = el.particlesToggle.checked;
    audioEngine.setSfxEnabled(state.options.sfx);
    persist();
    fillSettingsForm();
    renderAll();
    showToast("仪式设定已保存。", { type: "success" });
    announce("仪式设定已保存。");
  }

  /* ---------- data actions ---------- */

  function releaseTrackUrls() {
    trackUrls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });
    trackUrls.clear();
  }

  function readFileAsText(file) {
    if (file && typeof file.text === "function") return file.text();
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(reader.error || new Error("read error")); };
      reader.readAsText(file);
    });
  }

  function exportConfig() {
    const snapshot = JSON.parse(JSON.stringify(state));
    snapshot.music.tracks = snapshot.music.tracks.filter(function (track) {
      return !track.temporary;
    });
    if (!snapshot.music.tracks.some(function (track) { return track.id === snapshot.music.selectedTrackId; })) {
      snapshot.music.selectedTrackId = snapshot.music.tracks[0] ? snapshot.music.tracks[0].id : null;
      if (!snapshot.music.selectedTrackId) snapshot.music.source = "synth";
    }

    const payload = {
      app: "stellar-draw",
      version: 1,
      exportedAt: new Date().toISOString(),
      state: snapshot
    };
    const now = new Date();
    const stamp = now.getFullYear()
      + core.pad(now.getMonth() + 1, 2)
      + core.pad(now.getDate(), 2)
      + "-"
      + core.pad(now.getHours(), 2)
      + core.pad(now.getMinutes(), 2);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    core.downloadBlob("stellar-draw-" + stamp + ".json", blob);
    showToast("配置已导出，可以随时从 JSON 恢复。", { type: "success", duration: 3600 });
  }

  async function importConfigFile(file) {
    if (!file) return;
    el.importInput.value = "";

    if (file.size > 8 * 1024 * 1024) {
      showToast("配置文件过大，无法导入。", { type: "warning" });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(await readFileAsText(file));
    } catch (error) {
      showToast("无法读取这个 JSON 文件，请检查文件内容。", { type: "warning", duration: 4200 });
      return;
    }

    const source = parsed && parsed.state ? parsed.state : parsed;
    if (!source || typeof source !== "object" || Array.isArray(source)
      || (!source.participants && !source.prizes && !source.event && !source.options && !source.history)) {
      showToast("这个文件不像一份有效的抽选配置。", { type: "warning" });
      return;
    }

    const imported = core.sanitizeState(source);
    const confirmed = await confirmAction({
      title: "导入这份配置？",
      message: "当前名单、奖池、记录与设定会被覆盖。配置包含 "
        + imported.participants.length + " 位候选、"
        + imported.prizes.length + " 份奖项和 "
        + imported.history.length + " 条记录。",
      confirmText: "导入配置"
    });
    if (!confirmed) {
      showToast("已取消导入。");
      return;
    }

    pauseMusicIfPlaying();
    releaseTrackUrls();
    imported.music.tracks = imported.music.tracks.filter(function (track) { return !track.temporary; });
    if (!imported.music.tracks.some(function (track) { return track.id === imported.music.selectedTrackId; })) {
      imported.music.selectedTrackId = imported.music.tracks[0] ? imported.music.tracks[0].id : null;
      if (!imported.music.selectedTrackId) imported.music.source = "synth";
    }

    state = imported;
    view.stage = "idle";
    view.drawing = false;
    view.round = null;
    view.winnerRecord = null;
    view.search = "";
    view.editingPrizeId = null;
    el.peopleInput.value = "";
    el.peopleSearch.value = "";
    audioEngine.setSfxEnabled(state.options.sfx);
    audioEngine.setVolume(state.music.volume);
    resetPrizeForm();
    persist();
    fillSettingsForm();
    renderAll();
    validateSelectedTrack();
    showToast(
      "配置已导入：" + state.participants.length + " 位候选 · " + state.prizes.length + " 份奖项 · " + state.history.length + " 条记录。",
      { type: "success", duration: 4200 }
    );
    announce("配置已导入。");
  }

  async function resetDemo() {
    const confirmed = await confirmAction({
      title: "恢复演示数据？",
      message: "当前名单、奖池、中奖记录、设定与已上传的音乐都会被清空，并回到最初的演示状态。",
      confirmText: "恢复演示",
      danger: true
    });
    if (!confirmed) return;

    pauseMusicIfPlaying();
    releaseTrackUrls();
    const oldTrackIds = state.music.tracks.map(function (track) { return track.id; });
    await Promise.all(oldTrackIds.map(function (id) { return mediaStore.delete(id); }));

    state = core.defaultState();
    view.stage = "idle";
    view.drawing = false;
    view.round = null;
    view.winnerRecord = null;
    view.search = "";
    view.editingPrizeId = null;
    el.peopleInput.value = "";
    el.peopleSearch.value = "";
    audioEngine.setSfxEnabled(state.options.sfx);
    audioEngine.setVolume(state.music.volume);
    resetPrizeForm();
    persist();
    fillSettingsForm();
    renderAll();
    updateFullscreenButton();
    showToast("已恢复演示数据，可以重新开始了。", { type: "success", duration: 3600 });
    announce("已恢复演示数据。");
  }

  async function clearHistory() {
    if (!state.history.length) {
      showToast("还没有可以清空的中奖记录。");
      return;
    }
    const confirmed = await confirmAction({
      title: "清空中奖记录？",
      message: "共 " + state.history.length + " 条记录将被删除。奖品余量与候选池会保持当前状态，此操作无法撤销。",
      confirmText: "清空记录",
      danger: true
    });
    if (!confirmed) return;

    state.history = [];
    if (view.stage === "winner") {
      view.stage = "idle";
      view.winnerRecord = null;
      view.round = null;
    }
    persist();
    renderAll();
    showToast("中奖记录已清空。");
    announce("中奖记录已清空。");
  }

  async function clearParticipants() {
    if (!state.participants.length) {
      showToast("候选名册已经是空的。");
      return;
    }
    const confirmed = await confirmAction({
      title: "清空候选名册？",
      message: "当前 " + state.participants.length + " 位候选人会全部移除，奖池与中奖记录仍然保留。",
      confirmText: "清空名单",
      danger: true
    });
    if (!confirmed) return;

    state.participants = [];
    view.stage = "idle";
    view.winnerRecord = null;
    view.round = null;
    view.search = "";
    el.peopleSearch.value = "";
    persist();
    renderAll();
    showToast("候选名册已清空。");
    announce("候选名册已清空。");
  }

  /* ---------- event wiring ---------- */

  let volumeSaveTimer = 0;
  let resizeTimer = 0;
  let cursorFrame = 0;

  function isEditableTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function handlePointerMove(event) {
    if (event.pointerType === "touch" || cursorFrame) return;
    cursorFrame = window.requestAnimationFrame(function () {
      cursorFrame = 0;
      el.cursorLight.style.transform = "translate3d(" + (event.clientX - 210) + "px, " + (event.clientY - 210) + "px, 0)";
    });
  }

  function handleWindowResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      rebuildOrbitPeople();
      updateOrbitMetrics();
      updatePrizeTrayFade();
    }, 140);
  }

  function handleGlobalKeydown(event) {
    if (view.confirmOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        resolveConfirm(false);
        return;
      }
      trapFocus(event, el.confirmCard);
      return;
    }

    if (!el.drawerLayer.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeConsole();
        return;
      }
      trapFocus(event, el.consoleDrawer);
      return;
    }

    if (event.key === "Escape") {
      if (view.stage === "winner") {
        event.preventDefault();
        resetStageToIdle(true);
      } else if (view.drawing) {
        event.preventDefault();
        showToast("命运正在流转，请等待这一轮揭晓。");
      }
      return;
    }

    if (isEditableTarget(event.target)) return;
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target && event.target.closest && event.target.closest("button, a, [role='button']")) return;

    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      handleDrawAttempt();
      return;
    }

    if (event.key && event.key.toLocaleLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  function bindEvents() {
    el.eventEditButton.addEventListener("click", function () {
      openConsole("settings", { focusEventTitle: true });
    });
    el.openConsoleBtn.addEventListener("click", function () {
      openConsole(view.tab);
    });
    el.closeConsoleBtn.addEventListener("click", closeConsole);
    el.drawerBackdrop.addEventListener("click", closeConsole);

    el.drawerTabs.forEach(function (button) {
      button.addEventListener("click", function () {
        activateTab(button.dataset.tab);
      });
    });

    el.openPeopleBtn.addEventListener("click", function () { openConsole("people"); });
    el.openPrizesBtn.addEventListener("click", function () { openConsole("prizes"); });
    el.managePrizesBtn.addEventListener("click", function () { openConsole("prizes"); });
    el.prizeNowBtn.addEventListener("click", function () { openConsole("prizes"); });
    el.historyQuickBtn.addEventListener("click", function () { openConsole("history"); });
    el.musicQuickBtn.addEventListener("click", toggleMusicPlayback);

    el.fullscreenBtn.addEventListener("click", toggleFullscreen);
    el.drawButton.addEventListener("click", handleDrawAttempt);
    el.undoDrawBtn.addEventListener("click", function () { undoLatestDraw(); });
    el.prizeTray.addEventListener("scroll", updatePrizeTrayFade, { passive: true });

    el.addPeopleForm.addEventListener("submit", function (event) {
      event.preventDefault();
      addPeople(el.peopleInput.value);
    });
    el.peopleSearch.addEventListener("input", function () {
      view.search = el.peopleSearch.value;
      renderPeopleList();
    });
    el.clearPeopleBtn.addEventListener("click", clearParticipants);
    el.removeWinnersToggle.addEventListener("change", function () {
      state.options.removeWinners = el.removeWinnersToggle.checked;
      persist();
      showToast(
        state.options.removeWinners ? "中奖者会在揭晓后移出候选池。" : "中奖者会继续留在候选池中。",
        { duration: 2200 }
      );
    });

    el.prizeForm.addEventListener("submit", function (event) {
      event.preventDefault();
      savePrizeFromForm();
    });
    el.cancelPrizeEdit.addEventListener("click", resetPrizeForm);
    el.prizeAccentChoices.addEventListener("click", function (event) {
      const swatch = event.target.closest(".accent-swatch");
      if (swatch) setPrizeAccent(swatch.dataset.accent);
    });

    el.synthSourceBtn.addEventListener("click", function () { setMusicSource("synth"); });
    el.fileSourceBtn.addEventListener("click", function () { setMusicSource("file"); });
    el.musicPlayBtn.addEventListener("click", toggleMusicPlayback);
    el.volumeSlider.addEventListener("input", function () {
      const value = Math.max(0, Math.min(100, Math.round(Number(el.volumeSlider.value) || 0)));
      state.music.volume = value;
      audioEngine.setVolume(value);
      el.volumeSlider.style.setProperty("--volume", value + "%");
      el.volumeValue.textContent = String(value);
      window.clearTimeout(volumeSaveTimer);
      volumeSaveTimer = window.setTimeout(persist, 260);
    });
    el.volumeSlider.addEventListener("change", persist);

    el.musicDropzone.addEventListener("click", function () {
      el.musicFileInput.click();
    });
    el.musicDropzone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        el.musicFileInput.click();
      }
    });
    el.musicDropzone.addEventListener("dragover", function (event) {
      event.preventDefault();
      el.musicDropzone.classList.add("is-dragover");
    });
    el.musicDropzone.addEventListener("dragleave", function (event) {
      if (!el.musicDropzone.contains(event.relatedTarget)) {
        el.musicDropzone.classList.remove("is-dragover");
      }
    });
    el.musicDropzone.addEventListener("drop", function (event) {
      event.preventDefault();
      el.musicDropzone.classList.remove("is-dragover");
      if (event.dataTransfer && event.dataTransfer.files) {
        handleMusicFiles(event.dataTransfer.files);
      }
    });
    el.musicFileInput.addEventListener("change", function () {
      handleMusicFiles(el.musicFileInput.files);
    });

    el.undoLatestBtn.addEventListener("click", function () { undoLatestDraw(); });
    el.clearHistoryBtn.addEventListener("click", clearHistory);

    el.settingsForm.addEventListener("submit", function (event) {
      event.preventDefault();
      saveSettings();
    });
    el.themeChoices.forEach(function (button) {
      button.addEventListener("click", function () {
        chooseTheme(button.dataset.theme);
      });
    });
    el.sfxToggle.addEventListener("change", function () {
      state.options.sfx = el.sfxToggle.checked;
      audioEngine.setSfxEnabled(state.options.sfx);
      persist();
      if (state.options.sfx) audioEngine.playTick();
    });
    el.particlesToggle.addEventListener("change", function () {
      state.options.particles = el.particlesToggle.checked;
      persist();
    });

    el.exportBtn.addEventListener("click", exportConfig);
    el.importBtn.addEventListener("click", function () { el.importInput.click(); });
    el.importInput.addEventListener("change", function () {
      const file = el.importInput.files && el.importInput.files[0];
      importConfigFile(file);
    });
    el.resetBtn.addEventListener("click", resetDemo);

    el.confirmCancelBtn.addEventListener("click", function () { resolveConfirm(false); });
    el.confirmOkBtn.addEventListener("click", function () { resolveConfirm(true); });
    el.confirmBackdrop.addEventListener("click", function () { resolveConfirm(false); });

    document.addEventListener("keydown", handleGlobalKeydown);
    document.addEventListener("fullscreenchange", updateFullscreenButton);
    document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
    window.addEventListener("resize", handleWindowResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
  }

  /* ---------- boot ---------- */

  function init() {
    applyTheme(state.options.theme);
    setChromeDate();
    audioEngine.setVolume(state.music.volume);
    audioEngine.setSfxEnabled(state.options.sfx);
    fillSettingsForm();
    syncToggles();
    resetPrizeForm();
    bindEvents();
    renderAll();
    updateFullscreenButton();
    window.requestAnimationFrame(animateOrbit);
    window.setInterval(setChromeDate, 60000);
    validateSelectedTrack();

    if (!state.participants.length && !state.prizes.length) {
      setFooterStatus("LOCAL SESSION · 等待布置第一场仪式");
    }
  }

  init();
})(window.StellarDraw = window.StellarDraw || {});
