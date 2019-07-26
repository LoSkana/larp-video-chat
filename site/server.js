// http://127.0.0.1:8432
// http://localhost:8432

var server = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');


function serverHandler(request, response) {
    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }

        if (filename.indexOf('favicon.ico') !== -1) {
            return;
        }

        var isWin = !!process.platform.match(/^win/);

        if (fs.statSync(filename).isDirectory() && !isWin) {
            filename += '/index.html';
        } else if (fs.statSync(filename).isDirectory() && !!isWin) {
            filename += '\\index.html';
        }

        fs.readFile(filename, 'binary', function(err, file) {
            if (err) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                response.write(err + '\n');
                response.end();
                return;
            }

            var contentType;

            if (filename.indexOf('.html') !== -1) {
                contentType = 'text/html';
            }

            if (filename.indexOf('.js') !== -1) {
                contentType = 'application/javascript';
            }

            if (contentType) {
                response.writeHead(200, {
                    'Content-Type': contentType
                });
            } else response.writeHead(200);

            response.write(file, 'binary');
            response.end();
        });
    });
}

var config = {
  "socketURL": "/",
  "dirPath": "",
  "homePage": "/",
  "socketMessageEvent": "larp-video-chat",
  "socketCustomEvent": "larp-video-chat-custom",
  "port": 8432,
  "enableLogs": false,
  "isUseHTTPs": false,
  "enableAdmin": false
};

var RTCMultiConnectionServer = require('rtcmulticonnection-server');
var ioServer = require('socket.io');

var app = server.createServer(serverHandler);
RTCMultiConnectionServer.beforeHttpListen(app, config);
app = app.listen(config["port"], process.env.IP || "0.0.0.0", function() {
    RTCMultiConnectionServer.afterHttpListen(app, config);
});

// --------------------------
// socket.io codes goes below

ioServer(app).on('connection', function(socket) {
    RTCMultiConnectionServer.addSocket(socket, config);

    // ----------------------
    // below code is optional

    const params = socket.handshake.query;

    if (!params.socketCustomEvent) {
        params.socketCustomEvent = 'custom-message';
    }

    socket.on(params.socketCustomEvent, function(message) {
        socket.broadcast.emit(params.socketCustomEvent, message);
    });
});

