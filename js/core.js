/* =========================================================
   STELLAR DRAW · core data
   ========================================================= */
(function (NS) {
  "use strict";

  const STORAGE_KEY = "stellar-draw.state.v1";
  const MEDIA_DB_NAME = "stellar-draw.media.v1";
  const MEDIA_STORE_NAME = "audio";
  const MAX_PARTICIPANTS = 1000;
  const MAX_NAME_LENGTH = 32;
  const MAX_PRIZES = 100;

  const DEFAULT_NAMES = [
    "沈知微", "顾言", "江屿", "林晚舟", "苏念", "陈星野",
    "贺川", "陆青禾", "温宁", "许星河", "唐小满", "白露",
    "周予安", "夏栀", "闻溪", "傅时安", "韩松", "梁月"
  ];

  const DEFAULT_PRIZES = [
    { name: "极光限定礼盒", note: "致那个把夜晚点亮的人", total: 1, accent: "#d7ff7a" },
    { name: "星海旅行基金", note: "把下一段旅程交给星光", total: 2, accent: "#7ef0c8" },
    { name: "午夜香氛礼盒", note: "让这一夜的味道被记住", total: 3, accent: "#efd49b" },
    { name: "幸运咖啡券", note: "明天的第一杯，我们请", total: 5, accent: "#9dd7ff" }
  ];

  const THEMES = ["aurora", "champagne", "glacier", "ember"];
  const PRIZE_ACCENTS = ["#d7ff7a", "#7ef0c8", "#efd49b", "#9dd7ff", "#ffad8d"];

  function uid(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return prefix + "_" + window.crypto.randomUUID();
    }
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }

  function pad(value, length) {
    return String(value).padStart(length || 2, "0");
  }

  function defaultState() {
    const prizes = DEFAULT_PRIZES.map(function (prize) {
      return {
        id: uid("prize"),
        name: prize.name,
        note: prize.note,
        total: prize.total,
        remaining: prize.total,
        accent: prize.accent
      };
    });

    const participants = DEFAULT_NAMES.map(function (name) {
      return { id: uid("person"), name: name };
    });

    return {
      version: 1,
      event: {
        title: "星轨抽选夜",
        tagline: "FORTUNE, IN MOTION"
      },
      participants: participants,
      prizes: prizes,
      activePrizeId: prizes[0] ? prizes[0].id : null,
      options: {
        removeWinners: true,
        sfx: true,
        particles: true,
        theme: "aurora"
      },
      history: [],
      music: {
        source: "synth",
        volume: 52,
        selectedTrackId: null,
        tracks: []
      }
    };
  }

  function cleanString(value, maxLength) {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim().slice(0, maxLength || 200);
  }

  function cleanId(value) {
    return typeof value === "string" && value.length <= 120 ? value : "";
  }

  function cleanHex(value, fallback) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function uniqueNameSet(list) {
    const seen = new Set();
    return list.filter(function (item) {
      const key = item.name.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function sanitizeState(raw) {
    const fallback = defaultState();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return fallback;
    }

    const next = {
      version: 1,
      event: {
        title: cleanString(raw.event && raw.event.title, 32) || fallback.event.title,
        tagline: cleanString(raw.event && raw.event.tagline, 60) || fallback.event.tagline
      },
      participants: [],
      prizes: [],
      activePrizeId: null,
      options: {
        removeWinners: true,
        sfx: true,
        particles: true,
        theme: "aurora"
      },
      history: [],
      music: {
        source: "synth",
        volume: 52,
        selectedTrackId: null,
        tracks: []
      }
    };

    if (raw.options && typeof raw.options === "object") {
      next.options.removeWinners = raw.options.removeWinners !== false;
      next.options.sfx = raw.options.sfx !== false;
      next.options.particles = raw.options.particles !== false;
      next.options.theme = THEMES.indexOf(raw.options.theme) > -1 ? raw.options.theme : "aurora";
    }

    if (Array.isArray(raw.participants)) {
      const usedIds = new Set();
      raw.participants.slice(0, MAX_PARTICIPANTS).forEach(function (person) {
        const name = cleanString(person && person.name, MAX_NAME_LENGTH);
        if (!name) return;
        let id = cleanId(person && person.id);
        if (!id || usedIds.has(id)) id = uid("person");
        usedIds.add(id);
        next.participants.push({ id: id, name: name });
      });
      next.participants = uniqueNameSet(next.participants);
    } else if (raw.participants === undefined) {
      next.participants = fallback.participants;
    }

    if (Array.isArray(raw.prizes)) {
      const usedPrizeIds = new Set();
      raw.prizes.slice(0, MAX_PRIZES).forEach(function (prize) {
        const name = cleanString(prize && prize.name, 32);
        if (!name) return;
        let total = Number(prize && prize.total);
        if (!Number.isFinite(total)) total = Number(prize && prize.remaining);
        if (!Number.isFinite(total)) total = 1;
        total = Math.max(1, Math.min(999, Math.floor(total)));
        let remaining = Number(prize && prize.remaining);
        if (!Number.isFinite(remaining)) remaining = total;
        remaining = Math.max(0, Math.min(total, Math.floor(remaining)));
        let id = cleanId(prize && prize.id);
        if (!id || usedPrizeIds.has(id)) id = uid("prize");
        usedPrizeIds.add(id);
        next.prizes.push({
          id: id,
          name: name,
          note: cleanString(prize && prize.note, 60),
          total: total,
          remaining: remaining,
          accent: cleanHex(prize && prize.accent, PRIZE_ACCENTS[next.prizes.length % PRIZE_ACCENTS.length])
        });
      });
    } else if (raw.prizes === undefined) {
      next.prizes = fallback.prizes;
    }

    const rawActive = cleanId(raw.activePrizeId);
    next.activePrizeId = next.prizes.some(function (prize) { return prize.id === rawActive; })
      ? rawActive
      : (next.prizes[0] ? next.prizes[0].id : null);

    if (Array.isArray(raw.history)) {
      const seenHistory = new Set();
      raw.history.slice(0, 2000).forEach(function (record, index) {
        if (!record || typeof record !== "object") return;
        const personName = cleanString(record.participant && record.participant.name, MAX_NAME_LENGTH)
          || cleanString(record.name, MAX_NAME_LENGTH);
        if (!personName) return;
        const key = [record.prizeName, personName, record.at].join("|");
        if (seenHistory.has(key)) return;
        seenHistory.add(key);
        const at = Number(record.at);
        next.history.push({
          round: Math.max(1, Math.floor(Number(record.round) || (raw.history.length - index))),
          participant: {
            id: cleanId(record.participant && record.participant.id) || uid("person"),
            name: personName
          },
          participantIndex: Math.max(0, Math.floor(Number(record.participantIndex) || 0)),
          prizeId: cleanId(record.prizeId),
          prizeName: cleanString(record.prizeName, 32) || "幸运礼物",
          prizeNote: cleanString(record.prizeNote, 60),
          prizeAccent: cleanHex(record.prizeAccent, "#d7ff7a"),
          at: Number.isFinite(at) ? at : Date.now(),
          wasRemoved: record.wasRemoved !== false
        });
      });
      next.history = next.history.slice(0, 500);
    }

    if (raw.music && typeof raw.music === "object") {
      next.music.source = raw.music.source === "file" ? "file" : "synth";
      const volume = Number(raw.music.volume);
      next.music.volume = Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume))) : 52;
      next.music.selectedTrackId = cleanId(raw.music.selectedTrackId) || null;
      if (Array.isArray(raw.music.tracks)) {
        const usedTrackIds = new Set();
        raw.music.tracks.slice(0, 60).forEach(function (track) {
          const name = cleanString(track && track.name, 160);
          if (!name) return;
          let id = cleanId(track && track.id);
          if (!id || usedTrackIds.has(id)) id = uid("track");
          usedTrackIds.add(id);
          next.music.tracks.push({
            id: id,
            name: name,
            size: Math.max(0, Number(track && track.size) || 0),
            type: cleanString(track && track.type, 80),
            addedAt: Number(track && track.addedAt) || Date.now(),
            temporary: Boolean(track && track.temporary)
          });
        });
      }
      if (!next.music.tracks.some(function (track) { return track.id === next.music.selectedTrackId; })) {
        next.music.selectedTrackId = next.music.tracks[0] ? next.music.tracks[0].id : null;
      }
      if (next.music.source === "file" && !next.music.selectedTrackId) {
        next.music.source = "synth";
      }
    }

    return next;
  }

  function loadState() {
    let raw = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return defaultState();
    }
    if (!raw) return defaultState();
    try {
      const parsed = JSON.parse(raw);
      const state = sanitizeState(parsed);
      if (state.music && Array.isArray(state.music.tracks)) {
        const before = state.music.tracks.length;
        state.music.tracks = state.music.tracks.filter(function (track) { return !track.temporary; });
        if (before !== state.music.tracks.length) {
          if (!state.music.tracks.some(function (track) { return track.id === state.music.selectedTrackId; })) {
            state.music.selectedTrackId = state.music.tracks[0] ? state.music.tracks[0].id : null;
            if (state.music.source === "file" && !state.music.selectedTrackId) state.music.source = "synth";
          }
        }
      }
      return state;
    } catch (error) {
      return defaultState();
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
  }

  function formatFileSize(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return (value / 1024).toFixed(0) + " KB";
    return (value / 1024 / 1024).toFixed(1) + " MB";
  }

  function formatTime(timestamp) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date(timestamp));
    } catch (error) {
      return "";
    }
  }

  function getDateParts() {
    const now = new Date();
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1, 2);
    const day = pad(now.getDate(), 2);
    const start = new Date(year, 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / 86400000);
    return {
      dateMain: month + "." + day,
      dateYear: String(year),
      session: pad(dayOfYear, 3)
    };
  }

  function secureRandomInt(max) {
    if (!Number.isFinite(max) || max <= 0) return -1;
    const cryptoObj = window.crypto || window.msCrypto;
    if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
      const range = 0x100000000;
      const limit = Math.floor(range / max) * max;
      const bucket = new Uint32Array(1);
      let value = 0;
      do {
        cryptoObj.getRandomValues(bucket);
        value = bucket[0];
      } while (value >= limit);
      return value % max;
    }
    return Math.floor(Math.random() * max);
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  class MediaStore {
    constructor() {
      this.db = null;
      this.memory = new Map();
      this.ready = this.open();
    }

    open() {
      const self = this;
      return new Promise(function (resolve, reject) {
        if (!("indexedDB" in window)) {
          reject(new Error("IndexedDB unavailable"));
          return;
        }
        let request;
        try {
          request = window.indexedDB.open(MEDIA_DB_NAME, 1);
        } catch (error) {
          reject(error);
          return;
        }
        request.onupgradeneeded = function () {
          const db = request.result;
          if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
            db.createObjectStore(MEDIA_STORE_NAME, { keyPath: "id" });
          }
        };
        request.onsuccess = function () {
          self.db = request.result;
          self.db.onversionchange = function () { self.db.close(); self.db = null; };
          resolve(self.db);
        };
        request.onerror = function () {
          reject(request.error || new Error("IndexedDB open failed"));
        };
        request.onblocked = function () {
          reject(new Error("IndexedDB blocked"));
        };
      }).catch(function (error) {
        return Promise.reject(error);
      });
    }

    async put(record) {
      this.memory.set(record.id, record);
      try {
        const db = await this.ready;
        await new Promise(function (resolve, reject) {
          const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
          transaction.objectStore(MEDIA_STORE_NAME).put(record);
          transaction.oncomplete = function () { resolve(); };
          transaction.onerror = function () { reject(transaction.error); };
          transaction.onabort = function () { reject(transaction.error); };
        });
        return true;
      } catch (error) {
        return false;
      }
    }

    async get(id) {
      if (this.memory.has(id)) return this.memory.get(id);
      try {
        const db = await this.ready;
        return await new Promise(function (resolve, reject) {
          const transaction = db.transaction(MEDIA_STORE_NAME, "readonly");
          const request = transaction.objectStore(MEDIA_STORE_NAME).get(id);
          request.onsuccess = function () { resolve(request.result || null); };
          request.onerror = function () { reject(request.error); };
        });
      } catch (error) {
        return null;
      }
    }

    async delete(id) {
      this.memory.delete(id);
      try {
        const db = await this.ready;
        await new Promise(function (resolve, reject) {
          const transaction = db.transaction(MEDIA_STORE_NAME, "readwrite");
          transaction.objectStore(MEDIA_STORE_NAME).delete(id);
          transaction.oncomplete = function () { resolve(); };
          transaction.onerror = function () { reject(transaction.error); };
        });
      } catch (error) {
        // In-memory records are already removed.
      }
    }
  }

  NS.core = {
    STORAGE_KEY: STORAGE_KEY,
    MAX_PARTICIPANTS: MAX_PARTICIPANTS,
    MAX_NAME_LENGTH: MAX_NAME_LENGTH,
    MAX_PRIZES: MAX_PRIZES,
    THEMES: THEMES,
    PRIZE_ACCENTS: PRIZE_ACCENTS,
    DEFAULT_NAMES: DEFAULT_NAMES,
    uid: uid,
    pad: pad,
    defaultState: defaultState,
    sanitizeState: sanitizeState,
    loadState: loadState,
    saveState: saveState,
    cleanString: cleanString,
    formatFileSize: formatFileSize,
    formatTime: formatTime,
    getDateParts: getDateParts,
    secureRandomInt: secureRandomInt,
    downloadBlob: downloadBlob,
    MediaStore: MediaStore
  };
})(window.StellarDraw = window.StellarDraw || {});
