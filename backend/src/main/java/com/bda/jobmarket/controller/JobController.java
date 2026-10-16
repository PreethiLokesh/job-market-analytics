package com.bda.jobmarket.controller;

import com.bda.jobmarket.model.Job;
import com.bda.jobmarket.repository.JobRepository;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/jobs")
public class JobController {
    private final MongoTemplate mongo;
    private final JobRepository jobs;

    public JobController(MongoTemplate mongo, JobRepository jobs) { this.mongo = mongo; this.jobs = jobs; }

    private static boolean has(String s) { return s != null && !s.isBlank(); }

    /** Search + filter + pagination. */
    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false) String q,
                                    @RequestParam(required = false) String city,
                                    @RequestParam(required = false) String skill,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "12") int size) {
        Query query = new Query();
        if (has(q)) query.addCriteria(Criteria.where("title").regex(Pattern.quote(q.trim()), "i"));
        if (has(city)) query.addCriteria(Criteria.where("city").is(city));
        if (has(skill)) query.addCriteria(Criteria.where("skills").is(skill));
        long total = mongo.count(query, Job.class);
        query.with(Sort.by(Sort.Direction.DESC, "postedAt")).skip((long) page * size).limit(size);
        return Map.of("content", mongo.find(query, Job.class), "total", total, "page", page, "size", size);
    }

    @GetMapping("/{id}")
    public Job get(@PathVariable String id) {
        return jobs.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
    }
}
