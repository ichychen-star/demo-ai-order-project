package com.company.aivehicleorder.ai;

import com.company.aivehicleorder.dto.response.AiParseResponse;
import com.company.aivehicleorder.exception.AiParseException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AiResponseParser {

    private static final Logger log = LoggerFactory.getLogger(AiResponseParser.class);

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public AiParseResponse parseParseResponse(String jsonString) {
        String cleaned = stripMarkdownFences(jsonString);
        try {
            AiParseResponse response = objectMapper.readValue(cleaned, AiParseResponse.class);
            if (response.getConfidence() == null) {
                response.setConfidence(0.0);
            }
            if (response.getOptions() == null) {
                response.setOptions(List.of());
            }
            if (response.getMissingFields() == null) {
                response.setMissingFields(List.of());
            }
            return response;
        } catch (AiParseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse AI JSON response: {}", e.getMessage());
            throw new AiParseException("AI 無法解析訂單內容，請手動調整。", e);
        }
    }

    private String stripMarkdownFences(String text) {
        if (text == null) return "";
        String trimmed = text.strip();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3).strip();
            }
        }
        return trimmed;
    }
}
