// local imports
const config = require('./config.json')
const feeds = require('./feeds.json')
const redis = require('redis')

// external imports
const RssFeedEmitter = require('rss-feed-emitter')
const request = require('request')

// initialize redis
const redisClient = redis.createClient({
    host: config.redis_host, port: config.redis_port, password: config.redis_password
})
redisClient.connect();
redisClient.on('error', err => {
    console.log('Error ' + err);
});

// array of urls from sources.json where active is true
const urls = feeds.filter(entry => {
    if (entry.active == true) {
        return entry
    }
}).map(entry => (entry.url))

// initialize the feed object, with options
const feeder = new RssFeedEmitter({
    skipFirstLoad: true // avoids the dump of current-state data from feeds
});

// add our urls with the refersh interval from config.json
urls.forEach((url) => {
    feeder.add({
        'url': url, 'refresh': config.refresh_interval
    });
});

// instructions on what to do when new item from feeds is pushed

feeder.on('new-item', function (item) {
    try {
        const timestamp = item.pubdate
        const link = item.link
        const title = item.title
        const author = item.author
        const summary = item.summary
        const description = item.description
        var text_summary = ''
        try {
            text_summary = summary.replace(/<[^>]*>/g, '').replace('\n', ' ')
        } catch (err) {
            try {
                text_summary = description.replace(/<[^>]*>/g, '').replace('\n', ' ')
            } catch (err2) {
                if (summary) {
                    text_summary = summary.replace('\n', ' ')
                } else if (description) {
                    text_summary = description.replace('\n', ' ')
                }
            }
        }
        const itemObject = {timestamp, link, title, author, text_summary}

        /*
        redisClient.get(itemObject.link, (err, reply) => {
            if(err) console.log(err);
            if (!reply) return false;
        })
         */

        var message_string = `**${title}**\nPublished: ${timestamp}\nby ${author}\n${link}\n`

        console.log(`[+] NEW: "${title}"`)
        console.log(`[+] Posting to webhook...`)

        const options = {
            url: config.webhook, headers: {
                'Content-Type': 'application/json'
            }, json: true, body: {'content': message_string}
        }

        const req = request.post(options, (err, res, body) => {
            if (err) {
                return console.log(`[+] ERR posting "${title}": ${err}`);
            }
            console.log(`[+] Posted "${title}", status ${res.statusCode}`);
        });

    } catch (err) {
        console.log(`[!] ERR: ${err}`)
    }
})

feeder.on('error', console.error);
