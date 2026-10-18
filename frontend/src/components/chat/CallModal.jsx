import { useEffect, useRef, useState } from "react";
import "./call.css";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Volume2, VolumeX,
} from "lucide-react";


const CallModal = ({
  callType,
  callActive,
  remoteUser,
  localStream,
  remoteStream,
  audioMuted,
  videoOff,
  onToggleMute,
  onToggleVideo,
  onHangUp,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);


  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);


  useEffect(() => {
    if (callType === "video") {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    } else {
      if (remoteAudioRef.current && remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType]);


  useEffect(() => {
    if (!callActive) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callActive]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const initial = remoteUser?.name?.[0]?.toUpperCase() || "?";

  const toggleSpeaker = () => {
    const el = callType === "video" ? remoteVideoRef.current : remoteAudioRef.current;
    if (el) el.muted = !el.muted;
    setSpeakerMuted((v) => !v);
  };

  return (
    <div
      className={`call-modal-overlay ${callType === "video" ? "video-call" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Active call"
    >


      {callType === "voice" && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          muted={speakerMuted}
          id="remote-audio"
          style={{ display: "none" }}
        />
      )}


      {callType === "video" && remoteStream ? (
        <video
          ref={remoteVideoRef}
          className="call-remote-video"
          autoPlay
          playsInline
          muted={speakerMuted}
          id="remote-video"
        />
      ) : (
        <div className="call-remote-placeholder">
          {callType !== "video" && (
            <div className="call-center-avatar">
              <div className="call-center-avatar-img">
                {remoteUser?.photoURL
                  ? <img src={remoteUser.photoURL} alt={remoteUser.name} />
                  : initial
                }
              </div>
              <p className="call-center-name">{remoteUser?.name}</p>
              {callActive ? (
                <div className={`call-sound-wave ${audioMuted ? "paused" : ""}`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="call-sound-wave-bar" />
                  ))}
                </div>
              ) : (
                <p className="call-center-status">
                  Connecting
                  <span className="connecting-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}


      {callType === "video" && (
        <div className="call-local-video-wrap" id="local-video-pip">
          {localStream && !videoOff ? (
            <video
              ref={localVideoRef}
              className="call-local-video"
              autoPlay
              playsInline
              muted
              id="local-video"
            />
          ) : (
            <div className="call-local-placeholder">{initial}</div>
          )}
        </div>
      )}


      <div className="call-header">
        <div className="call-header-info">
          <p className="call-header-name">{remoteUser?.name}</p>
          {callActive ? (
            <p className="call-header-status active">
              {callType === "video" ? "📹" : "🎙️"} {formatTime(elapsed)}
            </p>
          ) : (
            <p className="call-header-status connecting">
              Connecting
              <span className="connecting-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </p>
          )}
        </div>
        {callActive && (
          <span className="call-timer">{formatTime(elapsed)}</span>
        )}
      </div>


      {callType === "video" && !remoteStream && (
        <div className="call-center-avatar">
          <div className="call-center-avatar-img">
            {remoteUser?.photoURL
              ? <img src={remoteUser.photoURL} alt={remoteUser.name} />
              : initial
            }
          </div>
          <p className="call-center-name">{remoteUser?.name}</p>
          <p className="call-center-status">
            Connecting
            <span className="connecting-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </p>
        </div>
      )}


      <div className="call-controls">


        <button
          className="ctrl-btn"
          onClick={onToggleMute}
          id="call-toggle-mute"
          aria-label={audioMuted ? "Unmute" : "Mute"}
        >
          <div className={`ctrl-btn-circle ${audioMuted ? "active" : ""}`}>
            {audioMuted ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
          </div>
          <span className="ctrl-btn-label">{audioMuted ? "Unmute" : "Mute"}</span>
        </button>


        {callType === "video" && (
          <button
            className="ctrl-btn"
            onClick={onToggleVideo}
            id="call-toggle-video"
            aria-label={videoOff ? "Turn on camera" : "Turn off camera"}
          >
            <div className={`ctrl-btn-circle ${videoOff ? "active" : ""}`}>
              {videoOff ? <VideoOff size={22} color="#fff" /> : <Video size={22} color="#fff" />}
            </div>
            <span className="ctrl-btn-label">{videoOff ? "Show cam" : "Hide cam"}</span>
          </button>
        )}


        <button
          className="ctrl-btn"
          onClick={toggleSpeaker}
          id="call-toggle-speaker"
          aria-label={speakerMuted ? "Unmute speaker" : "Mute speaker"}
        >
          <div className={`ctrl-btn-circle ${speakerMuted ? "active" : ""}`}>
            {speakerMuted ? <VolumeX size={22} color="#fff" /> : <Volume2 size={22} color="#fff" />}
          </div>
          <span className="ctrl-btn-label">Speaker</span>
        </button>


        <button
          className="ctrl-btn"
          onClick={onHangUp}
          id="call-hang-up"
          aria-label="End call"
        >
          <div className="ctrl-btn-circle danger">
            <PhoneOff size={26} color="#fff" />
          </div>
          <span className="ctrl-btn-label">End</span>
        </button>
      </div>
    </div>
  );
};

export default CallModal;
