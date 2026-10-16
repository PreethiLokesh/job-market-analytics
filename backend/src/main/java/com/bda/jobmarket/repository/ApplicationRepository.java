package com.bda.jobmarket.repository;

import com.bda.jobmarket.model.Application;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ApplicationRepository extends MongoRepository<Application, String> {
    List<Application> findByUserIdOrderByAppliedAtDesc(String userId);
    boolean existsByUserIdAndJobId(String userId, String jobId);
}
