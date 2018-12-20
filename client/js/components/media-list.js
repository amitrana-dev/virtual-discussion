module.exports={
    props: ['mediaList'],
    template: '#media-list',
    methods: {
      loadVideo: function (media) {
        this.$emit('load-media', media)
      }
    }
  }