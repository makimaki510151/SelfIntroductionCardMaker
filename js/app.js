/* 自己紹介カードメーカー。ビルド不要。 */
(function () {
  const data = window.CARD_DATA;
  const CATEGORIES = data.CATEGORIES;
  const TEMPLATES = data.TEMPLATES;
  const THEMES = data.THEMES;
  const FONTS = data.FONTS;
  const STORAGE_KEY = "intro-card-maker-v1";
  const SLOT_ORDER = ["kana", "nick", "role", "org", "catch"];
  const FIELD_VARS = [
    "--f-label-font", "--f-label-weight", "--f-value-font", "--f-value-weight",
    "--f-label-color", "--f-value-color", "--f-label-size", "--f-value-size",
  ];
  const PRESETS = ["#1c1917", "#5c534c", "#9f1239", "#c2410c", "#a16207", "#166534", "#155e75", "#1d4ed8", "#6d28d9", "#f8f5f0", "#ffffff", "#f2c14e"];
  const SAMPLE_FIELDS = {
    furigana: "あおば みのり",
    nickname: "みのりん",
    catch: "紙と光と、朝ごはんが好きです。",
    age: "23",
    birthday: "2002年5月12日",
    pronouns: "女性。さん付けでも名前でも",
    blood: "O型",
    zodiac: "牡牛座",
    height: "157cm",
    birthplace: "静岡県",
    lives: "京都市",
    languages: "日本語。英語はメニューが読めるくらい",
    job: "グラフィックデザイナー",
    org: "スタジオ紙吹雪",
    major: "印刷物とパッケージ",
    personality: "おだやかで、好きなことには細かい",
    mbti: "INFP",
    strength: "人の話を最後まで聞ける",
    weakness: "返事をためこむことがある",
    motto: "急がば回れ",
    hobby: "フィルム写真、古本屋、パン作り",
    talent: "人の好きな色を覚えること",
    food: "だし巻き卵、桃、カレー",
    color: "生成りと朱色",
    music: "シティポップ、ピアノトリオ",
    place: "川沿いの古本屋",
    oshi: "書店員さんおすすめの作家",
    rhythm: "夜型。朝ごはんは抜かない",
    drink: "午前はコーヒー、午後はほうじ茶",
    petperson: "猫派。犬は友達",
    dream: "小さな活版の工房を持つこと",
    sns: "@minori.paper",
    topic: "最近食べたパン、おすすめの本屋",
  };
  const PHOTO_SVG = '<svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true"><circle cx="32" cy="24" r="10" fill="currentColor"></circle><path d="M14 54c2.2-12 9.5-16 18-16s15.8 4 18 16" fill="currentColor"></path></svg>';

  const ui = { category: "all" };
  const openDetails = new Set();
  const fontLoads = new Map();
  let state = loadState();
  let cardKey = "";
  let fontToken = 0;
  let saveTimer = 0;
  let toastTimer = 0;
  let modalResolver = null;
  let exporting = false;
  let dragId = "";
  let photoPointer = null;
  let suppressPhotoClick = false;
  let picker = { button: null, kind: "", fieldId: "" };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((key) => {
        const value = props[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    const list = Array.isArray(children) ? children : children == null ? [] : [children];
    list.forEach((child) => {
      if (child == null || child === false) return;
      node.append(child);
    });
    return node;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function clamp(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  }
  function isColor(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
  }
  function norm(value) {
    return String(value || "").toLowerCase().normalize("NFKC").replace(/\s+/g, "");
  }
  function emptyStyle() {
    return { labelFont: "", valueFont: "", labelColor: "", valueColor: "", labelSize: 0, valueSize: 0 };
  }
  function fontById(id) { return FONTS.find((font) => font.id === id) || null; }
  function themeById(id) { return THEMES.find((theme) => theme.id === id) || THEMES[0]; }
  function templateById(id) { return TEMPLATES.find((tpl) => tpl.id === id) || null; }
  function categoryById(id) {
    return CATEGORIES.find((cat) => cat.id === id) || { id: "custom", name: "自由記入", blurb: "" };
  }
  function getField(id) { return state.fields.find((field) => field.id === id) || null; }

  function defaultState() {
    return {
      version: 1,
      photo: "",
      photoX: 50,
      photoY: 50,
      photoZoom: 100,
      name: "",
      theme: "washi",
      photoShape: "auto",
      columns: "auto",
      groupByCategory: true,
      showEmpty: false,
      labelFont: "zen-kaku",
      valueFont: "zen-maru",
      nameFont: "",
      labelColor: "",
      valueColor: "",
      nameColor: "",
      accentColor: "",
      labelSize: 12,
      valueSize: 16,
      nameSize: 44,
      fields: [],
    };
  }

  function normalizeField(raw) {
    if (!raw || typeof raw !== "object") return null;
    const tpl = raw.templateId ? templateById(raw.templateId) : null;
    if (raw.templateId && !tpl) return null;
    const style = raw.style || {};
    const category = tpl ? tpl.category : (CATEGORIES.some((cat) => cat.id === raw.category) ? raw.category : "custom");
    return {
      id: String(raw.id || uid()),
      templateId: tpl ? tpl.id : "",
      category: category,
      label: String(raw.label || (tpl ? tpl.label : "無題")).slice(0, 40),
      value: String(raw.value || "").slice(0, 2000),
      placeholder: tpl ? tpl.placeholder : "",
      hint: tpl ? tpl.hint : "",
      multiline: tpl ? !!tpl.multiline : !!raw.multiline,
      wide: !!raw.wide || !!(tpl && tpl.wide && raw.wide !== false && raw.wide == null),
      slot: tpl ? (tpl.slot || "") : "",
      style: {
        labelFont: fontById(style.labelFont) ? style.labelFont : "",
        valueFont: fontById(style.valueFont) ? style.valueFont : "",
        labelColor: isColor(style.labelColor) ? style.labelColor : "",
        valueColor: isColor(style.valueColor) ? style.valueColor : "",
        labelSize: style.labelSize ? clamp(style.labelSize, 10, 32, 0) : 0,
        valueSize: style.valueSize ? clamp(style.valueSize, 12, 40, 0) : 0,
      },
    };
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object") return null;
    const source = raw.card && typeof raw.card === "object" ? raw.card : raw;
    const base = defaultState();
    const shapes = ["auto", "circle", "rounded", "square", "arch", "bleed"];
    const next = defaultState();
    next.photo = typeof source.photo === "string" && source.photo.indexOf("data:image") === 0 ? source.photo : "";
    next.photoX = clamp(source.photoX, 0, 100, 50);
    next.photoY = clamp(source.photoY, 0, 100, 50);
    next.photoZoom = clamp(source.photoZoom, 100, 300, 100);
    next.name = String(source.name || "").slice(0, 60);
    next.theme = THEMES.some((theme) => theme.id === source.theme) ? source.theme : base.theme;
    next.photoShape = shapes.indexOf(source.photoShape) >= 0 ? source.photoShape : "auto";
    next.columns = source.columns === "1" || source.columns === "2" ? source.columns : "auto";
    next.groupByCategory = source.groupByCategory !== false;
    next.showEmpty = !!source.showEmpty;
    next.labelFont = fontById(source.labelFont) ? source.labelFont : base.labelFont;
    next.valueFont = fontById(source.valueFont) ? source.valueFont : base.valueFont;
    next.nameFont = source.nameFont && fontById(source.nameFont) ? source.nameFont : "";
    next.labelColor = isColor(source.labelColor) ? source.labelColor : "";
    next.valueColor = isColor(source.valueColor) ? source.valueColor : "";
    next.nameColor = isColor(source.nameColor) ? source.nameColor : "";
    next.accentColor = isColor(source.accentColor) ? source.accentColor : "";
    next.labelSize = clamp(source.labelSize, 10, 24, base.labelSize);
    next.valueSize = clamp(source.valueSize, 12, 32, base.valueSize);
    next.nameSize = clamp(source.nameSize, 26, 72, base.nameSize);
    const seen = new Set();
    next.fields = (Array.isArray(source.fields) ? source.fields : []).map(normalizeField).filter((field) => {
      if (!field) return false;
      if (!field.templateId) return true;
      if (seen.has(field.templateId)) return false;
      seen.add(field.templateId);
      return true;
    });
    return next;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw)) || defaultState();
    } catch (err) {
      return defaultState();
    }
  }

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  function saveNow() {
    const status = $("#saveStatus");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      status.textContent = "このブラウザに自動保存しました";
    } catch (err) {
      try {
        const copy = Object.assign({}, state, { photo: "" });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
        status.textContent = "写真以外を自動保存しました。写真が大きすぎたためです";
      } catch (err2) {
        status.textContent = "自動保存に失敗しました。バックアップからファイルに残せます";
      }
    }
  }

  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 3400);
  }

  function confirmModal(title, body, okLabel) {
    $("#modalTitle").textContent = title;
    $("#modalBody").textContent = body;
    $("#modalOk").textContent = okLabel || "続ける";
    $("#modal").hidden = false;
    $("#modalOk").focus();
    return new Promise((resolve) => { modalResolver = resolve; });
  }
  function closeModal(result) {
    $("#modal").hidden = true;
    if (modalResolver) modalResolver(result);
    modalResolver = null;
  }

  function ensureFont(font) {
    if (!font || !font.google) return Promise.resolve();
    if (fontLoads.has(font.id)) return fontLoads.get(font.id);
    const pending = new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=" + font.google + "&display=swap";
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
    fontLoads.set(font.id, pending);
    return pending;
  }
  function usedFonts() {
    const ids = [state.labelFont, state.valueFont];
    if (state.nameFont) ids.push(state.nameFont);
    state.fields.forEach((field) => {
      if (field.style.labelFont) ids.push(field.style.labelFont);
      if (field.style.valueFont) ids.push(field.style.valueFont);
    });
    const seen = new Set();
    return ids.map(fontById).filter((font) => {
      if (!font || seen.has(font.id)) return false;
      seen.add(font.id);
      return true;
    });
  }
  function ensureUsedFonts() {
    const fonts = usedFonts();
    return Promise.all(fonts.map(ensureFont)).then(() => {
      return Promise.all(fonts.map((font) => {
        if (!font.google) return Promise.resolve();
        return document.fonts.load(font.valueWeight + ' 32px "' + font.name + '"').catch(() => {});
      }));
    }).then(() => document.fonts.ready);
  }
  function refreshFonts() {
    const token = ++fontToken;
    ensureUsedFonts().then(() => {
      if (token !== fontToken) return;
      renderPages();
      fitPreview();
    });
  }

  function makeField(tpl, extra) {
    extra = extra || {};
    return {
      id: uid(),
      templateId: tpl ? tpl.id : "",
      category: tpl ? tpl.category : "custom",
      label: String(tpl ? tpl.label : (extra.label || "無題")).slice(0, 40),
      value: extra.value || "",
      placeholder: tpl ? tpl.placeholder : "",
      hint: tpl ? tpl.hint : "",
      multiline: tpl ? !!tpl.multiline : !!extra.multiline,
      wide: tpl ? !!tpl.wide : !!extra.wide,
      slot: tpl && tpl.slot ? tpl.slot : "",
      style: emptyStyle(),
    };
  }
  function hasCustomStyle(field) {
    const style = field.style || emptyStyle();
    return !!(style.labelFont || style.valueFont || style.labelColor || style.valueColor || style.labelSize || style.valueSize);
  }
  function fieldVisible(field) {
    if (state.showEmpty) return true;
    return !!(field.value && field.value.trim());
  }
  function resolvedColumns() {
    if (state.columns === "1" || state.columns === "2") return state.columns;
    const count = state.fields.filter((field) => !field.slot && fieldVisible(field)).length;
    return count > 6 ? "2" : "1";
  }
  function clusteredBody() {
    const fields = state.fields.filter((field) => !field.slot && fieldVisible(field));
    if (!state.groupByCategory) return [{ category: "", fields: fields }];
    const map = new Map();
    fields.forEach((field) => {
      if (!map.has(field.category)) map.set(field.category, []);
      map.get(field.category).push(field);
    });
    const groups = [];
    CATEGORIES.forEach((cat) => {
      if (map.has(cat.id)) groups.push({ category: cat.id, fields: map.get(cat.id) });
    });
    return groups;
  }
  function structureKey() {
    const parts = [state.groupByCategory ? "g" : "f"];
    clusteredBody().forEach((group) => {
      parts.push(group.category + "=" + group.fields.map((field) => field.id).join(","));
    });
    return parts.join("|");
  }
  function editorClusters() {
    const slots = state.fields.filter((field) => field.slot).sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
    const body = state.fields.filter((field) => !field.slot);
    const groups = [];
    if (slots.length) groups.push({ id: "slots", name: "カードの上部", fields: slots });
    if (!state.groupByCategory) {
      if (body.length) groups.push({ id: "flat", name: "", fields: body });
      return groups;
    }
    const map = new Map();
    body.forEach((field) => {
      if (!map.has(field.category)) map.set(field.category, []);
      map.get(field.category).push(field);
    });
    CATEGORIES.forEach((cat) => {
      if (map.has(cat.id)) groups.push({ id: cat.id, name: cat.name, fields: map.get(cat.id) });
    });
    return groups;
  }

  function fileBase() {
    const name = state.name.trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").slice(0, 40);
    return name ? "自己紹介カード_" + name : "自己紹介カード";
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        reject(new Error("画像ファイルを選んでください"));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const g = canvas.getContext("2d");
        if (file.type !== "image/png") {
          g.fillStyle = "#ffffff";
          g.fillRect(0, 0, w, h);
        }
        g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("この画像は読み込めませんでした"));
      };
      img.src = url;
    });
  }
  async function setPhotoFile(file) {
    try {
      state.photo = await readImage(file);
      state.photoX = 50;
      state.photoY = 50;
      state.photoZoom = 100;
      syncControls();
      updateCard();
      saveSoon();
    } catch (err) {
      toast(err.message || "画像を読み込めませんでした");
    }
  }
  function bindDrop(target) {
    target.addEventListener("dragover", (event) => {
      if (!event.dataTransfer || !event.dataTransfer.types || !Array.from(event.dataTransfer.types).includes("Files")) return;
      event.preventDefault();
      target.classList.add("is-drag");
    });
    target.addEventListener("dragleave", () => target.classList.remove("is-drag"));
    target.addEventListener("drop", (event) => {
      if (!event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files.length) return;
      event.preventDefault();
      target.classList.remove("is-drag");
      setPhotoFile(event.dataTransfer.files[0]);
    });
  }

  function makeSamplePhoto() {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const g = canvas.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 0, 640);
    bg.addColorStop(0, "#f7d7c4");
    bg.addColorStop(1, "#e7b294");
    g.fillStyle = bg;
    g.fillRect(0, 0, 640, 640);
    g.fillStyle = "#2f5d50";
    g.beginPath();
    g.ellipse(320, 690, 250, 220, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = "#f4d7c6";
    g.fillRect(286, 430, 68, 90);
    g.fillStyle = "#3a312b";
    g.beginPath();
    g.arc(320, 300, 156, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f6dece";
    g.beginPath();
    g.ellipse(320, 318, 112, 126, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#3a312b";
    g.beginPath();
    g.ellipse(320, 236, 118, 78, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.ellipse(214, 300, 34, 78, 0.3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(426, 300, 34, 78, -0.3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#2b241f";
    g.beginPath();
    g.ellipse(278, 326, 7, 8, 0, 0, Math.PI * 2);
    g.ellipse(362, 326, 7, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#c46b5a";
    g.lineWidth = 5;
    g.lineCap = "round";
    g.beginPath();
    g.arc(320, 348, 24, 0.25, Math.PI - 0.25);
    g.stroke();
    g.fillStyle = "rgba(232, 140, 130, 0.5)";
    g.beginPath();
    g.ellipse(246, 356, 16, 10, 0, 0, Math.PI * 2);
    g.ellipse(394, 356, 16, 10, 0, 0, Math.PI * 2);
    g.fill();
    return canvas.toDataURL("image/png");
  }

  function applyFieldStyle(node, field) {
    FIELD_VARS.forEach((name) => node.style.removeProperty(name));
    if (!field || !field.style) {
      paintFieldRules(node, null);
      return;
    }
    const style = field.style;
    if (style.labelFont) {
      const font = fontById(style.labelFont);
      if (font) {
        node.style.setProperty("--f-label-font", font.family);
        node.style.setProperty("--f-label-weight", String(font.labelWeight));
      }
    }
    if (style.valueFont) {
      const font = fontById(style.valueFont);
      if (font) {
        node.style.setProperty("--f-value-font", font.family);
        node.style.setProperty("--f-value-weight", String(font.valueWeight));
      }
    }
    if (style.labelColor) node.style.setProperty("--f-label-color", style.labelColor);
    if (style.valueColor) node.style.setProperty("--f-value-color", style.valueColor);
    if (style.labelSize) node.style.setProperty("--f-label-size", style.labelSize + "px");
    if (style.valueSize) node.style.setProperty("--f-value-size", style.valueSize + "px");
    paintFieldRules(node, style);
  }
  function notebookRule() {
    const size = Math.max(state.valueSize, state.labelSize);
    return Math.max(28, Math.ceil((size + 12) / 2) * 2);
  }
  function ruleSpan(size, rule) {
    const need = Math.ceil(size * 1.15 + 8);
    return Math.max(1, Math.ceil(need / rule));
  }
  function ruledImage(line) {
    return "repeating-linear-gradient(to bottom, #fffef8 0, #fffef8 " + (line - 1) + "px, rgba(90,140,180,0.62) " + (line - 1) + "px, rgba(90,140,180,0.62) " + line + "px)";
  }
  function clearRuled(node) {
    node.style.lineHeight = "";
    node.style.backgroundColor = "";
    node.style.backgroundImage = "";
  }
  function paintRuled(node, line, rule) {
    if (!node) return;
    if (!rule) {
      clearRuled(node);
      return;
    }
    node.style.lineHeight = line + "px";
    if (line > rule) {
      node.style.backgroundColor = "#fffef8";
      node.style.backgroundImage = ruledImage(line);
    } else {
      node.style.backgroundColor = "";
      node.style.backgroundImage = "";
    }
  }
  function paintFieldRules(node, style) {
    const rule = state.theme === "notebook" ? notebookRule() : 0;
    const labelNode = node.querySelector(".field-label");
    const valueNode = node.querySelector(".field-value") || (node.classList.contains("js-value") ? node : null);
    paintRuled(labelNode, rule ? ruleSpan((style && style.labelSize) || state.labelSize, rule) * rule : 0, rule);
    paintRuled(valueNode, rule ? ruleSpan((style && style.valueSize) || state.valueSize, rule) * rule : 0, rule);
  }
  function applyNotebookLines(card) {
    if (!card) return;
    const notebook = state.theme === "notebook";
    const rule = notebook ? notebookRule() : 0;
    if (!notebook) {
      card.style.removeProperty("--rule");
      card.style.removeProperty("--name-lh");
      card.style.backgroundImage = "";
      const nameEl = card.querySelector(".card-name");
      if (nameEl) clearRuled(nameEl);
      card.querySelectorAll(".group-title, .card-empty-hint").forEach((node) => clearRuled(node));
      return;
    }
    card.style.setProperty("--rule", rule + "px");
    const nameLh = ruleSpan(state.nameSize, rule) * rule;
    card.style.setProperty("--name-lh", nameLh + "px");
    card.style.backgroundImage = "repeating-linear-gradient(to bottom, rgba(255,254,248,0) 0, rgba(255,254,248,0) " + (rule - 1) + "px, rgba(90,140,180,0.62) " + (rule - 1) + "px, rgba(90,140,180,0.62) " + rule + "px)";
    paintRuled(card.querySelector(".card-name"), nameLh, rule);
    card.querySelectorAll(".group-title, .card-empty-hint").forEach((node) => paintRuled(node, rule, rule));
  }
  function applyPhotoVars(node) {
    if (!node) return;
    node.style.setProperty("--photo-x", state.photoX + "%");
    node.style.setProperty("--photo-y", state.photoY + "%");
    node.style.setProperty("--photo-zoom", String(state.photoZoom / 100));
  }
  function axisLabel(value, low, high) {
    if (value <= 5) return low;
    if (value >= 95) return high;
    if (value >= 45 && value <= 55) return "中央";
    return value + "%";
  }
  function syncPhotoControls() {
    const box = $("#photoAdjust");
    if (!box) return;
    box.hidden = !state.photo;
    $("#photoX").value = state.photoX;
    $("#photoY").value = state.photoY;
    $("#photoZoom").value = state.photoZoom;
    $("#photoXOut").textContent = axisLabel(state.photoX, "左", "右");
    $("#photoYOut").textContent = axisLabel(state.photoY, "上", "下");
    $("#photoZoomOut").textContent = state.photoZoom;
  }
  function stageScale() {
    const match = /scale\(([\d.]+)\)/.exec($("#stage").style.transform || "");
    return match ? Number(match[1]) || 1 : 1;
  }
  function panBy(frame, dx, dy) {
    const img = frame.querySelector("img");
    if (!img || !img.naturalWidth || !frame.clientWidth || !frame.clientHeight) return;
    const zoom = state.photoZoom / 100;
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    const cover = Math.max(fw / img.naturalWidth, fh / img.naturalHeight);
    const dw = img.naturalWidth * cover * zoom;
    const dh = img.naturalHeight * cover * zoom;
    if (dw > fw + 0.5) {
      const span = fw - dw;
      const next = Math.min(0, Math.max(span, (state.photoX / 100) * span + dx));
      state.photoX = Math.round((next / span) * 100);
    }
    if (dh > fh + 0.5) {
      const span = fh - dh;
      const next = Math.min(0, Math.max(span, (state.photoY / 100) * span + dy));
      state.photoY = Math.round((next / span) * 100);
    }
  }
  function setOrClear(node, name, value) {
    if (value) node.style.setProperty(name, value);
    else node.style.removeProperty(name);
  }
  function applyAppearance(card) {
    if (!card) return;
    const theme = themeById(state.theme);
    const labelFont = fontById(state.labelFont) || fontById("zen-kaku");
    const valueFont = fontById(state.valueFont) || fontById("zen-maru");
    card.dataset.theme = theme.id;
    card.dataset.layout = theme.layout;
    card.dataset.shape = state.photoShape === "auto" ? theme.photoShape : state.photoShape;
    card.dataset.columns = resolvedColumns();
    card.style.setProperty("--label-font", labelFont.family);
    card.style.setProperty("--label-weight", String(labelFont.labelWeight));
    card.style.setProperty("--value-font", valueFont.family);
    card.style.setProperty("--value-weight", String(valueFont.valueWeight));
    card.style.setProperty("--label-size", state.labelSize + "px");
    card.style.setProperty("--value-size", state.valueSize + "px");
    card.style.setProperty("--name-size", state.nameSize + "px");
    if (state.nameFont && fontById(state.nameFont)) {
      const nameFont = fontById(state.nameFont);
      card.style.setProperty("--name-font", nameFont.family);
      card.style.setProperty("--name-weight", String(nameFont.labelWeight));
    } else {
      card.style.removeProperty("--name-font");
      card.style.removeProperty("--name-weight");
    }
    setOrClear(card, "--label-color", state.labelColor);
    setOrClear(card, "--value-color", state.valueColor);
    setOrClear(card, "--name-color", state.nameColor);
    setOrClear(card, "--accent", state.accentColor);
    applyPhotoVars(card);
  }

  function pageOverflows(card) {
    const body = card.querySelector(".card-body");
    const limit = card.clientHeight - 22;
    if (body && body.offsetTop + body.offsetHeight > limit) return true;
    return card.scrollHeight > card.clientHeight + 1;
  }
  function makeFieldNode(item) {
    const field = item.field;
    const value = el("p", { class: "field-value", text: item.text });
    if (!String(item.text || "").trim()) value.classList.add("is-blank");
    const node = el("div", { class: "field", "data-field-id": field.id, "data-wide": field.wide ? "true" : "false" }, [
      el("p", { class: "field-label", text: (field.label || "無題") + (item.continued ? "（続き）" : "") }),
      value,
    ]);
    applyFieldStyle(node, field);
    return node;
  }
  function makeCard(continued) {
    const card = el("article", { class: "card" });
    card.setAttribute("aria-label", continued ? "自己紹介カードの続き" : "自己紹介カードのプレビュー");
    const head = [];
    if (!continued) {
      const fallback = el("div", { class: "photo-fallback" });
      fallback.innerHTML = PHOTO_SVG;
      head.push(
        el("div", { class: "photo-frame" }, [
          el("img", { class: "photo-img", alt: "プロフィール写真", draggable: "false" }),
          fallback,
        ]),
        el("div", { class: "name-block" }, [
          el("p", { class: "card-kana js-value is-hidden", "data-slot": "kana" }),
          el("h1", { class: "card-name is-empty" }, [
            el("span", { class: "name-text" }),
            el("span", { class: "name-placeholder", "data-export-hide": "true", text: "なまえ" }),
          ]),
          el("p", { class: "card-nick js-value is-hidden", "data-slot": "nick" }),
          el("p", { class: "card-role js-value is-hidden", "data-slot": "role" }),
          el("p", { class: "card-org js-value is-hidden", "data-slot": "org" }),
          el("p", { class: "card-catch js-value is-hidden", "data-slot": "catch" }),
        ])
      );
    } else {
      head.push(el("p", { class: "continue-name", text: state.name.trim() || "自己紹介" }));
    }
    card.append(
      el("div", { class: "deco deco-a", "aria-hidden": "true" }),
      el("div", { class: "deco deco-b", "aria-hidden": "true" }),
      el("header", { class: continued ? "card-head card-continue" : "card-head" }, head),
      el("div", { class: "card-body" }),
      el("p", { class: "page-no", "aria-hidden": "true" })
    );
    return card;
  }
  function fillHeader(card) {
    const img = card.querySelector(".photo-img");
    const frame = card.querySelector(".photo-frame");
    if (state.photo) {
      img.src = state.photo;
      frame.classList.add("has-photo");
      img.alt = state.name.trim() ? state.name.trim() + "の写真" : "プロフィール写真";
    }
    const named = !!state.name.trim();
    const nameEl = card.querySelector(".card-name");
    nameEl.classList.toggle("is-empty", !named);
    nameEl.querySelector(".name-text").textContent = named ? state.name.trim() : "";
    SLOT_ORDER.forEach((slot) => {
      const node = card.querySelector('[data-slot="' + slot + '"]');
      const field = state.fields.find((item) => item.slot === slot) || null;
      const show = !!(field && fieldVisible(field));
      node.classList.toggle("is-hidden", !show);
      node.setAttribute("aria-hidden", show ? "false" : "true");
      if (field) node.dataset.fieldId = field.id;
      else delete node.dataset.fieldId;
      node.textContent = show ? field.value : "";
      applyFieldStyle(node, show ? field : null);
    });
  }
  function splitToFit(node, card, full) {
    const valueEl = node.querySelector(".field-value");
    if (!valueEl || full.length <= 1) return "";
    let lo = 0;
    let hi = full.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      valueEl.textContent = full.slice(0, mid);
      if (pageOverflows(card)) hi = mid - 1;
      else lo = mid;
    }
    if (lo <= 0) {
      valueEl.textContent = full.slice(0, 1);
      return full.slice(1);
    }
    let kept = full.slice(0, lo).replace(/\s+$/, "");
    const nl = kept.lastIndexOf("\n");
    if (nl >= Math.floor(kept.length * 0.45)) kept = kept.slice(0, nl).replace(/\s+$/, "");
    if (!kept) kept = full.slice(0, 1);
    valueEl.textContent = kept;
    if (pageOverflows(card)) {
      kept = full.slice(0, lo).replace(/\s+$/, "");
      valueEl.textContent = kept;
    }
    return full.slice(kept.length).replace(/^\s+/, "");
  }
  function renderPages() {
    const stage = $("#stage");
    if (!stage) return;
    const queue = [];
    clusteredBody().forEach((group) => {
      const groupName = state.groupByCategory && group.category ? categoryById(group.category).name : "";
      group.fields.forEach((field, index) => {
        queue.push({
          field: field,
          groupName: groupName,
          showTitle: index === 0 && !!groupName,
          text: field.value,
          continued: false,
        });
      });
    });
    stage.replaceChildren();
    const cards = [];
    let card = null;
    let body = null;
    let group = null;
    function startPage(continued) {
      card = makeCard(continued);
      applyAppearance(card);
      applyNotebookLines(card);
      stage.appendChild(card);
      cards.push(card);
      body = card.querySelector(".card-body");
      group = null;
      if (!continued) fillHeader(card);
    }
    function appendItem(item) {
      if (!group || group.dataset.cat !== item.groupName) {
        group = el("section", { class: "group" });
        group.dataset.cat = item.groupName;
        if (item.showTitle && item.groupName) {
          const title = el("p", { class: "group-title", text: item.groupName });
          group.appendChild(title);
          if (state.theme === "notebook") paintRuled(title, notebookRule(), notebookRule());
        }
        group.appendChild(el("div", { class: "group-fields" }));
        body.appendChild(group);
      }
      const node = makeFieldNode(item);
      group.querySelector(".group-fields").appendChild(node);
      return node;
    }
    function removeItem(node) {
      const wrap = node.parentElement;
      const section = wrap.parentElement;
      node.remove();
      if (!wrap.children.length) {
        section.remove();
        if (group === section) group = null;
      }
    }
    startPage(false);
    if (!queue.length) {
      body.appendChild(el("p", { class: "card-empty-hint", "data-export-hide": "true", text: "追加した欄が、ここに並びます" }));
    }
    let guard = 0;
    while (queue.length && guard < 400) {
      guard += 1;
      const item = queue[0];
      const node = appendItem(item);
      if (!pageOverflows(card)) {
        queue.shift();
        continue;
      }
      removeItem(node);
      if (card.querySelector(".field") || !card.querySelector(".card-continue")) {
        item.showTitle = !!item.groupName;
        startPage(true);
        continue;
      }
      const placed = appendItem(item);
      const rest = splitToFit(placed, card, item.text);
      queue.shift();
      if (rest) {
        queue.unshift({
          field: item.field,
          groupName: item.groupName,
          showTitle: !!item.groupName,
          text: rest,
          continued: true,
        });
      }
    }
    cards.forEach((page, index) => {
      const mark = page.querySelector(".page-no");
      if (cards.length < 2) mark.remove();
      else mark.textContent = (index + 1) + " / " + cards.length;
    });
    syncPhotoEditor();
  }
  function syncPhotoEditor() {
    const img = $("#photoThumb");
    const empty = $("#photoEmpty");
    const remove = $("#photoRemove");
    if (state.photo) {
      if (img.getAttribute("src") !== state.photo) img.src = state.photo;
      img.hidden = false;
      empty.hidden = true;
      remove.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
      empty.hidden = false;
      remove.hidden = true;
    }
    $("#photoDrop").classList.toggle("has-photo", !!state.photo);
    applyPhotoVars($("#photoDrop"));
    syncPhotoControls();
  }
  function updateCard(options) {
    renderPages();
    if (options && options.fonts) refreshFonts();
    else requestAnimationFrame(fitPreview);
  }
  function fitPreview() {
    const pane = $("#previewPane");
    const scaler = $("#scaler");
    const stage = $("#stage");
    if (!pane || !stage || !stage.offsetWidth) return;
    const scale = Math.min(1, Math.max(260, pane.clientWidth - 28) / stage.offsetWidth);
    stage.style.transform = "scale(" + scale + ")";
    scaler.style.width = Math.ceil(stage.offsetWidth * scale) + "px";
    scaler.style.height = Math.ceil(stage.offsetHeight * scale) + "px";
    const pages = $$("#stage .card").length;
    const fit = scale < 0.985 ? "画面に合わせて " + Math.round(scale * 100) + "% で表示中。" : "";
    const count = pages > 1 ? pages + "枚に分かれます。" : "1枚に収まります。";
    $("#scaleNote").textContent = fit + count + "書き出しは16:9（1920×1080）です。";
  }

  function fontButtonLabel(id, kind) {
    if (!id) {
      if (kind === "name") return "内容の書体に合わせる";
      if (kind === "field-label") return "欄の全体設定に合わせる";
      return "内容の全体設定に合わせる";
    }
    const font = fontById(id);
    return font ? font.name : "書体を選ぶ";
  }
  function syncFontButtons() {
    $("#labelFontBtn").textContent = (fontById(state.labelFont) || {}).name || "書体を選ぶ";
    $("#valueFontBtn").textContent = (fontById(state.valueFont) || {}).name || "書体を選ぶ";
    $("#nameFontBtn").textContent = state.nameFont && fontById(state.nameFont) ? fontById(state.nameFont).name : "内容の書体に合わせる";
  }
  function syncThemeSelection() {
    $$(".theme-btn").forEach((btn) => {
      const on = btn.dataset.theme === state.theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function syncControls() {
    const theme = themeById(state.theme);
    $$("#shapeChoices button").forEach((btn) => {
      const on = btn.dataset.shape === state.photoShape;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$("#columnChoices button").forEach((btn) => {
      const on = btn.dataset.columns === state.columns;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $("#groupToggle").checked = !!state.groupByCategory;
    $("#emptyToggle").checked = !!state.showEmpty;
    $("#labelSize").value = state.labelSize;
    $("#valueSize").value = state.valueSize;
    $("#nameSize").value = state.nameSize;
    $("#labelSizeOut").textContent = state.labelSize;
    $("#valueSizeOut").textContent = state.valueSize;
    $("#nameSizeOut").textContent = state.nameSize;
    $("#labelColor").value = state.labelColor || theme.swatch.label;
    $("#valueColor").value = state.valueColor || theme.swatch.value;
    $("#nameColor").value = state.nameColor || theme.swatch.name;
    $("#accentColor").value = state.accentColor || theme.swatch.accent;
    $$(".js-color-reset").forEach((btn) => { btn.disabled = !state[btn.dataset.colorKey]; });
    if (document.activeElement !== $("#nameInput")) $("#nameInput").value = state.name;
    syncFontButtons();
    syncThemeSelection();
    document.body.dataset.mobileView = document.body.dataset.mobileView || "edit";
  }

  function renderThemeList() {
    $("#themeList").replaceChildren(...THEMES.map((theme) => {
      const btn = el("button", { type: "button", class: "theme-btn", "data-theme": theme.id });
      btn.style.setProperty("--swatch-bg", theme.swatch.bg);
      btn.style.setProperty("--swatch-ink", theme.swatch.ink);
      btn.style.setProperty("--swatch-accent", theme.swatch.accent);
      btn.append(
        el("span", { class: "theme-swatch" }, [
          el("span", { class: "swatch-photo" }),
          el("span", { class: "swatch-lines" }, [el("span"), el("span"), el("span")]),
        ]),
        el("span", { class: "theme-name", text: theme.name }),
        el("span", { class: "theme-desc", text: theme.description })
      );
      return btn;
    }));
    syncThemeSelection();
  }
  function renderSwatches() {
    $$(".swatches").forEach((box) => {
      box.replaceChildren(...PRESETS.map((color) => {
        const btn = el("button", { type: "button", class: "swatch", "data-color": color, "aria-label": color });
        btn.style.background = color;
        return btn;
      }));
    });
  }
  function syncChips() {
    $$("#categoryChips button").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.category === ui.category));
  }
  function renderChips() {
    const cats = [{ id: "all", name: "すべて" }].concat(CATEGORIES.filter((cat) => cat.id !== "custom"));
    $("#categoryChips").replaceChildren(...cats.map((cat) => {
      const count = cat.id === "all" ? TEMPLATES.length : TEMPLATES.filter((tpl) => tpl.category === cat.id).length;
      return el("button", { type: "button", "data-category": cat.id, text: cat.name + " " + count });
    }));
    syncChips();
  }
  function renderTemplates() {
    const query = norm($("#templateSearch").value);
    let items = TEMPLATES.filter((tpl) => {
      if (!query && ui.category !== "all" && tpl.category !== ui.category) return false;
      if (!query) return true;
      const cat = categoryById(tpl.category);
      return [tpl.label, tpl.hint, tpl.placeholder, cat.name].some((value) => norm(value).includes(query));
    });
    const root = $("#templateList");
    if (!items.length) {
      root.replaceChildren(el("p", { class: "empty-copy", text: "一致する欄がありません。下の自由な欄で追加できます。" }));
      return;
    }
    const blocks = [];
    if (query) blocks.push({ name: "検索結果", items: items });
    else if (ui.category === "all") {
      CATEGORIES.forEach((cat) => {
        const group = items.filter((tpl) => tpl.category === cat.id);
        if (group.length) blocks.push({ name: cat.name, items: group });
      });
    } else blocks.push({ name: "", items: items });
    root.replaceChildren(...blocks.map((block) => {
      const wrap = el("div", { class: "tpl-block" });
      if (block.name) wrap.append(el("p", { class: "tpl-cat", text: block.name }));
      const grid = el("div", { class: "tpl-grid" });
      block.items.forEach((tpl) => {
        const added = state.fields.some((field) => field.templateId === tpl.id);
        const btn = el("button", { type: "button", class: added ? "tpl is-added" : "tpl", "data-template": tpl.id });
        const label = el("span", { class: "tpl-label" });
        label.append(document.createTextNode(tpl.label));
        if (tpl.slot) label.append(el("span", { class: "tpl-mark", text: "上部" }));
        btn.append(label, el("span", { class: "tpl-hint", text: added ? "追加済み。クリックでその欄へ" : tpl.hint }));
        grid.append(btn);
      });
      wrap.append(grid);
      return wrap;
    }));
  }

  function autosize(area) {
    area.style.height = "auto";
    area.style.height = Math.min(area.scrollHeight, 280) + "px";
  }
  function syncEmpty(row, field) {
    const badge = row.querySelector(".js-empty-badge");
    if (badge) badge.hidden = !!field.value.trim();
    row.classList.toggle("is-blank", !field.value.trim());
  }
  function syncStyleBadge(row, field) {
    const badge = row.querySelector(".js-style-badge");
    if (badge) badge.hidden = !hasCustomStyle(field);
  }
  function jumpToAdd() {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    $("#sec-add").scrollIntoView({ block: "start" });
    root.style.scrollBehavior = previous;
    $("#templateSearch").focus({ preventScroll: true });
  }
  function syncJumpAdd() {
    const btn = $("#jumpAdd");
    const narrow = window.matchMedia("(max-width: 1040px)").matches;
    const previewing = narrow && document.body.dataset.mobileView === "preview";
    const rect = $("#sec-add").getBoundingClientRect();
    const addVisible = rect.top < window.innerHeight * 0.4 && rect.bottom > 72;
    const back = $("#backToAdd").getBoundingClientRect();
    const backVisible = back.bottom > 0 && back.top < window.innerHeight;
    btn.hidden = previewing || addVisible || backVisible;
    if (btn.hidden) return;
    const column = document.querySelector(".editor-column").getBoundingClientRect();
    btn.style.left = Math.max(12, column.left) + "px";
  }
  function focusField(id) {
    const row = document.querySelector('[data-editor-id="' + id + '"]');
    if (!row) return;
    row.classList.add("is-flash");
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = row.querySelector(".js-value");
    if (input) input.focus();
    setTimeout(() => row.classList.remove("is-flash"), 1200);
  }
  function renderStyleControl(field, kind, theme) {
    const isLabel = kind === "label";
    const fontKey = isLabel ? "labelFont" : "valueFont";
    const colorKey = isLabel ? "labelColor" : "valueColor";
    const sizeKey = isLabel ? "labelSize" : "valueSize";
    const fontKind = isLabel ? "field-label" : "field-value";
    const globalSize = isLabel ? state.labelSize : state.valueSize;
    const globalColor = isLabel ? (state.labelColor || theme.swatch.label) : (state.valueColor || theme.swatch.value);
    const box = el("div");
    box.append(el("h4", { text: field.slot ? "この文字" : (isLabel ? "欄の文字" : "内容の文字") }));
    box.append(el("button", {
      type: "button",
      class: "font-btn js-font-btn",
      "data-font-kind": fontKind,
      text: fontButtonLabel(field.style[fontKey], fontKind),
    }));
    const colorRow = el("div", { class: "color-row" });
    const color = el("input", { type: "color", "data-color-key": colorKey, "aria-label": (isLabel ? "欄" : "内容") + "の色" });
    color.value = field.style[colorKey] || globalColor;
    colorRow.append(color, el("button", { type: "button", class: "text-btn js-field-color-reset", "data-color-key": colorKey, text: "標準の色" }));
    box.append(colorRow);
    const sizeLabel = el("label", { class: "slider", text: "大きさ" });
    const range = el("input", { type: "range", min: isLabel ? "10" : "12", max: isLabel ? "28" : "36", "data-size-key": sizeKey });
    range.value = field.style[sizeKey] || globalSize;
    sizeLabel.append(range);
    box.append(sizeLabel, el("button", { type: "button", class: "text-btn js-size-reset", "data-size-key": sizeKey, text: "標準の大きさ" }));
    return box;
  }
  function renderFieldRow(field, index, total, opened) {
    const theme = themeById(state.theme);
    const row = el("article", { class: field.value.trim() ? "editor-field" : "editor-field is-blank", "data-editor-id": field.id });
    const top = el("div", { class: "editor-field-top" });
    if (!field.slot) top.append(el("span", { class: "drag-handle js-drag", draggable: "true", title: "ドラッグして並べ替え", "aria-hidden": "true" }));
    const badges = el("div", { class: "badges" });
    badges.append(el("span", { class: "badge", text: categoryById(field.category).name }));
    if (field.slot) badges.append(el("span", { class: "badge badge-accent", text: "カード上部" }));
    const emptyBadge = el("span", { class: "badge js-empty-badge", text: "未入力" });
    emptyBadge.hidden = !!field.value.trim();
    badges.append(emptyBadge);
    const styleBadge = el("span", { class: "badge badge-accent js-style-badge", text: "個別の文字設定" });
    styleBadge.hidden = !hasCustomStyle(field);
    badges.append(styleBadge);
    const buttons = el("div", { class: "icon-buttons" });
    if (!field.slot) {
      const up = el("button", { type: "button", class: "js-up", "aria-label": "上へ", text: "↑" });
      const down = el("button", { type: "button", class: "js-down", "aria-label": "下へ", text: "↓" });
      up.disabled = index === 0;
      down.disabled = index === total - 1;
      buttons.append(up, down);
    }
    buttons.append(el("button", { type: "button", class: "js-delete", text: "削除" }));
    top.append(badges, buttons);
    const labelWrap = el("label", { class: "label-edit", text: "欄の名前" });
    const labelInput = el("input", { class: "js-label", maxlength: "40", value: field.label });
    labelWrap.append(labelInput);
    const valueWrap = el("label", { class: "value-edit", text: "内容" });
    const area = el("textarea", { class: "js-value", rows: field.multiline ? "4" : "2", placeholder: field.placeholder || "" });
    area.value = field.value;
    valueWrap.append(area);
    const details = el("details");
    if (opened.has(field.id)) details.setAttribute("open", "");
    details.append(el("summary", { text: field.slot ? "この文字の書体と色" : "この欄だけ変える" }));
    const grid = el("div", { class: field.slot ? "" : "style-grid" });
    if (!field.slot) grid.append(renderStyleControl(field, "label", theme));
    grid.append(renderStyleControl(field, "value", theme));
    details.append(grid);
    if (!field.slot) {
      const wide = el("label", { class: "check wide-check" });
      const box = el("input", { type: "checkbox", class: "js-wide" });
      box.checked = !!field.wide;
      wide.append(box, document.createTextNode("カードでは幅いっぱいに表示"));
      details.append(wide);
    }
    details.append(el("button", { type: "button", class: "text-btn js-style-reset", text: "この欄の文字設定をリセット" }));
    row.append(top, labelWrap);
    if (field.hint) row.append(el("p", { class: "field-hint", text: field.hint }));
    row.append(valueWrap, details);
    return row;
  }
  function renderEditor(focusId) {
    const opened = new Set(openDetails);
    const list = $("#fieldList");
    const clusters = editorClusters();
    if (!state.fields.length) {
      list.replaceChildren(el("p", { class: "empty-copy", text: "まだ追加した欄はありません。上のテンプレートから選ぶか、自由な欄を作れます。" }));
      return;
    }
    list.replaceChildren(...clusters.map((cluster) => {
      const group = el("section", { class: "editor-group" });
      if (cluster.name) group.append(el("h3", { text: cluster.name }));
      cluster.fields.forEach((field, index) => group.append(renderFieldRow(field, index, cluster.fields.length, opened)));
      return group;
    }));
    openDetails.clear();
    $$("#fieldList details").forEach((details) => {
      const row = details.closest("[data-editor-id]");
      if (!row) return;
      if (opened.has(row.dataset.editorId)) details.open = true;
      if (details.open) openDetails.add(row.dataset.editorId);
    });
    $$("#fieldList textarea").forEach(autosize);
    if (focusId) focusField(focusId);
  }

  function updateProgress() {
    const total = TEMPLATES.length;
    const added = state.fields.filter((field) => field.templateId).length;
    const filled = state.fields.filter((field) => field.templateId && field.value.trim()).length;
    const custom = state.fields.filter((field) => !field.templateId).length;
    const text = $("#progressText");
    if (filled >= total) text.textContent = "テンプレートをすべて記入しました。このカードで、その人の輪郭が伝わります。";
    else text.textContent = "テンプレート " + filled + " / " + total + " まで記入（欄は " + added + " 件追加" + (custom ? "、自由記入 " + custom : "") + "）";
    $("#meterBar").style.width = (total ? (filled / total) * 100 : 0) + "%";
    const missing = total - added;
    const addAll = $("#addAllBtn");
    addAll.disabled = missing === 0;
    addAll.textContent = missing === 0 ? "テンプレートはすべて追加済み" : "すべてのテンプレートを追加（あと " + missing + "）";
    $("#clearFieldsBtn").disabled = state.fields.length === 0;
  }
  function afterMembership(focusId) {
    renderEditor(focusId);
    renderTemplates();
    updateCard();
    updateProgress();
    saveSoon();
  }
  function addTemplate(id) {
    const tpl = templateById(id);
    if (!tpl) return;
    const existing = state.fields.find((field) => field.templateId === id);
    if (existing) {
      renderEditor();
      focusField(existing.id);
      return;
    }
    const field = makeField(tpl);
    state.fields.push(field);
    afterMembership(field.id);
  }
  function moveField(id, dir) {
    const clusters = editorClusters();
    const cluster = clusters.find((group) => group.fields.some((field) => field.id === id));
    if (!cluster || cluster.id === "slots") return;
    const pos = cluster.fields.findIndex((field) => field.id === id);
    const next = pos + dir;
    if (next < 0 || next >= cluster.fields.length) return;
    const targetId = cluster.fields[next].id;
    const from = state.fields.findIndex((field) => field.id === id);
    const item = state.fields.splice(from, 1)[0];
    const to = state.fields.findIndex((field) => field.id === targetId);
    state.fields.splice(dir < 0 ? to : to + 1, 0, item);
    renderEditor();
    const button = document.querySelector('[data-editor-id="' + id + '"] ' + (dir < 0 ? ".js-up" : ".js-down"));
    if (button && !button.disabled) button.focus();
    updateCard();
    saveSoon();
  }
  function moveBefore(fromId, toId) {
    if (fromId === toId) return false;
    const clusters = editorClusters();
    const cluster = clusters.find((group) => group.fields.some((field) => field.id === fromId));
    if (!cluster || cluster.id === "slots") return false;
    if (!cluster.fields.some((field) => field.id === toId)) {
      if (state.groupByCategory) toast("分類をまたいで並べるときは、「分類ごとに見出しを付ける」をオフにしてください");
      return false;
    }
    const from = state.fields.findIndex((field) => field.id === fromId);
    const item = state.fields.splice(from, 1)[0];
    const to = state.fields.findIndex((field) => field.id === toId);
    state.fields.splice(to, 0, item);
    return true;
  }
  async function removeField(field) {
    if (field.value.trim()) {
      const ok = await confirmModal("欄を削除", "「" + (field.label || "無題") + "」をカードから外します。", "削除する");
      if (!ok) return;
    }
    state.fields = state.fields.filter((item) => item.id !== field.id);
    openDetails.delete(field.id);
    afterMembership();
  }

  function renderFontList() {
    const groups = [];
    FONTS.forEach((font) => {
      let group = groups.find((item) => item.name === font.group);
      if (!group) {
        group = { name: font.group, fonts: [] };
        groups.push(group);
      }
      group.fonts.push(font);
    });
    $("#fontList").replaceChildren(...groups.map((group) => {
      const box = el("div", { class: "font-group" });
      box.append(el("p", { class: "font-group-label", text: group.name }));
      group.fonts.forEach((font) => {
        const sample = el("span", { class: "font-option-sample", text: "あア字 Aa" });
        sample.style.fontFamily = font.family;
        const btn = el("button", { type: "button", class: "font-option", "data-font-id": font.id });
        btn.append(el("span", { text: font.name }), sample);
        box.append(btn);
      });
      return box;
    }));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) ensureFont(fontById(entry.target.dataset.fontId));
      });
    }, { root: $("#fontPopover") });
    $$("#fontList [data-font-id]").forEach((btn) => observer.observe(btn));
  }
  function filterFonts(query) {
    const q = norm(query);
    $$("#fontList [data-font-id]").forEach((btn) => {
      const font = fontById(btn.dataset.fontId);
      btn.hidden = !!(q && font && norm(font.name).indexOf(q) < 0 && norm(font.group).indexOf(q) < 0);
    });
    $$("#fontList .font-group").forEach((group) => {
      group.hidden = ![...group.querySelectorAll("[data-font-id]")].some((btn) => !btn.hidden);
    });
  }
  function markCurrentFont() {
    let current = "";
    if (picker.kind === "label") current = state.labelFont;
    else if (picker.kind === "value") current = state.valueFont;
    else if (picker.kind === "name") current = state.nameFont;
    else if (picker.fieldId) {
      const field = getField(picker.fieldId);
      if (field) current = picker.kind === "field-label" ? field.style.labelFont : field.style.valueFont;
    }
    $$("#fontPopover .font-option").forEach((btn) => {
      const id = btn.dataset.fontId || "";
      const on = (btn.id === "fontInherit" && !current) || (!!id && id === current);
      btn.classList.toggle("is-current", on);
    });
  }
  function openPicker(button, kind, fieldId) {
    picker = { button: button, kind: kind, fieldId: fieldId || "" };
    const inherit = $("#fontInherit");
    if (kind === "label" || kind === "value") inherit.hidden = true;
    else {
      inherit.hidden = false;
      inherit.textContent = fontButtonLabel("", kind);
    }
    $("#fontSearch").value = "";
    filterFonts("");
    markCurrentFont();
    const pop = $("#fontPopover");
    pop.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    let left = Math.min(rect.left, window.innerWidth - width - 8);
    left = Math.max(8, left);
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    $("#fontSearch").focus();
  }
  function closePicker() {
    $("#fontPopover").hidden = true;
    picker = { button: null, kind: "", fieldId: "" };
  }
  function chooseFont(id) {
    if (id && !fontById(id)) return;
    if (picker.kind === "label") {
      if (id) state.labelFont = id;
    } else if (picker.kind === "value") {
      if (id) state.valueFont = id;
    } else if (picker.kind === "name") {
      state.nameFont = id;
    } else if (picker.kind === "field-label" || picker.kind === "field-value") {
      const field = getField(picker.fieldId);
      if (!field) return;
      const key = picker.kind === "field-label" ? "labelFont" : "valueFont";
      field.style[key] = id;
      if (picker.button) picker.button.textContent = fontButtonLabel(id, picker.kind);
      const row = document.querySelector('[data-editor-id="' + field.id + '"]');
      if (row) syncStyleBadge(row, field);
    } else return;
    closePicker();
    syncFontButtons();
    updateCard({ fonts: true });
    saveSoon();
  }

  function coverCrop(img, tw, th) {
    tw = Math.max(1, Math.round(tw));
    th = Math.max(1, Math.round(th));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const g = canvas.getContext("2d");
    const zoom = state.photoZoom / 100;
    const x = state.photoX / 100;
    const y = state.photoY / 100;
    const cover = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
    const dw = img.naturalWidth * cover * zoom;
    const dh = img.naturalHeight * cover * zoom;
    g.drawImage(img, x * (tw - dw), y * (th - dh), dw, dh);
    return canvas.toDataURL("image/png");
  }
  async function drawPage(live) {
    if (typeof html2canvas !== "function") throw new Error("書き出し用のファイルを読み込めませんでした");
    const liveImg = live.querySelector(".photo-img");
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:0;top:0;z-index:-1;pointer-events:none;";
    const clone = live.cloneNode(true);
    clone.style.boxShadow = "none";
    clone.style.margin = "0";
    clone.querySelectorAll("[data-export-hide]").forEach((node) => node.remove());
    holder.appendChild(clone);
    document.body.appendChild(holder);
    try {
      if (state.photo && liveImg && liveImg.naturalWidth) {
        const frame = clone.querySelector(".photo-frame");
        const img = clone.querySelector(".photo-img");
        if (frame && img && frame.clientWidth && frame.clientHeight) {
          img.src = coverCrop(liveImg, frame.clientWidth * 2, frame.clientHeight * 2);
          img.style.objectFit = "fill";
          img.style.objectPosition = "50% 50%";
          img.style.transform = "none";
          if (img.decode) await img.decode().catch(() => {});
        }
      }
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: 2,
        width: 960,
        height: 540,
        useCORS: true,
        logging: false,
      });
      if (canvas.width === 1920 && canvas.height === 1080) return canvas;
      const slide = document.createElement("canvas");
      slide.width = 1920;
      slide.height = 1080;
      slide.getContext("2d").drawImage(canvas, 0, 0, 1920, 1080);
      return slide;
    } finally {
      holder.remove();
    }
  }
  async function drawPages() {
    if (typeof html2canvas !== "function") throw new Error("書き出し用のファイルを読み込めませんでした");
    await ensureUsedFonts();
    renderPages();
    const cards = $$("#stage .card");
    if (!cards.length) throw new Error("画像にできませんでした");
    const canvases = [];
    for (let i = 0; i < cards.length; i++) canvases.push(await drawPage(cards[i]));
    return canvases;
  }
  function canvasBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function downloadCanvas(canvas) {
    saveBlob(await canvasBlob(canvas), fileBase() + ".png");
  }
  function crc32(data) {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      c ^= data[i];
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function le(value, size) {
    const out = new Uint8Array(size);
    let n = value >>> 0;
    for (let i = 0; i < size; i++) {
      out[i] = n & 0xff;
      n = Math.floor(n / 256);
    }
    return out;
  }
  function bytesConcat(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    parts.forEach((part) => {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }
  function zipStore(files) {
    const encoder = new TextEncoder();
    const locals = [];
    const centrals = [];
    let offset = 0;
    files.forEach((file) => {
      const name = encoder.encode(file.name);
      const crc = crc32(file.data);
      const local = bytesConcat([
        le(0x04034b50, 4), le(20, 2), le(0x800, 2), le(0, 2), le(0, 2), le(0, 2),
        le(crc, 4), le(file.data.length, 4), le(file.data.length, 4),
        le(name.length, 2), le(0, 2), name, file.data,
      ]);
      locals.push(local);
      centrals.push(bytesConcat([
        le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x800, 2), le(0, 2), le(0, 2), le(0, 2),
        le(crc, 4), le(file.data.length, 4), le(file.data.length, 4),
        le(name.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4),
        le(offset, 4), name,
      ]));
      offset += local.length;
    });
    const central = bytesConcat(centrals);
    const end = bytesConcat([
      le(0x06054b50, 4), le(0, 2), le(0, 2), le(files.length, 2), le(files.length, 2),
      le(central.length, 4), le(offset, 4), le(0, 2),
    ]);
    return new Blob([bytesConcat(locals), central, end], { type: "application/zip" });
  }
  async function downloadCanvases(canvases) {
    if (canvases.length === 1) {
      await downloadCanvas(canvases[0]);
      return;
    }
    const base = fileBase();
    const files = [];
    for (let i = 0; i < canvases.length; i++) {
      const blob = await canvasBlob(canvases[i]);
      const data = new Uint8Array(await blob.arrayBuffer());
      files.push({ name: base + "_" + String(i + 1).padStart(2, "0") + ".png", data: data });
    }
    saveBlob(zipStore(files), base + ".zip");
  }
  async function copyCanvas(canvas) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error("このブラウザは画像のコピーに対応していません。ダウンロードを使ってください");
    }
    const blob = await canvasBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  }
  async function exportImage(mode) {
    if (exporting) return;
    exporting = true;
    ["#downloadBtn", "#downloadBtnTop", "#copyBtn"].forEach((sel) => { $(sel).disabled = true; });
    $("#downloadBtn").textContent = "書き出しています…";
    $("#downloadBtnTop").textContent = "書き出しています…";
    try {
      const canvases = await drawPages();
      const size = canvases[0].width + "×" + canvases[0].height;
      if (mode === "copy") {
        await copyCanvas(canvases[0]);
        toast(canvases.length > 1 ? "1枚目をコピーしました。全部はダウンロードに入っています" : "画像をコピーしました");
      } else {
        await downloadCanvases(canvases);
        toast(canvases.length > 1
          ? canvases.length + "枚を保存しました（" + size + "）"
          : "保存しました（" + size + "）");
      }
    } catch (err) {
      toast(err && err.message ? err.message : "画像にできませんでした");
    } finally {
      exporting = false;
      ["#downloadBtn", "#downloadBtnTop", "#copyBtn"].forEach((sel) => { $(sel).disabled = false; });
      $("#downloadBtn").textContent = "画像をダウンロード";
      $("#downloadBtnTop").textContent = "画像をダウンロード";
    }
  }

  function hasContent() {
    return !!(state.name.trim() || state.photo || state.fields.length);
  }
  async function loadSample() {
    if (hasContent()) {
      const ok = await confirmModal("記入例を読み込む", "いまの名前、写真、欄を、記入例と入れ替えます。デザインと書体はそのままです。", "入れ替える");
      if (!ok) return;
    }
    state.name = "青葉 みのり";
    state.photo = makeSamplePhoto();
    state.photoX = 50;
    state.photoY = 50;
    state.photoZoom = 100;
    state.fields = Object.keys(SAMPLE_FIELDS).map((id) => {
      const field = makeField(templateById(id));
      field.value = SAMPLE_FIELDS[id];
      return field;
    }).filter((field) => field.templateId);
    openDetails.clear();
    cardKey = "";
    syncControls();
    afterMembership();
    toast("記入例を読み込みました");
  }
  async function resetAll() {
    const ok = await confirmModal("最初から作り直す", "名前、写真、欄、デザイン、書体を、最初の状態に戻します。", "作り直す");
    if (!ok) return;
    state = defaultState();
    openDetails.clear();
    cardKey = "";
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* 保存できない環境でも画面は戻す */ }
    syncControls();
    renderTemplates();
    renderEditor();
    updateCard({ fonts: true });
    updateProgress();
    toast("最初の状態に戻しました");
  }
  async function clearFields() {
    if (!state.fields.length) return;
    const ok = await confirmModal("欄をすべて削除", "追加した欄を消します。写真と名前、デザインは残ります。", "削除する");
    if (!ok) return;
    state.fields = [];
    openDetails.clear();
    afterMembership();
  }
  async function addAll() {
    const missing = TEMPLATES.filter((tpl) => !state.fields.some((field) => field.templateId === tpl.id));
    if (!missing.length) {
      toast("テンプレートはすでに全部入っています");
      return;
    }
    const ok = await confirmModal("すべてのテンプレート", "未追加の " + missing.length + " 件を、空の欄として追加します。あとから消せます。", "追加する");
    if (!ok) return;
    missing.forEach((tpl) => state.fields.push(makeField(tpl)));
    afterMembership();
    toast(missing.length + " 件の欄を追加しました");
  }
  function downloadJson() {
    const blob = new Blob([JSON.stringify({ version: 1, card: state }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileBase() + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const next = normalizeState(JSON.parse(String(reader.result)));
        if (!next) throw new Error("形式が違います");
        if (hasContent()) {
          const ok = await confirmModal("データを読み込む", "いまのカードを、ファイルの内容と入れ替えます。", "入れ替える");
          if (!ok) return;
        }
        state = next;
        openDetails.clear();
        cardKey = "";
        syncControls();
        renderTemplates();
        renderEditor();
        updateCard({ fonts: true });
        updateProgress();
        saveSoon();
        toast("データを読み込みました");
      } catch (err) {
        toast("このファイルは読み込めませんでした");
      }
    };
    reader.readAsText(file);
  }

  function bindPhotoPan(root) {
    if (!root) return;
    root.addEventListener("dragstart", (event) => {
      if (event.target.closest(".photo-frame, .photo-editor-frame")) event.preventDefault();
    });
    root.addEventListener("pointerdown", (event) => {
      const frame = event.target.closest(".photo-frame, .photo-editor-frame");
      if (!frame || !root.contains(frame) || !state.photo || event.button !== 0) return;
      photoPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, frame: frame };
      frame.classList.add("is-panning");
      try { frame.setPointerCapture(event.pointerId); } catch (err) { /* ポインタを取れない環境ではドラッグだけ続ける */ }
    });
    root.addEventListener("pointermove", (event) => {
      if (!photoPointer || !root.contains(photoPointer.frame) || event.pointerId !== photoPointer.id) return;
      const frame = photoPointer.frame;
      const scale = frame.closest("#stage") ? stageScale() : 1;
      const dx = (event.clientX - photoPointer.x) / scale;
      const dy = (event.clientY - photoPointer.y) / scale;
      if (!photoPointer.moved && Math.hypot(event.clientX - photoPointer.x, event.clientY - photoPointer.y) < 4) return;
      photoPointer.moved = true;
      photoPointer.x = event.clientX;
      photoPointer.y = event.clientY;
      panBy(frame, dx, dy);
      $$("#stage .card").forEach(applyPhotoVars);
      applyPhotoVars($("#photoDrop"));
      syncPhotoControls();
    });
    function endPan(event) {
      if (!photoPointer || event.pointerId !== photoPointer.id) return;
      photoPointer.frame.classList.remove("is-panning");
      if (photoPointer.moved) {
        suppressPhotoClick = true;
        setTimeout(() => { suppressPhotoClick = false; }, 0);
        saveSoon();
      }
      photoPointer = null;
    }
    root.addEventListener("pointerup", endPan);
    root.addEventListener("pointercancel", endPan);
  }
  function bindFontButton(button, kind) {
    button.addEventListener("click", () => {
      if (!$("#fontPopover").hidden && picker.button === button) closePicker();
      else openPicker(button, kind);
    });
  }
  function bind() {
    $("#nameInput").addEventListener("input", () => {
      state.name = $("#nameInput").value;
      updateCard();
      saveSoon();
    });
    $("#photoPick").addEventListener("click", () => $("#photoInput").click());
    $("#photoDrop").addEventListener("click", () => {
      if (suppressPhotoClick) return;
      $("#photoInput").click();
    });
    $("#stage").addEventListener("click", (event) => {
      if (suppressPhotoClick) return;
      if (event.target.closest(".photo-frame")) $("#photoInput").click();
    });
    ["photoX", "photoY", "photoZoom"].forEach((key) => {
      $("#" + key).addEventListener("input", () => {
        state[key] = Number($("#" + key).value);
        syncPhotoControls();
        $$("#stage .card").forEach(applyPhotoVars);
        applyPhotoVars($("#photoDrop"));
        saveSoon();
      });
    });
    $("#photoReset").addEventListener("click", () => {
      state.photoX = 50;
      state.photoY = 50;
      state.photoZoom = 100;
      syncPhotoControls();
      $$("#stage .card").forEach(applyPhotoVars);
      applyPhotoVars($("#photoDrop"));
      saveSoon();
    });
    bindPhotoPan($("#photoDrop"));
    bindPhotoPan($("#stage"));
    $("#photoInput").addEventListener("change", () => {
      const file = $("#photoInput").files && $("#photoInput").files[0];
      $("#photoInput").value = "";
      if (file) setPhotoFile(file);
    });
    $("#photoRemove").addEventListener("click", () => {
      state.photo = "";
      state.photoX = 50;
      state.photoY = 50;
      state.photoZoom = 100;
      updateCard();
      saveSoon();
    });
    bindDrop($("#photoDrop"));
    bindDrop($("#stage"));

    $("#themeList").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-theme]");
      if (!btn) return;
      state.theme = btn.dataset.theme;
      syncControls();
      updateCard();
      saveSoon();
    });
    $("#shapeChoices").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-shape]");
      if (!btn) return;
      state.photoShape = btn.dataset.shape;
      syncControls();
      updateCard();
      saveSoon();
    });
    $("#columnChoices").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-columns]");
      if (!btn) return;
      state.columns = btn.dataset.columns;
      syncControls();
      updateCard();
      saveSoon();
    });
    $("#groupToggle").addEventListener("change", () => {
      state.groupByCategory = $("#groupToggle").checked;
      renderEditor();
      updateCard();
      saveSoon();
    });
    $("#emptyToggle").addEventListener("change", () => {
      state.showEmpty = $("#emptyToggle").checked;
      updateCard();
      saveSoon();
    });

    ["labelSize", "valueSize", "nameSize"].forEach((key) => {
      $("#" + key).addEventListener("input", () => {
        state[key] = Number($("#" + key).value);
        $("#" + key + "Out").textContent = state[key];
        updateCard();
        saveSoon();
      });
    });
    ["labelColor", "valueColor", "nameColor", "accentColor"].forEach((key) => {
      $("#" + key).addEventListener("input", () => {
        state[key] = $("#" + key).value;
        const reset = document.querySelector('.js-color-reset[data-color-key="' + key + '"]');
        if (reset) reset.disabled = false;
        updateCard();
        saveSoon();
      });
    });
    $$(".js-color-reset").forEach((btn) => {
      btn.addEventListener("click", () => {
        state[btn.dataset.colorKey] = "";
        syncControls();
        updateCard();
        saveSoon();
      });
    });
    document.addEventListener("click", (event) => {
      const swatch = event.target.closest(".panel .swatch");
      if (!swatch) return;
      const box = swatch.closest(".swatches");
      const key = box && box.dataset.colorKey;
      if (!key || !Object.prototype.hasOwnProperty.call(state, key)) return;
      state[key] = swatch.dataset.color;
      syncControls();
      updateCard();
      saveSoon();
    });

    bindFontButton($("#labelFontBtn"), "label");
    bindFontButton($("#valueFontBtn"), "value");
    bindFontButton($("#nameFontBtn"), "name");
    $("#fontSearch").addEventListener("input", () => filterFonts($("#fontSearch").value));
    $("#fontList").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-font-id]");
      if (btn) chooseFont(btn.dataset.fontId);
    });
    $("#fontInherit").addEventListener("click", () => chooseFont(""));
    document.addEventListener("mousedown", (event) => {
      const pop = $("#fontPopover");
      if (pop.hidden) return;
      if (pop.contains(event.target)) return;
      if (picker.button && picker.button.contains(event.target)) return;
      closePicker();
    });
    window.addEventListener("scroll", (event) => {
      syncJumpAdd();
      const pop = $("#fontPopover");
      if (pop.hidden || pop.contains(event.target)) return;
      closePicker();
    }, true);
    window.addEventListener("resize", () => {
      closePicker();
      fitPreview();
      syncJumpAdd();
    });
    $("#jumpAdd").addEventListener("click", jumpToAdd);
    $("#backToAdd").addEventListener("click", jumpToAdd);

    $("#templateSearch").addEventListener("input", renderTemplates);
    $("#categoryChips").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-category]");
      if (!btn) return;
      ui.category = btn.dataset.category;
      syncChips();
      renderTemplates();
    });
    $("#templateList").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-template]");
      if (btn) addTemplate(btn.dataset.template);
    });
    $("#addAllBtn").addEventListener("click", addAll);
    $("#customForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const label = $("#customLabel").value.trim();
      if (!label) {
        toast("欄の名前を入れてください");
        $("#customLabel").focus();
        return;
      }
      const block = $("#customKind").value === "block";
      const field = makeField(null, { label: label, multiline: block, wide: block });
      state.fields.push(field);
      $("#customLabel").value = "";
      afterMembership(field.id);
    });

    $("#fieldList").addEventListener("toggle", (event) => {
      if (event.target.tagName !== "DETAILS") return;
      const row = event.target.closest("[data-editor-id]");
      if (!row) return;
      if (event.target.open) openDetails.add(row.dataset.editorId);
      else openDetails.delete(row.dataset.editorId);
    }, true);
    $("#fieldList").addEventListener("input", (event) => {
      const row = event.target.closest("[data-editor-id]");
      if (!row) return;
      const field = getField(row.dataset.editorId);
      if (!field) return;
      if (event.target.classList.contains("js-label")) {
        field.label = event.target.value.slice(0, 40);
        updateCard();
        saveSoon();
      } else if (event.target.classList.contains("js-value")) {
        field.value = event.target.value.slice(0, 2000);
        if (event.target.value !== field.value) event.target.value = field.value;
        autosize(event.target);
        syncEmpty(row, field);
        updateCard();
        updateProgress();
        saveSoon();
      } else if (event.target.dataset.sizeKey) {
        field.style[event.target.dataset.sizeKey] = Number(event.target.value);
        syncStyleBadge(row, field);
        updateCard();
        saveSoon();
      } else if (event.target.dataset.colorKey) {
        field.style[event.target.dataset.colorKey] = event.target.value;
        syncStyleBadge(row, field);
        updateCard();
        saveSoon();
      }
    });
    $("#fieldList").addEventListener("change", (event) => {
      if (!event.target.classList.contains("js-wide")) return;
      const row = event.target.closest("[data-editor-id]");
      const field = row && getField(row.dataset.editorId);
      if (!field) return;
      field.wide = event.target.checked;
      updateCard();
      saveSoon();
    });
    $("#fieldList").addEventListener("click", (event) => {
      const row = event.target.closest("[data-editor-id]");
      if (!row) return;
      const field = getField(row.dataset.editorId);
      if (!field) return;
      if (event.target.closest(".js-delete")) { removeField(field); return; }
      if (event.target.closest(".js-up")) { moveField(field.id, -1); return; }
      if (event.target.closest(".js-down")) { moveField(field.id, 1); return; }
      const fontBtn = event.target.closest(".js-font-btn");
      if (fontBtn) {
        if (!$("#fontPopover").hidden && picker.button === fontBtn) closePicker();
        else openPicker(fontBtn, fontBtn.dataset.fontKind, field.id);
        return;
      }
      if (event.target.closest(".js-style-reset")) {
        field.style = emptyStyle();
        openDetails.add(field.id);
        renderEditor();
        updateCard({ fonts: true });
        saveSoon();
        return;
      }
      const sizeReset = event.target.closest(".js-size-reset");
      if (sizeReset) {
        const key = sizeReset.dataset.sizeKey;
        field.style[key] = 0;
        const slider = row.querySelector('[data-size-key="' + key + '"]');
        if (slider) slider.value = key === "labelSize" ? state.labelSize : state.valueSize;
        syncStyleBadge(row, field);
        updateCard();
        saveSoon();
        return;
      }
      const colorReset = event.target.closest(".js-field-color-reset");
      if (colorReset) {
        const key = colorReset.dataset.colorKey;
        field.style[key] = "";
        const input = row.querySelector('[data-color-key="' + key + '"]');
        const theme = themeById(state.theme);
        if (input) input.value = key === "labelColor" ? (state.labelColor || theme.swatch.label) : (state.valueColor || theme.swatch.value);
        syncStyleBadge(row, field);
        updateCard();
        saveSoon();
      }
    });
    $("#fieldList").addEventListener("dragstart", (event) => {
      const handle = event.target.closest(".js-drag");
      if (!handle) return;
      const row = handle.closest("[data-editor-id]");
      dragId = row.dataset.editorId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", dragId);
      row.classList.add("is-dragging");
    });
    $("#fieldList").addEventListener("dragover", (event) => {
      const row = event.target.closest("[data-editor-id]");
      if (!row || !dragId) return;
      event.preventDefault();
      $$("#fieldList .is-drop").forEach((node) => node.classList.remove("is-drop"));
      row.classList.add("is-drop");
    });
    $("#fieldList").addEventListener("drop", (event) => {
      const row = event.target.closest("[data-editor-id]");
      event.preventDefault();
      if (row && dragId && moveBefore(dragId, row.dataset.editorId)) {
        const id = dragId;
        dragId = "";
        renderEditor(id);
        updateCard();
        saveSoon();
      }
      dragId = "";
    });
    $("#fieldList").addEventListener("dragend", () => {
      dragId = "";
      $$("#fieldList .is-drop, #fieldList .is-dragging").forEach((node) => node.classList.remove("is-drop", "is-dragging"));
    });

    $("#sampleBtn").addEventListener("click", loadSample);
    $("#resetBtn").addEventListener("click", resetAll);
    $("#clearFieldsBtn").addEventListener("click", clearFields);
    $("#downloadBtn").addEventListener("click", () => exportImage("download"));
    $("#downloadBtnTop").addEventListener("click", () => exportImage("download"));
    $("#copyBtn").addEventListener("click", () => exportImage("copy"));
    $("#exportJsonBtn").addEventListener("click", downloadJson);
    $("#importJsonBtn").addEventListener("click", () => $("#jsonInput").click());
    $("#jsonInput").addEventListener("change", () => {
      const file = $("#jsonInput").files && $("#jsonInput").files[0];
      $("#jsonInput").value = "";
      if (file) importJsonFile(file);
    });
    $("#modalCancel").addEventListener("click", () => closeModal(false));
    $("#modalOk").addEventListener("click", () => closeModal(true));
    $("#modal").addEventListener("click", (event) => { if (event.target === $("#modal")) closeModal(false); });
    $$(".view-switch button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.body.dataset.mobileView = btn.dataset.view;
        $$(".view-switch button").forEach((item) => item.classList.toggle("is-active", item === btn));
        requestAnimationFrame(fitPreview);
        syncJumpAdd();
      });
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        exportImage("download");
      } else if (event.key === "Escape") {
        closePicker();
        if (!$("#modal").hidden) closeModal(false);
      }
    });
  }

  function init() {
    document.body.dataset.mobileView = "edit";
    renderThemeList();
    renderChips();
    renderSwatches();
    renderFontList();
    bind();
    syncControls();
    renderTemplates();
    renderEditor();
    updateCard({ fonts: true });
    updateProgress();
    syncJumpAdd();
    if (window.ResizeObserver) new ResizeObserver(() => fitPreview()).observe($("#stage"));
  }

  init();
})();
