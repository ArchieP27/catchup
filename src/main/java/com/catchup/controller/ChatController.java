package com.catchup.controller;

import com.catchup.model.ChatMessage;
import com.catchup.model.User;
import com.catchup.repository.ChatMessageRepository;
import com.catchup.repository.UserRepository;
import com.catchup.service.PresenceManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    @Autowired
    private ChatMessageRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PresenceManager presenceManager;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @GetMapping("/users/search")
    @ResponseBody
    public List<String> searchUsers(@RequestParam String query, Principal principal) {
        return userRepository.findByUsernameContainingIgnoreCase(query).stream()
                .map(User::getUsername)
                .filter(name -> !name.equals(principal.getName()))
                .collect(Collectors.toList());
    }

    @GetMapping("/chat")
    public String chatPage() {
        return "chat";
    }

    @GetMapping("/messages")
    @ResponseBody
    public List<ChatMessage> getAllMessages() {
        return repository.findAll().stream()
                .filter(msg -> msg.getRecipient() == null || "PUBLIC".equals(msg.getType()))
                .collect(Collectors.toList());
    }

    @GetMapping("/messages/all-private-contacts")
    @ResponseBody
    public List<String> getPrivateContacts(Principal principal) {
        String me = principal.getName();
        List<ChatMessage> allMyPrivates = repository.findAll().stream()
                .filter(m -> "PRIVATE".equals(m.getType()) && (m.getUsername().equals(me) || me.equals(m.getRecipient())))
                .collect(Collectors.toList());

        return allMyPrivates.stream()
                .map(m -> m.getUsername().equals(me) ? m.getRecipient() : m.getUsername())
                .distinct()
                .collect(Collectors.toList());
    }

    @PostMapping("/messages")
    @ResponseBody
    public ChatMessage sendMessage(@RequestParam String username, @RequestParam String content) {
        ChatMessage msg = new ChatMessage();
        msg.setUsername(username);
        msg.setContent(content);
        msg.setTimestamp(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        return repository.save(msg);
    }

    @MessageMapping("/chat.newUser")
    public void addUser(Principal principal) {
        String username = principal.getName();
        presenceManager.add(username);
        messagingTemplate.convertAndSend("/topic/users", presenceManager.getOnlineUsers());
    }

    @MessageMapping("/chat.typing")
    public void broadcastTyping(@Payload ChatMessage chatMessage, Principal principal) {
        String sender = principal.getName();
        if (chatMessage.getRecipient() != null) {
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getRecipient(), "/queue/typing", sender);
        }
    }

    @MessageMapping("/chat.stopTyping")
    public void stopTyping(@Payload(required = false) String recipient, Principal principal) {
        if (recipient == null) return;
        String sender = principal.getName();
        String cleanRecipient = recipient.replace("\"", "");

        if (!cleanRecipient.isEmpty()) {
            messagingTemplate.convertAndSendToUser(
                    cleanRecipient, "/queue/typing", "STOP:" + sender);
        }
    }

    @MessageMapping("/chat.sendMessage")
    public void broadcastMessage(@Payload ChatMessage chatMessage, Principal principal) {
        String sender = principal.getName();
        chatMessage.setUsername(sender);
        chatMessage.setTimestamp(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        repository.save(chatMessage);

        if ("PRIVATE".equals(chatMessage.getType())) {
            messagingTemplate.convertAndSendToUser(
                    chatMessage.getRecipient(), "/queue/messages", chatMessage);
            messagingTemplate.convertAndSendToUser(
                    sender, "/queue/messages", chatMessage);
        } else {
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

    @GetMapping("/messages/private")
    @ResponseBody
    public List<ChatMessage> getPrivateMessages(@RequestParam String otherUser, Principal principal) {
        return repository.findPrivateHistory(principal.getName(), otherUser);
    }



}
