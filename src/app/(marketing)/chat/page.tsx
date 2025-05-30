'use client';

import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { useUserStore, useReservationStore, useTripStore, useDriverStore, useMessageStore } from '@/store';
import { images } from '@/utils/constants/icons';
import { useState, useEffect, useCallback } from 'react';
import { Reservation, Trip, Driver, User } from '@/utils/constants/types';
import { Message } from '@/store';
import { WebSocketManager } from '@/lib/websocket';
import { toast } from 'sonner';

const ChatPage = () => {
    const { user: clerkUser } = useUser();
    const { currentUser, users } = useUserStore();
    const { getUserReservation, getReservationsByTripId } = useReservationStore();
    const { trips } = useTripStore();
    const { drivers } = useDriverStore();
    const { messages, addMessage } = useMessageStore();
    const [messageInput, setMessageInput] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<Message[]>(messages);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isChatExpired, setIsChatExpired] = useState<boolean>(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    // Handle userId and role
    const userId: number | undefined = currentUser?.id
        ? typeof currentUser.id === 'string'
            ? parseInt(currentUser.id)
            : currentUser.id
        : clerkUser?.id
          ? parseInt(clerkUser.id)
          : undefined;
    const role: string = currentUser?.role || 'passenger';

    // Determine relevant data based on role
    let reservation: Reservation | undefined;
    let trip: Trip | undefined;
    let chatPartner: User | Driver | undefined;
    let availableReservations: Reservation[] = [];

    if (role === 'passenger' && userId !== undefined) {
        const userReservation = getUserReservation(userId);
        if (userReservation?.tripId) {
            reservation = userReservation;
            const foundTrip = trips.find((t: Trip) => t.id === userReservation.tripId);
            if (foundTrip?.driverId) {
                trip = foundTrip;
                chatPartner = drivers.find((d: Driver) => d.id === foundTrip.driverId);
            }
        }
    } else if (role === 'driver' && userId !== undefined) {
        const driver = drivers.find((d: Driver) => d.userId === userId);
        if (driver) {
            const driverTrips = trips.filter((t: Trip) => t.driverId === driver.id && t.status !== 'completed');
            if (driverTrips.length > 0) {
                trip = driverTrips[0]; // Select first active trip
                if (trip) {
                    availableReservations = getReservationsByTripId(trip.id);
                    const selectedOrFirstReservation =
                        selectedReservation ||
                        (availableReservations.length > 0 ? availableReservations[0] : undefined);
                    if (selectedOrFirstReservation?.userId) {
                        reservation = selectedOrFirstReservation;
                        chatPartner = users.find((u: User) => u.id === selectedOrFirstReservation.userId);
                    }
                }
            }
        }
    } else if (role === 'owner') {
        reservation = undefined;
        trip = undefined;
        chatPartner = undefined;
    }

    // Initialize WebSocket
    useEffect(() => {
        if (!reservation || !userId) return;

        const wsUrl: string = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1738';
        if (!wsUrl) {
            console.error('NEXT_PUBLIC_WEBSOCKET_URL is not defined in .env');
            toast.error('WebSocket configuration error');
            return;
        }

        const wsManager: WebSocketManager = WebSocketManager.getInstance({
            url: wsUrl,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
        });

        wsManager.initialize();

        const messageHandler = wsManager.getMessageHandler();
        const connection = messageHandler.getConnection();
        const ws = connection.getWebSocket();

        const updateConnectionStatus = () => {
            setIsConnected(connection.isConnected());
            if (!connection.isConnected()) {
                toast.warning('WebSocket disconnected, attempting to reconnect...');
            }
        };

        if (ws) {
            ws.on('connect', () => {
                updateConnectionStatus();
                messageHandler.send({
                    type: 'subscribe_chat',
                    payload: { reservationId: reservation.id, userId },
                });
            });

            ws.on('disconnect', () => {
                updateConnectionStatus();
                toast.warning('WebSocket connection lost');
            });

            ws.on('connect_error', (error: Error) => {
                updateConnectionStatus();
                console.error('WebSocket connection error:', error);
                toast.error('Failed to connect to real-time chat');
            });

            ws.on('error', (data: { error: string }) => {
                console.error('WebSocket error:', data.error);
                if (data.error.includes('Chat messages have expired')) {
                    setIsChatExpired(true);
                } else {
                    toast.error(`Chat error: ${data.error}`);
                }
            });
        }

        // Subscribe to chat messages
        const unsubscribeChat = messageHandler.subscribe(
            'chat_message',
            (message: { type: string; payload: Message | Message[] }) => {
                if (reservation && userId && chatPartner) {
                    const newMessages: Message[] = Array.isArray(message.payload) ? message.payload : [message.payload];
                    const validMessages = newMessages.filter(
                        (msg) =>
                            msg.reservationId === reservation.id &&
                            ((msg.senderId === userId && msg.receiverId === chatPartner.id) ||
                                (msg.senderId === chatPartner.id && msg.receiverId === userId)),
                    );

                    if (validMessages.length > 0) {
                        validMessages.forEach((msg) => addMessage(msg));
                        setChatMessages((prev: Message[]) => {
                            const updated = [
                                ...prev,
                                ...validMessages.filter((msg) => !prev.some((p) => p.id === msg.id)),
                            ];
                            return updated.sort(
                                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
                            );
                        });

                        // Show notification for incoming messages
                        validMessages.forEach((msg) => {
                            if (msg.senderId === chatPartner.id) {
                                const partnerName =
                                    role === 'passenger'
                                        ? `${(chatPartner as Driver).firstName} ${(chatPartner as Driver).lastName}`
                                        : (chatPartner as User).name;
                                if (Notification.permission === 'granted') {
                                    new Notification(`New message from ${partnerName}`, {
                                        body: msg.content,
                                        icon: '/icons/notification.png',
                                    });
                                } else {
                                    Notification.requestPermission().then((permission) => {
                                        if (permission === 'granted') {
                                            new Notification(`New message from ${partnerName}`, {
                                                body: msg.content,
                                                icon: '/icons/notification.png',
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            },
        );

        // Periodic connection status check
        const interval = setInterval(updateConnectionStatus, 1000);

        // Cleanup
        return () => {
            if (reservation && userId) {
                messageHandler.send({
                    type: 'unsubscribe_chat',
                    payload: { reservationId: reservation.id, userId },
                });
            }
            unsubscribeChat();
            clearInterval(interval);
            wsManager.disconnect();
        };
    }, [reservation, userId, chatPartner, addMessage]);

    const handleSendMessage = useCallback((): void => {
        if (
            !messageInput.trim() ||
            !reservation ||
            !trip ||
            !chatPartner ||
            userId === undefined ||
            !isConnected ||
            isChatExpired
        )
            return;

        const newMessage: Message = {
            id: messages.length + 1, // Temporary ID
            reservationId: reservation.id,
            tripId: trip.id,
            senderId: userId,
            receiverId: chatPartner.id,
            content: messageInput.trim(),
            timestamp: new Date().toISOString(),
        };

        const wsManager: WebSocketManager = WebSocketManager.getInstance({
            url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1738',
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
        });

        wsManager.getMessageHandler().send({
            type: 'send_chat_message',
            payload: newMessage,
        });

        // Optimistically add message to UI
        addMessage(newMessage);
        setChatMessages((prev: Message[]) => [...prev, newMessage]);
        setMessageInput('');
    }, [messageInput, reservation, trip, chatPartner, userId, isConnected, isChatExpired, addMessage, messages.length]);

    // Handle no active reservation or unsupported role
    if (!reservation || !trip || !chatPartner) {
        return (
            <div className="flex-1 bg-white p-5 min-h-screen">
                <h1 className="text-2xl font-JakartaBold">Chat</h1>
                <div className="flex flex-col justify-center items-center h-full">
                    <Image
                        src={images.message}
                        alt="No messages illustration"
                        width={400}
                        height={160}
                        className="w-full h-40 object-contain"
                    />
                    <h2 className="text-3xl font-JakartaBold mt-3">
                        {role === 'owner' ? 'Chat Not Available' : 'No Active Reservation'}
                    </h2>
                    <p className="text-base mt-2 text-center px-7">
                        {role === 'owner'
                            ? 'Chat functionality is not available for owners.'
                            : 'Book a trip or get assigned to one to start chatting.'}
                    </p>
                </div>
            </div>
        );
    }

    // Handle expired chat
    if (isChatExpired) {
        return (
            <div className="flex-1 bg-white p-5 min-h-screen">
                <h1 className="text-2xl font-JakartaBold">Chat</h1>
                <div className="flex flex-col justify-center items-center h-full">
                    <Image
                        src={images.message}
                        alt="No messages illustration"
                        width={400}
                        height={160}
                        className="w-full h-40 object-contain"
                    />
                    <h2 className="text-3xl font-JakartaBold mt-3">Chat Expired</h2>
                    <p className="text-base mt-2 text-center px-7">
                        The chat for this trip has expired. Messages are only available for 24 hours after trip
                        completion.
                    </p>
                </div>
            </div>
        );
    }

    const filteredMessages: Message[] = chatMessages.filter(
        (m: Message) =>
            m.reservationId === reservation.id &&
            ((m.senderId === userId && m.receiverId === chatPartner.id) ||
                (m.senderId === chatPartner.id && m.receiverId === userId)),
    );

    return (
        <div className="flex-1 bg-white p-5 min-h-screen flex flex-col">
            <h1 className="text-2xl font-JakartaBold mb-4">
                Chat with{' '}
                {role === 'passenger'
                    ? `${(chatPartner as Driver).firstName} ${(chatPartner as Driver).lastName}`
                    : (chatPartner as User).name}
            </h1>
            {role === 'driver' && availableReservations.length > 1 && (
                <div className="mb-4">
                    <label className="block text-sm font-JakartaBold mb-2">Select Passenger:</label>
                    <select
                        value={selectedReservation?.id || ''}
                        onChange={(e) => {
                            const selected = availableReservations.find((r) => r.id === parseInt(e.target.value));
                            setSelectedReservation(selected || null);
                            setChatMessages(messages); // Reset messages when switching
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {availableReservations.map((res) => {
                            const passenger = users.find((u: User) => u.id === res.userId);
                            return (
                                <option key={res.id} value={res.id}>
                                    {passenger ? passenger.name : `Passenger ${res.userId}`}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}
            <p className="text-sm text-gray-600 mb-2">Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
            <div className="flex-1 bg-gray-100 rounded-lg p-4 overflow-y-auto">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full">
                        <Image
                            src={images.message}
                            alt="No messages illustration"
                            width={200}
                            height={80}
                            className="w-48 h-20 object-contain"
                        />
                        <p className="text-base mt-2 text-center">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    filteredMessages.map((msg: Message) => (
                        <div
                            key={msg.id}
                            className={`mb-4 flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs p-3 rounded-lg ${
                                    msg.senderId === userId ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800'
                                }`}
                            >
                                <p>{msg.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!isConnected || isChatExpired}
                />
                <button
                    onClick={handleSendMessage}
                    className={`px-4 py-2.5 rounded-lg transition-colors ${
                        isConnected && !isChatExpired
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    }`}
                    disabled={!isConnected || isChatExpired}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatPage;
