package com.bda.jobmarket.service;

import java.util.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

/** Cached list of all skills in the jobs collection; maps "java" -> "Java" so matching is case-insensitive. */
@Service
public class SkillCatalog {
    private final MongoTemplate mongo;
    private volatile List<String> all;

    public SkillCatalog(MongoTemplate mongo) { this.mongo = mongo; }

    public List<String> all() {
        if (all == null) {
            List<String> s = new ArrayList<>(mongo.findDistinct(new Query(), "skills", "jobs", String.class));
            Collections.sort(s);
            all = s;
        }
        return all;
    }

    public void refresh() { all = null; }

    public List<String> normalize(List<String> input) {
        if (input == null) return List.of();
        Map<String, String> canon = new HashMap<>();
        for (String s : all()) canon.put(s.toLowerCase(), s);
        return input.stream().map(String::trim).filter(s -> !s.isEmpty())
                .map(s -> canon.getOrDefault(s.toLowerCase(), s)).distinct().toList();
    }
}
