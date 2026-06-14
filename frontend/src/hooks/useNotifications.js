import { useEffect, useRef, useCallback } from "react";

const playMessageSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, startTime, duration) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    play(880, now,        0.12);
    play(660, now + 0.13, 0.18);
  } catch (_) {}
};

export const useNotifications = ({ currentUserId, activeChatRef, onToast }) => {
  const permissionAsked = useRef(false);

  useEffect(() => {
    if (permissionAsked.current) return;
    permissionAsked.current = true;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handlePushNotification = useCallback((data) => {
    const { title, body, chatId, senderId, isGroup, groupId } = data;
    if (senderId === currentUserId) return;

    const active = activeChatRef.current;
    const activeIsThisChat = active && (
      isGroup
        ? active._id === groupId
        : [active._id, currentUserId].sort().join("_") === chatId
    );

    playMessageSound();

    if (!activeIsThisChat) {
      onToast({ title, body, chatId, isGroup, groupId });
    }

    if (!activeIsThisChat && "Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, icon: "/chat-icon.png", silent: true });
    }
  }, [currentUserId, activeChatRef, onToast]);

  return { handlePushNotification };
};
