package com.catchup.service;

import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Service
public class PresenceManager {
    private final Set<String> onlineUsers = Collections.synchronizedSet(new HashSet<>());

    public void add(String username) {
        onlineUsers.add(username);
    }

    public void remove(String username) {
        onlineUsers.remove(username);
    }

    public Set<String> getOnlineUsers() {
        return onlineUsers;
    }

}