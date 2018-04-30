const express = require("express")
const bodyParser = require("body-parser")
const Twit = require("twit")
const https = require("https")
// const GithubWebHook = require("express-github-webhook")

require("dotenv-safe").config()

const T = new Twit({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET,
	timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

// const webhookHandler = GithubWebHook({
// 	path: "/webhook",
// 	secret: process.env.GITHUB_WEBHOOK_SECRET
// })

const PORT = process.env.PORT || 4567
const app = express()

app.use(bodyParser.json())
// app.use(webhookHandler)

app.get("/", (req, res) => {
	res.json({
		status: "good"
	})
})

// Make Request every 20 minutes to keep it from sleeping
setInterval(() => {
	https.get("https://awesome-preact-bot.herokuapp.com/", res => {
		res.setEncoding("utf8")
		let body = ""
		res.on("data", data => (body += data))
		res.on("end", () => console.log(body))
	})
}, 1000 * 60 * 20)

// webhookHandler.on("push", (_, data) => {
// 	const {
// 		created,
// 		head_commit: {
// 			message = ""
// 		} = {}
// 	} = data

// 	// We're only concerned about merged push events
// 	if (!created && message.length && !message.toLowerCase().includes("revert")) {
// 		const [commit, desc, twitter_username = null] = message
// 			.split(/\n+/)
// 			.map(m => m.replace(/\(.*\)/, "").trim())

// 		const titleCase = str => str[0].toUpperCase() + str.slice(1)

// 		const tweet = titleCase(commit.toLowerCase().replace("add", "added"))

// 		// Only tweet if we add to the list
// 		if (tweet.match(/add/i)) {
// 			// --------------------------------
// 			// Post as status update to twitter
// 			// --------------------------------
// 			// T.post(
// 			// 	"statuses/update",
// 			// 	{
// 			// 		status: `${tweet} to the list ${desc} cc ${
// 			// 			twitter_username[0] !== "@"
// 			// 				? `@${twitter_username}`
// 			// 				: twitter_username
// 			// 		} #preact`
// 			// 	},
// 			// 	err => {
// 			// 		if (err) {
// 			// 			console.error("Could not post to twitter -> " + err.message)
// 			// 		}
// 			// 	}
// 			// )
// 		}
// 	}
// })

const stream = T.stream("statuses/filter", {
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
		T.post(
			"statuses/retweet/:id", {
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

		T.post(
			"favorites/create", {
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
	const UserStream = T.stream("user")

	UserStream.on("tweet", tweet => {
		if (tweet.user.screen_name === screen_name) {
			T.post(
				"statuses/retweet/:id", {
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