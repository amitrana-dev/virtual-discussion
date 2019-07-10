module.exports={
    props: ['contentList','folderList','showPrivate', 'socket', 'currentFolder'],
    data: function (){
      return {
        folderName: ''
      }
    },
    template: '#content-list',
    methods: {
      loadContent: function (content) {
        this.$emit('load-content', content)
      },
      addFolder: function(){
        if(this.folderName.trim() !=''){
          this.$emit('add-folder', this.folderName);  
        }
      },
      uploadFile: function(e){
        let file = e.target.files[0];
        let that=this;
        that.socket.emit('add-file',(that.currentFolder.id ? that.currentFolder.id : 0),that.showPrivate, {name: file.name,type: file.type} , file);  
      },
      goBack: function (){
        this.$emit('go-back');  
      },
      deleteFolder: function (folder){
        this.$emit('delete-folder', folder)
      },
      changeFolder: function (folder) {
        this.$emit('load-folder', folder)
      },
      setPrivate: function () {
        this.$emit('private-content',true);
      },
      setPublic: function () {
        this.$emit('private-content',false);
      }
    }
  }