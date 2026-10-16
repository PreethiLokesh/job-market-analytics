package com.bda.jobmarket.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("companies")
public record Company(@Id String id, String name, String industry) {}
