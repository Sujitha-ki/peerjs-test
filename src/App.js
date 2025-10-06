import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

function App() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [remoteIds, setRemoteIds] = useState([]);
  const localStreamRef = useRef(null);

  useEffect(() => {
    // Create Peer
    const p = new Peer();
    setPeer(p);

    p.on("open", (id) => {
      console.log("My Peer ID:", id);
      setMyId(id);
    });

    // Listen for incoming calls
    p.on("call", (call) => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        localStreamRef.current = stream;
        call.answer(stream); // answer call with local audio
        call.on("stream", (remoteStream) => playAudio(remoteStream));
      });
    });

    return () => p.destroy();
  }, []);

  // Play remote audio
  const playAudio = (stream) => {
    const audioEl = document.createElement("audio");
    audioEl.srcObject = stream;
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);
  };

  // Start call to a remote peer
  const callPeer = (remoteId) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      const call = peer.call(remoteId, stream);
      call.on("stream", (remoteStream) => playAudio(remoteStream));
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>WebRTC Audio Call App</h2>
      <p>
        Your ID: <strong>{myId}</strong>
      </p>

      <input
        type="text"
        placeholder="Remote Peer ID"
        value={remoteIds.join(",")}
        onChange={(e) => setRemoteIds(e.target.value.split(","))}
        style={{ width: 300 }}
      />
      <button
        onClick={() => remoteIds.forEach((id) => callPeer(id))}
        style={{ marginLeft: 10 }}
      >
        Call
      </button>
    </div>
  );
}

export default App;
