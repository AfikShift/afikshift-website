// Fills the Android download details from /release.json (one file to edit per release).
// The APK link is a specific, approved GitHub Release (vX.Y.Z), so a newer upload never replaces what is
// published until release.json is changed. "published": false keeps every download link hidden.
(function () {
  function set(name, value) {
    document.querySelectorAll('[data-r="' + name + '"]').forEach(function (el) { el.textContent = value; });
  }
  function show(sel, on) {
    document.querySelectorAll(sel).forEach(function (el) { el.hidden = !on; });
  }
  fetch("/release.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (rel) {
      var ok = rel.published === true && /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\//.test(rel.apk_url || "");
      set("version", rel.version);
      set("release_date", rel.release_date);
      set("file_size", rel.file_size);
      set("sha256", rel.sha256);
      document.querySelectorAll("[data-r-href]").forEach(function (a) { a.href = ok ? rel.apk_url : "#"; });
      show("[data-when-published]", ok);
      show("[data-when-unpublished]", !ok);
    })
    .catch(function () { show("[data-when-published]", false); show("[data-when-unpublished]", true); });
})();
