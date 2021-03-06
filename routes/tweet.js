const mongoose = require("mongoose");
var express = require("express");
var router = express.Router();

const Tweet = require("../models/Tweet");
const Comment = require("../models/Comment");
const User = require("../models/User");
const ObjectId = mongoose.Types.ObjectId;

router.post("/newPost", function(req, res, next) {
  console.log(req);
  newPost(
    req.session.currentUser.username,
    req.body.newPosttitle,
    req.body.newPostcontent,
    (success, err) => {
      if (success) {
        res.status(200).end();
      }
    }
  );
});

router.post("/deletePost", function(req, res, next) {
  console.log(req);
  //deletePost(creator, postId)
});

router.get("/createFeed", function(req, res, next) {
  // console.log(req);
  createFeed(req.session.currentUser.username, 5, feed => {
    res.send(feed);
  });
});

function newPost(creator, title, content, cb) {
  User.findOne({ name: creator })
    .then(user => {
      const tweet = new Tweet({
        _id: new mongoose.Types.ObjectId(),
        image: content,
        title: title,
        creator: user._id,
        upvotes: 0
      });

      tweet.save(function(err) {
        if (err) {
          console.log("error creating new post", err);
          cb(false, err);
        } else {
          cb(true);
        }
      });

      User.updateOne({ name: creator }, { $push: { tweets: tweet._id } }).catch(
        err => console.log(err)
      );
    })
    .catch(err => console.log(err));

  console.log(`${creator} created a post with the title ${title}`);
}

function deletePost(creator, postId) {
  Tweet.findByIdAndRemove(postId)
    .then(res => console.log(res, "was removed"))
    .catch(err => console.log(err));

  User.findOneAndUpdate(
    { name: creator },
    { $pull: { tweets: mongoose.Types.ObjectId(postId) } }
  )
    .then(console.log("success"))
    .catch(err => console.log("error", err));
}

function createFeed(user, length, cb) {
  User.findOne({ name: user })
    .distinct("following", {})
    .exec((err, following) => {
      if (err) console.log("error fetching 'following'", err);
      // console.log(following);
      Tweet.find({ creator: { $in: following } })
        .limit(length)
        .sort({ created_at: -1 })
        .populate("creator")
        .exec((err, result) => {
          // console.log(result);
          cb(result);
        });
    });
}

module.exports = router;
