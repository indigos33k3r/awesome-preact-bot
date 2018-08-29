const express = require("express")
const bodyParser = require("body-parser")
const Twitter = require("twitter-lite")
const https = require("https")

require("dotenv-safe").config()

const client = new Twitter({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET,
	timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

const PORT = process.env.PORT || 4567
const app = express()

app.use(bodyParser.json())

app.get("/", (req, res) => {
	res.json({
		status: "good"
	})
})

// Make Request every 30 minutes to keep it from sleeping
setInterval(() => {
	https.get("https://awesome-preact-bot.herokuapp.com/", res => {
		res.setEncoding("utf8")
		let body = ""
		res.on("data", data => (body += data))
		res.on("end", () => console.log(body))
	})
}, 1000 * 60 * 30)

const stream = client.stream("statuses/filter", {
	track: "#preact"
})

stream.on("tweet", tweet => {
	// Don't retweet/favorite mine!
	if (
		tweet.user.screen_name !== "AwesomePreact" &&
		!tweet.text.match("PreACT")
	) {
		// ------------------------------
		// Retweet any tweet with #preact
		// ------------------------------
		client.post(
			"statuses/retweet/:id",
			{
				id: tweet.id_str
			},
			err => {
				if (err) {
					console.error("Could not retweet post -> " + err.message)
				}
			}
		)

		// ------------------------------
		// Favorite any tweet with #preact
		// ------------------------------

		client.post(
			"favorites/create",
			{
				id: tweet.id_str
			},
			err => {
				if (err) {
					console.error("Could not favorite post -> " + err.message)
				}
			}
		)
	}
})

function retweet_user(screen_name) {
	const UserStream = client.stream("user")

	UserStream.on("tweet", tweet => {
		if (tweet.user.screen_name === screen_name) {
			T.post(
				"statuses/retweet/:id",
				{
					id: tweet.id_str
				},
				err => {
					if (err) {
						console.error("Could not retweet post -> " + err.message)
					}
				}
			)
		}
	})
}

// List of folks to retweet
retweet_user("preactjs")
retweet_user("iamdevloper") // for the humour

app.listen(PORT, () => {
	console.log(`App running on PORT ${PORT}`)
})
