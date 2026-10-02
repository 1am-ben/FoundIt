// ---- CONFIG ----
const SUPABASE_URL = "https://hzfvwqaumccdzpfsrdki.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZnZ3cWF1bWNjZHpwZnNyZGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDEzOTYsImV4cCI6MjEwNDgxNzM5Nn0.hFi50oYMfxXCmzTFFSq2ya2wHJJngnFV0SFJ8Oy2-dY";
const OWNER_WHATSAPP = "233256026355";
const OWNER_CODE = "Benall90";
// ------------------

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentPhotoFile = null;

function escapeHtml(str) {
  const d = document.createElement("div");
  d.innerText = str;
  return d.innerHTML;
}

// ---- Toasts ----
function showToast(message, variant) {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast" + (variant === "success" ? " success" : "");
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 250);
  }, 2400);
}

// ---- Skeleton loader ----
function skeletonHtml(count) {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += `
      <div class="skeleton-card">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line w60"></div>
          <div class="skeleton-line w40"></div>
          <div class="skeleton-line w30"></div>
        </div>
      </div>`;
  }
  return out;
}

// ---- Tabs ----
const tabButtonGroups = {
  browse: [document.getElementById("tab-browse"), document.getElementById("topnav-browse")],
  report: [document.getElementById("tab-report"), document.getElementById("topnav-report")],
  owner: [document.getElementById("tab-owner"), document.getElementById("topnav-owner")],
};
const views = {
  browse: document.getElementById("view-browse"),
  report: document.getElementById("view-report"),
  owner: document.getElementById("view-owner"),
};
function showTab(name) {
  Object.keys(tabButtonGroups).forEach((k) => {
    tabButtonGroups[k].forEach((btn) => btn && btn.classList.toggle("active", k === name));
    views[k].style.display = k === name ? "block" : "none";
  });
  const feeSection = document.getElementById("fee-info-section");
  if (feeSection) feeSection.style.display = name === "browse" ? "block" : "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "browse") loadListings();
}
Object.keys(tabButtonGroups).forEach((k) => {
  tabButtonGroups[k].forEach((btn) => btn && btn.addEventListener("click", () => showTab(k)));
});
// Footer links and hero CTAs reuse the same tab switcher
const footerBrowse = document.getElementById("footer-browse");
const footerReport = document.getElementById("footer-report");
const footerOwner = document.getElementById("footer-owner");
if (footerBrowse) footerBrowse.addEventListener("click", () => showTab("browse"));
if (footerReport) footerReport.addEventListener("click", () => showTab("report"));
if (footerOwner) footerOwner.addEventListener("click", () => showTab("owner"));

document.getElementById("cta-find").addEventListener("click", () => {
  showTab("browse");
  setTimeout(() => document.getElementById("search-input").focus(), 300);
});
document.getElementById("cta-report").addEventListener("click", () => showTab("report"));

