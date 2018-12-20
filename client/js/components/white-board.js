module.exports={
    props: ['item'],
    template: '#white-board',
    methods: {
      
    },
    mounted: function () {
      let paint=require('../paint/paint')(document.getElementById(this.item.id))
      paint.addEventListener("drawing", function (event) {
        console.log(event)
      })
    }
  }