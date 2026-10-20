const socket = io();
socket.on("connect", function () {
    console.log("Connected to server:", socket.id);
});


let roomMode = "create";

function chooseRoomMode(mode) {
    roomMode = mode;

    document.getElementById("roomCode").style.display =
        mode === "join" ? "block" : "none";

    document.getElementById("roomCodeLabel").style.display =
        mode === "join" ? "block" : "none";

    document.getElementById("roomMessage").textContent = "";

    showScreen("playerScreen");
}

let score = 0;
let currentQuestion = 0;
let answered = false;
let selectedCar = "🏎️";
let playerName = "Player";
let distance = 10;

const questions = [
    {
        question: "Which index does an array usually start from in C?",
        options: ["A. 1", "B. 0", "C. -1", "D. 2"],
        answer: 1
    },
    {
        question: "Which data structure follows LIFO?",
        options: ["A. Queue", "B. Array", "C. Stack", "D. Tree"],
        answer: 2
    },
    {
        question: "Which operation inserts an element into a stack?",
        options: ["A. Pop", "B. Push", "C. Dequeue", "D. Peek"],
        answer: 1
    },
    {
        question: "Which data structure follows FIFO?",
        options: ["A. Stack", "B. Queue", "C. Tree", "D. Graph"],
        answer: 1
    },
    {
        question: "Which keyword is used to define an integer in C?",
        options: ["A. float", "B. char", "C. int", "D. string"],
        answer: 2
    }
];

function showScreen(screenId) {
    document.querySelectorAll(".hero, .screen").forEach(function(screen) {
        screen.style.display = "none";
    });

    document.getElementById(screenId).style.display =
        screenId === "welcomeScreen" ? "grid" : "block";
}

function selectCar(button) {
    document.querySelectorAll(".car-choice").forEach(function(car) {
        car.classList.remove("selected");
    });

    button.classList.add("selected");
    selectedCar = button.dataset.car;
}

socket.on("joinedRace", function(data) {
    document.getElementById("playerMessage").textContent =
        "Room joined successfully!";

    document.getElementById("lobbyRoomCode").textContent =
        data.roomCode;

    document.getElementById("lobbyMessage").textContent =
        "Waiting for players...";

    showScreen("lobbyScreen");

    console.log("Room Code:", data.roomCode);
    console.log("Player ID:", data.playerId);
});

let isHost = false;

socket.on("playersUpdate", function(data) {
    const playersBox = document.getElementById("lobbyPlayers");
    playersBox.innerHTML = "";

    data.players.forEach(function(player) {
        const playerRow = document.createElement("p");
        playerRow.textContent =
            player.name + " — " + player.score + " points";

        if (player.id === data.hostId) {
            playerRow.textContent += " 👑 Host";
        }

        playersBox.appendChild(playerRow);
    });

    isHost = socket.id === data.hostId;

    document.getElementById("startRaceBtn").style.display =
        isHost ? "inline-block" : "none";

    document.getElementById("lobbyMessage").textContent =
        data.players.length < 2
            ? "Waiting for at least one more player..."
            : (isHost ? "Everyone ready? Start the race!" : "Waiting for host to start...");
});

socket.on("raceStarted", function() {
    score = 0;
    currentQuestion = 0;
    distance = 10;
    answered = false;

    document.getElementById("playerCar").textContent = selectedCar;
    document.getElementById("playerCar").style.left = distance + "%";
    document.getElementById("carProgress").style.width = distance + "%";
    document.getElementById("distanceText").textContent = distance + "%";

    showScreen("gameScreen");
    updateScore();
});

socket.on("joinError", function(message) {
    document.getElementById("playerMessage").textContent = message;
});

function startGame() {
    const name = document.getElementById("playerName").value.trim();
    const roomMessage = document.getElementById("roomMessage");
    const playerMessage = document.getElementById("playerMessage");

    if (name === "") {
        playerMessage.textContent = "Please enter your name first!";
        return;
    }

    let code = "";

    if (roomMode === "join") {
        code = document.getElementById("roomCode").value.trim().toUpperCase();

        if (code === "") {
            playerMessage.textContent = "Please enter the room code!";
            return;
        }
    }

    playerName = name;
    selectedCar = selectedCar || "🏎️";

    playerMessage.textContent = "Connecting to room...";
    roomMessage.textContent = "";

    socket.emit("joinRace", {
        roomCode: code,
        playerName: name
    });
}


function loadQuestion() {
    const question = questions[currentQuestion];

    document.getElementById("questionText").textContent =
        question.question;

    document.getElementById("questionCount").textContent =
        "QUESTION " + (currentQuestion + 1) + " / " + questions.length;

    document.getElementById("progressFill").style.width =
        ((currentQuestion + 1) / questions.length * 100) + "%";

    document.getElementById("feedback").textContent =
        "Choose correctly to boost your car!";

    document.getElementById("nextBtn").disabled = true;

    const optionsBox = document.getElementById("options");
    optionsBox.innerHTML = "";

    question.options.forEach(function(option, index) {
        const button = document.createElement("button");

        button.className = "answer-btn";
        button.textContent = option;

        button.onclick = function() {
            checkAnswer(index, button);
        };

        optionsBox.appendChild(button);
    });

    answered = false;
}

function checkAnswer(selected, button) {
    if (answered) {
        return;
    }

    answered = true;

    const correctAnswer = questions[currentQuestion].answer;
    const allOptions = document.querySelectorAll(".answer-btn");

    allOptions.forEach(function(option, index) {
        option.disabled = true;

        if (index === correctAnswer) {
            option.classList.add("correct");
        }
    });

    if (selected === correctAnswer) {
        score += 10;
        distance = Math.min(distance + 20, 85);

        document.getElementById("feedback").textContent =
            "⚡ Correct answer! +10 points. Great racing!";

        document.getElementById("playerCar").style.left =
            distance + "%";

        document.getElementById("carProgress").style.width =
            distance + "%";

        document.getElementById("distanceText").textContent =
            distance + "%";
    } else {
        button.classList.add("wrong");

        document.getElementById("feedback").textContent =
            "Not quite! The correct answer is highlighted.";
    }

    updateScore();
    document.getElementById("nextBtn").disabled = false;
}

function updateScore() {
    document.getElementById("score").textContent = score;
    document.getElementById("headerScore").textContent = score;
    document.getElementById("leaderScore").textContent =
        score + " points";
}

function nextQuestion() {
    if (!answered) {
        return;
    }

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
    } else {
        document.getElementById("finalScore").textContent = score;
        document.getElementById("finalName").textContent =
            playerName + " — Race Champion!";

        showScreen("resultScreen");
    }
}

function restartGame() {
    document.getElementById("playerName").value = playerName;
    startGame();
}

showScreen("welcomeScreen");
