const express = require('express');
const bodyParser = require('body-parser');
const webrtc = require('@koush/wrtc');
const cors = require('cors');

const port = process.env.PORT || 3000;
const configuration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
};
// Add turn server to `configuration.iceServers` if needed.

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.post('/broadcast', async (req, res) => {
  const {offer, candidates} = req.body;
  const localCandidates = [];
  let dataChannel;
  // Step 1. Create new RTCPeerConnection
  const peer = new webrtc.RTCPeerConnection(configuration);
  peer.ondatachannel = (event) => {
    dataChannel = event.channel;
    dataChannel.onopen = (event) => {
      dataChannel.send('Hello from server!');
    };
    dataChannel.onclose = (event) => {
      console.log('Data channel closed');
    };
    dataChannel.onmessage = (event) => {
      console.log('Data channel message:', event.data);
    };
  };
  peer.onconnectionstatechange = (event) => {
    console.log('Connection state:', peer.connectionState);
  };
  peer.onsignalingstatechange = (event) => {
    console.log('Signaling state:', peer.signalingState);
  };
  peer.oniceconnectionstatechange = (event) => {
    console.log('ICE connection state:', peer.iceConnectionState);
  };
  peer.onicegatheringstatechange = (event) => {
    console.log('ICE gathering state:', peer.iceGatheringState);
  };
  peer.onicecandidate = (event) => {
    // Step 6. Gathering local ICE candidates
    if (event.candidate) {
      localCandidates.push(event.candidate);
      return;
    }
    // Step 7. Response with Answer and server candidates
    let payload = {
      answer: peer.localDescription,
      candidates: localCandidates,
    };
    res.json(payload);
  };
  // Step 2. Set remote description with Offer from client
  await peer.setRemoteDescription(offer);
  // Step 3. Create Answer
  let answer = await peer.createAnswer();
  // Step 4. Set local description with Answer from step 3
  await peer.setLocalDescription(answer);
  // Step 5. Add ICE candidates from client
  for (let candidate of candidates) {
    await peer.addIceCandidate(candidate);
  }
});

app.listen(port, () => console.log('Server started on port ' + port));