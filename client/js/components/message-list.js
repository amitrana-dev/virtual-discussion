var momentsAgo = require('vue').component('moments-ago', require('./moments-ago'))
module.exports={
    props: ['messages', 'loggedInUser'],
    template: '#message-list',
    components: { momentsAgo: momentsAgo }
  }