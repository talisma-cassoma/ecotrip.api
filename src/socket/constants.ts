export const constants = {
  event: {
    // 🔹 Conexão
    USER_CONNECTED: 'userConnection',
    USER_DISCONNECTED: 'userDisconnection',

    //Entrada / saída de salas
    JOIN_ROOM: 'joinRoom',
    
    LOBBY_UPDATED: 'lobbyUpdated',
    
    //Atualizações específicas de trip rooms
    SELECT_DRIVER:'selectDriver',
    LEAVE_ROOM: 'leaveRoom',        // novo — quando alguém sai manualmente
  
  }
}
