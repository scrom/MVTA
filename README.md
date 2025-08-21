Minimum Viable Text Adventure" ("MVTA")**
=======================================
** *Now developed way beyond "minimum viable" **
*The game is back! live and running at: https://mvta.io/  (!!!) *

MVTA: March 2014 to Present day (2025).

After a 10 year hiatus, we are back in active development - at least for a while...

The game code and development setup has been updated to 2025 versions of Node, Redis, and related packages. 
Tests have been migrated to Jest and work begins shortly on a new (secure) deployment and hosting approach.

About:
------
A classic 80s style text adventure (and engine) with a few twists. 
A work of Interactive Fiction (IF) wrtiten using Node and Javascript.

(See also https://ifdb.org/viewgame?id=ek1sc6yxwgp1kr9 from around when when this was first published)

"MVTA" was originally developed with the idea of being a "minimum viable text adventure" as a means of getting back into coding. 
The beast has taken on a life of its own.

The original concept was to allow one (or more) users to enter a single room in a game, and enter commands which would be pushed to a "watcher" queue. 
Another player or watcher would then pull the user commands from the queue and write responses asynchronously.

The idea came from a game that ran for a number of weeks in the office where a glass wall next to the coffee machines became a for a free-form text adventure using a brain-writing / consequences style with an unwritten rule that any person may enter a command but someone else would define what the response was.

Invariably the adventure would descend into curious psychedelia such as Justin Bieber riding a flaming Aardvark (or similar) but the concept seemed a neat way of (re)learning development.

In the end, it's become "just another text adventure engine" but I still have a desire to (one day) add that real-time interaction back in. 
(Perhaps I'll hook it up to an LLM and write a dynamic text adventure chatbot?)

A key part of this project was simply to get back into coding properly. But by deliberately creating a legacy codebase from scratch in order to truly understand what most of my dev teams *really* face. 
- Understanding the difference between cramming one more feature in in a spare hour vs being disciplined and writing tests first. 
- Seeing that tipping point where complexity gets to the point where you can't just hack things in without a regression risk any more. 
- The need to rework poor design decisions but not having the support of working tests. (hint - write more tests)
- Having to cram in unit and integration tests to prize seams apart and facing the pain of adding coverage analysis (still to do!)

*In December 2014 I finally reached a tipping point and had to start adding in large functional regression tests in order to continue working in (relative) safety. 
All the fundamental work is done (other than adding more game data) and most of what's left is invasive, risky, and complex. 
This was a great place to have ended up. - It does mean there's a very strong chance it's carrying a fair few hidden bugs. Welcome to the world of legacy code!*

A reminder. This is not the "right" way to develop but it's still how a lot of projects and teams end up working under pressure.
In some way therefore, the commit history on this will be a history lesson in how *not* to write good software - and then how to recover from it (or survive) later.

Direction
---------
As the game currently stands it's becoming quite an advanced (if ugly) text adventure engine. 
It has a dynamic aggression/affinity system that's rather novel, support for multiple NPCs and missions and understands well over 100 verbs but there's a load of work to do. 

Other than *loads* of additional game mechanics, features and sample content, the other major components to work on are:
 - a means of managing and editing game maps,  documenting all the attributes and placeholder subtleties. The map is currently assembled form a series of json files and the set of attributes available for everything isn't documented. (Hey, that's not bad - for a while it was all in a single file!)
 - enhanced and persistent logging - using modern logging and observability tools.
 - an enhanced UI - *todo*
 - mobile device friendly? - done! - people are starting to get used to typing more than they were but it's pretty verbose as a game.
 - eventually I'd like players to choose, extend and reuse maps. Right now, there's just the one.
 - a means of saving and loading game state. If the Node server goes down, a player state is lost, or if a player closes their browser, they can't recover their game. *done* - if the player has achieved enough to save their game*
 - persistence of Redis savegame data if redis goes down - *done*.
 - implementing sensible object composition (1500 to 2000 line god classes prove a point but they're bleeding all over each other and not well-designed and structured. That's hurting now.) - todo
 - implementing server throttling to prevent overloading - *done*
 - limiting the number of saved game files on the server to ensure hosting space isn't consumed. *partially done* - only "real" games can be saved* Need to implement old data cleanup actions and max storage usage. 
 - the game really needs a battery of tests but that's after the legacy code "peak" is reached - *ongoing* (but it's come a long way).
 - finding somewhere simple that I can get this hosted for free that doesn't require mountains of manual config. This was originally "done" using Heroku but I'm working on something more interesting with docker and a cloud provider. - *in progress*

*If you're more curious about what work and plans are still hanging about, take a look at the "issues" against this project. There's plenty to explore!*


Technical stuff:
================
Server Configuration
--------------------
1: Ensure a current version of NodeJS is installed and the relevant module dependencies are installed unsing NPM. (see module dependencies in this readme)

2: Set the following server environment variables to configure the application hostname and port

- MVTA_HOST (e.g. mvta.herokuapp.com)
- MVTA_PORT     (e.g. 1337)

2a: If running over HTTPS rather than HTTP, set additional environment variables

- MVTA_PROTOCOL "https" (without the quotes) - this is only actually used for some tests. The https server itself is already set up.
- MVTA_SSL_PORT (e.g. 443)

Note, if the game is running on port 80, you don't need to explicitly set PORT as an environment variable.

2b: The game supports use of "fallback" ports - that is. If existing ports are in use, it will fall back to alternatives.
The environment variables for these are entirely optional
- MVTA_FALLBACK_PORT
- MVTA_FALLBACK_SSL_PORT

