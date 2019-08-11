// Initialize Firebase
// Make sure to match the configuration to the script version number in the HTML
// (Ex. 3.0 != 3.7.0)
var config = {
    apiKey: "AIzaSyAZpeG4Xs1vM5FcTsIsXSXP1SUkGE2Ba2U",
    authDomain: "boot-camp-assignments.firebaseapp.com",
    databaseURL: "https://boot-camp-assignments.firebaseio.com",
    projectId: "boot-camp-assignments",
    storageBucket: "",
    messagingSenderId: "923934605982",
    appId: "1:923934605982:web:9f606697afefe410"
};

firebase.initializeApp(config);

// Create a variable to reference the database.
var database = firebase.database();

// -----------------------------

// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated
// every time the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = database.ref(".info/connected");

var usersRef = database.ref("/users");
var gamesRef = database.ref("/activeGames");