import "./call.css";
import { Phone, PhoneOff, Video } from "lucide-react";


const IncomingCallModal = ({ caller, callType, onAccept, onReject }) => {
  if (!caller) return null;

  const initial = caller.callerName?.[0]?.toUpperCase() || "?";

  return (
    <div className="incoming-call-overlay" role="dialog" aria-modal="true">
      <div className="incoming-call-card">


        <div className="call-avatar-ring">
          <div className="call-avatar-pulse-2" />
          <div className="call-avatar-pulse" />
          <div className="call-avatar">
            {caller.callerPhoto
              ? <img src={caller.callerPhoto} alt={caller.callerName} />
              : initial
            }
          </div>
        </div>


        <div className="call-label">
          {callType === "video"
            ? <><Video size={12} /> Incoming video call</>
            : <><Phone size={12} /> Incoming voice call</>
          }
        </div>

        <p className="call-name">{caller.callerName}</p>


        <div className="incoming-call-actions">
          <button className="call-btn" onClick={onReject} id="call-reject-btn" aria-label="Reject call">
            <div className="call-btn-circle reject">
              <PhoneOff size={24} color="#fff" />
            </div>
            <span className="call-btn-label">Decline</span>
          </button>

          <button className="call-btn" onClick={onAccept} id="call-accept-btn" aria-label="Accept call">
            <div className="call-btn-circle accept">
              {callType === "video"
                ? <Video size={24} color="#fff" />
                : <Phone size={24} color="#fff" />
              }
            </div>
            <span className="call-btn-label">Accept</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default IncomingCallModal;
