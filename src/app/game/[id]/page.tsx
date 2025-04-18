// src/app/game/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';

interface PanelInfo {
  panelNumber: number;
  claimedBy: string;
  status: 'claimed' | 'submitted';
}

export default function GamePage() {
  const { id: gameId } = useParams();    // <-- gets the [id] param
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [panel, setPanel] = useState<PanelInfo | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!gameId) return;
    const sock = io('/api/socket');
    setSocket(sock);
    sock.on('panelClaimed', (data: any) => {
      if (data.gameId === gameId) {
        alert(`${data.claimedBy} claimed panel ${data.panelNumber}`);
      }
    });
    sock.on('panelSubmitted', (data: any) => {
      if (data.gameId === gameId) {
        alert(`${data.claimedBy} submitted panel ${data.panelNumber}`);
      }
    });
    return () => { sock.disconnect(); };
  }, [gameId]);

  const joinGame = async () => {
    const res = await fetch(`/api/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const json = await res.json();
      setPlayers(json.players);
      setJoined(true);
    } else {
      alert('Join failed');
    }
  };

  const claimPanel = async () => {
    const res = await fetch(`/api/games/${gameId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const { panel } = await res.json();
      setPanel(panel);
    } else {
      alert('Claim failed');
    }
  };

  useEffect(() => {
    if (panel && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 1000, 800);
    }
  }, [panel]);

  if (!gameId) return <p>Loading game…</p>;

  if (!joined) {
    return (
      <div>
        <h1>Join Game {gameId}</h1>
        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={joinGame} disabled={!name}>Join</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Game {gameId}</h1>
      <p>Players: {players.join(', ')}</p>

      {!panel && (
        <button onClick={claimPanel}>Claim Next Panel</button>
      )}

      {panel && panel.status === 'claimed' && (
        <div>
          <h2>You’re drawing panel {panel.panelNumber}</h2>
          <canvas
            ref={canvasRef}
            width={1000}
            height={800}
            style={{ border: '1px solid #333' }}
          />
          <button onClick={() => alert('Submit flow next')}>Submit Panel</button>
        </div>
      )}
    </div>
  );
}
