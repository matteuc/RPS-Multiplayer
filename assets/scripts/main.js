var usersRefSnap, connectionsRefSnap, userConnectionRef, userConnectionSnap;
var currUser, currUserRef, currUserRefSnap;
var connectionsId = {};
var gamesRefSnap;

var rockIcon = "./assets/images/rock.png";
var paperIcon = "./assets/images/paper.png";
var scissorsIcon = "./assets/images/scissors.png";
var hiddenIcon = "./assets/images/lock.png"

usersRef.on("value", function (snap) {
    usersRefSnap = snap;
    if (currUser) {
        currUserRefSnap = usersRefSnap.child(currUser);
    }
});

// When the client's connection state changes...
connectedRef.on("value", function (snap) {
    // If they are connected..
    if (snap.val()) {
        promptUsername();
    }

});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function (snap) {
    connectionsRefSnap = snap;
    renderOnlineUsers();
    if (currUser) {
        userConnectionSnap = connectionsRefSnap.child(connectionsId[currUser]);
        renderInvitations();
        if (userConnectionSnap.val().inGame) {
            renderGame();
        }
    }
    // if ((snap.child(connectionsId[currUser]).val().inTurn || snap.child(connectionsId[currUser]).val().result)) {

    // })
})

gamesRef.on("value", function (snap) {
    gamesRefSnap = snap;
})

// Loads current user info to DOM
function renderUserInfo(username) {
    $("#username").text(username);
    $("#userWins").text(usersRefSnap.child(username).val().wins);
    $("#userLosses").text(usersRefSnap.child(username).val().losses);
}

function getCurrentTime() {
    return moment().format('LLLL');
}

// Loads online users to DOM
function renderOnlineUsers() {
    var activeUsers = $("#activeUsers")
    var numUsers = 0;
    activeUsers.empty();

    $.each(connectionsRefSnap.val(), function (id, user) {
        if (user.username != currUser) {
            var newUserItem = $("<li class='list-group-item'>");
            newUserItem.text(user.username);
            newUserItem.attr("data-name", user.username);
            newUserItem.attr("data-inGame", user.inGame);

            if (user.inGame) {
                newUserItem.addClass("user-busy");
                newUserItem.addClass("list-group-item-danger");
                newUserItem.append(" <i>is currently in a game</i>")
            } else {
                newUserItem.addClass("user-free");
            }

            activeUsers.append(newUserItem);
            numUsers++;
        } else {
            userConnectionRef = connectionsRef.child(id);

            userConnectionRef.on("value", function (snap) {
                userConnectionSnap = snap;
            })
        }

        connectionsId[user.username] = id;

    })

    $("#numUsersBadge").text(numUsers);


}

function renderInvitations() {
    usersRef.child(currUser).child("receivedInvitations").on("value", function (snap) {
        // Reset users DOM
        renderOnlineUsers();
        var invites = snap.val()
        var invitesDisplay = $("#receivedInvites");
        var numInvites = 0;
        invitesDisplay.empty();

        $.each(invites, function (user, info) {
            var newInviteItem = $("<li class='list-group-item invite'>");
            newInviteItem.html(`${bold(user)} <i>Received on ${info.receivedOn}</i>`);
            newInviteItem.attr("data-name", user);
            invitesDisplay.append(newInviteItem);
            var sentBy = $(`.user-free[data-name = "${user}"]`);
            sentBy.removeClass("user-free");
            sentBy.addClass("list-group-item-warning invitedBy");
            sentBy.append(` <i>sent you an invite on ${info.receivedOn}</i>`);
            numInvites++;

        })

        $("#numInvitesBadge").text(numInvites);

    });

    usersRef.child(currUser).child("sentInvitations").on("value", function (snap) {
        // Reset users DOM
        renderOnlineUsers();

        var sentInvites = snap.val()

        $.each(sentInvites, function (user, info) {
            var sentTo = $(`.user-free[data-name = "${user}"]`);
            sentTo.removeClass("user-free");
            sentTo.addClass("list-group-item-info");
            sentTo.append(` <i>was sent an invite on ${info.sentOn}</i>`);
        })
    });


}

