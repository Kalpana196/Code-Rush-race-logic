
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const rooms = new Map();

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

function makeRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function publicPlayers(room) {
    return room.players.map(player => ({
        id: player.id,
        name: player.name,
        score: player.score,
        progress: player.progress
    }));
}

function sendPlayers(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    io.to(roomCode).emit("playersUpdate", {
        players: publicPlayers(room),
        hostId: room.hostId,
        started: room.started
    });
}

function sendQuestion(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || !room.started) return;

    if (room.questionIndex >= room.questions.length) {
        room.finished = true;
        io.to(roomCode).emit("raceFinished", {
            players: publicPlayers(room)
        });
        return;
    }

    const question = room.questions[room.questionIndex];
    room.answered = false;

    clearTimeout(room.timerId);

    io.to(roomCode).emit("questionUpdate", {
        index: room.questionIndex,
        total: room.questions.length,
        question: question.question,
        options: question.options,
        levelIndex: question.levelIndex,
        activePlayerId: room.players[room.turn]?.id,
        seconds: 30
    });

    room.timerId = setTimeout(() => {
        finishQuestion(roomCode, null);
    }, 30000);
}

function finishQuestion(roomCode, selectedIndex) {
    const room = rooms.get(roomCode);

    if (!room || !room.started || room.answered) return;

    room.answered = true;
    clearTimeout(room.timerId);

    const player = room.players[room.turn];
    const question = room.questions[room.questionIndex];

    if (!player || !question) return;

    const correct = selectedIndex === question.answer;

    if (correct) {
        const points = [10, 20, 30, 40, 50];
        player.score += points[question.levelIndex] || 10;
        player.progress += 1;
    }

    io.to(roomCode).emit("answerResult", {
        playerId: player.id,
        playerName: player.name,
        selectedIndex,
        correctIndex: question.answer,
        correct,
        timedOut: selectedIndex === null,
        correctText: question.options[question.answer]
    });

    sendPlayers(roomCode);
}

io.on("connection", socket => {

    socket.on("joinRace", ({ roomCode, playerName } = {}) => {
        if (socket.data.roomCode) {
            socket.emit("joinError", "You have already joined a room.");
            return;
        }

        const name = String(playerName || "").trim().slice(0, 20);

        if (!name) {
            socket.emit("joinError", "Please enter your name.");
            return;
        }

        let code = String(roomCode || "").trim().toUpperCase();

        if (!code) {
            do {
                code = makeRoomCode();
            } while (rooms.has(code));
        }

        let room = rooms.get(code);

        if (!room) {
            room = {
                hostId: socket.id,
                players: [],
                started: false,
                finished: false,
                answered: false,
                turn: 0,
                questionIndex: 0,
                questions: [],
                timerId: null
            };
            rooms.set(code, room);
        }

        if (room.started) {
            socket.emit("joinError", "This race has already started.");
            return;
        }

        if (room.players.length >= 4) {
            socket.emit("joinError", "Room is full. Maximum 4 players.");
            return;
        }

        if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            socket.emit("joinError", "This player name is already taken in this room.");
            return;
        }

        room.players.push({
            id: socket.id,
            name,
            score: 0,
            progress: 0
        });

        socket.data.roomCode = code;
        socket.join(code);

        socket.emit("joinedRace", {
            roomCode: code,
            playerId: socket.id
        });

        sendPlayers(code);
    });

    socket.on("startRace", async () => {
        const code = socket.data.roomCode;
        const room = rooms.get(code);

        if (!room || socket.id !== room.hostId || room.started) return;

        if (room.players.length < 2) {
            socket.emit("joinError", "At least 2 players are needed to start.");
            return;
        }

        try {
            const filePath = path.join(__dirname, "questions.json");
            const data = require(filePath);

            const keys = [
                "level1_array",
                "level2_stack",
                "level3_queue",
                "level4_linked_list",
                "level5_mixed"
            ];

            const questions = [];

            for (let levelIndex = 0; levelIndex < keys.length; levelIndex++) {
                const bank = data.levels[keys[levelIndex]]?.questions || [];

                const shuffled = [...bank].sort(() => Math.random() - 0.5);

                shuffled.slice(0, 5).forEach(question => {
                    questions.push({
                        ...question,
                        levelIndex
                    });
                });
            }

            if (questions.length === 0) {
                socket.emit("joinError", "No questions found in questions.json.");
                return;
            }

            room.questions = questions;
            room.started = true;
            room.finished = false;
            room.turn = 0;
            room.questionIndex = 0;

            io.to(code).emit("raceStarted");
            sendPlayers(code);
            sendQuestion(code);

        } catch (error) {
            console.error(error);
            socket.emit("joinError", "Could not load questions.json.");
        }
    });

    socket.on("submitAnswer", ({ selectedIndex } = {}) => {
        const code = socket.data.roomCode;
        const room = rooms.get(code);

        if (!room || !room.started || room.finished || room.answered) return;
        if (room.players[room.turn]?.id !== socket.id) return;

        const question = room.questions[room.questionIndex];
        if (!question) return;

        if (
            !Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= question.options.length
        ) {
            return;
        }

        finishQuestion(code, selectedIndex);
    });

    socket.on("nextQuestion", () => {
        const code = socket.data.roomCode;
        const room = rooms.get(code);

        if (!room || !room.started || room.finished || !room.answered) return;
        if (room.players[room.turn]?.id !== socket.id) return;

        room.questionIndex += 1;

        if (room.questionIndex >= room.questions.length) {
            room.finished = true;
            clearTimeout(room.timerId);

            io.to(code).emit("raceFinished", {
                players: publicPlayers(room)
            });
            return;
        }

        room.turn = (room.turn + 1) % room.players.length;
        sendQuestion(code);
    });

    socket.on("disconnect", () => {
        const code = socket.data.roomCode;
        const room = rooms.get(code);

        if (!room) return;

        const leavingIndex = room.players.findIndex(p => p.id === socket.id);
        if (leavingIndex === -1) return;

        room.players.splice(leavingIndex, 1);

        if (room.players.length === 0) {
            clearTimeout(room.timerId);
            rooms.delete(code);
            return;
        }

        if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
        }

        if (room.turn >= room.players.length) {
            room.turn = 0;
        }

        if (room.started && !room.finished && room.answered === false) {
            const activePlayer = room.players[room.turn];

            if (!activePlayer || activePlayer.id !== socket.id) {
                clearTimeout(room.timerId);
                room.answered = true;
                room.questionIndex += 1;

                if (room.questionIndex >= room.questions.length) {
                    room.finished = true;
                    io.to(code).emit("raceFinished", {
                        players: publicPlayers(room)
                    });
                } else {
                    room.turn = room.turn % room.players.length;
                    sendQuestion(code);
                }
            }
        }

        sendPlayers(code);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Code Rush running at http://localhost:${PORT}`);
});