// ---- Browse ----
async function loadListings() {
  const container = document.getElementById("listings-container");
  container.innerHTML = skeletonHtml(4);
  const { data, error } = await sb.from("listings").select("*").order("created_at", { ascending: false });
  if (error) {
    container.innerHTML = "<p class='empty-msg'><span class='empty-icon'>⚠️</span>Couldn't load listings right now.<br>Check your connection and try again.</p>";
    return;
  }
  window._allListings = (data || []).filter((l) => l.status !== "returned");
  renderListings();
}
function renderListings() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const container = document.getElementById("listings-container");
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) clearBtn.style.display = q ? "block" : "none";
  const list = (window._allListings || []).filter(
    (l) => !q || l.name.toLowerCase().includes(q) || l.student_id.toLowerCase().includes(q)
  );
  const countLabel = document.getElementById("results-count");
  if (countLabel) {
    countLabel.textContent = list.length > 0 ? `${list.length} found card${list.length === 1 ? "" : "s"}` : "";
  }
  if (list.length === 0) {
    container.innerHTML = window._allListings && window._allListings.length
      ? "<p class='empty-msg'><span class='empty-icon'>🔍</span>No matching cards found.<br>Try checking the spelling or searching by student ID.</p>"
      : "<p class='empty-msg'><span class='empty-icon'>🪪</span>No found IDs yet.<br>Found an ID card? Help a fellow GCTU student get it back.<br><button class='empty-cta' id='empty-report-cta'>Report a Found ID</button></p>";
    const emptyCta = document.getElementById("empty-report-cta");
    if (emptyCta) emptyCta.addEventListener("click", () => showTab("report"));
    return;
  }
  container.innerHTML = list.map((l) => {
    const msg = encodeURIComponent(
      `Hi, I saw a listing on the GCTU Lost ID Board for "${l.name}" (ID ending ${l.student_id.slice(-4)}). I'd like to arrange pickup.`
    );
    return `
      <div class="card">
        ${l.photo_url ? `<img src="${l.photo_url}" alt="Photo of found ID card" />` : ""}
        <div class="card-info">
          <p class="card-name">${escapeHtml(l.name)}</p>
          <span class="id-pill">ID ending ${escapeHtml(l.student_id.slice(-4))}</span>
          <p class="card-date">Found ${l.date_found}</p>
          <a class="wa-btn" target="_blank" href="https://wa.me/${OWNER_WHATSAPP}?text=${msg}">💬 WhatsApp</a>
        </div>
      </div>`;
  }).join("");
}
document.getElementById("search-input").addEventListener("input", renderListings);
const searchClearBtn = document.getElementById("search-clear");
if (searchClearBtn) {
  searchClearBtn.addEventListener("click", () => {
    const input = document.getElementById("search-input");
    input.value = "";
    renderListings();
    input.focus();
  });
}

// ---- Report form ----
let cropper = null;
const cropModal = document.getElementById("crop-modal");
const cropImage = document.getElementById("crop-image");
const cropBox = cropModal.querySelector(".crop-box");
let lastFocusedBeforeCrop = null;

function closeCropModal() {
  if (cropper) { cropper.destroy(); cropper = null; }
  cropModal.style.display = "none";
  document.getElementById("f-photo-camera").value = "";
  document.getElementById("f-photo-gallery").value = "";
  if (lastFocusedBeforeCrop) lastFocusedBeforeCrop.focus();
}

function handlePhotoFile(file) {
  if (!file) return;
  lastFocusedBeforeCrop = document.activeElement;
  const reader = new FileReader();
  reader.onload = (e) => {
    cropImage.src = e.target.result;
    cropModal.style.display = "flex";
    cropBox.setAttribute("tabindex", "-1");
    cropBox.focus();
    if (cropper) cropper.destroy();
    cropper = new Cropper(cropImage, {
      viewMode: 1,
      autoCropArea: 0.9,
      background: false,
    });
  };
  reader.readAsDataURL(file);
}
document.getElementById("f-photo-camera").addEventListener("change", (e) => handlePhotoFile(e.target.files[0]));
document.getElementById("f-photo-gallery").addEventListener("change", (e) => handlePhotoFile(e.target.files[0]));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cropModal.style.display === "flex") closeCropModal();
});

document.getElementById("crop-cancel").addEventListener("click", closeCropModal);

document.getElementById("crop-confirm").addEventListener("click", () => {
  if (!cropper) return;
  cropper.getCroppedCanvas({ maxWidth: 640, maxHeight: 640 }).toBlob((blob) => {
    currentPhotoFile = blob;
    const previewUrl = URL.createObjectURL(blob);
    const img = document.getElementById("photo-preview");
    img.src = previewUrl;
    img.style.display = "block";
    cropModal.style.display = "none";
    if (cropper) { cropper.destroy(); cropper = null; }
    if (lastFocusedBeforeCrop) lastFocusedBeforeCrop.focus();
  }, "image/jpeg", 0.85);
});

