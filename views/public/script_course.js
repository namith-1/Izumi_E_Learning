let modules = [];
let whatYouWillLearn = [];

const courseID = getQueryParam("courseId");

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
    whatYouWillLearn,
    sub
  };

  const url = courseID
    ? `/save-course-changes?courseId=${courseID}`
    : "/save-course";
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Course saved successfully!");
      window.location.href = "/instructor-dashboard";
    })
    .catch((err) => console.error(err));
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function loadCourse() {
  if (courseID && courseID !== "404") {
    fetch(`/course/${courseID}`)
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("courseTitle").value = data.title;
        modules = data.modules || [];
        document.getElementById("overview").value = data.overview || "";
        document.getElementById("tagline").value = data.tagline || "";
        whatYouWillLearn = Array.isArray(data.whatYouWillLearn)
          ? data.whatYouWillLearn
          : [];
        renderWhatYouWillLearn();
        renderModules();
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
