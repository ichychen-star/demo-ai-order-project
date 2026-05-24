package com.company.aivehicleorder.ai;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
public class PromptTemplateLoader {

    private static final Logger log = LoggerFactory.getLogger(PromptTemplateLoader.class);

    private static final String[] TEMPLATE_NAMES = {
        "parse-order-system",
        "generate-summary-system"
    };

    private final Map<String, String> templates = new HashMap<>();

    @PostConstruct
    public void loadTemplates() throws IOException {
        for (String name : TEMPLATE_NAMES) {
            ClassPathResource resource = new ClassPathResource("prompts/" + name + ".txt");
            if (!resource.exists()) {
                throw new IllegalStateException("Required prompt template not found: prompts/" + name + ".txt");
            }
            String content = resource.getContentAsString(StandardCharsets.UTF_8);
            templates.put(name, content);
            log.info("Loaded prompt template: {} ({} chars)", name, content.length());
        }
    }

    public String getTemplate(String name) {
        String template = templates.get(name);
        if (template == null) {
            throw new IllegalArgumentException("Unknown prompt template: " + name);
        }
        return template;
    }
}