3: MVTA is written to use either .json files or Redis (as a non-file data store) to save player game data and timed-out games.

If you're running in an environment that doesn't offer filesystem support (such as Heroku), you'll need to set up your own Redis data store (and it'll need to be secure).
Once you have a store available, set the following environment variables for your Redis data store:

- REDIS_HOST (the addressable hostname of your redis server)
- REDIS_PWD (the auth password of your redis server if used - without quotes)
- REDIS_PORT (the port number of your redis host)

*If REDIS_HOST is _not_ set as an environment variable, the game will default to file-based game save data.*
Note, back in 2014; due to a few bugs in the node_redis javascript parser I had to use the c-based hiredis parser and pull chunks in data streams to load saved games successfully. 
(A bit more work when developing in a Windows environment but reliable at least) - I wonder if this is now fixed?!

4: Server throttling has been introduced. Whilst sensible default settings are defined in config.js; custom settings can be applied using 2 further environment variables:

- MVTA_RATELIMITMINUTES  (default value is 5) //the time window used to measure the number of incooming requests (in minutes)
- MVTA_RATELIMITREQUESTS (default value is 125 )|| 125, //the maxiumum number of requests allowed from a single IP within a given time window. Slowdown happens at this threshold. Full limiting happens at 2x this.

5: SO that you don't fill the logs with debug noise - remember to also set.

- NODE_ENV: production

6: For info... The full set of environment variables (with their defaults) used by MVTA are captured in /server/js/config.js 

Running the server
------------------
MVTA is now designed to run using docker containers. One for Redis and one for the main node game. (historically it was a procfile and Heroku).
When running directly from Visual Studio or VSCode, the launch file is defined under /.vscode/launch.json

If you want to run locally on a windows machine outside VS (and without using Redis for storage); the simplest is to write a batch file that sets the working directory to:

- <your drive>/<your installation location>/server/js/

Once at the working location, the game runs from the file "main.js". E.g.

- node main.js

I generally include a "pause" at the end of a batch file so that should there be a bug or issue that causes the game to crash you can see the diagnostic output before the window quits.
- pause

If you want to set up your own redis service, feel free. I'll not document that config here although you'll see a fair bit in docker configs if you need some pointers.

Client Configuration
--------------------
The client consists of an index.html page in the root of the project and a series of referenced JS files under the js/client folder.
There's also a css folder with some *very* basic layout and styling.
The express server coded into the server.js file should automatically serve static files from the root of the node project (where the index.html file lives). 

The client currenly runs over http (but will support https) and assumes the game is running from the "root" of the node server on the node listening port.

You can enable client "console" output by setting
- var debug = true; 
in the client main.js file

That's it. You're ready to go!


Launching the client
--------------------
Use your favourite browser to navigate to the webroot and port of the node server: e.g. https://your-server:1337/ 
Upon successful launch, the client should show the client and UI successfully initiated with green borders and a prompt.
(Sometime I'll add a server communication test here so that we can see the server is accessible and running)


Coding style
------------
The code is deliberately written in an old-fashioned static OO style for the most part. 
This is the case for both client and server code although the client is closer to more "correct" javascript object/prototypal definitions.

Whilst JS is a dynamic language, this was as much an exercise in poor OO design and maintainability. 
(Having said that, I relied heavily on some loose typing for some areas rather than implementing inheritance fully)
To this end, please stick to the same javascript object style that's in use if extending.
On the server side, I'm trying to keep the main game engine away from node-specific features and code as much as posssible. 


Development & deployment platforms
-----------------------------------
This game is developed on Windows but is designed to be able to run from docker Linux containers.
It is currently hosted and live on AWS EC2 as a couple of small docker containers

Whilst the game was originally developed in Visual Studio 2012 and can still be developed in VS2022, I've found it far better to work on it using VSCode. 


Tests
-----
For most server classes, there are corresponding test files. 
These are found in a test framework-specific subfolder under /test/  e.g. /test/jest
The file naming convention for tests is <classname>.<subset>.test.js - This follows pretty much standard JS test framework copnventions to support discoverabiltiy whilst being clear what they are meant to be testing.

The tests in here are a mix of unit and functional regression tests - sad but realistic given the era these were first written (when writing tests was manual and slow).
The functional regression tests are pretty important as this game engine is complex - there's a lot that has to hang together to work - especially around complex missions, contagion, and character interactions.

The test framework in use (as of May 2025) is Jest. (After some battling with a Visual Studio bug, I have them happily running from the VSCode test explorer)
Jest configuration can be found in the file jest.config.js (as well as some basics in package.json).

I relied heavily on Github Copilot to speed up the test migration and will do more with it to generate additional tests.
It's incredible how much more productive creating meaningful tests is using Copilot.  
Sure it's not always getting things right so you need to review what has been generated carefully for "dumb things" - but so much boilerplate is taken care of!

There are currently only server-side tests. When client development starts up more heavily, some scaffolding and support for client testing will be needed.


Module Dependencies
-------------------
The game was originally designed to run on Node version 0.10.33 but has now been upgraded to run on Node 24.2.0 and upward.

Node Module dependencies are defined in \package.json
As of August 2025 they are...

For the server:
---
    "body-parser": "^2.2.0",
    "express": "^5.1.0",
    "express-rate-limit": "^8.0.1",
    "express-slow-down": "^3.0.0",
    "jsonfile": "^6.1.0",
    "morgan": "^1.10.0",
    "redis": "^5.0.1"
---
Take a look at the rest of the package.json file for dev dependencies and other config info.

---------------------------
End. Thanks for reading!

Simon
