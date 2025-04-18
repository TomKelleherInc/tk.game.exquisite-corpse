'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';

interface GamePageProps {
  params: { id: string };
}

export default function GamePage({ params }: GamePageProps) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_ENDPOINT!);

    socket.on('connect', () => {
      console.log('Connected to WS as', socket.id);
      // you can also emit: socket.emit('joinGame', params.id)
    });

    // Example listener
    socket.on('panelClaimed', (data) => {
      console.log('Panel claimed:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [params.id]);

  return (
    <div>
      <h1>Exquisite Corpse Game</h1>
      <p>Game ID: {params.id}</p>
      {/* TODO: render canvas & claim/submit UI */}
    </div>
  );
}
