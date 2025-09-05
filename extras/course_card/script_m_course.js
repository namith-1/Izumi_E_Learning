let courseList = [];
let load_upto = 0; // Track how many courses to load

async function fetchCourses() {
    if (load_upto < courseList.length) {
        load_upto += 5;
        displayCourses();
    } else {
        try {
            const lastLoadedId = courseList.length > 0 ? courseList[courseList.length - 1].id : 0;
            const response = await fetch(`http://localhost:4000/courses?lastId=${lastLoadedId}`);
            const courses = await response.json();

            if (courses.length > 0) {
                courseList = [...courseList, ...courses];
                load_upto = courseList.length;
                displayCourses();
            } else {
                alert("No more courses to load!");
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    }
}

function displayCourses() {
    const container = document.getElementById("courseContainer");
    container.innerHTML = ""; // Clear previous content

    for (let i = 0; i < load_upto; i++) {
        const course = courseList[i];
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <div class="card-content">
                <div class="card-title">${course.title}</div>
            </div>
        `;
        // Add click event to open course details
        card.addEventListener("click", () => openCourseDetail(course));
        container.appendChild(card);
    }
}

function showLess() {
    if (load_upto > 5) {
        load_upto -= 5;
        displayCourses(); // Re-render the courses after reducing the count
    }
}
