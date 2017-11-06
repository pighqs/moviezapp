//PACKAGES
var express = require('express');
// on stocke l'app express dans une variable app : initialisation
var app = express();
// permet de charger des fichiers statiques (css, images, fichiers js externes), ils doivent etre placés dans le dossier "public"
app.use(express.static('public'));

app.set('view engine', 'ejs');
// Request is designed to make http calls. It supports HTTPS and follows redirects by default.
var request = require('request');


// BASE DE DONNEES
var mongoose = require('mongoose');
// pour empêcher erreur si base de donnees met trop longtemps a repondre
var options = { server: { socketOptions: { connectTimeoutMS: 30000 } } };



// ROUTES
app.get('/', function(req, res) {
    res.render('home', { title: "MOVIEZ" });
});



//LISTEN
var port = (process.env.PORT || 8080);
app.listen(port, function() {
    console.log("server listening on port 8080");
});