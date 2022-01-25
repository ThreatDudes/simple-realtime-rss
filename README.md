# simple-realtime-rss
The simplest realtime RSS feed server. No bot Oauth or anything!


## Installing
For RSS, we use the external library here [`rss-feed-emitter`](https://www.npmjs.com/package/rss-feed-emitter). It can be installed with
```
npm i rss-feed-emitter
```
Redis is also used as databse for storing feed information. [Read this quickstart here](https://redis.io/topics/quickstart) for instructions on installation. In the `config.json` make sure your Redis host IP and Port match what is running on the system.

## Configuration
In `feeds.json` you can list out the feeds you would want to ingest with this schema:
```
{
      "id": "e5c320e2-b058-415a-9b55-2c3230c6b59e",
      "name": "ExploitDB",
      "created_at": "2022-01-13T03:34:29.000Z",
      "url": "https://www.exploit-db.com/rss.xml",
      "rating": 1,
      "active": true,
      "category": "VULNERABILITY",
      "protocol": "rss",
      "description": "The Exploit Database - Exploits, Shellcode, 0days, Remote Exploits, Local Exploits, Web Apps, Vulnerability Reports, Security Articles, Tutorials and more."
}
```
The only required fields in this schema are `url` and `active`. The server will not ingest any feeds that are not `"active": true`.

In `config.json`, you may set the refresh interval and the webhook url:
```
{
    "webhook": "<url>",
    "refresh_interval": 2000
}
```

For instance, a Discord channel webhook can be obtained by following these instructions: [https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks).

## Running
Just run `node server.js`. An initial poll will grab all the current content, then it will just run into perpetuity. You can deploy to your server as a background task using `nohup node server.js &` or even maybe using [Glitch](https://glitch.com) as free hosting.
