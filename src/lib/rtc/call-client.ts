import { io, type Socket } from 'socket.io-client';

/** Control type the engine attaches to an actionable chat message. */
export const CALL_CONTROL_TYPE = 'call.connect';

/** Actionable control carried by a chat message (`control` on the payload). */
export type ChatControl = {
  type: string;
  callId: string;
};

export type CallAuth = {
  token?: string | null;
  phone?: string;
  guest?: boolean;
};

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'connecting-peer'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'error';

export type CallState = {
  status: CallStatus;
  callId: string | null;
  error: string | null;
  muted: boolean;
  cameraOff: boolean;
  peerPresent: boolean;
  /** Effective mode: true when the call runs on voice only. */
  audioOnly: boolean;
  /** When this client joined the room (ms epoch); null until joined. */
  joinedAt: number | null;
  /** When the other participant joined — i.e. the call started (ms epoch). */
  peerJoinedAt: number | null;
};

export type CallStreams = {
  local: MediaStream | null;
  remote: MediaStream | null;
};

export const IDLE_CALL: CallState = {
  status: 'idle',
  callId: null,
  error: null,
  muted: false,
  cameraOff: false,
  peerPresent: false,
  audioOnly: false,
  joinedAt: null,
  peerJoinedAt: null,
};

/** How long a vanished peer gets to rejoin before the call is ended. */
const PEER_LEFT_GRACE_MS = 5000;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type CallClientOptions = {
  socketUrl: string;
  auth: CallAuth;
  onChange: (state: CallState, streams: CallStreams) => void;
};

function mediaErrorMessage(error: unknown, audioOnly = false): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return audioOnly
      ? 'Microphone access was blocked. Allow it in the browser, then try again.'
      : 'Camera and microphone access was blocked. Allow it in the browser, then try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return audioOnly
      ? 'No microphone was found on this device.'
      : 'No camera or microphone was found on this device.';
  }
  if (name === 'NotReadableError') {
    return audioOnly
      ? 'The microphone is already in use by another app.'
      : 'The camera or microphone is already in use by another app.';
  }
  return audioOnly ? 'Could not open the microphone.' : 'Could not open the camera and microphone.';
}

/**
 * Browser WebRTC client for a 1:1 consultation.
 *
 * Signalling lives on the engine's `/calls` namespace; media is peer-to-peer.
 * The participant already in the room creates the offer (`call.peer.joined`),
 * the newcomer answers, so the two clients never produce competing offers.
 *
 * Works both behind a chat control and as a standalone button: construct it,
 * call `start(callId)`, and render the streams it reports.
 */
