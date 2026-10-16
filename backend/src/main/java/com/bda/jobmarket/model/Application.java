package com.bda.jobmarket.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("applications")
public record Application(@Id String id, String userId, String jobId, String jobTitle, String company,
                          String status, Instant appliedAt) {}
