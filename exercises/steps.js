// Shared progress tracker for exercise walkthrough pages.
// Persists every <input type="checkbox" class="step"> by index, per page, in localStorage.
(function(){
  var KEY = "gemstar-ex-" + (document.body.dataset.key || location.pathname.split("/").pop());
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ state = {}; }

  var boxes = Array.prototype.slice.call(document.querySelectorAll("input.step"));
  boxes.forEach(function(cb, i){
    var id = "s" + i;
    var li = cb.closest("li");
    if (state[id]) { cb.checked = true; if (li) li.classList.add("done"); }
    cb.addEventListener("change", function(){
      state[id] = cb.checked;
      if (li) li.classList.toggle("done", cb.checked);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
      update();
    });
  });

  function update(){
    var total = boxes.length, done = boxes.filter(function(b){return b.checked;}).length;
    var bar = document.getElementById("bar");
    if (bar) bar.style.width = total ? (100*done/total) + "%" : "0%";
    var pct = document.getElementById("pct");
    if (pct) pct.textContent = done + " / " + total;
  }
  update();

  // Cross-platform link upgrade: build vscode://file links from the repo root, derived from THIS
  // page's own location — so they work whether the repo is at /Volumes/… (macOS), /C:/… (Windows),
  // or anywhere else. Falls back to the relative href already in the markup (e.g. when served over http).
  if (typeof upgradePathLinks === "function") upgradePathLinks();
})();

function upgradePathLinks(){
  try {
    if (location.protocol !== "file:") return;            // hosted over http → keep relative hrefs
    var marker = "/learning-guide/";
    var path = decodeURIComponent(location.pathname);
    var i = path.indexOf(marker);
    if (i === -1) return;
    var root = path.slice(0, i);                           // /Volumes/DevArea/dlr/gemstar  OR  /C:/Users/me/gemstar
    var links = document.querySelectorAll("a.path[data-file]");
    for (var k = 0; k < links.length; k++) {
      links[k].setAttribute("href", "vscode://file" + root + "/" + links[k].getAttribute("data-file"));
    }
  } catch (e) { /* keep relative fallback */ }
}
