import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

function App() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [remoteIds, setRemoteIds] = useState([]);
  const [calls, setCalls] = useState([]); // active calls
  const [incomingCalls, setIncomingCalls] = useState([]); // pending incoming
  const [callDuration, setCallDuration] = useState(0);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const p = new Peer();
    setPeer(p);

    p.on("open", (id) => {
      setMyId(id);
      console.log("My Peer ID:", id);
    });

    // Listen for incoming calls
    p.on("call", (call) => {
      // Add to incoming calls list
      setIncomingCalls((prev) => [...prev, call]);
    });

    return () => p.destroy();
  }, []);

  const acceptCall = (call) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      call.answer(stream); // answer the call
      setCalls((prev) => [...prev, call]); // store active call
      setIncomingCalls((prev) => prev.filter((c) => c !== call)); // remove from incoming
      call.on("stream", (remoteStream) => playAudio(remoteStream));
      call.on("close", () => handleCallEnded(call));

      // start timer if first call
      if (calls.length === 0) startTimer();
    });
  };

  const playAudio = (stream) => {
    const audioEl = document.createElement("audio");
    audioEl.srcObject = stream;
    audioEl.autoplay = true;
    audioEl.id = "remote-audio-" + Math.random();
    document.body.appendChild(audioEl);
  };

  const callPeer = (remoteId) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      const call = peer.call(remoteId, stream);
      setCalls((prev) => [...prev, call]);
      call.on("stream", (remoteStream) => playAudio(remoteStream));
      call.on("close", () => handleCallEnded(call));

      if (calls.length === 0) startTimer();
    });
  };

  const handleCallEnded = (call) => {
    setCalls((prev) => prev.filter((c) => c !== call));
    if (calls.length <= 1) stopTimer();
  };

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setCallDuration(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const endCalls = () => {
    calls.forEach((c) => c.close());
    setCalls([]);
    stopTimer();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
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

      {/* Incoming Calls */}
      {incomingCalls.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Incoming Calls:</h3>
          {incomingCalls.map((call, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              Call from <strong>{call.peer}</strong>
              <button
                onClick={() => acceptCall(call)}
                style={{ marginLeft: 10 }}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* End Call & Duration */}
      {calls.length > 0 && (
        <>
          <button
            onClick={endCalls}
            style={{
              marginTop: 10,
              background: "red",
              color: "#fff",
              padding: "5px 12px",
            }}
          >
            End Call
          </button>
          <span style={{ marginLeft: 20, fontWeight: "bold" }}>
            Duration: {formatTime(callDuration)}
          </span>
        </>
      )}
    </div>
  );
}

export default App;
