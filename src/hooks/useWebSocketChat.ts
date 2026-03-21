import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useWebSocketChat = () => {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const connect = async () => {
      try {
        const token = await user.getIdToken();
        // Use wss:// for https, ws:// for http
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/api/chat?token=${token}`;

        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WS Connected');
          if (wsRef.current === ws) {
            setIsConnected(true);
            setError(null);
          }
        };

        ws.onclose = (event) => {
          console.log('WS Closed', event.code, event.reason);
          if (wsRef.current === ws) {
            setIsConnected(false);
          }
        };

        ws.onerror = (err) => {
          console.error('WS Error', err);
          if (wsRef.current === ws) {
            setError('Connection error');
          }
        };

        wsRef.current = ws;
      } catch (e) {
        console.error('WS Setup Error', e);
        setError('Failed to setup connection');
      }
    };

    connect().catch(err => {
      console.error('Failed to connect to WebSocket:', err);
      setError('Connection failed');
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.uid]);

  const sendMessage = useCallback((data: any, onChunk: (text: string) => void, onDone: () => void, onError: (err: string) => void, onMeta?: (data: any) => void) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      onError('WebSocket not connected');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const response = JSON.parse(event.data);
        
        if (response.type === 'chunk') {
          onChunk(response.text);
        } else if (response.type === 'done') {
          wsRef.current?.removeEventListener('message', handleMessage);
          onDone();
        } else if (response.type === 'error') {
          wsRef.current?.removeEventListener('message', handleMessage);
          onError(response.error);
        } else if (response.type === 'meta') {
           if (onMeta) onMeta(response);
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    wsRef.current.addEventListener('message', handleMessage);
    try {
      wsRef.current.send(JSON.stringify(data));
    } catch (e) {
      console.error('Error sending WS message', e);
      onError('Failed to send message');
    }
  }, []);

  return { isConnected, sendMessage, error };
};
