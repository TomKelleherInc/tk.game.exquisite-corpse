// src/app/game/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import type { Canvas as FabricCanvas  } from 'fabric';      // <-- TYPE IMPORT
//import fabric from 'fabric';

const [prevImage, setPrevImage] = useState<string | null>(null);


interface PanelInfo {
  panelNumber: number;
  claimedBy: string;
  status: 'claimed' | 'submitted';
}

export default function GamePage() {
  const { id: gameId } = useParams();           // Grab the dynamic [id] from URL
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [panel, setPanel] = useState<PanelInfo | null>(null);
  const [socket, setSocket] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
    
  // Initialize Socket.io once gameId is available
  useEffect(() => {
    if (panel && canvasRef.current && !fabricRef.current) {
      import('fabric').then(({ Canvas, PencilBrush }) => {
        const canvasEl = canvasRef.current!;
  
        // 1) Instantiate the Canvas without drawing mode
        const fabricCanvas = new Canvas(canvasEl, { selection: false });
  
        // 2) Set dimensions
        fabricCanvas.setDimensions({ width: 1000, height: 800 });
  
        // 3) White background
        fabricCanvas.set('backgroundColor', '#ffffff');
        fabricCanvas.requestRenderAll();
  
        // 4) Create & assign a new PencilBrush
        const brush = new PencilBrush(fabricCanvas);
        brush.width = 5;
        brush.color = '#1F48EA';
        fabricCanvas.freeDrawingBrush = brush;
  
        // 5) Enable drawing mode
        fabricCanvas.isDrawingMode = true;
  
        // 6) Save for later
        fabricRef.current = fabricCanvas;
      });
    }
  }, [panel]);
          
  // Join Game
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

  // Claim Panel
  const claimPanel = async () => {
    // 1) Claim as before
    const res = await fetch(`/api/games/${gameId}/claim`, {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return alert('Claim failed');
    const { panel } = await res.json();
    setPanel(panel);

   // 2) If this is panel 2+, fetch the previous imageData
   if (panel.panelNumber > 1) {
     const stateRes = await fetch(`/api/games/${gameId}`);
     const stateJson = await stateRes.json();
     const prev = stateJson.panels.find((p:any) => p.panelNumber === panel.panelNumber-1);
     if (prev?.imageData) {
       // stash it so the drawing effect below can pick it up
       setPrevImage(prev.imageData as string);
     }
   }
  };


  // Submit Panel
  const submitPanel = async () => {
    if (!fabricRef.current) return;
    const dataUrl = fabricRef.current.toDataURL({ format: 'png', multiplier: 1 });
    await fetch(`/api/games/${gameId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, imageData: dataUrl }),
    });
    // …
  };
  
  if (!gameId) return <p>Loading game…</p>;

  if (!joined) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Join Game {gameId}</h1>
        <input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ marginRight: '1rem' }}
        />
        <button onClick={joinGame} disabled={!name}>Join</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Game {gameId}</h1>
      <p>Players: {players.join(', ')}</p>

      {!panel && (
        <button onClick={claimPanel}>Claim Next Panel</button>
      )}

      {panel && panel.status === 'claimed' && (
        <div style={{ marginTop: '2rem' }}>
          <h2>You’re drawing panel {panel.panelNumber}</h2>
          <canvas
            ref={canvasRef}
            style={{ border: '1px solid #333', display: 'block', marginBottom: '1rem' }}
          />
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Brush Width:
              <input
                type="range"
                min={1}
                max={50}
                defaultValue={5}
                onChange={e => {
                  if (fabricRef.current)
                    fabricRef.current.freeDrawingBrush.width = parseInt(e.target.value, 10);
                }}
                style={{ marginLeft: '0.5rem' }}
              />
            </label>
            <label style={{ marginLeft: '2rem' }}>
              Color:
              <input
                type="color"
                defaultValue="#1F48EA"
                onChange={e => {
                  if (fabricRef.current)
                    fabricRef.current.freeDrawingBrush.color = e.target.value;
                }}
                style={{ marginLeft: '0.5rem' }}
              />
            </label>
          </div>
          <button onClick={submitPanel}>Submit Panel</button>
        </div>
      )}

      {panel && panel.status === 'submitted' && (
        <p style={{ marginTop: '2rem' }}>
          🎉 You submitted panel {panel.panelNumber}. Waiting for others…
        </p>
      )}
    </div>
  );
}
