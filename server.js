// Local imports
const config = require('./config.json')
const feeds = require('./feeds.json')
const winston = require('winston')

// External imports
const RssFeedEmitter = require('rss-feed-emitter')
const request = require('request')

const logger = winston.createLogger({
  level: 'info', format: winston.format.json(), transports: [//
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({
      filename: 'error.log', level: 'error'
    }), new winston.transports.File({filename: 'combined.log'}),],
});

// Bugfix for Winston Mess-Up (Broken by design more like "We can't find that bug and need a cheap excuse")
const errorHelper = {
  error: logger.error.bind(logger)
};

// Array of urls from sources.json where active is true
const urls = feeds.filter(entry => {
  if (entry.active) {
    return entry
  }
}).map(entry => (entry.url))

// Initialize the feed object, with options
const feeder = new RssFeedEmitter({
  skipFirstLoad: true // Avoids the dump of current-state data from feeds
});

// Add our urls with the refresh interval from config.json
urls.forEach((url) => {
  feeder.add({
    'url': url, 'refresh': config.refresh_interval
  });
});

// Instructions on what to do when new item from feeds is pushed

feeder.on('new-item', async function (item) {
  try {
    const timestamp = item.pubdate
    const link = item.link
    const title = item.title
    const author = item.author
    const summary = item.summary
    const description = item.description
    let text_summary = '';
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

    let message_string = `**${title}**\nPublished: ${timestamp}\nby ${author}\n${link}\n`;

    console.log(`[+] NEW: "${title}"`)
    console.log(`[+] Posting to webhook...`)


    const options = {
      url: config.webhook, headers: {
        'Content-Type': 'application/json'
      }, json: true, body: {'content': message_string}
    }

    const req = request.post(options, (err, res, body) => {
      if (err) {
        return errorHelper.error(`[+] ERR posting "${title}": ${err}`);
      }
      console.log(`[+] Posted "${title}", status ${res.statusCode}`);
    });

  } catch (err) {
    errorHelper.error(`[!] ERR: ${err}`)
  }

})

feeder.on('error', errorHelper.error);
