let modules = [];

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

function renderModules(parent = null, parentElement = document.getElementById("modules")) {
    parentElement.innerHTML = "";

    const list = parent ? parent.subModules : modules;
    
    list.forEach((mod) => {
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
        
        li.appendChild(titleInput);
        li.appendChild(textInput);
        li.appendChild(urlInput);
        li.appendChild(addButton);
        
        const subList = document.createElezment("ul");
        li.appendChild(subList);
        parentElement.appendChild(li);
        
        renderModules(mod, subList);
    });
}

function saveCourse(f) {
    fetch("/save-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: document.getElementById("courseTitle").value,
            modules
        })
    }).then(res => res.json()).then(alert);
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function loadCourse() {
    const courseId = getQueryParam("courseId");
    if (courseId && courseId !== 404) {
        fetch(`/course/${courseId}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("courseTitle").value = data.title;
            modules = data.modules;
            console.log(modules);
            renderModules();
        })
        .catch(error => console.error("Error loading course:", error));
    }

   

}
const courseID = getQueryParam("courseId");

// Call loadCourse when the page loads
if(courseID != 404)window.onload = loadCourse;
