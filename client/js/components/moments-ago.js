module.exports={
    props: ['date'],
    template: '#moments-ago',
    data: function () {
      return {
        currentTime: Date.now()
      }
    },
    computed: {
      timeFromNow: function () {
        return require('moment').utc(this.date).from(this.currentTime)
      }
    },
    mounted: function () {
      var that = this
      setInterval ( function () {
        that.currentTime = Date.now()  
      },1000)
    }
  }