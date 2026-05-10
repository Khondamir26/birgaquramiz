import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api/client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket) return _socket;

  _socket = io(`${getApiBaseUrl()}/tracking`, {
    withCredentials: true,
    transports:      ["websocket"],
    reconnection:    false, // useTrackingSocket manages reconnection with backoff
    autoConnect:     true,
  });

  return _socket;
}

export function disconnectSocket(): void {
  _socket?.removeAllListeners();
  _socket?.disconnect();
  _socket = null;
}
