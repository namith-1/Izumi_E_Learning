let modules = [];
let whatYouWillLearn = [];

const courseIDRaw = getQueryParam("courseId");
const courseID = (courseIDRaw || "").trim();
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addModule");
  if (addBtn) addBtn.addEventListener("click", () => addModule());

  // What you'll learn input handler
  const wywInput = document.getElementById("whatYouWillLearnInput");
  if (wywInput) {
    wywInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && wywInput.value.trim()) {
        e.preventDefault();
        whatYouWillLearn.push(wywInput.value.trim());
        wywInput.value = "";
        renderWhatYouWillLearn();
      }
    });
  }
});

function renderWhatYouWillLearn() {
  const list = document.getElementById("whatYouWillLearnList");
  if (!list) return;
  list.innerHTML = "";
  whatYouWillLearn.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = item + " ";
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.onclick = () => {
      whatYouWillLearn.splice(idx, 1);
      renderWhatYouWillLearn();
    };
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function addModule(parent = null) {
  const mod = { title: "", text: "", url: "", subModules: [] };

  if (parent === null) {
    modules.push(mod);
  } else {
    parent.subModules.push(mod);
  }

  renderModules();
}

function removeModule(parent, index) {
  if (parent === null) {
    modules.splice(index, 1);
  } else {
    parent.subModules.splice(index, 1);
  }

  renderModules();
}

function renderModules(
  parent = null,
  parentElement = document.getElementById("modules")
) {
  parentElement.innerHTML = "";

  const list = parent ? parent.subModules : modules;

  list.forEach((mod, index) => {
    const li = document.createElement("li");

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Module Title";
    titleInput.value = mod.title;
    titleInput.oninput = (e) => (mod.title = e.target.value);

    const textInput = document.createElement("textarea");
    textInput.placeholder = "Module Text";
    textInput.value = mod.text;
    textInput.oninput = (e) => (mod.text = e.target.value);

    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.placeholder = "Module URL";
    urlInput.value = mod.url;
    urlInput.oninput = (e) => (mod.url = e.target.value);

    const addButton = document.createElement("button");
    addButton.textContent = "Add Sub-Module";
    addButton.onclick = () => addModule(mod);

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove Module";
    removeButton.onclick = () => removeModule(parent, index);

    li.appendChild(titleInput);
    li.appendChild(textInput);
    li.appendChild(urlInput);
    li.appendChild(addButton);
    li.appendChild(removeButton);

    const subList = document.createElement("ul");
    li.appendChild(subList);
    parentElement.appendChild(li);

    renderModules(mod, subList);
  });
}

function saveCourse() {
  if (!confirm("Are you sure you want to save this course?")) return;

  const payload = {
    title: document.getElementById("courseTitle").value,
    modules,
    price: Number(document.getElementById("price").value) || 0,
    overview: (document.getElementById("overview") || { value: "" }).value,
    tagline: (document.getElementById("tagline") || { value: "" }).value,
    // Send the accumulated list rather than a single input value
    whatYouWillLearn: Array.isArray(whatYouWillLearn) ? whatYouWillLearn : [],
    subject: (document.getElementById("subject") || { value: "" }).value
  };

  const url = courseID
    ? `/save-course-changes?courseId=${encodeURIComponent(courseID)}`
    : "/save-course";
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Course saved successfully!");
      window.location.href = "/dashboard";
    })
    .catch((err) => console.error(err));
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function loadCourse() {
  if (courseID && courseID !== "404") {
    // Validate id format before attempting fetches
    if (!isValidObjectId(courseID)) {
      console.warn("Invalid courseId format; skipping module fetch.", courseID);
      const banner = document.getElementById("fallbackBanner");
      if (banner) {
        banner.textContent = "Invalid course ID. Please return to dashboard.";
        banner.style.display = "block";
      }
      return;
    }
    // Try primary endpoint; if it fails, fallback to minimal course API
    fetch(`/course/${encodeURIComponent(courseID)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Primary fetch failed: ${res.status}`);
        return res.json();
      })
      .catch(async () => {
        // Fallback to minimal course details to keep editor usable
        const res = await fetch(`/api/courses/${encodeURIComponent(courseID)}`);
        if (!res.ok) throw new Error(`Fallback fetch failed: ${res.status}`);
        const meta = await res.json();
        // Normalize minimal structure
        return {
          title: meta.title || "",
          overview: meta.overview || "",
          tagline: meta.tagline || "",
          whatYouWillLearn: Array.isArray(meta.whatYouWillLearn)
            ? meta.whatYouWillLearn
            : [],
          modules: [],
          _fallback: true,
        };
      })
      .then((data) => {
        document.getElementById("courseTitle").value = data.title || "";
        modules = Array.isArray(data.modules) ? data.modules : [];
        document.getElementById("overview").value = data.overview || "";
        document.getElementById("tagline").value = data.tagline || "";
        whatYouWillLearn = Array.isArray(data.whatYouWillLearn)
          ? data.whatYouWillLearn
          : [];
        renderWhatYouWillLearn();
        renderModules();
        // If fallback was used, surface a subtle banner to the user
        if (data._fallback) {
          const banner = document.getElementById("fallbackBanner");
          if (banner) {
            banner.textContent =
              "Modules temporarily unavailable. You can edit basic details now.";
            banner.style.display = "block";
          }
        }
      })
      .catch((error) => console.error("Error loading course:", error));
  }
}

// Call loadCourse when the page loads
if (courseID) {
  window.onload = loadCourse;
  document.getElementById("s").style.display = "none";
} else {
  document.getElementById("sc").style.display = "none";
}