// When a username is clicked, send a game invite
$(document).on("click", ".user-free", function () {
    if (currUser) {
        // If the current user is not in a game
        var userToInvite = $(this).text();
        if ($(this).attr("data-inGame") != true) {
            // Send an invitation confirmation
            bootbox.confirm(`Would you like to send ${bold(userToInvite)} a game invite?`, function (result) {
                if (result) {
                    currUserRef.child("sentInvitations").child(userToInvite).update({
                        sentOn: getCurrentTime()
                    });
                    usersRef.child(userToInvite).child("receivedInvitations").child(currUser).update({
                        receivedOn: getCurrentTime()
                    })
                }
            });
        }
    }
})

// When an invite is clicked, play a game of RPS
$(document).on("click", ".invite, .invitedBy", function () {
    var sentBy = $(this).attr("data-name");
    var opponentInGame = usersRefSnap.child(sentBy).val().inGame;

    if (!opponentInGame) {
        bootbox.confirm(`Would you like to challenge ${bold(sentBy)} to a game?`, function (result) {
            // remove this user from the current user's receivedInvitations
            usersRef.child(currUser).child("receivedInvitations").child(sentBy).set(null);
            // remove the current user from this user's sentInvitations
            usersRef.child(sentBy).child("sentInvitations").child(currUser).set(null);
            if (result) {
                // var id = gamesRef.push();
                // gamesRef.child(id.key).set({
                //     inProgress: true
                // });
                // Update current user info
                userConnectionRef.update({
                    inGame: true,
                    inTurn: true,
                    opponent: sentBy

                });
                // Update opponent info
                connectionsRef.child(connectionsId[sentBy]).update({
                    inGame: true,
                    inTurn: false,
                    opponent: currUser
                })
                renderGame();
            }
        })
    }

})

