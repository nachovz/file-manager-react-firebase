const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.getPortada = functions.https.onRequest((request, response) => {
  admin
    .database()
    .ref("/portadas")
    .orderByKey()
    .limitToLast(1)
    .once("value", (snapshot) => {
      const val = snapshot.val();
      var keys = Object.keys(val);
      response.redirect(val[keys[0]].pdfURL);
    });
});