export class CallClient {
  private socket: Socket | null = null;
  private peer: RTCPeerConnection | null = null;
  private local: MediaStream | null = null;
  private remote: MediaStream | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];
  private hasRemoteDescription = false;
  private disposed = false;
  private state: CallState = IDLE_CALL;
  private hasConnected = false;
  /** Whether we created the current offer (only that side re-offers). */
  private offerer = false;
  private peerLeftTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: CallClientOptions) {}

  get callId(): string | null {
    return this.state.callId;
  }

  async start(callId: string, options: { audioOnly?: boolean } = {}): Promise<void> {
    this.dispose();
    this.disposed = false;
    this.pendingIce = [];
    this.hasRemoteDescription = false;
    this.local = null;
    this.remote = null;
    this.hasConnected = false;
    this.offerer = false;
    this.clearPeerLeftTimer();
    const wantsAudioOnly = options.audioOnly === true;
    this.patch({
      ...IDLE_CALL,
      status: 'connecting',
      callId,
      audioOnly: wantsAudioOnly,
    });
    this.emitStreams();

    if (!navigator.mediaDevices?.getUserMedia) {
      this.patch({
        status: 'error',
        error: 'Camera access needs HTTPS or localhost in this browser.',
      });
      return;
    }

    let local: MediaStream | null = null;
    let audioOnly = wantsAudioOnly;
    try {
      local = await navigator.mediaDevices.getUserMedia(
        audioOnly
          ? { audio: true }
          : {
              audio: true,
              video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            }
      );
    } catch (error) {
      if (audioOnly) {
        this.patch({ status: 'error', error: mediaErrorMessage(error, true) });
        return;
      }
      // No usable camera (missing, busy or blocked): a consultation can still
      // happen over voice, so retry with the microphone only.
      try {
        local = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioOnly = true;
      } catch (audioError) {
        this.patch({
          status: 'error',
          error: mediaErrorMessage(audioError, true),
        });
        return;
      }
    }
    const stream = local;
    if (!stream) {
      this.patch({ status: 'error', error: mediaErrorMessage(undefined, audioOnly) });
      return;
    }
    if (this.disposed) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    this.local = stream;
    this.patch({ audioOnly });
    this.emitStreams();

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peer = peer;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      const candidate = event.candidate;
      if (!candidate) return;
      this.socket?.emit('call.ice', {
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        candidate: candidate.candidate,
      });
    };

    peer.ontrack = (event) => {
      this.remote = event.streams[0] ?? new MediaStream([event.track]);
      this.emitStreams();
      this.patch({
        status: 'connected',
        peerPresent: true,
        error: null,
        joinedAt: this.state.joinedAt ?? Date.now(),
        peerJoinedAt: this.state.peerJoinedAt ?? Date.now(),
      });
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        this.patch({
          status: 'connected',
          peerPresent: true,
          error: null,
          joinedAt: this.state.joinedAt ?? Date.now(),
          peerJoinedAt: this.state.peerJoinedAt ?? Date.now(),
        });
      } else if (peer.connectionState === 'disconnected') {
        this.patch({ status: 'reconnecting' });
      } else if (peer.connectionState === 'failed') {
        try {
          peer.restartIce();
        } catch {
          /* older browsers — the next offer still renegotiates */
        }
        // Only the offerer re-offers, so the two sides cannot glare.
        if (this.offerer) void this.sendOffer();
        else this.patch({ status: 'reconnecting' });
      }
    };

    const socket = io(`${this.options.socketUrl}/calls`, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      auth: {
        token: this.options.auth.token ?? undefined,
        phone: this.options.auth.phone,
        guest: this.options.auth.guest ?? false,
      },
    });
    this.socket = socket;

    socket.on('connect', () => {
      const reconnected = this.hasConnected;
      this.hasConnected = true;
      // Room membership is not restored by socket.io: always rejoin.
      socket.emit('call.join', { callId });
      if (reconnected && this.isLive()) {
        this.patch({ status: 'reconnecting' });
        try {
          // Media is peer-to-peer; an ICE restart lets the existing
          // connection recover without tearing the call down.
          this.peer?.restartIce();
        } catch {
          /* the next offer still renegotiates */
        }
      }
    });
    socket.on('connect_error', () => {
      if (this.disposed) return;
      if (this.isLive()) {
        // Transient: socket.io keeps retrying, so don't kill the call.
        this.patch({ status: 'reconnecting' });
      } else {
        this.patch({ status: 'error', error: 'Could not reach the call server.' });
      }
    });
    socket.on('disconnect', () => {
      if (this.disposed) return;
      // A dropped socket is not a dropped call: wait for the rejoin.
      if (this.isLive()) this.patch({ status: 'reconnecting' });
    });
    // Manager-level event: socket.io gives up after its retry budget.
    socket.io.on('reconnect_failed', () => {
      if (this.disposed) return;
      if (!this.isLive()) return;
      this.patch({
        status: 'error',
        error: 'The call connection was lost.',
      });
      this.release();
    });

    socket.on('call.joined', (payload: { peers?: unknown[] }) => {
      if (this.disposed) return;
      this.clearPeerLeftTimer();
      const peers = Array.isArray(payload?.peers) ? payload.peers.length : 0;
      const hadPeer = this.state.peerPresent;
      const joinedAt = this.state.joinedAt ?? Date.now();
      if (peers > 0) {
        this.patch({
          status: 'connecting-peer',
          peerPresent: true,
          joinedAt,
          peerJoinedAt: this.state.peerJoinedAt ?? Date.now(),
        });
        try {
          this.peer?.restartIce();
        } catch {
          /* the peer's offer still renegotiates */
        }
        return;
      }
      this.patch({ status: 'waiting', peerPresent: false, joinedAt });
      // We had a peer before this (re)join: give them time to rejoin too.
      if (hadPeer) this.startPeerLeftGrace();
    });

    socket.on('call.peer.joined', () => {
      if (this.disposed) return;
      this.clearPeerLeftTimer();
      this.patch({
        status: 'connecting-peer',
        peerPresent: true,
        joinedAt: this.state.joinedAt ?? Date.now(),
        peerJoinedAt: this.state.peerJoinedAt ?? Date.now(),
      });
      void this.sendOffer();
    });

    socket.on('call.offer', (payload: { sdp?: string }) => {
      void this.acceptOffer(payload?.sdp);
    });
    socket.on('call.answer', (payload: { sdp?: string }) => {
      void this.acceptAnswer(payload?.sdp);
    });
    socket.on('call.ice', (payload: RTCIceCandidateInit) => {
      void this.addIceCandidate(payload);
    });

    socket.on('call.peer.left', () => {
      if (this.disposed) return;
      if (!this.isLive()) return;
      // The peer may just be reconnecting: hold the call briefly and only end
      // it if they never rejoin.
      this.startPeerLeftGrace();
    });
    socket.on('call.full', () => {
      if (this.disposed) return;
      this.patch({
        status: 'error',
        error: 'This consultation already has two participants.',
      });
      this.release();
    });
    socket.on('call.replaced', () => {
      if (this.disposed) return;
      this.patch({
        status: 'ended',
        error: 'The call was opened on another device.',
      });
      this.release();
    });
  }

  /** Hang up but keep the final state (so the UI can show why it ended). */
  leave(): void {
    if (!this.disposed) this.socket?.emit('call.leave');
    this.patch({ status: 'ended', peerPresent: false });
    this.release();
  }

  /** Release media and signalling without reporting a new state. */
  dispose(): void {
    this.socket?.emit('call.leave');
    this.release();
  }

  toggleMute(): void {
    if (!this.local) return;
    const muted = !this.state.muted;
    this.local.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    this.patch({ muted });
  }

  toggleCamera(): void {
    if (!this.local || this.local.getVideoTracks().length === 0) return;
    const cameraOff = !this.state.cameraOff;
    this.local.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOff;
    });
    this.patch({ cameraOff });
  }

  private async sendOffer(): Promise<void> {
    const peer = this.peer;
    const socket = this.socket;
    if (!peer || !socket) return;
    this.offerer = true;
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('call.offer', { sdp: offer.sdp });
    } catch {
      this.patch({ status: 'error', error: 'Could not start the call.' });
    }
  }

  private async acceptOffer(sdp?: string): Promise<void> {
    const peer = this.peer;
    const socket = this.socket;
    if (!peer || !socket || !sdp) return;
    this.offerer = false;
    try {
      await peer.setRemoteDescription({ type: 'offer', sdp });
      this.hasRemoteDescription = true;
      await this.flushIce();
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('call.answer', { sdp: answer.sdp });
      this.patch({ status: 'connecting-peer', peerPresent: true });
    } catch {
      this.patch({ status: 'error', error: 'Could not answer the call.' });
    }
  }

  private async acceptAnswer(sdp?: string): Promise<void> {
    const peer = this.peer;
    if (!peer || !sdp) return;
    try {
      await peer.setRemoteDescription({ type: 'answer', sdp });
      this.hasRemoteDescription = true;
      await this.flushIce();
    } catch {
      this.patch({ status: 'error', error: 'Could not connect the call.' });
    }
  }

  private async addIceCandidate(candidate: RTCIceCandidateInit | undefined): Promise<void> {
    if (!candidate?.candidate) return;
    const peer = this.peer;
    if (!peer) return;
    if (!this.hasRemoteDescription) {
      this.pendingIce.push(candidate);
      return;
    }
    try {
      await peer.addIceCandidate(candidate);
    } catch {
      /* stale candidate — safe to ignore */
    }
  }

  private async flushIce(): Promise<void> {
    const peer = this.peer;
    if (!peer) return;
    const pending = this.pendingIce;
    this.pendingIce = [];
    for (const candidate of pending) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        /* stale candidate — safe to ignore */
      }
    }
  }

  private isLive(): boolean {
    const status = this.state.status;
    return (
      status === 'connecting' ||
      status === 'waiting' ||
      status === 'connecting-peer' ||
      status === 'connected' ||
      status === 'reconnecting'
    );
  }

  private clearPeerLeftTimer(): void {
    if (this.peerLeftTimer !== null) {
      clearTimeout(this.peerLeftTimer);
      this.peerLeftTimer = null;
    }
  }

  private startPeerLeftGrace(): void {
    this.clearPeerLeftTimer();
    this.patch({ status: 'reconnecting' });
    this.peerLeftTimer = setTimeout(() => {
      this.peerLeftTimer = null;
      if (this.disposed) return;
      this.patch({
        status: 'ended',
        peerPresent: false,
        error: 'The other participant left the call.',
      });
      this.release();
    }, PEER_LEFT_GRACE_MS);
  }

  private release(): void {
    this.clearPeerLeftTimer();
    this.disposed = true;
    this.local?.getTracks().forEach((track) => track.stop());
    this.local = null;
    this.remote = null;
    this.peer?.close();
    this.peer = null;
    this.pendingIce = [];
    this.hasRemoteDescription = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.emitStreams();
  }

  private patch(next: Partial<CallState>): void {
    this.state = { ...this.state, ...next };
    this.options.onChange(this.state, { local: this.local, remote: this.remote });
  }

  private emitStreams(): void {
    this.options.onChange(this.state, { local: this.local, remote: this.remote });
  }
}
