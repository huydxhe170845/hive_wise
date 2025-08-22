package com.capstone_project.capstone_project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.HashMap;

@Service
public class QdrantService {
    @Value("${qdrant.url}")
    private String qdrantUrl;

    @Value("${qdrant.api.key:}")
    private String qdrantApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> searchWithFilter(String collection, float[] queryVector, int limit,
            Map<String, Object> filter) {
        RestTemplate restTemplate = new RestTemplate();
        String url = qdrantUrl + "/collections/" + collection + "/points/search";

        List<Float> vectorList = new ArrayList<>();
        for (float f : queryVector) {
            vectorList.add(f);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("vector", vectorList);
        body.put("limit", limit);
        body.put("with_payload", true);
        body.put("with_vector", false);

        if (filter != null && !filter.isEmpty()) {
            body.put("filter", filter);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (!qdrantApiKey.isEmpty()) {
            headers.set("api-key", qdrantApiKey);
        }
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("result");

            return results != null ? results : new ArrayList<>();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<Map<String, Object>> search(String collection, float[] queryVector, int limit) {
        return searchWithFilter(collection, queryVector, limit, null);
    }

    public void upsertKnowledge(String collection, String id, float[] vector, Map<String, Object> payload) {
        RestTemplate restTemplate = new RestTemplate();
        String url = qdrantUrl + "/collections/" + collection + "/points";

        List<Float> vectorList = new ArrayList<>();
        for (float f : vector) {
            vectorList.add(f);
        }

        Map<String, Object> point = new HashMap<>();
        point.put("id", id);
        point.put("vector", vectorList);
        point.put("payload", payload);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("points", List.of(point));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (!qdrantApiKey.isEmpty()) {
            headers.set("api-key", qdrantApiKey);
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("Sending to Qdrant - Point ID: " + id + ", Vector size: " + vectorList.size());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            System.out.println("Qdrant response status: " + response.getStatusCode());
            System.out.println("Qdrant response body: " + response.getBody());
        } catch (Exception e) {
            System.err.println("Error calling Qdrant API: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}