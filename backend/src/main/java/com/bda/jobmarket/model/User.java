package com.bda.jobmarket.model;

import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public record User(@Id String id, String name, String email, String passwordHash, String role,
                   List<String> skills, String city, Instant createdAt) {}
