package com.catchup.config;

import com.catchup.service.PresenceManager;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketEventListener {

    private final PresenceManager presenceManager;
    private final SimpMessageSendingOperations messagingTemplate;

    public WebSocketEventListener(PresenceManager presenceManager, SimpMessageSendingOperations messagingTemplate) {
        this.presenceManager = presenceManager;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        System.out.println("New WebSocket connection established");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();

        if (principal != null) {
            String username = principal.getName();
            presenceManager.remove(username);
            System.out.println("Presence Update: User [" + username + "] has gone offline.");
            messagingTemplate.convertAndSend("/topic/users", presenceManager.getOnlineUsers());
        }
    }
}