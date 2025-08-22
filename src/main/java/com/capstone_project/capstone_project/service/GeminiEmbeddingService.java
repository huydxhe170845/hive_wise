package com.capstone_project.capstone_project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiEmbeddingService {
    @Value("${gemini.api.key}")
    private String apiKey;

    private final String GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent";

    public float[] embedText(String text) {
        RestTemplate restTemplate = new RestTemplate();
        String url = GEMINI_EMBEDDING_URL + "?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "model", "models/embedding-001",
                "content", Map.of(
                        "parts", List.of(Map.of("text", text))));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        System.out.println("Gemini embedding response: " + response.getBody());

        Map<String, Object> resp = response.getBody();
        if (resp.containsKey("embedding")) {
            Map<String, Object> embedding = (Map<String, Object>) resp.get("embedding");
            List<Double> values = (List<Double>) embedding.get("values");

            float[] result = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                result[i] = values.get(i).floatValue();
            }
            return result;
        }

        return new float[] { 0.1f, 0.2f, 0.3f };
    }
}