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
//var mongoose = require('mongoose');
// pour empêcher erreur si base de donnees met trop longtemps a repondre
//var options = { server: { socketOptions: { connectTimeoutMS: 30000 } } };

var movies = [];
var apiKey = "3b0ada6d415a01999b9b2da681c2829f";
var sort = "popularity.desc";
var lang = "fr-FR";


// BASE DE DONNEES
var mongoose = require('mongoose');
// pour empêcher erreur si base de donnees met trop longtemps a repondre
var options = { server: { socketOptions: { connectTimeoutMS: 30000 } } };
// connection base de données
mongoose.connect('mongodb://moviez:moviez@ds249005.mlab.com:49005/moviez', options, function(err) {
    if (err) {
        console.log("erreur : " + err);
    } else {
        console.log("connection moviez DB OK");
    }
});

// SCHEMA
var movieSchema = mongoose.Schema({
    title: String,
    posterpath: String,
    overview: String

});

// MODEL
var MovieModel = mongoose.model('movies', movieSchema);

// ROUTES
app.get('/', function(req, res) {

    var moviesDiscoverURL = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey + "&language=" + lang + "&sort_by=" + sort + "&include_adult=true&include_video=false&page=1";

    request(moviesDiscoverURL, function(error, response, body) {
        // seulement si la réponse n'est pas 404 ()
        if (response.statusCode !== 404) {

            // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
            movies = JSON.parse(body);

            // on appelle la collection movies (films enregistrés dans db)
            MovieModel.find(function(err, likedmovies) {
                res.render('home', { movies, likedmovies });
            })


            // on insere cette variable dans le tableau cityList qui est lu par le front
        } else {
            console.log('statusCode:', response && response.statusCode);
        }



    });

});

app.get('/home', function(req, res) {

    var moviesDiscoverURL = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey + "&language=" + lang + "&sort_by=" + sort + "&include_adult=true&include_video=false&page=1";
    request(moviesDiscoverURL, function(error, response, body) {
        // seulement si la réponse n'est pas 404 ()
        if (response.statusCode !== 404) {

            // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
            movies = JSON.parse(body);

            MovieModel.find(function(err, likedmovies) {
                res.render('home', { movies, likedmovies });
            })

            // on insere cette variable dans le tableau cityList qui est lu par le front
        } else {
            console.log('statusCode:', response && response.statusCode);
        }

    });

});

app.get('/like', function(req, res) {
    if (req.query.movie_id && req.query.movie_id != "") {

        var likedMovieID = req.query.movie_id;

        //la ville demandée en url via le formulaire à openweathermap est stockée dans une variable
        var movieURL = "https://api.themoviedb.org/3/movie/" + likedMovieID + "?api_key=" + apiKey + "&language=" + lang;

        request(movieURL, function(error, response, body) {
            // seulement si la réponse n'est pas 404 ()
            if (response.statusCode !== 404) {

                // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
                var body = JSON.parse(body);

                // on récupère les infos de body pour assigner une nouvelle variable newCity
                var newMovie = new MovieModel({
                    title: body.original_title,
                    posterpath: body.poster_path,
                    overview: body.overview

                });

                console.log(newMovie);

                // on insere dans la base de donnees
                newMovie.save(function(error, movie) {
                    MovieModel.find(function(err, likedMovies) {
                        res.render('review', { movies: likedMovies });
                    })
                });

            } else {
                console.log('statusCode:', response && response.statusCode);
            }

        });
    };
});

app.get('/review', function(req, res) {
    MovieModel.find(function(err, movies) {
        res.render('review', { movies: movies });
    })
});





//LISTEN
var port = (process.env.PORT || 8080);
app.listen(port, function() {
    console.log("server listening on port 8080");
});