function renderGame() {
    // Hide Dashboard
    $("#dashboard").hide();
    $("#gameDisplay").fadeIn();

    // var currGameId = userConnectionSnap.val().gameId;
    var userInTurn = userConnectionSnap.val().inTurn;
    var userResult = userConnectionSnap.val().result;
    var userInGame = userConnectionSnap.val().inGame;
    var userResultShown = userConnectionSnap.val().resultShown;
    var opponent = userConnectionSnap.val().opponent;
    var opponentChoice = userConnectionSnap.val().opponentChoice;
    var opponentConnectionRef = connectionsRef.child(connectionsId[opponent]);

    // var currGameRef = gamesRef.child(currGameId);
    // var currGameSnap = gamesRefSnap.child(currGameId);
    // var gameInProgress = gamesRefSnap.child(currGameId).val().inProgress;

    // If it is the current user's turn and the game is in progress
    if (userInTurn && userInGame) {

        // Show message and enable buttons
        updateMessage("What is your move?");
        enableButtons();
        // If the opponent has not made their move yet
        if (!opponentChoice) {
            // When move is clicked
            $(".move").click(function () {
                var userChoice = $(this).attr("id");
                var userChoiceIcon = getMoveIcon(userChoice);
                $("#userChoiceIcon").attr("src", userChoiceIcon);

                // var gameObject = {};
                // gameObject[currUser] = userChoice;

                // currGameRef.update(gameObject);

                // Update user info
                // "Notify" game start to opponent and show game screen
                userConnectionRef.update({
                    inTurn: false
                })

                opponentConnectionRef.update({
                    inTurn: true,
                    opponentChoice: userChoice
                })
            })
        }
        // If the opponent has made their move
        else {
            // Retrieve and hide enemy move
            var opponentChoice = userConnectionSnap.val()["opponentChoice"];
            var opponentChoiceIcon = getMoveIcon(opponentChoice);
            $("#opponentChoiceIcon").attr("src", hiddenIcon);

            $(".move").click(function () {
                // update user choice icon
                var userChoice = $(this).attr("id");
                var userChoiceIcon = getMoveIcon(userChoice);
                $("#userChoiceIcon").attr("src", userChoiceIcon);

                // Get game result
                var userResult = getResult(userChoice, opponentChoice);
                var opponentResult = getResult(opponentChoice, userChoice);

                // Show Opponent Move
                $("#opponentChoiceIcon").attr("src", opponentChoiceIcon);

                // update user in-game info
                opponentConnectionRef.update({
                    opponentChoice: userChoice,
                    result: opponentResult,
                    resultShown: false
                })

                userConnectionRef.update({
                    inGame: false,
                    result: userResult,
                    resultShown: true,
                })

                // update game info
                // var gameObject = {};
                // gameObject.inProgress = false;
                // gameObject[currUser] = userChoice;
                // gamesRef.child(currGameId).update(gameObject);

                endGame(userResult);
            })

        }

    }
    // User is waiting for the opponent to make their move
    else if (!userInTurn && userInGame && !userResult) {
        updateMessage("Waiting for opponent's move...");
        disableButtons();
    }
    // Game no longer in progress, results have been determined, but results have not been displayed
    else if (userInGame && userResult && !userResultShown) {
        // View enemy move
        var opponentChoice = userConnectionSnap.val()["opponentChoice"]
        var opponentChoiceIcon = getMoveIcon(opponentChoice);
        $("#opponentChoiceIcon").attr("src", opponentChoiceIcon);

        // update inGame boolean
        userConnectionRef.update({
            inGame: false,
            resultShown: true
        })

        endGame(userResult);
        // deleteGame();
    }

    function getMoveIcon(move) {
        var icon;
        switch (move) {
            case "rock":
                icon = rockIcon;
                break;
            case "paper":
                icon = paperIcon;
                break;
            case "scissors":
                icon = scissorsIcon;
                break;
        }

        return icon;
    }

    function getResult(userChoice, opponentChoice) {
        if (userChoice === opponentChoice) {
            return "tied"
        } else {
            if (((userChoice === "scissors") && (opponentChoice === "paper")) || ((userChoice === "rock") && (opponentChoice === "scissors")) || ((userChoice === "paper") && (opponentChoice === "rock"))) {
                return "won"
            } else {
                return "lost"
            }
        }
    }

    function resetGame() {
        // Reset Game Information
        updateMessage("");
        $("#userChoiceIcon, #opponentChoiceIcon").attr("src", "");
        // Disable buttons
        disableButtons();
    }

    function updateMessage(text) {
        $("#gameMessage").text(text);
    }

    function disableButtons() {
        $("#rock, #paper, #scissors").attr("disabled", true);
    }

    function enableButtons() {
        $("#rock, #paper, #scissors").attr("disabled", false);
    }

    function endGame(userResult) {

        disableButtons();
        updateMessage(`You have ${userResult}!`);

        // Increment user stats
        switch (userResult) {
            case "won":
                currUserRef.update({
                    wins: currUserRefSnap.val().wins++
                })
                break;
            case "lost":
                currUserRef.update({
                    losses: currUserRefSnap.val().losses++
                })
                break;
        }

        // Reset user game fields
        userConnectionRef.update({
            inGame: false,
            inTurn: null,
            opponent: null,
            opponentChoice: null,
            result: null,
            resultShown: null,

        })


        setTimeout(function () {
            // Hide Game
            $("#gameDisplay").hide();
            // Show Dashboard 
            resetGame();
            $("#dashboard").fadeIn();
        }, 5000)
    }

    // function deleteGame(gameId) {
    //     // delete game object
    //     gamesRef.child(currGameId).set(null);
    // }
}

function bold(text) {
    return `<strong>${text}</strong>`;
}

function isConnected(username) {
    var isConnected = false;
    $.each(connectionsRefSnap.val(), function (id, user) {
        if (user.username == username) {
            isConnected = true;
        }
    })

    return isConnected;

}

function promptUsername() {
    bootbox.prompt({
        title: "What is your username?",
        closeButton: false,
        isRequired: true,
        callback: function (username) {

            if (!usersRefSnap.child(username).exists()) {
                var userObject = {
                    wins: 0,
                    losses: 0
                }
                currUserRef = usersRef.child(username);
                currUserRef.update(userObject);
            } else {
                currUserRef = usersRef.child(username);
            }

            // User is not signed in anywhere
            if (!isConnected(username)) {
                currUser = username;
                // Add user to the connections list.
                var con = connectionsRef.push({
                    username: username,
                    inGame: false
                });

                renderUserInfo(username);
                renderInvitations();
                $("#dashboard, #userGreeting").fadeIn();

                // Remove user from the connection list when they disconnect.
                con.onDisconnect().remove();
            } else {
                bootbox.hideAll();
                // user is already signed in elsewhere
                bootbox.alert({
                    message: "This user is already connected!",
                    centerVertical: true
                });
                setTimeout(function () {
                    bootbox.hideAll();
                    promptUsername();

                }, 2000)

            }
        }

    })
}