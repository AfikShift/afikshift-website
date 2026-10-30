// Shared header/footer + mobile menu. No tracking, no cookies.
(function () {
  var page = document.body.getAttribute("data-page");
var links = [["/", "Home", "home"], ["/features.html", "Features", "features"], ["/pricing.html", "Pricing", "pricing"], ["/contact.html", "Contact", "contact"]];
 var nav = '<a class="logo" href="/"><img src="/img/icon.png" alt="" width="36" height="36">AfikShift</a>' +
    '<button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
    '<nav class="menu" id="menu">' + links.map(function (l) {
      return '<a href="' + l[0] + '"' + (page === l[2] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
    }).join("") + '<a class="cta" href="index.html#download">Download</a></nav>';
  var h = document.getElementById("site-header");
  if (h) h.innerHTML = '<div class="nav"><div class="wrap">' + nav + "</div></div>";

  var f = document.getElementById("site-footer");
 if (f) f.innerHTML = '<div class="wrap"><div class="cols"><div><a class="logo" href="/"><img src="/img/icon.png" alt="" width="36" height="36">AfikShift</a>' +
    "<p>Independent Shift &amp; Earnings Tracker.<br>Your Shifts. Your Earnings. Your Control.</p></div>" +
    '<div><h4>Product</h4><a href="/features.html">Features</a><a href="/pricing.html">Pricing</a><a href="/#screens">Screenshots</a><a href="/download/android/">Download</a></div>' +
    '<div><h4>Legal &amp; help</h4><a href="/privacy.html">Privacy Policy</a><a href="/terms.html">Terms &amp; Conditions</a><a href="/refunds.html">Cancellation &amp; Refunds</a><a href="/contact.html">Contact</a></div></div>' +
    '<div class="legal">AfikShift is an independently developed application. It is not affiliated with, endorsed by or sponsored by any government department, public body or employer. ' +
    "Earnings figures are estimates for personal record-keeping and are not official payroll records.<br>" +
    "AfikShift is operated by THE MHM NEXUS LTD, a company registered in England and Wales (company number 16762622). " +
    "Registered office: Enterprise Centre, Cranborne Road, Potters Bar, England, EN6 3DQ.<br>© " + new Date().getFullYear() +
    ' THE MHM NEXUS LTD · <a style="display:inline" href="mailto:contactus@afikshift.com">contactus@afikshift.com</a></div></div>';

  var b = document.querySelector(".burger"), m = document.getElementById("menu");
  if (b && m) b.addEventListener("click", function () {
    var open = m.classList.toggle("open");
    b.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
