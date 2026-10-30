// AfikShift website subscriptions: sign in / create account, then a Stripe-hosted checkout created by the
// AfikShift API for THIS account. Pro is switched on only by Stripe's verified webhook, never by this page.
// Config: window.AFIK_BILLING = {api: "https://<api-host>/api", enabled: true|false, sandbox: bool}
(function () {
  var cfg = window.AFIK_BILLING || {};
  var root = document.getElementById("afik-billing");
  if (!root) return;
  var API = (cfg.api || "").replace(/\/$/, "");
  var store = window.sessionStorage; // tokens live only for this browser tab
  var qs = new URLSearchParams(location.search);
  var PLANS = [["monthly", "AfikShift Pro Monthly", "£3.99", "/ month", "Renews every month"],
               ["six_month", "AfikShift Pro 6-Month", "£19.99", "/ 6 months", "Renews every six months"]];

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "on") Object.keys(attrs.on).forEach(function (e) { n.addEventListener(e, attrs.on[e]); });
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function show(nodes) { root.textContent = ""; nodes.forEach(function (c) { if (c) root.appendChild(c); }); }
  function note(text, warn) { return el("div", {"class": "callout" + (warn ? " warn" : ""), role: "status", text: text}); }
  function errText(d) {
    if (!d) return "Something went wrong. Please try again.";
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.detail) && d.detail[0]) return String(d.detail[0].msg || "Please check your details").replace(/^Value error, /, "");
    return "Something went wrong. Please try again.";
  }

  async function call(path, body, retry) {
    var h = {"Content-Type": "application/json"}, t = store.getItem("afik_at");
    if (t) h.Authorization = "Bearer " + t;
    var r = await fetch(API + path, {method: body === undefined ? "GET" : "POST", headers: h,
      body: body === undefined ? undefined : JSON.stringify(body), credentials: "omit"});
    if (r.status === 401 && retry !== false && store.getItem("afik_rt")) {
      var rr = await fetch(API + "/auth/refresh", {method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({refresh_token: store.getItem("afik_rt")}), credentials: "omit"});
      if (rr.ok) { keep(await rr.json()); return call(path, body, false); }
      signOutLocal();
    }
    var data = null;
    try { data = await r.json(); } catch (e) { /* empty body */ }
    if (!r.ok) { var e2 = new Error(errText(data)); e2.status = r.status; throw e2; }
    return data;
  }
  function keep(tok) { store.setItem("afik_at", tok.access_token); store.setItem("afik_rt", tok.refresh_token); }
  function signOutLocal() { store.removeItem("afik_at"); store.removeItem("afik_rt"); }
  function signedIn() { return !!store.getItem("afik_at"); }

  function form(fields, label, onSubmit, extra) {
    var msg = el("p", {"class": "form-msg", role: "alert"});
    var btn = el("button", {"class": "btn btn-teal", type: "submit", text: label});
    var f = el("form", {"class": "afik-form", novalidate: "", on: {submit: async function (ev) {
      ev.preventDefault(); msg.textContent = ""; btn.disabled = true;
      var v = {}; fields.forEach(function (x) { v[x[0]] = f.elements[x[0]].value.trim(); });
      try { await onSubmit(v); } catch (e) { msg.textContent = e.message; } finally { btn.disabled = false; }
    }}}, fields.map(function (x) {
      return el("label", {}, [el("span", {text: x[1]}), el("input", {name: x[0], type: x[2], autocomplete: x[3], required: ""})]);
    }).concat([msg, btn]).concat(extra || []));
    return f;
  }
  function link(text, fn) { return el("button", {"class": "linkbtn", type: "button", text: text, on: {click: fn}}); }

  function signInView(info) {
    show([info ? note(info) : null, el("h2", {text: "Sign in to subscribe"}),
      el("p", {text: "Use your AfikShift account. Pro is added to the account you sign in with."}),
      form([["email", "Email", "email", "email"], ["password", "Password", "password", "current-password"]], "Sign in",
        async function (v) { keep(await call("/auth/login", v)); home(); },
        [el("p", {}, [el("span", {text: "New to AfikShift? "}), link("Create an account", registerView)])])]);
  }
  function registerView() {
    show([el("h2", {text: "Create your AfikShift account"}),
      form([["full_name", "Full name", "text", "name"], ["email", "Email", "email", "email"],
            ["password", "Password (10+ characters, letters and numbers)", "password", "new-password"]], "Create account",
        async function (v) { await call("/auth/register", v); verifyView(v.email); },
        [el("p", {}, [el("span", {text: "Already have an account? "}), link("Sign in", function () { signInView(); })])])]);
  }
  function verifyView(email) {
    show([note("We have emailed a 6-digit code to " + email + "."), el("h2", {text: "Confirm your email"}),
      form([["code", "6-digit code", "text", "one-time-code"]], "Confirm",
        async function (v) { keep(await call("/auth/verify-email", {email: email, code: v.code})); home(); },
        [link("Back to sign in", function () { signInView(); })])]);
  }

  async function startCheckout(plan, btn) {
    btn.disabled = true;
    try { location.href = (await call("/billing/stripe/checkout", {plan: plan, channel: "web"})).url; }
    catch (e) { btn.disabled = false; alert(e.message); }
  }
  async function portal(btn) {
    btn.disabled = true;
    try { location.href = (await call("/billing/stripe/portal?channel=web", {})).url; }
    catch (e) { btn.disabled = false; alert(e.message); }
  }

  async function home(banner) {
    if (!signedIn()) return signInView(banner);
    show([note("Loading your account…")]);
    var me, ent;
    try { me = await call("/me"); ent = await call("/billing/entitlement"); }
    catch (e) { if (e.status === 401) return signInView(); return show([note(e.message, true)]); }
    var out = el("button", {"class": "btn btn-line", type: "button", text: "Sign out", on: {click: async function () {
      try { await call("/auth/logout", {refresh_token: store.getItem("afik_rt")}); } catch (e) { /* already signed out */ }
      signOutLocal(); signInView();
    }}});
    var who = el("p", {"class": "who", text: "Signed in as " + me.email + " · Plan: " + (ent.plan === "pro" ? "Pro" : "Free")});
    if (ent.plan === "pro") {
      var manage = el("button", {"class": "btn btn-teal", type: "button", text: "Manage subscription", on: {click: function () { portal(manage); }}});
      return show([banner ? note(banner) : null, who, el("h2", {text: "You have AfikShift Pro"}),
        el("p", {text: ent.expires_at ? (ent.will_renew ? "Renews on " : "Pro until ") + new Date(ent.expires_at).toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric"}) : ""}),
        el("div", {"class": "actions"}, [manage, out]),
        el("p", {"class": "small", text: "Subscribed through Google Play or Aptoide? Manage it in that store instead."})]);
    }
    var pick = qs.get("plan");
    var plans = el("div", {"class": "plans two"}, PLANS.map(function (p) {
      var b = el("button", {"class": "btn btn-teal", type: "button", "data-plan": p[0], text: "Subscribe – " + p[2], on: {click: function () { startCheckout(p[0], b); }}});
      return el("div", {"class": "plan" + (p[0] === "six_month" ? " best" : "") + (pick === p[0] ? " picked" : "")}, [
        p[0] === "six_month" ? el("span", {"class": "badge", text: "BEST VALUE"}) : null, el("h3", {text: p[1]}),
        el("p", {"class": "price"}, [document.createTextNode(p[2]), el("small", {text: " " + p[3]})]), el("p", {"class": "per", text: p[4] + ". Cancel any time."}), b]);
    }));
    show([banner ? note(banner) : null, who, el("h2", {text: "Choose your plan"}), plans,
      el("p", {"class": "small", text: "Payment is taken securely by Stripe. Recurring subscription, renews automatically until you cancel. See our Cancellation & Refund Policy."}), out]);
  }

  async function confirmPayment() {
    show([note("Confirming your payment with Stripe… this usually takes a few seconds.")]);
    try { await call("/billing/stripe/sync", {}); } catch (e) { /* the webhook will still arrive */ }
    for (var i = 0; i < 15; i++) {
      try { if ((await call("/billing/entitlement")).plan === "pro") return home("Thank you – AfikShift Pro is now active on your account. Open the app and it will switch on automatically."); }
      catch (e) { if (e.status === 401) return signInView("Please sign in again to see your Pro status."); }
      await new Promise(function (r) { setTimeout(r, 2000); });
    }
    home("We are still waiting for Stripe to confirm your payment. Pro will switch on automatically – refresh this page in a minute.");
  }

  if (!cfg.enabled || !API) {
    return show([note("Card subscriptions on the website are coming soon. You can subscribe in the AfikShift app today.")]);
  }
  var status = qs.get("status");
  if (status) history.replaceState(null, "", location.pathname + (qs.get("plan") ? "?plan=" + qs.get("plan") : ""));
  if (status === "success" && signedIn()) confirmPayment();
  else if (status === "cancelled") home("Checkout cancelled – no payment was taken.");
  else home();
})();
