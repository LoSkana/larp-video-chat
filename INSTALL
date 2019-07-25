It's really easy to install & deploy. You just have to prepare a simple STUN / TURN server (just follow the instructions), and finally deploy the actual server

### STUN / TURN SERVER

# https://www.webrtc-experiment.com/docs/TURN-server-installation-guide.html#reTurnServer

sudo apt install resiprocate-turn-server

sudo nano /etc/reTurn/users.txt

# add as last line: username:01f747a4ce917e70aa813460a80757e4:reTurn:authorized
# notiche that the hash is the output of: echo -n username:reTurn:password | md5sum

service resiprocate-turn-server restart

# check it is running!

sudo netstat -nlp | grep reTurnServer

# WARNING: if you restart the server, you have to manually start the resiprocate-turn-server service


### SERVER 

sudo ufw allow 8432 (or whatever firewall you are using) 

cd site

npm install 

node server.js

go to localhost:8432 and have fun!
