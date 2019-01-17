/* globals webkitRTCPeerConnection,mozRTCPeerConnection,RTCSessionDescription,RTCIceCandidate,IceServersHandler */
function RTCConnection (socket, onRemoteStreamAdd, onRemoteStreamRemove, onDisconnect) {
  let that = this
  that.connections = {}
  that.localTracks = {}
  that.localStream = null
  that.mediaConstraints = {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
    }
  }
  // function negotiate(pc){
  //   return pc.createOffer().then(d=>pc.setLocalDescription(d)).then(d=>{ socket.json.send(pc.localDescription)})
  // }
  // that.connect=(peerId)=>{
  //   that.peerId=peerId;
  //   that.createPeerConnection(that.peerId);
  //   let pc=that.connections[peerId].pc;
  //   return negotiate(pc);
  // };
  that.createPeerConnection = (peerId) => {
    let RTCPeerConnection = webkitRTCPeerConnection || mozRTCPeerConnection
    let pcConfig = {
      'iceServers': IceServersHandler.getIceServers()
    }
    try {
      that.connections[peerId] = { pc: new RTCPeerConnection(pcConfig) }
    } catch (e) {
      console.log(e)
    }
    that.connections[peerId].pc.onicecandidate = function (e) {
      if (e.candidate) {
        socket.json.send({
          type: 'candidate',
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          sdpMid: e.candidate.sdpMid,
          candidate: e.candidate.candidate
        }, peerId)
      } else if (that.connections[peerId].pc.iceGatheringState === 'complete') {
        // negotiate(that.connections[peerId].pc)
        socket.json.send(that.connections[peerId].pc.localDescription, peerId)
      }
    }
    that.connections[peerId].pc.onnegotiationneeded = function (e) {
      let pc=that.connections[peerId].pc;
      if (pc.signalingState != "stable") return;
       pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
      .then(d => pc.setLocalDescription(d))
    };

    that.connections[peerId].pc.ontrack = (e) => { onRemoteStreamAdd(e, peerId) }
  }
  socket.on('message', (e, socketId) => {
    let pc = that.connections[socketId].pc
    switch (e.type) {
      case 'offer':
        pc.setRemoteDescription(new RTCSessionDescription(e))
          .then(_ => pc.createAnswer())
          .then(d => { pc.setLocalDescription(d) }).then(_ => { socket.json.send(pc.localDescription, socketId) }).catch(console.info)
        break
      case 'answer':
        pc.setRemoteDescription(new RTCSessionDescription(e), console.log)
        break
      case 'candidate':
        let candidate = new RTCIceCandidate({ sdpMLineIndex: e.sdpMLineIndex, sdpMid: e.sdpMid, candidate: e.candidate })
        pc.addIceCandidate(candidate)
        break
      case 'trackchange':
        onRemoteStreamRemove(e, socketId)
        break
    }
  })
  socket.on('connected', function (peers) {
    that.connections = {}
    peers.forEach(function (socketId) {
      that.connections[socketId] = { pc: null }
      that.createPeerConnection(socketId)
    })
  }).on('peer-connect', function (data) {
    that.connections[data.socketId] = { pc: null }
    that.createPeerConnection(data.socketId)
    that.sendStreamToPeer(data.socketId)
  }).on('peer-disconnect', function (data) {
    console.log('Disconnected', data)
    if (that.connections[data.socketId]) delete that.connections[data.socketId]
    onDisconnect(data.socketId)
  })
  that.sendStreamToPeer = (socketId) => {
    if (that.localStream == null) return
    let pc = that.connections[socketId].pc
    let gotVideo=false
    let gotAudio=false
    if(that.localTracks[socketId]){
      that.localTracks[socketId].forEach((sender,index) => {
        if(sender.track.kind === 'video'){
          console.log('got video');
          gotVideo=true;
          sender.replaceTrack(that.localStream.getVideoTracks()[0]);
        }else{
          console.log('got audio');
          gotAudio=true;
          sender.replaceTrack(that.localStream.getAudioTracks()[0]);
        }
      })
    }
    // if(!gotVideo && !gotAudio) that.localTracks[socketId] = []
    // if(!gotVideo || !gotAudio) that.localStream.getTracks().forEach(track => {
    //   if( (!gotVideo && track.kind==='video') || (!gotAudio && track.kind==='audio') ){
    //     console.log(track);
    //     that.localTracks[socketId].push(pc.addTrack(track, that.localStream))
    //   };
    // })
    
    // pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
    //   .then(d => pc.setLocalDescription(d))
  }
  return {
    addStream: function (stream) {
      that.localStream = stream
      for (let socketId in that.connections) {
        if (!that.connections.hasOwnProperty(socketId)) continue
        that.createPeerConnection(socketId)
        that.sendStreamToPeer(socketId)
      }
    },
    trackChange: function (audio, video) {
      for (let socketId in that.connections) {
        if (!that.connections.hasOwnProperty(socketId)) continue
        socket.json.send({ type: 'trackchange', audio: audio, video: video }, socketId)
      }
    }
    // removeStream: function(){
    //   if(that.localTracks.length){
    //     for(socketId in that.localTracks){
    //       if (that.connections.hasOwnProperty(socketId)){
    //         if (that.localTracks.hasOwnProperty(socketId)){
    //           that.localTracks[socketId].forEach(function(sender){
    //             that.connections[socketId].pc.removeTrack(sender);
    //           });
    //         }
    //         that.connections[socketId].pc.stop();
    //         that.connections[socketId].pc=null;
    //       }
    //     }
    //   }
    //   that.localTracks={};
    // }
  }
};
module.exports = function (...args) {
  return new RTCConnection(...args)
}
