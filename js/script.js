
/* ==================== CAR SELECTION PAGE ==================== */

if (document.body.classList.contains("car-selection-page")) {
    const carButtons = document.querySelectorAll(".select-car-btn");
    const continueBtn = document.getElementById("continue-car-btn");
    const selectedText = document.getElementById("selected-car-text");

    let selectedCar = "";

    carButtons.forEach(button => {
        button.addEventListener("click", () => {
            carButtons.forEach(btn => {
                btn.closest(".car-card").classList.remove("selected");
            });

            button.closest(".car-card").classList.add("selected");

            selectedCar = button.dataset.car;
            selectedText.textContent = "Selected Car: " + selectedCar;
            continueBtn.disabled = false;
        });
    });

    continueBtn.addEventListener("click", () => {
        if (selectedCar !== "") {
            localStorage.setItem("selectedCar", selectedCar);
            window.location.href = "track-selection.html";
        }
    });
}


/* ==================== TRACK SELECTION PAGE ==================== */

if (document.body.classList.contains("track-selection-page")) {
    const trackButtons = document.querySelectorAll(".select-track-btn");
    const continueBtn = document.getElementById("continue-track-btn");
    const selectedText = document.getElementById("selected-track-text");

    let selectedTrack = "";

    trackButtons.forEach(button => {
        button.addEventListener("click", () => {
            trackButtons.forEach(btn => {
                btn.closest(".track-card").classList.remove("selected");
            });

            button.closest(".track-card").classList.add("selected");

            selectedTrack = button.dataset.track;
            selectedText.textContent = "Selected Track: " + selectedTrack;
            continueBtn.disabled = false;
        });
    });

    continueBtn.addEventListener("click", () => {
        if (selectedTrack !== "") {
            localStorage.setItem("selectedTrack", selectedTrack);
            window.location.href = "challenge-selection.html";
        }
    });
}


/* ==================== CHALLENGE SELECTION PAGE ==================== */

if (document.body.classList.contains("challenge-selection-page")) {
    const challengeButtons = document.querySelectorAll(".select-challenge-btn");
    const startButton = document.getElementById("start-challenge-btn");
    const selectedText = document.getElementById("selected-challenge-text");

    let selectedMode = "";

    challengeButtons.forEach(button => {
        button.addEventListener("click", () => {
            challengeButtons.forEach(btn => {
                btn.closest(".challenge-card").classList.remove("selected");
            });

            button.closest(".challenge-card").classList.add("selected");

            selectedMode = button.dataset.mode;
            selectedText.textContent = "Selected Mode: " + selectedMode;
            startButton.disabled = false;
        });
    });

    startButton.addEventListener("click", () => {
        if (selectedMode !== "") {
            localStorage.setItem("selectedMode", selectedMode);
            window.location.href = "game.html";
        }
    });
}


/* ==================== GAME PAGE SELECTION ==================== */

if (document.body.classList.contains("game-page")) {
    const selectedCar = localStorage.getItem("selectedCar");
    const selectedTrack = localStorage.getItem("selectedTrack");

    const gameCar = document.getElementById("game-car");
    const trackName = document.getElementById("current-track-name");

    const backgrounds = {
        "Neon City": "image/city.jpg",
        "Forest": "image/forest.jpg",
        "Desert": "image/desert.jpg",
        "Snow Mountain": "image/ice.jpg"
    };

    if (selectedCar && gameCar) {
        gameCar.src = "image/car.png";
    }

    if (selectedTrack && backgrounds[selectedTrack]) {
document.body.style.backgroundImage = `linear-gradient(rgba(8,13,27,0.20), rgba(8,13,27,0.35)), url("${backgrounds[selectedTrack]}")`;    }

    if (trackName && selectedTrack) {
        trackName.textContent = selectedTrack.toUpperCase();
    }
}
