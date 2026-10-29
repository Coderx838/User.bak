# **User.bak**

(*A self standin bot for discord that can handle your day when you are away.*)

*"Because you have a life, a sleep schedule, and a Discord server that never stops pinging."*

**This bot is made for people who are busy with real-life things while their Discord is left unattended.(yeh this was my real problem this is where idea came from.)**

(*No more waking up to 47 unread pings or friends complaining that you ghosted them for ten hours.*
)

**Introducing 'User.bak' a discord bot that can be personalized for everyone as per thier needs and then handles thier discord for them**


## Live Demo for you (yeh catty.):
*Join the discord channel : https://discord.gg/K3ehg5gTf*

*Go to #demo in the server and talk to the bot by mentioning me, using my name (Coderx), or you can directly DM the bot.*


## Quickstart (Up and Running in 3 Minutes)

#### Clone & install(Ik you know how to do this , but anyways ..:3)

```bash
git clone https://github.com/Coderx838/User.bak.git
cd User.bak
npm install
```

### Set up your env (this is really important)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Now in .env fill in this essentials that bot needs to work.:
* `DISCORD_TOKEN` — Grab this from the [Discord Developer Portal](https://discord.com/developers/applications).
* `TARGET_USER_ID` — Your Discord User ID (the person being cloned).
* `GROQ_API_KEY` — Free key from [Groq Console](https://console.groq.com/keys).
* *(Optional)*: `VIRUSTOTAL_API_KEY`, `GIPHY_API_KEY`, `STORAGE_CHANNEL_ID`, `MEMORY_CHANNEL_ID`, `EMERGENCY_WEBHOOK_URL`, `OWNER_TIMEZONE`.(these are fun .. yay)

**Note on Discord Intents**: Make sure to check **Guild Presences Intent** and **Message Content Intent** under the Bot tab in your Discord Developer Portal, otherwise the bot cannot read your online status or message text.(important!!)

### All done , fire it up !!
```bash
npm start
```

(*Now you got your own clone running,locally*)



### All the commands the bot have (take your time to understand it ..catty)

| Command | Who Can Run It | What Happens |
|---|---|---|
| `!help` | Everyone | Shows whether the bot is currently covering for you and how it works. |
| `!tell Master <msg>` | Everyone | Saves a private note / voicemail for you to read when you return. |
| `!urgent <reason>` | Everyone | Tests if their issue is a real emergency. Pings your webhook if real, roasts if fake. |
| `!digest` | Owner Only | DMs you an immediate AI summary of all missed pings, voicemails, and voice notes. |
| `!briefing [status\|on\|off\|set]` | Owner Only | Configures automated morning standup and nightly recap deliveries to your DMs. |
| `!stats` | Owner Only | Shows today's token usage, uptime, pending logs, and threats blocked. |
| `!afk [on\|off\|auto]` | Owner Only | Manually forces stand-in on, off, or back to auto presence tracking. |
| `!standin [on\|off\|auto]` | Owner Only | Quick toggle for stand-in mode. |
| `!persona [list\|set\|add\|remove]` | Owner Only | Swap personalities live (`default`, `cool`, `formal`, `savage`, `work`) or write a custom one. |
| `!learn <topic> = <fact>` | Owner Only | Teaches the bot verified facts about your schedule, stack, or preferences. |
| `!unlearn <topic>` | Owner Only | Wipes a learned fact from memory. |
| `!knowledge` | Owner Only | Lists everything the bot currently remembers about you. |
| `!reset` | Owner Only | Clears short-term channel conversation context. |
| `!delete-last` | Owner Only | Deletes the bot's last sent message in the channel. |
| `!delete-all` | Owner Only | Purges recent bot messages from the channel. |

> **catty tips**: Use owner commands (`!stats`, `!persona`, `!knowledge`) in private DMs with the bot. but even if you run them in a public server, the bot cleans up your message and routes the answer to your DMs so server members do not see your configs(for security um..eductional ig)

### Making the bot yours (yay really..)

Want to tweak the debounce speed, persona prompts, or cooldowns? Everything is laid out cleanly in `config.json`:

```json
{
  "prefix": "!",
  "cooldownSecondsPerUser": 15,
  "channelCooldownSeconds": 4,
  "spamLimitCount": 4,
  "batchDebounceMs": 3500,
  "maxBatchSize": 6,
  "groqTemperature": 0.8,
  "groqMaxTokens": 300
}
```



----------------------------------------------------------------------------------------------------------------------------------


*Made by a teen for [Hackclub ysws](https://crescent.hackclub.com/).*



