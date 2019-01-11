var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
var axios = require("axios");

// Requiring Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

//Define port
var port = process.env.PORT || 3000

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// Database configuration with mongoose
//mongoose.connect("mongodb://heroku_jmv816f9:5j1nd4taq42hi29bfm5hobeujd@ds133192.mlab.com:33192/heroku_jmv816f9");
mongoose.connect("mongodb://localhost/mongoscraper");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======

//GET requests to render Handlebars pages
app.get("/", function(req, res) {
  Article.find({"saved": false}, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("home", hbsObject);
  });
});

app.get("/saved", function(req, res) {
  Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});
//
  app.get("/scrape",function(req,res){
    axios.get("https://www.nytimes.com/").then(function(response){
      var $=cheerio.load(response.data);
      var results=[];
  //    <div class="css-6p6lnl"><a href="https://www.nytimes.com/2019/01/10/us/politics/border-wall-government-shutdown.html?action=click&amp;module=Top%20Stories&amp;pgtype=Homepage"><div class="css-1j836f9 esl82me3"><div class="css-3w1yun esl82me0">U.S.-Mexico Border</div><h2 class="css-bzeb53 esl82me2"><span class="ghost" aria-hidden="true" style="position: absolute; left: 0px; visibility: hidden;">White House Considers Diverting Aid From Disaster Relief to Build Wall</span><span class="balancedHeadline" style="display: inline-block; max-width: 165.773px;">White House Considers Diverting Aid From Disaster Relief to Build Wall</span></h2></div>
  //<ul class="css-1rrs2s3 e1n8kpyg1"><li>President Trump traveled to the border to warn of crime and chaos as the partial government shutdown reached a milestone Day 21.</li><li>White House officials considered diverting aid from Puerto Rico, Florida, Texas and California to build a border wall under an emergency declaration.</li></ul></a><div class="css-194w6rb e1m7ci270"><div class="css-na047m e1m7ci271"><span class="css-17h6617 e1c8ga110"><time aria-label="7 hours ago" class="">7h ago</time></span></div></div></div>
     // <h2 class="css-bzeb53 esl82me2"><span class="ghost" aria-hidden="true" style="position: absolute; left: 0px; visibility: hidden;">White House Considers Diverting Aid From Disaster Relief to Build Wall</span><span class="balancedHeadline" style="display: inline-block; max-width: 165.773px;">White House Considers Diverting Aid From Disaster Relief to Build Wall</span></h2>
    //  $("article.css-8atqhb").each(function(i,element){
   //   $("h2.css-bzeb53.esl82me2").each(function(i,element){
    $("div.css-6p6lnl").each(function(i,element){
        console.log("***********ARTICLE *******");
        console.log(element);
        console.log("***********ARTICLE END*******");
        var title=$(element)
            .children()
            .text();
        var link="https://www.nytimes.com"+$(element)
            .children("a").attr("href");
        var summary=$(element)
            .children(".summary").text();
        results.push({title: title, link: link,summary: summary});

        var entry = new Article(results[i]);

      // Now, save that entry to the db
        entry.save(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          }
          // Or log the doc
          else {
            console.log(doc);
          }
        });


      });
      console.log(results);




  });
    

  })
// A GET request to scrape the echojs website
/*  app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    console.log("********response******");
    console.log(html);
    console.log("response END *****************");
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
//    $("h2.css-6h3ud0.esl82me2").each(function(i, element) {
  $("article.css-8atqhb").each(function(i, element) {

        // Add the title and summary of every link, and save them as properties of the result object
      result.title = $(this).children("h2").text();
      result.summary = $(this).children(".summary").text();
      result.link = $(this).children("h2").children("a").attr("href");
      console.log("***RESULT****");
      console.log("");
      console.log(result);
      console.log("");console.log("");console.log("");
      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
        res.send("Scrape Complete");

  });
  // Tell the browser that we finished scraping the text
});  */
/* 
app.get("/scrape", (req, res) => {
  request("https://news.ycombinator.com/", (error, response, html) => {
      let $ = cheerio.load(html);
      console.log("********response******");
      console.log(html);
      console.log("response END *****************");
      $("td[class=title]").each(function(i, element) {
          let result = {};
          result.title = $(this).children("a").text();
          result.link = $(this).children("a").attr("href");
          console.log("***RESULT****");
          console.log("");
          console.log(result);
          console.log("");console.log("");console.log("");

          if (result.title != "") {
              let entry = new Article(result);
              entry.save((err, doc) => {
                  if (err) {
                      console.log(err);
                  } else {
                      console.log(doc);
                  }
              });
          }
      });
  });
  res.send("Scrape Complete");
});
 */

/* app.get("/scrape", (req, res) => {
  request("https://www.reforma.com", (error, response, html) => {
      let $ = cheerio.load(html);
      console.log("********response******");
      console.log(html);
      console.log("response END *****************");
      $("ligaonclick").each(function(i, element) {
          let result = {};
          result.title = $(this).children("a").text();
          result.link = $(this).children("a").attr("href");
          console.log("***RESULT****");
          console.log("");
          console.log(result);
          console.log("");console.log("");console.log("");

          if (result.title != "") {
              let entry = new Article(result);
              entry.save((err, doc) => {
                  if (err) {
                      console.log(err);
                  } else {
                      console.log(doc);
                  }
              });
          }
      });
  });
  res.send("Scrape Complete");
}); */


// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Save an article
app.post("/articles/save/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});


// Create a new note
app.post("/notes/save/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // And save the new note the db
  newNote.save(function(error, note) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's notes
      Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
      // Execute the above query
      .exec(function(err) {
        // Log any errors
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          // Or send the note to the browser
          res.send(note);
        }
      });
    }
  });
});

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
  // Use the note id to find and delete it
  Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
    // Log any errors
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
       // Execute the above query
        .exec(function(err) {
          // Log any errors
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            // Or send the note to the browser
            res.send("Note Deleted");
          }
        });
    }
  });
});

// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});