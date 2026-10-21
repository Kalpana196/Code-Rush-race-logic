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

}


const copyRoomBtn = document.getElementById("copyRoomBtn");

if (copyRoomBtn) {
    copyRoomBtn.addEventListener("click", async function () {
        const roomCode = document.getElementById("roomCode").textContent;

        try {
            await navigator.clipboard.writeText(roomCode);
            copyRoomBtn.textContent = "Code Copied!";
        } catch (error) {
            alert("Please copy the room code manually: " + roomCode);
        }
    });
}
const createBtn = document.getElementById("createBtn");

if (createBtn) {
    createBtn.addEventListener("click", function () {
        window.location.href = "create-room.html";
    });
}
const joinBtn = document.getElementById("joinBtn");

if (joinBtn) {
    joinBtn.addEventListener("click", function () {
        window.location.href = "join-room.html";
    });
}


const joinRoomBtn = document.getElementById("joinRoomBtn");

if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", function () {
        const roomCode = document.getElementById("roomCodeInput").value.trim();
        const joinMessage = document.getElementById("joinMessage");

        if (roomCode === "") {
            joinMessage.textContent = "Please enter a room code.";
            joinMessage.style.color = "#ff8585";
            return;
        }

        joinMessage.textContent = "Room code entered. Connecting requires the multiplayer server.";
        joinMessage.style.color = "#a18aff";
    });
}
