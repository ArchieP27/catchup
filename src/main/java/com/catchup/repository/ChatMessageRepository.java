package com.catchup.repository;

import com.catchup.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.username = :me AND m.recipient = :other) OR " +
            "(m.username = :other AND m.recipient = :me) " +
            "ORDER BY m.timestamp ASC")
    List<ChatMessage> findPrivateHistory(@Param("me") String me, @Param("other") String other);


}
