import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

function App() {
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [remoteIds, setRemoteIds] = useState([]);
  const [calls, setCalls] = useState([]); // active calls
  const [incomingCalls, setIncomingCalls] = useState([]); // pending incoming
  const [callDuration, setCallDuration] = useState(0);
  const [callLogs, setCallLogs] = useState(
    JSON.parse(localStorage.getItem("callLogs")) || []
  );

  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const callStartTimeRef = useRef(null);

  useEffect(() => {
    const p = new Peer();
    setPeer(p);

    p.on("open", (id) => setMyId(id));

    // Listen for incoming calls
    p.on("call", (call) => {
      setIncomingCalls((prev) => [...prev, call]);
    });

    return () => p.destroy();
  }, []);

  // Accept incoming call
  const acceptCall = (call) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      call.answer(stream);
      setCalls((prev) => [...prev, call]);
      setIncomingCalls((prev) => prev.filter((c) => c !== call));

      call.on("stream", (remoteStream) => playAudio(remoteStream));
      call.on("close", () => handleCallEnded(call));

      if (calls.length === 0) startTimer();
      callStartTimeRef.current = Date.now();
    });
  };

  // Start outgoing call
  const callPeer = (remoteId) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      localStreamRef.current = stream;
      const call = peer.call(remoteId, stream);

      setCalls((prev) => [...prev, call]);
      call.on("stream", (remoteStream) => playAudio(remoteStream));
      call.on("close", () => handleCallEnded(call));

      if (calls.length === 0) startTimer();
      callStartTimeRef.current = Date.now();
    });
  };

  const playAudio = (stream) => {
    const audioEl = document.createElement("audio");
    audioEl.srcObject = stream;
    audioEl.autoplay = true;
    audioEl.id = "remote-audio-" + Math.random();
    document.body.appendChild(audioEl);
  };

  const handleCallEnded = (call) => {
    const endTime = Date.now();
    const duration = callStartTimeRef.current
      ? Math.floor((endTime - callStartTimeRef.current) / 1000)
      : 0;

    const newLog = {
      peerId: call.peer,
      duration,
      time: new Date().toLocaleString(),
    };
    const updatedLogs = [newLog, ...callLogs];
    setCallLogs(updatedLogs);
    localStorage.setItem("callLogs", JSON.stringify(updatedLogs));

    setCalls((prev) => prev.filter((c) => c !== call));
    if (calls.length === 1) stopTimer(); // stop timer if last call ended
    callStartTimeRef.current = null;
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 20,
        }}
      >
        <p>
          Your ID: <strong>{myId}</strong>
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(myId)}
          style={{ marginLeft: 10 }}
        >
          Copy My ID
        </button>
      </div>

      <input
        type="text"
        placeholder="Remote Peer IDs (comma-separated)"
        value={remoteIds.join(",")}
        onChange={(e) => setRemoteIds(e.target.value.split(","))}
        style={{ width: 300 }}
      />
      <button
        onClick={() => remoteIds.forEach(callPeer)}
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
        <div style={{ marginTop: 10 }}>
          <button
            onClick={endCalls}
            style={{ background: "red", color: "#fff", padding: "5px 12px" }}
          >
            End Call
          </button>
          <span style={{ marginLeft: 20, fontWeight: "bold" }}>
            Duration: {formatTime(callDuration)}
          </span>
        </div>
      )}

      {/* Call Logs */}
      <div style={{ marginTop: 20 }}>
        <h3>Call Logs</h3>
        {callLogs.length === 0 ? (
          <p>No calls yet.</p>
        ) : (
          <ul>
            {callLogs.map((log, idx) => (
              <li key={idx}>
                Peer: {log.peerId} | Duration: {log.duration}s | Time:{" "}
                {log.time}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