document.getElementById("submit-report").addEventListener("click", async () => {
  const name = document.getElementById("f-name").value.trim();
  const studentId = document.getElementById("f-studentid").value.trim();
  const dateFound = document.getElementById("f-date").value;
  const note = document.getElementById("f-note").value.trim();
  const errorBox = document.getElementById("report-error");
  errorBox.style.display = "none";

  if (!name || !studentId || !dateFound || !currentPhotoFile) {
    errorBox.textContent = "Fill in name, student ID, date found, and a photo of the card.";
    errorBox.style.display = "block";
    return;
  }

  const btn = document.getElementById("submit-report");
  btn.disabled = true;
  btn.textContent = "Posting…";

  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadError } = await sb.storage.from("card-photos").upload(fileName, currentPhotoFile);
    if (uploadError) throw uploadError;

    const { data: urlData } = sb.storage.from("card-photos").getPublicUrl(fileName);

    const { error: insertError } = await sb.from("listings").insert({
      name, student_id: studentId, date_found: dateFound, note, photo_url: urlData.publicUrl,
    });
    if (insertError) throw insertError;

    document.getElementById("f-name").value = "";
    document.getElementById("f-studentid").value = "";
    document.getElementById("f-date").value = "";
    document.getElementById("f-note").value = "";
    document.getElementById("photo-preview").style.display = "none";
    currentPhotoFile = null;

    showTab("browse");
    showToast("✓ Found ID reported successfully — it's now visible to the owner.", "success");
  } catch (err) {
    errorBox.textContent = "Couldn't post this listing. Try again.";
    errorBox.style.display = "block";
  }
  btn.disabled = false;
  btn.textContent = "Post found card";
});

// ---- Owner tools ----
document.getElementById("owner-unlock-btn").addEventListener("click", () => {
  const input = document.getElementById("owner-code-input").value;
  const errorBox = document.getElementById("owner-error");
  if (input === OWNER_CODE) {
    document.getElementById("owner-lock").style.display = "none";
    document.getElementById("owner-panel").style.display = "block";
    loadOwnerListings();
  } else {
    errorBox.textContent = "That code isn't right.";
    errorBox.style.display = "block";
  }
});

async function loadOwnerListings() {
  const container = document.getElementById("owner-listings");
  container.innerHTML = skeletonHtml(3);
  const { data, error } = await sb.from("listings").select("*").order("created_at", { ascending: false });
  if (error) { container.innerHTML = "<p class='empty-msg'>Couldn't load listings.</p>"; return; }
  if (!data || data.length === 0) { container.innerHTML = "<p class='empty-msg'>Nothing posted yet.</p>"; return; }
  container.innerHTML = data.map((l) => {
    const isReturned = l.status === "returned";
    return `
    <div class="owner-card" id="owner-row-${l.id}">
      ${l.photo_url ? `<img src="${l.photo_url}" alt="Photo of ${escapeHtml(l.name)}'s ID card" />` : ""}
      <div class="card-info">
        <p class="card-name">${escapeHtml(l.name)}</p>
        <p class="card-date">${escapeHtml(l.student_id)} · found ${l.date_found}</p>
      </div>
      ${isReturned
        ? `<span class="status-badge returned">✅ Returned</span>`
        : `<button class="claim-btn" data-id="${l.id}">Mark Returned</button>`}
    </div>`;
  }).join("");
  container.querySelectorAll(".claim-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      btn.disabled = true;
      btn.textContent = "Updating…";
      const { error } = await sb.from("listings").update({ status: "returned" }).eq("id", id);
      if (error) {
        btn.disabled = false;
        btn.textContent = "Mark Returned";
        showToast("Couldn't update — try again.");
        return;
      }
      btn.outerHTML = `<span class="status-badge returned">✅ Returned</span>`;
      showToast("✓ Marked as returned", "success");
    });
  });
}

// ---- init ----
loadListings();

// ---- Copy payment details ----
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1500);
    } catch {
      // clipboard access blocked — no-op, number is still visible to copy manually
    }
  });
});