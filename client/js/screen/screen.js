// Last updated On: May 12, 2018

// Latest file can be found here: https://cdn.webrtc-experiment.com/screen.js

// Muaz Khan     - https://github.com/muaz-khan
// MIT License   - https://www.webrtc-experiment.com/licence/

// Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/screen-sharing

(function() {

    if(typeof getScreenId === 'undefined') {
        console.warn('getScreenId.js early load is recommended.');
    }

    if(typeof adapter === 'undefined' || typeof adapter.browserDetails === 'undefined') {
        // https://webrtc.github.io/adapter/adapter-latest.js
        console.warn('adapter.js is recommended.');
    }
    else {
        window.adapter = {
            browserDetails: {
                browser: 'chrome'
            }
        };
    }

    if(typeof IceServersHandler === 'undefined') {
        // https:/cdn.webrtc-experiment.com/IceServersHandler.js
        console.warn('IceServersHandler.js is recommended.');
    }

    // via: https://bugs.chromium.org/p/chromium/issues/detail?id=487935#c17
    // you can capture screen on Android Chrome >= 55 with flag: "Experimental ScreenCapture android"
    window.IsAndroidChrome = false;
    try {
        if (navigator.userAgent.toLowerCase().indexOf("android") > -1 && /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)) {
            window.IsAndroidChrome = true;
        }
    } catch (e) {}

    var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);

    // a middle-agent between public API and the Signaler object
    window.Screen = function(channel) {
        var signaler, self = this;
        this.channel = channel || location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');

        // get alerted for each new meeting
        this.onscreen = function(screen) {
            if (self.detectedRoom) return;
            self.detectedRoom = true;

            self.view(screen);
        };

        function captureUserMedia(callback, extensionAvailable) {
            if(isEdge) {
                navigator.getDisplayMedia({video: true}).then(stream => {
                    addStreamStopListener(stream, function() {
                        if (self.onuserleft) self.onuserleft('self');
                    });

                    self.stream = stream;

                    var video = document.createElement('video');
                    video.id = 'self';
                    video.muted = true;
                    video.volume = 0;

                    try {
                        video.setAttributeNode(document.createAttribute('autoplay'));
                        video.setAttributeNode(document.createAttribute('playsinline'));
                        video.setAttributeNode(document.createAttribute('controls'));
                    } catch (e) {
                        video.setAttribute('autoplay', true);
                        video.setAttribute('playsinline', true);
                        video.setAttribute('controls', true);
                    }

                    video.srcObject = stream;

                    self.onaddstream({
                        video: video,
                        stream: stream,
                        userid: 'self',
                        type: 'local'
                    });

                    callback(stream);
                }, error => {
                    if (location.protocol === 'http:') {
                        alert('HTTPs is required.');
                    }

                    console.error(error);
                });
                return;
            }

            getScreenId(function(error, sourceId, screen_constraints) {
                if (IsAndroidChrome) {
                    screen_constraints = {
                        mandatory: {
                            chromeMediaSource: 'screen'
                        },
                        optional: []
                    };

                    screen_constraints = {
                        video: screen_constraints
                    };

                    error = null;
                }

                //console.log('screen_constraints', JSON.stringify(screen_constraints, null, '\t'));
                navigator.mediaDevices.getUserMedia(screen_constraints).then(function(stream) {
                    addStreamStopListener(stream, function() {
                        if (self.onuserleft) self.onuserleft('self');
                    });

                    self.stream = stream;

                    var video = document.createElement('video');
                    video.id = 'self';
                    video.muted = true;
                    video.volume = 0;

                    try {
                        video.setAttributeNode(document.createAttribute('autoplay'));
                        video.setAttributeNode(document.createAttribute('playsinline'));
                        video.setAttributeNode(document.createAttribute('controls'));
                    } catch (e) {
                        video.setAttribute('autoplay', true);
                        video.setAttribute('playsinline', true);
                        video.setAttribute('controls', true);
                    }

                    video.srcObject = stream;

                    self.onaddstream({
                        video: video,
                        stream: stream,
                        userid: 'self',
                        type: 'local'
                    });

                    callback(stream);
                }).catch(function(error) {
                    if (adapter.browserDetails.browser === 'chrome' && location.protocol === 'http:') {
                        alert('HTTPs is required.');
                    } else if (adapter.browserDetails.browser === 'chrome') {
                        alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
                    } else if (adapter.browserDetails.browser === 'firefox') {
                        alert(Firefox_Screen_Capturing_Warning);
                    }

                    console.error(error);
                });
            }, true);
        }

        var Firefox_Screen_Capturing_Warning = 'Make sure that you are using Firefox Nightly and you enabled: media.getusermedia.screensharing.enabled flag from about:config page. You also need to add your domain in "media.getusermedia.screensharing.allowed_domains" flag.';

        // share new screen
        this.share = function(roomid) {
            captureUserMedia(function() {
            });
        };
        this.leave = function(){
            // leave user media resources
            if (self.stream) {
                if('stop' in self.stream) {
                    self.stream.stop();
                }
                else {
                    self.stream.getTracks().forEach(function(track) {
                        track.stop();
                    });
                }
            }
        }
    };
    function setBandwidth(sdp) {
        if (adapter.browserDetails.browser === 'firefox') return sdp;
        if(adapter.browserDetails.browser === 'safari') return sdp;
        if(isEdge) return sdp;

        // https://github.com/muaz-khan/RTCMultiConnection/blob/master/dev/CodecsHandler.js
        if(typeof CodecsHandler !== 'undefined') {
            sdp = CodecsHandler.preferCodec(sdp, 'vp9');
        }

        // https://github.com/muaz-khan/RTCMultiConnection/blob/master/dev/BandwidthHandler.js
        if (typeof BandwidthHandler !== 'undefined') {
            window.isFirefox = adapter.browserDetails.browser === 'firefox';

            var bandwidth = {
                screen: 300, // 300kbits minimum
                video: 256 // 256kbits (both min-max)
            };
            var isScreenSharing = true;

            sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, bandwidth, isScreenSharing);
            sdp = BandwidthHandler.setVideoBitrates(sdp, {
                min: bandwidth.video,
                max: bandwidth.video
            });
            return sdp;
        }

        // removing existing bandwidth lines
        sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');

        // "300kbit/s" for screen sharing
        sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:300\r\n');

        return sdp;
    }

    window.addStreamStopListener = function (stream, callback) {
        stream.addEventListener('ended', function() {
            callback();
            callback = function() {};
        }, false);
        stream.addEventListener('inactive', function() {
            callback();
            callback = function() {};
        }, false);
        stream.getTracks().forEach(function(track) {
            track.addEventListener('ended', function() {
                callback();
                callback = function() {};
            }, false);
            track.addEventListener('inactive', function() {
                callback();
                callback = function() {};
            }, false);
        });
    };

    function loadScript(src, onload) {
        var script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.documentElement.appendChild(script);
        console.log('loaded', src);
    }

    typeof getScreenId === 'undefined' && loadScript('https://cdn.webrtc-experiment.com/getScreenId.js');
})();
