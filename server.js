const express = require("express")
const bodyParser = require("body-parser")
const Twitter = require("twitter-lite")
const https = require("https")

require("dotenv-safe").config()

process.on("unhandledRejection", err => {
	console.log("******************")
	console.log(err.message)
	console.log("******************")
})

const client = new Twitter({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token_key: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET
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

const parameters = {
	track: "#preact,#preactjs,#javascript",
	follow: "422297024,743958196138606600" // @iamdevloper, @preactjs
}

client
	.stream("statuses/filter", parameters)
	.on("start", response => console.log("start"))
	.on("data", async data => {
		console.log("favoriting", data.text)
		await client.post("favorites/create", null, { id: data.id_str })

		console.log("retweeting", data.text)
		await client.post("statuses/retweet", null, { id: data.id_str })
	})
	.on("ping", () => console.log("ping"))
	.on("error", error => console.log("error", error))
	.on("end", response => console.log("end"))

// to stop the stream:
// client.stream.destroy() // emits "end" and "error" event

app.listen(PORT, () => {
	console.log(`App running on PORT ${PORT}`)
})
