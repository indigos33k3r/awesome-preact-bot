const express = require("express")
const bodyParser = require("body-parser")
const Twit = require("twit")
const GithubWebHook = require("express-github-webhook")

require("dotenv-safe").config()

const T = new Twit({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET,
	timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

const webhookHandler = GithubWebHook({
	path: "/webhook",
	secret: process.env.WEBHOOK_SECRET
})

const PORT = process.env.PORT || 4567
const app = express()

app.use(bodyParser.json())
app.use(webhookHandler)

webhookHandler.on("push", (_, data) => {
	const { created, head_commit: { message } } = data
	// We're only concerned about merged push events
	if (
		!created &&
		message.length &&
		message.toLowerCase().slice(0, 6) !== "revert"
	) {
		const [commit, desc, twitter_username = null] = message
			.split(/\n+/)
			.map(m => m.replace(/\(.*\)/, "").trim())

		const titleCase = str => str[0].toUpperCase() + str.slice(1)

		const tweet = titleCase(commit.toLowerCase().replace("add", "added"))

		// Only tweet if we add to the list
		if (tweet.match(/add/i)) {
			// --------------------------------
			// Post as status update to twitter
			// --------------------------------
			T.post(
				"statuses/update",
				{
					status: `${tweet} to the list ${desc} cc ${
						twitter_username[0] !== "@"
							? `@${twitter_username}`
							: twitter_username
					} #preact`
				},
				err => {
					if (err) {
						console.error("Could not post to twitter -> " + err.message)
					}
				}
			)
		}
	}
})

const stream = T.stream("statuses/filter", {
	track: "#preact"
})

stream.on("tweet", tweet => {
	// Don't retweet/favorite mine!
	if (tweet.user.screen_name !== "AwesomePreact") {
		// ------------------------------
		// Retweet any tweet with #preact
		// ------------------------------
		T.post(
			"statuses/retweet/:id",
			{
				id: tweet.id_str
			},
			err => {
				if (err) {
					console.error("Could retweet post -> " + err.message)
				}
			}
		)

		// ------------------------------
		// Favorite any tweet with #preact
		// ------------------------------

		T.post(
			"favorites/create",
			{
				id: tweet.id_str
			},
			err => {
				if (err) {
					console.error("Could favorite post -> " + err.message)
				}
			}
		)
	}
})

app.listen(PORT, () => {
	console.log(`App running on PORT ${PORT}`)
})
