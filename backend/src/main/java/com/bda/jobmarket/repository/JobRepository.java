package com.bda.jobmarket.repository;

import com.bda.jobmarket.model.Job;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface JobRepository extends MongoRepository<Job, String> {}
