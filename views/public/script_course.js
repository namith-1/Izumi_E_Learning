let modules = [];

const courseID = getQueryParam("courseId");

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addModule").addEventListener("click", () => addModule());
});

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

function renderModules(parent = null, parentElement = document.getElementById("modules")) {
    parentElement.innerHTML = "";

    const list = parent ? parent.subModules : modules;
    
    list.forEach((mod, index) => {
        const li = document.createElement("li");
        
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.placeholder = "Module Title";
        titleInput.value = mod.title;
        titleInput.oninput = (e) => mod.title = e.target.value;

        const textInput = document.createElement("textarea");
        textInput.placeholder = "Module Text";
        textInput.value = mod.text;
        textInput.oninput = (e) => mod.text = e.target.value;

        const urlInput = document.createElement("input");
        urlInput.type = "url";
        urlInput.placeholder = "Module URL";
        urlInput.value = mod.url;
        urlInput.oninput = (e) => mod.url = e.target.value;
        
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
    if (confirm("Are you sure you want to save this course?")) {
    if(courseID){
    fetch(courseID ? `/save-course-changes?courseId=${courseID}` : "/save-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: document.getElementById("courseTitle").value,
            modules
        })
    })
    .then(res => res.json())
    .then(alert);
}else
{
    fetch("/save-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: document.getElementById("courseTitle").value,
            modules
        })
    }).then(res => res.json()).then(alert);
}
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function loadCourse() {
    if (courseID && courseID !== "404") {
        fetch(`/course/${courseID}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("courseTitle").value = data.title;
            modules = data.modules;
            renderModules();
        })
        .catch(error => console.error("Error loading course:", error));
    }
}

// Call loadCourse when the page loads
if (courseID) {
    window.onload = loadCourse;
    document.getElementById("s").style.display = "none";
} else {
    document.getElementById("sc").style.display = "none";
}