var usersRefSnap;
var currUser;

usersRef.on("value", function (snap) {
    usersRefSnap = snap;
})

// When the client's connection state changes...
connectedRef.on("value", function (snap) {
    // If they are connected..
    if (snap.val()) {
        bootbox.prompt({
            title: "What is your username?",
            closeButton: false,
            callback: function (username) {

                if (!usersRefSnap.child(username).exists()) {
                    var userObject = {
                        wins: 0,
                        losses: 0
                    }
                    usersRef.child(username).update(userObject);
                }

                currUser = username;
                // Add user to the connections list.
                var con = connectionsRef.push({
                    username: username,
                    inGame: false
                });

                renderUserInfo(username);

                // Remove user from the connection list when they disconnect.
                con.onDisconnect().remove();
            }

        })

    }

});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function (snap) {
    renderOnlineUsers(snap);
});

// Loads current user info to DOM
function renderUserInfo(username) {
    $("#username").text(username);
    $("#userWins").text(usersRefSnap.child(username).val().wins);
    $("#userLosses").text(usersRefSnap.child(username).val().losses);
}

// Loads online users to DOM
function renderOnlineUsers(onlineUsers) {
    var activeUsers = $("#activeUsers")
    activeUsers.empty();

    $.each(onlineUsers.val(), function (id, user) {
        if (user.username != currUser) {
            var newUserItem = $("<li class='list-group-item user'>");
            newUserItem.text(user.username);
            (user.inGame) ? newUserItem.addClass("list-group-item-danger"): '';

            activeUsers.append(newUserItem);
        }

    })
}

$(document).on("click", ".user", function () {

})