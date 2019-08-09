var usersRefSnap, connectionsRefSnap;
var currUser, currUserRef, currUserRefSnap;


usersRef.on("value", function (snap) {
    usersRefSnap = snap;
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
});

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
    activeUsers.empty();

    $.each(connectionsRefSnap.val(), function (id, user) {
        if (user.username != currUser) {
            var newUserItem = $("<li class='list-group-item user'>");
            newUserItem.text(user.username);
            newUserItem.attr("data-inGame", user.inGame);

            (user.inGame) ? newUserItem.addClass("list-group-item-danger"): '';

            activeUsers.append(newUserItem);
        }

    })
}

// When a username is clicked, send a game invite
$(document).on("click", ".user", function () {
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