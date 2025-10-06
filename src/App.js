import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

function App() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [remoteIds, setRemoteIds] = useState([]);
  const [calls, setCalls] = useState([]); // store active call objects
  const localStreamRef = useRef(null);

  useEffect(() => {
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
        call.answer(stream);
        setCalls((prev) => [...prev, call]); // store call
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
    audioEl.id = "remote-audio-" + Math.random(); // unique id
    document.body.appendChild(audioEl);
  };

  // Start call to remote peers
  const callPeer = (remoteId) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      const call = peer.call(remoteId, stream);
      setCalls((prev) => [...prev, call]);
      call.on("stream", (remoteStream) => playAudio(remoteStream));
    });
  };

  // End all calls
  const endCalls = () => {
    // Close all PeerJS calls
    calls.forEach((c) => c.close());
    setCalls([]);

    // Stop local audio stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Remove all remote audio elements
    document
      .querySelectorAll("audio[id^='remote-audio-']")
      .forEach((el) => el.remove());
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>WebRTC Audio Call App</h2>
      <p>
        Your ID: <strong>{myId}</strong>
      </p>

      <input
        type="text"
        placeholder="Remote Peer IDs (comma-separated)"
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

      {calls.length > 0 && (
        <button
          onClick={endCalls}
          style={{
            marginLeft: 10,
            background: "red",
            color: "#fff",
            padding: "5px 12px",
          }}
        >
          End Call
        </button>
      )}
    </div>
  );
}

export default App;
