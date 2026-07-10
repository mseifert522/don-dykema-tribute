/* Tribute to Don Dykema — interactions + guest book */

(function () {
  "use strict";

  const cfg = window.TRIBUTE_CONFIG || {};
  const GH_OWNER = cfg.githubOwner || "mseifert522";
  const GH_REPO = cfg.githubRepo || "don-dykema-tribute";
  const GH_TOKEN = (cfg.githubToken || "").trim();
  const NOTIFY_EMAIL = (cfg.notifyEmail || "").trim();

  /* ---------- Header scroll ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  requestAnimationFrame(() => {
    document.querySelectorAll(".hero .reveal").forEach((el) => {
      el.classList.add("is-visible");
    });
  });

  /* ---------- Lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox && lightbox.querySelector(".lightbox-img");
  const closeBtn = lightbox && lightbox.querySelector(".lightbox-close");

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-lightbox]").forEach((fig) => {
    fig.addEventListener("click", () => {
      const img = fig.querySelector("img");
      if (img) openLightbox(img.src, img.alt);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }
  if (lightbox) lightbox.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  /* ---------- Guest book tabs ---------- */
  const tabs = document.querySelectorAll(".contrib-tab");
  const typeInput = document.getElementById("contribution-type");
  const form = document.getElementById("tribute-form");

  function setTab(tab) {
    tabs.forEach((t) => {
      const on = t.getAttribute("data-tab") === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (typeInput) typeInput.value = tab;
    if (form) {
      form.querySelectorAll("[data-panel]").forEach((el) => {
        el.hidden = el.getAttribute("data-panel") !== tab;
      });
    }
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => setTab(t.getAttribute("data-tab")));
  });

  /* ---------- Memory wall (GitHub Issues) ---------- */
  const wall = document.getElementById("memory-wall");
  const wallLoading = document.getElementById("memory-wall-loading");

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (_) {
      return "";
    }
  }

  function parseIssue(issue) {
    const body = issue.body || "";
    const labels = (issue.labels || []).map((l) => l.name);
    const isPhoto = labels.includes("photo");

    const getField = (name) => {
      const re = new RegExp("<!--" + name + ":([\\s\\S]*?)-->", "i");
      const m = body.match(re);
      return m ? m[1].trim() : "";
    };

    const name = getField("name") || issue.title.replace(/^(Memory|Photo) from\s+/i, "").trim();
    const relation = getField("relation");
    const message = getField("message") || getField("note") || stripMeta(body);
    const photoUrl = getField("photo");
    const caption = getField("caption");

    return {
      id: issue.number,
      name: name || "A friend",
      relation,
      message: message || caption || "",
      photoUrl,
      caption,
      isPhoto,
      date: issue.created_at,
      url: issue.html_url,
    };
  }

  function stripMeta(body) {
    return body
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\r\n/g, "\n")
      .trim();
  }

  function renderMemoryCard(item) {
    const rel = item.relation
      ? `<span class="mw-relation">${escapeHtml(item.relation)}</span>`
      : "";
    const photo =
      item.photoUrl && /^https?:\/\//i.test(item.photoUrl)
        ? `<figure class="mw-photo"><img src="${escapeHtml(item.photoUrl)}" alt="${escapeHtml(item.caption || "Photo shared for Don")}" loading="lazy" /></figure>`
        : "";
    const badge = item.isPhoto ? `<span class="mw-badge">Photo</span>` : "";
    const text = item.message
      ? `<p class="mw-message">${escapeHtml(item.message).replace(/\n/g, "<br>")}</p>`
      : "";

    return `
      <article class="mw-card${item.isPhoto ? " is-photo" : ""}" data-id="${item.id}">
        <header class="mw-header">
          <div>
            <p class="mw-name">${escapeHtml(item.name)}${badge}</p>
            ${rel}
          </div>
          <time class="mw-date" datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time>
        </header>
        ${photo}
        ${text}
      </article>
    `;
  }

  async function loadMemories() {
    if (!wall) return;

    try {
      // Fetch open issues, then keep those labeled memory or photo (API label filter is AND)
      const url =
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues` +
        `?state=open&per_page=50&sort=created&direction=desc`;

      const headers = {
        Accept: "application/vnd.github+json",
      };
      if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Could not load memories (" + res.status + ")");

      const issues = await res.json();
      const items = (issues || [])
        .filter((i) => !i.pull_request)
        .filter((i) => {
          const names = (i.labels || []).map((l) => l.name);
          return names.includes("memory") || names.includes("photo");
        })
        .map(parseIssue);

      if (wallLoading) wallLoading.remove();

      if (!items.length) {
        wall.innerHTML = `
          <div class="memory-wall-empty">
            <p>Be the first to share a memory of Don.</p>
            <a href="#contribute" class="btn-primary">Share a memory</a>
          </div>`;
        return;
      }

      wall.innerHTML = `<div class="mw-grid">${items.map(renderMemoryCard).join("")}</div>`;

      // Photo lightbox on wall images
      wall.querySelectorAll(".mw-photo img").forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => openLightbox(img.src, img.alt));
      });
    } catch (err) {
      if (wallLoading) wallLoading.remove();
      wall.innerHTML = `
        <div class="memory-wall-empty">
          <p>Memories will appear here as family and friends share them.</p>
          <a href="#contribute" class="btn-primary">Share a memory</a>
        </div>`;
      console.warn("Memory wall:", err);
    }
  }

  loadMemories();

  /* ---------- Form submit ---------- */
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("tribute-submit");

  function setStatus(type, html) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = "form-status is-" + type;
    statusEl.innerHTML = html;
  }

  function setSubmitting(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    const label = submitBtn.querySelector(".btn-label");
    const loading = submitBtn.querySelector(".btn-loading");
    if (label) label.hidden = on;
    if (loading) loading.hidden = !on;
  }

  function buildIssueBody(data) {
    const lines = [
      `<!--name:${data.name}-->`,
      data.relation ? `<!--relation:${data.relation}-->` : "",
      data.message ? `<!--message:${data.message}-->` : "",
      data.caption ? `<!--caption:${data.caption}-->` : "",
      data.photoUrl ? `<!--photo:${data.photoUrl}-->` : "",
      data.photoNote ? `<!--note:${data.photoNote}-->` : "",
      "",
      data.message || data.photoNote || data.caption || "",
      "",
      data.photoUrl ? `![Photo](${data.photoUrl})` : "",
      "",
      "---",
      data.relation ? `*${data.relation}*` : "",
      data.email ? `Contact (private to family via email notification)` : "",
    ];
    return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
  }

  async function createGithubIssue(data) {
    if (!GH_TOKEN) return { ok: false, reason: "no-token" };

    const isPhoto = data.type === "photo";
    const title = isPhoto
      ? `Photo from ${data.name}`
      : `Memory from ${data.name}`;
    const labels = isPhoto ? ["photo"] : ["memory"];

    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body: buildIssueBody(data),
          labels,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.warn("GitHub issue create failed:", res.status, err);
      return { ok: false, reason: "api", status: res.status };
    }
    return { ok: true, issue: await res.json() };
  }

  async function notifyFamily(data) {
    if (!NOTIFY_EMAIL) return { ok: false, reason: "no-email" };

    const payload = {
      name: data.name,
      email: data.email || "not provided",
      relation: data.relation || "not provided",
      type: data.type,
      message: data.message || "",
      caption: data.caption || "",
      photo_url: data.photoUrl || "",
      photo_note: data.photoNote || "",
      _subject: `Don Dykema tribute: ${data.type} from ${data.name}`,
      _template: "table",
      _captcha: "false",
    };

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_EMAIL)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn("FormSubmit status:", res.status);
        return { ok: false };
      }
      return { ok: true };
    } catch (err) {
      console.warn("FormSubmit error:", err);
      return { ok: false };
    }
  }

  function prependToWall(data, issueNumber) {
    if (!wall) return;
    const empty = wall.querySelector(".memory-wall-empty");
    if (empty) empty.remove();
    if (wallLoading) wallLoading.remove();

    let grid = wall.querySelector(".mw-grid");
    if (!grid) {
      grid = document.createElement("div");
      grid.className = "mw-grid";
      wall.innerHTML = "";
      wall.appendChild(grid);
    }

    const item = {
      id: issueNumber || "new",
      name: data.name,
      relation: data.relation,
      message: data.message || data.photoNote || data.caption || "",
      photoUrl: data.photoUrl,
      caption: data.caption,
      isPhoto: data.type === "photo",
      date: new Date().toISOString(),
    };

    grid.insertAdjacentHTML("afterbegin", renderMemoryCard(item));
    const img = grid.querySelector(".mw-card .mw-photo img");
    if (img) {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => openLightbox(img.src, img.alt));
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Honeypot
      const hp = form.querySelector('[name="_gotcha"]');
      if (hp && hp.value) return;

      const type = (typeInput && typeInput.value) || "memory";
      const name = (document.getElementById("contrib-name") || {}).value.trim();
      const relation = (document.getElementById("contrib-relation") || {}).value.trim();
      const email = (document.getElementById("contrib-email") || {}).value.trim();
      const message = (document.getElementById("contrib-message") || {}).value.trim();
      const caption = (document.getElementById("contrib-caption") || {}).value.trim();
      const photoUrl =
        type === "photo"
          ? (document.getElementById("contrib-photo-url") || {}).value.trim()
          : (document.getElementById("contrib-photo-optional") || {}).value.trim();
      const photoNote = (document.getElementById("contrib-photo-note") || {}).value.trim();

      if (!name) {
        setStatus("error", "Please add your name so we know who shared this.");
        return;
      }
      if (type === "memory" && !message) {
        setStatus("error", "Please write a memory — even a few sentences mean the world.");
        return;
      }
      if (type === "photo" && !photoUrl && !photoNote) {
        setStatus("error", "Please add a photo link or a short description of the photo.");
        return;
      }

      // Simple client rate limit
      try {
        const last = Number(localStorage.getItem("tribute_last_submit") || 0);
        if (Date.now() - last < 30000) {
          setStatus("error", "Please wait a moment before sending another tribute.");
          return;
        }
      } catch (_) {}

      const data = { type, name, relation, email, message, caption, photoUrl, photoNote };

      setSubmitting(true);
      setStatus("info", "Sending your tribute…");

      const [ghResult, mailResult] = await Promise.all([
        createGithubIssue(data),
        notifyFamily(data),
      ]);

      setSubmitting(false);

      if (ghResult.ok || mailResult.ok) {
        try {
          localStorage.setItem("tribute_last_submit", String(Date.now()));
        } catch (_) {}

        prependToWall(data, ghResult.issue && ghResult.issue.number);
        form.reset();
        setTab("memory");

        if (ghResult.ok) {
          setStatus(
            "success",
            "<strong>Thank you.</strong> Your tribute is on Don’s Memory Wall for family and friends to read."
          );
        } else {
          setStatus(
            "success",
            "<strong>Thank you.</strong> Your tribute was sent to the family and will appear on the Memory Wall shortly."
          );
        }

        // Scroll status into view
        statusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setStatus(
          "error",
          "We couldn’t send that just now. Please try again in a moment, or email the family directly."
        );
      }
    });
  }
})();
