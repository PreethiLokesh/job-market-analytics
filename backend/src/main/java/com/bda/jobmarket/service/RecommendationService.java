package com.bda.jobmarket.service;

import java.util.*;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

/**
 * Skill-matching recommender (one aggregation pipeline):
 *   matched = job.skills  INTERSECT  user.skills
 *   missing = job.skills  MINUS      matched
 *   score   = matched / job.skills * 100   (how much of the job the user already covers)
 * Ranked by score, then number of matched skills, then salary.
 */
@Service
public class RecommendationService {
    private final MongoTemplate mongo;
    private final SkillCatalog catalog;

    public RecommendationService(MongoTemplate mongo, SkillCatalog catalog) {
        this.mongo = mongo;
        this.catalog = catalog;
    }

    public List<Document> recommend(List<String> userSkills, String city, int limit) {
        List<String> skills = catalog.normalize(userSkills);
        if (skills.isEmpty()) return List.of();

        Document match = new Document("skills", new Document("$in", skills));
        if (city != null && !city.isBlank()) match.append("city", city);

        List<Document> p = new ArrayList<>();
        p.add(new Document("$match", match));
        p.add(new Document("$addFields", new Document("matched",
                new Document("$setIntersection", List.of("$skills", skills)))));
        p.add(Document.parse("{$addFields:{matchCount:{$size:'$matched'},missing:{$setDifference:['$skills','$matched']}}}"));
        p.add(Document.parse("{$addFields:{score:{$round:[{$multiply:[{$divide:['$matchCount',{$size:'$skills'}]},100]},0]}}}"));
        p.add(Document.parse("{$sort:{score:-1,matchCount:-1,salaryLpa:-1}}"));
        p.add(new Document("$limit", limit));
        p.add(Document.parse("{$project:{_id:0,id:{$toString:'$_id'},title:1,company:1,city:1,skills:1,salaryLpa:1,level:1,type:1,postedAt:1,matched:1,missing:1,matchCount:1,score:1}}"));
        return mongo.getCollection("jobs").aggregate(p).allowDiskUse(true).into(new ArrayList<>());
    }
}
