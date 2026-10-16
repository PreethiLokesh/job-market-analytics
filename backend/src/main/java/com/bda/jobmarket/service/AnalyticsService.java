package com.bda.jobmarket.service;

import java.util.*;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

/** All analytics are MongoDB aggregation pipelines: the database does the heavy work, not Java. */
@Service
public class AnalyticsService {
    private final MongoTemplate mongo;

    public AnalyticsService(MongoTemplate mongo) { this.mongo = mongo; }

    private List<Document> run(String collection, List<Document> pipeline) {
        return mongo.getCollection(collection).aggregate(pipeline).allowDiskUse(true).into(new ArrayList<>());
    }

    private static List<Document> stages(String... json) {
        List<Document> l = new ArrayList<>();
        for (String s : json) l.add(Document.parse(s));
        return l;
    }

    public Map<String, Object> overview() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("jobs", mongo.getCollection("jobs").countDocuments());
        m.put("companies", mongo.getCollection("companies").countDocuments());
        m.put("users", mongo.getCollection("users").countDocuments());
        m.put("applications", mongo.getCollection("applications").countDocuments());
        List<Document> avg = run("jobs", stages("{$group:{_id:null,avg:{$avg:'$salaryLpa'}}}"));
        m.put("avgSalary", avg.isEmpty() ? 0 : Math.round(avg.get(0).getDouble("avg") * 10) / 10.0);
        return m;
    }

    /** Most in-demand skills: unwind the embedded skills array, count each skill. */
    public List<Document> topSkills(int limit) {
        return run("jobs", stages(
                "{$unwind:'$skills'}",
                "{$group:{_id:'$skills',count:{$sum:1},avgSalary:{$avg:'$salaryLpa'}}}",
                "{$sort:{count:-1}}",
                "{$limit:" + limit + "}",
                "{$project:{_id:0,skill:'$_id',count:1,avgSalary:{$round:['$avgSalary',1]}}}"));
    }

    /** Average salary grouped by role or by city (optionally filtered to one city). */
    public List<Document> salary(String by, String city) {
        String field = "city".equals(by) ? "city" : "role";
        List<Document> p = new ArrayList<>();
        if (city != null && !city.isBlank()) p.add(new Document("$match", new Document("city", city)));
        p.addAll(stages(
                "{$group:{_id:'$" + field + "',avgSalary:{$avg:'$salaryLpa'},jobs:{$sum:1}}}",
                "{$sort:{avgSalary:-1}}",
                "{$project:{_id:0,name:'$_id',jobs:1,avgSalary:{$round:['$avgSalary',1]}}}"));
        return run("jobs", p);
    }

    /** Jobs posted per month. */
    public List<Document> hiringTrend() {
        return run("jobs", stages(
                "{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$postedAt'}},jobs:{$sum:1},avgSalary:{$avg:'$salaryLpa'}}}",
                "{$sort:{_id:1}}",
                "{$project:{_id:0,month:'$_id',jobs:1,avgSalary:{$round:['$avgSalary',1]}}}"));
    }

    public List<Document> topCompanies(int limit) {
        return run("jobs", stages(
                "{$group:{_id:'$company',jobs:{$sum:1},avgSalary:{$avg:'$salaryLpa'}}}",
                "{$sort:{jobs:-1}}",
                "{$limit:" + limit + "}",
                "{$project:{_id:0,company:'$_id',jobs:1,avgSalary:{$round:['$avgSalary',1]}}}"));
    }

    public Map<String, Object> meta(SkillCatalog catalog) {
        Map<String, Object> m = new LinkedHashMap<>();
        List<String> cities = new ArrayList<>(mongo.findDistinct(new org.springframework.data.mongodb.core.query.Query(), "city", "jobs", String.class));
        List<String> roles = new ArrayList<>(mongo.findDistinct(new org.springframework.data.mongodb.core.query.Query(), "role", "jobs", String.class));
        Collections.sort(cities);
        Collections.sort(roles);
        m.put("cities", cities);
        m.put("roles", roles);
        m.put("skills", catalog.all());
        return m;
    }
}
