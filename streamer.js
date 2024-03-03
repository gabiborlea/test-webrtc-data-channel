async function createPeer(configuration) {
  const localCandidates = [];
  // Step 1. Create new RTCPeerConnection
  const peer = new RTCPeerConnection(configuration);
  peer.onconnectionstatechange = (event) => {
    console.log("Connection state:", peer.connectionState);
  };
  peer.onsignalingstatechange = (event) => {
    console.log("Signaling state:", peer.signalingState);
  };
  peer.oniceconnectionstatechange = (event) => {
    console.log("ICE connection state:", peer.iceConnectionState);
  };
  peer.onicegatheringstatechange = (event) => {
    console.log("ICE gathering state:", peer.iceGatheringState);
  };
  // Step 5. Gathering local ICE candidates
  peer.onicecandidate = async (event) => {
    if (event.candidate) {
      localCandidates.push(event.candidate);
      return;
    }
    // Step 6. Send Offer and client candidates to server
    const response = await fetch("http://localhost:3000/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offer: offer,
        candidates: localCandidates,
      }),
    });
    const { answer, candidates } = await response.json();
    // Step 7. Set remote description with Answer from server
    await peer.setRemoteDescription(answer);
    // Step 8. Add ICE candidates from server
    for (let candidate of candidates) {
      await peer.addIceCandidate(candidate);
    }
  };
  // Step 2. Create new Data channel
  const dataChannel = peer.createDataChannel("host-server");
  dataChannel.onopen = (event) => {
    dataChannel.send("Hello from client!");
  };
  dataChannel.onclose = (event) => {
    console.log("Data channel closed");
  };
  dataChannel.onmessage = (event) => {
    console.log("Data channel message:", event.data);
  };
  // Step 3. Create Offer
  const offer = await peer.createOffer();
  // Step 4. Set local description with Offer from step 3
  await peer.setLocalDescription(offer);
  return peer;
}

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
};
// Add turn server to `configuration.iceServers` if needed.
// See more at https://www.twilio.com/docs/stun-turn

createPeer(configuration);
