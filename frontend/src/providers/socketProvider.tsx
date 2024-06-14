/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useRef, useEffect, useState, FC } from 'react';
import { Socket, io } from 'socket.io-client';

interface SafeSocket {
    on: (event: string, callback: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
    off: (event: string, callback?: (...args: any[]) => void) => void;
}

const createSafeSocket = (socket: Socket | null): SafeSocket => ({
    on: (event, callback) => {
        if (socket) {
            socket.on(event, callback);
        }
    },
    emit: (event, ...args) => {
        if (socket) {
            socket.emit(event, ...args);
        }
    },
    off: (event, callback) => {
        if (socket) {
            socket.off(event, callback);
        }
    },
});

interface SocketContextData {
    socket: SafeSocket;
}

const SocketContext = createContext<SocketContextData>({ socket: createSafeSocket(null) });

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
    const [isConnected, setConnected] = useState(false);
    const socketUrl = 'http://localhost:3000';
    const socket = useRef<Socket | null>(null);

    const handleOnMessage = (message: string) => {
        console.log(message);
    };

    useEffect(() => {
        if (!isConnected) {
            socket.current = io(socketUrl, {
                transports: ['websocket'],
            });

            socket.current.on('connect', () => {
                console.info(`Successfully connected to socket at ${socketUrl}`);
                setConnected(true);
            });

            socket.current.on('disconnect', () => {
                console.info(`Successfully disconnected`);
                setConnected(false);
            });

            socket.current.on('error', (err: Error) => {
                console.log('Socket Error:', err.message);
            });

            socket.current.on('message', handleOnMessage);
        }

        return () => {
            if (socket.current?.connected) {
                socket.current.disconnect();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket: createSafeSocket(socket.current) }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextData => useContext(SocketContext);