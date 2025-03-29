let magazineList = [];
let load_upto = 5; // Start by loading first 5 courses

// Fetch courses when the page loads
window.onload = async function () {
    await fetchMagazines();
};
async function fetchMagazines() {
    if (load_upto < magazineList.length) {
        load_upto += 5;
        displayMagazines();
    } else {
        try {
            const lastLoadedId = magazineList.length > 0 ? magazineList[magazineList.length - 1].id : 0;
            const response = await fetch(`http://localhost:4000/magazines?lastId=${lastLoadedId}`);
            const magazines = await response.json();

            if (magazines.length > 0) {
                magazineList = [...magazineList, ...magazines];
                load_upto = magazineList.length;
                displayMagazines();
            } else {
                alert("No more magazines to load!");
            }
        } catch (error) {
            console.error("Error fetching magazines:", error);
        }
    }
}

function displayMagazines() {
    const container = document.getElementById("magazineContainer");
    container.innerHTML = ""; // Clear previous content

    for (let i = 0; i < load_upto; i++) {
        const magazine = magazineList[i];
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <img src="${magazine.image_url}" alt="Magazine Cover">
            <div class="card-content">
                <div class="card-title">${magazine.title}</div>
                <div class="card-desc">${magazine.description}</div>
            </div>
        `;
        // Add click event to open detailed view
        card.addEventListener("click", () => openMagazineDetail(magazine));
        container.appendChild(card);
    }
}

function showLess() {
    if (load_upto > 5) {
        load_upto -= 5;
        displayMagazines(); // Re-render the magazines after reducing the count
    }
}