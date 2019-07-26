function debug(el) {
    alert(JSON.stringify(el, undefined, 2));
}

window.enableAdapter = true; // enable adapter.js

// ......................................................
// .......................UI Code........................
// ......................................................

$('#enter-room').click(function() {
    
    switch($('#room-trasmit').val()) {
        case 'audio': connection.mediaConstraints.video = false; break; 
        case 'audio': connection.mediaConstraints.video = false; break; 
        case 'nothing': connection.session.audio = false;
            connection.session.video = false; break; 
    }

    connection.openOrJoin($('#room-id').val(), function(isRoomExists, roomid) {
        /*if (!isRoomExists) {
            showRoomURL(roomid);
        }*/
    
        $('#room-descr').html("Connected to room: " + roomid);
        $('#sec-ready').hide(300);
        setTimeout(function () {$('#sec-connected').show(300)}, 500);

    });
});

$('#btn-leave-room').click(function() {
    
    if (!confirm("Are you really sure you want to leave?")) return ;
    
    this.disabled = true;

    if (connection.isInitiator) {
        // use this method if you did NOT set "autoCloseEntireSession===true"
        // for more info: https://github.com/muaz-khan/RTCMultiConnection#closeentiresession
        connection.closeEntireSession(function() {
            $('#h1').html('Entire session has been closed.');
        });
    } else {
        connection.leave();
    }
    
     location.reload(); 
});


// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................

var connection = new RTCMultiConnection();

// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = '/';

// comment-out below line if you do not have your own socket.io server
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketMessageEvent = 'larp-video-chat';

connection.enableFileSharing = true; // by default, it is "false".

connection.session = {
    audio: true,
    video: true,
    data: true
};

connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

// https://www.rtcmulticonnection.org/docs/iceServers/

// first step, ignore default STUN+TURN servers
connection.iceServers = [];

// second step, set STUN url
connection.iceServers.push({
    urls: 'stun:127.0.0.1:5349'
});

// last step, set TURN url (recommended)
connection.iceServers.push({
    urls: 'turn:127.0.0.1:3478',
    credential: 'password',
    username: 'username'
});
connection.videosContainer = $('#videos-container');
connection.onstream = function(event) {
    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');

    var video = document.createElement('video');
    video.controls = true;
    if(event.type === 'local') {
        video.muted = true;
    }
    video.srcObject = event.stream;

    var width = parseInt(connection.videosContainer.innerWidth() / 2) - 20;
    var mediaElement = getHTMLMediaElement(video, {
        // title: event.userid,
        buttons: ['mute-audio', 'mute-video'],
        width: width,
        showOnMouseEnter: false
    });

    connection.videosContainer.append(mediaElement);

    setTimeout(function() {
        mediaElement.media.play();
    }, 5000);

    mediaElement.id = event.streamid;
};

connection.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);
    }
};

connection.onopen = function() {
    $('#room-partecip').html('There are: ' + connection.getAllParticipants().length + ' users connected');
};

connection.onclose = function() {
    if (connection.getAllParticipants().length) {
        $('#room-partecip').html('There are: ' + connection.getAllParticipants().length + ' users connected');
    } else {
        $('#room-partecip').html('There are no users connected');
    }
};

connection.onEntireSessionClosed = function(event) {
        $('#sec-ready').hide();
        $('#sec-connected').hide();   

    connection.attachStreams.forEach(function(stream) {
        stream.stop();
    });

    // don't display alert for moderator
    if (connection.userid === event.userid) return;
    $('#h1').html('Entire session has been closed by the moderator: ' + event.userid);
};

connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
    // seems room is already opened
    connection.join(useridAlreadyTaken);
};

// ......................................................
// ................FileSharing/TextChat Code.............
// ......................................................

$('#share-file').click(function() {
    var fileSelector = new FileSelector();
    fileSelector.selectSingleFile(function(file) {
        connection.send(file);
    });
});

connection.onFileStart = function (file) {
    var div = document.createElement('div');
    div.title = file.name;
    div.innerHTML = '<label>0%</label> <progress></progress>';
    $('#file-container').show();
    $('#file-list').append(div);
    progressHelper[file.uuid] = {
        div: div,
        progress: div.querySelector('progress'),
        label: div.querySelector('label')
    };
    progressHelper[file.uuid].progress.max = file.maxChunks;
    
    
};

var progressHelper = {};

// to make sure file-saver dialog is not invoked.
connection.autoSaveToDisk = false;

connection.onFileProgress = function (chunk, uuid) {
    var helper = progressHelper[chunk.uuid];
    helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
    updateLabel(helper.progress, helper.label);
};

connection.onFileEnd = function (file) {
    progressHelper[file.uuid].div.innerHTML = '<a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + '</a>';
};

function updateLabel(progress, label) {
    if (progress.position == -1) return;
    var position = +progress.position.toFixed(2).split('.')[1] || 100;
    label.innerHTML = position + '%';
}

// ......................................................
// ......................Handling Room-ID................
// ......................................................

function GetURLParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam){
            return sParameterName[1];
        }
    }
}

function param(name, def) {
    v = GetURLParameter(name);
    if (v === undefined) return def; 
    return v; 
}

$(function() {   
    
    $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'skins/' + config.skin + '/style.css') );
    $('head').append( $('<script type="text/javascript" />').attr('src', 'skins/' + config.skin + '/local.js') );
    
    $('#room-id').val(param('id', Math.floor(Math.random() * 10000)));
    
    $('#room-trasmit').val(param('trasmit', 'all'));
    
    if (param('go', 0) != 0)
        $('#enter-room').click();
});


(function($) {
var re = /([^&=]+)=?([^&]*)/g;
var decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
var decode = function (str) {return decodeURIComponent( str.replace(decodeRE, " ") );};
$.parseParams = function(query) {
    var params = {}, e;
    while ( e = re.exec(query) ) { 
        var k = decode( e[1] ), v = decode( e[2] );
        if (k.substring(k.length - 2) === '[]') {
            k = k.substring(0, k.length - 2);
            (params[k] || (params[k] = [])).push(v);
        }
        else params[k] = v;
    }
    return params;
};
})(jQuery);
