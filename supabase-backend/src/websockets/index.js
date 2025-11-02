const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');

const connections = {
  streams: {},
  tournaments: {},
  notifications: {}
};

function setupWebSockets(io) {
  // Namespace for stream updates
  const streamNamespace = io.of('/ws/streams');
  
  streamNamespace.on('connection', (socket) => {
    const streamId = socket.handshake.query.stream_id;
    
    if (!connections.streams[streamId]) {
      connections.streams[streamId] = new Set();
    }
    connections.streams[streamId].add(socket.id);
    
    console.log(`User connected to stream ${streamId}`);
    
    socket.on('disconnect', () => {
      if (connections.streams[streamId]) {
        connections.streams[streamId].delete(socket.id);
        if (connections.streams[streamId].size === 0) {
          delete connections.streams[streamId];
        }
      }
    });
  });
  
  // Namespace for tournament updates
  const tournamentNamespace = io.of('/ws/tournaments');
  
  tournamentNamespace.on('connection', (socket) => {
    const tournamentId = socket.handshake.query.tournament_id;
    
    if (!connections.tournaments[tournamentId]) {
      connections.tournaments[tournamentId] = new Set();
    }
    connections.tournaments[tournamentId].add(socket.id);
    
    console.log(`User connected to tournament ${tournamentId}`);
    
    socket.on('disconnect', () => {
      if (connections.tournaments[tournamentId]) {
        connections.tournaments[tournamentId].delete(socket.id);
        if (connections.tournaments[tournamentId].size === 0) {
          delete connections.tournaments[tournamentId];
        }
      }
    });
  });
  
  // Namespace for notifications
  const notificationNamespace = io.of('/ws/notifications');
  
  notificationNamespace.on('connection', async (socket) => {
    try {
      const token = socket.handshake.query.token;
      
      if (!token) {
        socket.emit('error', { message: 'No token provided' });
        socket.disconnect();
        return;
      }
      
      const decoded = verifyToken(token, false);
      
      if (!decoded) {
        socket.emit('error', { message: 'Invalid token' });
        socket.disconnect();
        return;
      }
      
      const userId = decoded.sub;
      
      if (!connections.notifications[userId]) {
        connections.notifications[userId] = new Set();
      }
      connections.notifications[userId].add(socket.id);
      
      console.log(`User ${userId} connected for notifications`);
      
      socket.on('disconnect', () => {
        if (connections.notifications[userId]) {
          connections.notifications[userId].delete(socket.id);
          if (connections.notifications[userId].size === 0) {
            delete connections.notifications[userId];
          }
        }
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      socket.disconnect();
    }
  });
  
  return connections;
}

function broadcastStreamUpdate(io, streamId, data) {
  const streamNamespace = io.of('/ws/streams');
  streamNamespace.emit(`stream_${streamId}`, data);
}

function broadcastTournamentUpdate(io, tournamentId, data) {
  const tournamentNamespace = io.of('/ws/tournaments');
  tournamentNamespace.emit(`tournament_${tournamentId}`, data);
}

function sendNotificationToUser(io, userId, data) {
  const notificationNamespace = io.of('/ws/notifications');
  notificationNamespace.emit(`user_${userId}`, data);
}

module.exports = {
  setupWebSockets,
  broadcastStreamUpdate,
  broadcastTournamentUpdate,
  sendNotificationToUser
};

