# Virtual Discussion

Virtual discussion is a platform to chat(text/video) with other users of same discussion room and also edit documents together on the same room.

### Features
* Youtube Video Sharing
* Collaborative editor
* Video/Audio conference
* Text Chat

### Technology

Virtual Discussion uses a number of open source projects to work properly:

* [VueJS](https://vuejs.org/) - HTML enhanced for web apps!
* [Ace Editor] - awesome web-based text editor for online collaboration
* [Twitter Bootstrap](https://getbootstrap.com/docs/4.1/getting-started/introduction/) - great UI boilerplate for modern web apps
* [node.js](https://nodejs.org/en/) - evented I/O for the backend
* [SocketIO](https://socket.io/) - realtime data communications
* [Browserify](http://browserify.org) - For including different frontend js libraries and generate a common bundle of js files.
* [CoTurn](https://github.com/coturn/coturn/wiki/CoturnConfig) - Turn server for exchanging ICE candidates required for webrtc video sharing
* [Toastr](https://www.npmjs.com/package/vue-toasted) - For showing awesome notification message

### Installation

Virtual Discussion requires [Node.js](https://nodejs.org/) v8+ to run.

Copy .env-example to new .env file and fill out the settings for mysql/redis and others. 
Install the dependencies and devDependencies and start the server.

```sh
$ cd virtual-discussion
$ npm install
$ npm start
```

Verify the deployment by navigating to your clients/index.html in your preferred browser.

### Todos

 - Collaborative Whiteboard
 - Collaborative document editor (Images/Pdf)
 - Screen Sharing

License
----

MIT


**Free Software, Hell Yeah!**