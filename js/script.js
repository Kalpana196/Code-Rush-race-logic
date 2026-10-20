const startBtn = document.getElementById("startBtn");

if (startBtn) {
    startBtn.addEventListener("click", function () {
        window.location.href = "game.html";
    });
}
const lobbyPage = document.querySelector(".game-lobby");

if (lobbyPage) {
    const playerButtons = document.querySelectorAll(".lobby-player");

    playerButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            playerButtons.forEach(function(item) {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
        });
    });

    document.getElementById("backBtn").addEventListener("click", function() {
        window.location.href = "index.html";
    });

    document.getElementById("createBtn").addEventListener("click", function() {
        alert("Create Room functionality will be added later!");
    });

    document.getElementById("joinBtn").addEventListener("click", function() {
        alert("Join Room functionality will be added later!");
    });
}
