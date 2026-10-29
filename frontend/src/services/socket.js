import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('campusbite_token');
    const rawApi = (import.meta.env.VITE_API_URL || '').trim().replace(/\/api\/?$/, '');
    const socketOrigin = import.meta.env.VITE_SOCKET_URL || rawApi || window.location.origin;

    socket = io(socketOrigin, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to CampusBite real-time server with ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }
  return socket;
};

export const updateSocketAuth = (token) => {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
};

export const joinOwnerRoom = () => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_owner_room');
  } else if (s) {
    s.once('connect', () => {
      s.emit('join_owner_room');
    });
  }
};

export const joinStudentRoom = (userId) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_student_room', { userId });
  } else if (s) {
    s.once('connect', () => {
      s.emit('join_student_room', { userId });
    });
  }
};

export const joinOrderRoom = (orderId) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_order_room', { orderId });
  } else if (s) {
    s.once('connect', () => {
      s.emit('join_order_room', { orderId });
    });
  }
};

export const leaveOrderRoom = (orderId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave_order_room', { orderId });
  }
};
