module.exports={
    props: ['contentList'],
    template: '#content-list',
    methods: {
      loadContent: function (content) {
        this.$emit('load-content', content)
      }
    }
  }