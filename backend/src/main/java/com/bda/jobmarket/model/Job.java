package com.bda.jobmarket.model;

import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** skills is an EMBEDDED array inside each job document. */
@Document("jobs")
public record Job(@Id String id, String title, String role, String companyId, String company, String city,
                  List<String> skills, double salaryLpa, String level, String type, Instant postedAt,
                  String description) {}
