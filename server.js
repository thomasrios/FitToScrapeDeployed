var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var mongojs = require("mongojs");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware
const Article = require("./models/article");
const Comment = require("./models/comment");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);
// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Routes

app.get("/", function (req, res) {
  res.send(index.html);
});
// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.echojs.com/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // console.log(response.data)

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function (i, element) {
      // Save an empty result object
      var result = {};
      // Add the text and href of every link, and csave them as properties of the result object
      result.title = $(this)
        .find("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          // console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete! Go back home to see articles");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {

  // // TODO: Finish the route so it grabs all of the articles
  // db.Article.find({}).then(function (dbArticle) {
  //   // console.log(dbArticle)
  //   res.json(dbArticle);
  // });
  // Find all notes in the notes collection
  db.Article.find({}, function (error, found) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send json of the notes back to user
      // This will fire off the success function of the ajax request
      res.json(found);
    }
  });
});

// Route for saving/updating an Article's associated comments
app.post("/articles/:id", function (req, res) {
  // TODO
  // ====
  // save the new comments that gets posted to the comments collection
  // then find an article from the req.params.id
  // and update it's "comments" property with the _id of the new comments
  var comment = new Comment({
    title: req.body.title,
    body: req.body.body
  });

  comment.save().then(function (err, result) {
    if (err) {
      throw err
    } else {
      console.log(result);
    }
  })
  .catch(function (err) {
    // If an error occurred, log it
    console.log(err);
  });;

  console.log(mongojs.ObjectId(req.params.id))


  db.Article.updateOne(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      $push: {
        comment: comment._id
      }
    }).then(function(result) {
      res.json(result)
    })
    .catch(function (err) {
      // If an error occurred, log it
      console.log(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's comments
app.get("/articles/:id", function (req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "comments",
  // then responds with the article with the comments included

  console.log(req.params.id)
  db.Article.find(
    {
      _id: req.params.id
    })
    .populate("comment").then(function (dbArticle) {
      res.json(dbArticle)
    });

});

app.get("/comments", function (req, res) {

  // // TODO: Finish the route so it grabs all of the comments
  // db.Comment.find({}).then(function (dbComment) {
  //   // console.log(dbComment)
  //   res.json(dbComment);
  // });

  db.Comment.find({}, function (error, found) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send json of the notes back to user
      // This will fire off the success function of the ajax request
      res.json(found);
    }
  });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
