//////// PACKAGES
var express = require('express');
// on stocke l'app express dans une variable app : initialisation
var app = express();
// permet de charger des fichiers statiques (css, images, fichiers js externes), ils doivent etre placés dans le dossier "public"
app.use(express.static('public'));

app.set('view engine', 'ejs');
// Request is designed to make http calls. It supports HTTPS and follows redirects by default.

var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

var request = require('request');

// SESSION
var session = require("express-session");

app.use(
    session({
        secret: 'a4f8071f-c873-4447-8ee2',
        resave: false,
        saveUninitialized: false,
    })
);


// BASE DE DONNEES

var movies = [];
var apiKey = "3b0ada6d415a01999b9b2da681c2829f";
var sort = "vote_count.desc";
var lang = "fr-FR";

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

// schemas
var movieSchema = mongoose.Schema({
    movieID: Number,
    title: String,
    posterpath: String,
    overview: String,
    likeByUser: String
});

var userSchema = mongoose.Schema({
    userEmail: String,
    userPassword: String
});


// models
var MovieModel = mongoose.model('movies', movieSchema);
var UserModel = mongoose.model('users', userSchema);


//////// ROUTES
app.get('/', function(req, res) {

    console.log("logged ? " + req.session.islogged);


    var moviesDiscoverURL = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey + "&language=" + lang + "&sort_by=" + sort + "&include_adult=true&include_video=false&page=1";

    request(moviesDiscoverURL, function(error, response, body) {

        // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
        movies = JSON.parse(body);

        // on appelle la collection movies (films enregistrés dans db), mais uniquement ceux qui ont même id que user
        var query = MovieModel.find({ likeByUser: req.session.userID });
        query.exec(function(error, datas) {
            res.render('home', { movies, likedmovies: datas, page: "home", isUserLog: req.session.islogged });
        });

    });

});



app.get('/like', function(req, res) {
    if (req.session.islogged == true) {
        if (req.query.movieID && req.query.movieID != "") {
            var movieID = req.query.movieID;

            //la ville demandée en url via le formulaire à openweathermap est stockée dans une variable
            var movieURL = "https://api.themoviedb.org/3/movie/" + movieID + "?api_key=" + apiKey + "&language=" + lang;

            request(movieURL, function(error, response, body) {
                // seulement si la réponse n'est pas 404 ()
                if (response.statusCode !== 404) {

                    // la requête nous renvoie les infos qui seront stockées au format JSON dans une variable "body":
                    var body = JSON.parse(body);

                    // on récupère les infos de body pour assigner une nouvelle variable newCity
                    var newMovie = new MovieModel({
                        movieID: body.id,
                        title: body.original_title,
                        posterpath: body.poster_path,
                        overview: body.overview,
                        likeByUser: req.session.userID
                    });


                    // on insere dans la base de donnees
                    newMovie.save(function(error, movie) {});
                    //on redirige sur la home
                    res.redirect("/");

                } else {
                    console.log('statusCode:', response && response.statusCode);
                }

            });

        }

    } else if (req.session.islogged == false || req.session.islogged == undefined) {
        res.redirect("/signup");
    }
});

app.get('/unlike', function(req, res) {
    // recupere ID unique envoyé en requête et supprime entrée correspondante dans la base de données
    MovieModel.remove({ movieID: req.query.movieID, likeByUser: req.session.userID }, function(error, ville) {
        //on redirige sur la home
        res.redirect("/");
    });

});

app.get('/review', function(req, res) {
    if (req.session.islogged == true) {
        var query = MovieModel.find({ likeByUser: req.session.userID });
        query.exec(function(error, datas) {
            res.render('review', { movies: datas, page: "review", isUserLog: req.session.islogged });
        });
    } else {
        res.redirect("/signin");
    }
});


app.get('/single', function(req, res) {
    var movieID = req.query.movieID;

    //la ville demandée en url via le formulaire à openweathermap est stockée dans une variable
    var movieURL = "https://api.themoviedb.org/3/movie/" + movieID + "?api_key=" + apiKey + "&language=" + lang;
    var creditsURL = "https://api.themoviedb.org/3/movie/" + movieID + "/credits?api_key=" + apiKey;

    request(movieURL, function(error, response, body) {
        var body = JSON.parse(body);
        request(creditsURL, function(error, response, credits) {
            var credits = JSON.parse(credits);
            res.render('single', { body, credits, page: "single", isUserLog: req.session.islogged });

        });
    });
});


app.get('/search', function(req, res) {
    var recherche = req.query.movieSearch;
    var searchURL = "https://api.themoviedb.org/3/search/movie?api_key=" + apiKey + "&query=" + recherche;

    request(searchURL, function(error, response, searchResults) {
        var movies = JSON.parse(searchResults);

        MovieModel.find(function(err, likedmovies) {
            res.render('home', { movies, likedmovies, page: "search", isUserLog: req.session.islogged });
        });
    });
});

app.get('/signup', function(req, res) {
    res.render('signup', { page: "sign", isUserLog: req.session.islogged });
});

app.post('/signup', function(req, res) {
    // on récupère les infos de body pour assigner une nouvelle variable newCity
    var newUser = new UserModel({
        userEmail: req.body.email,
        userPassword: req.body.password
    });


    // on insere dans la base de donnees
    newUser.save(function(error, user) {
        // on enregistre l'id déterminé par la DB en id de session
        req.session.userID = user._id;
        req.session.islogged = true;
        //on redirige sur la home
        res.redirect("/");
    });
});

app.get('/signin', function(req, res) {
    res.render('signin', { page: "sign", isUserLog: req.session.islogged });

});

app.post('/signin', function(req, res) {

    var query = UserModel.findOne({ userEmail: req.body.email });
    query.exec(function(error, user) {
        if (user == undefined) {
            console.log("user mail doesn't exist");
            res.redirect("/signup");
        } else {
            if (user.userPassword == req.body.password) {
                console.log("user and password OK");
                req.session.islogged = true;
                req.session.userID = user._id;
                res.redirect("/");
            } else {
                console.log("wrong password");
                res.redirect("/signin");
            }
        }

    });
});


app.get('/signout', function(req, res) {
    req.session.islogged = false;
    res.redirect("/");
});

//////// LISTEN
// process.env.PORT est le port attribué par hénergeur
var port = (process.env.PORT || 8080);
app.listen(port, function() {
    console.log("server listening on port: " + port);
});