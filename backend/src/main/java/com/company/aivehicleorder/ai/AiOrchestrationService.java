package com.company.aivehicleorder.ai;

import com.company.aivehicleorder.dto.response.AiParseResponse;
import com.company.aivehicleorder.exception.AiParseException;
import com.company.aivehicleorder.service.PdfExtractService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AiOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestrationService.class);
    private static final int INPUT_CHAR_LIMIT = 2000;
    private static final String ERROR_MESSAGE = "AI 無法解析訂單內容，請手動調整。";

    private final ChatClient chatClient;
    private final PromptTemplateLoader promptTemplateLoader;
    private final AiResponseParser aiResponseParser;
    private final PdfExtractService pdfExtractService;

    public AiOrchestrationService(ChatClient chatClient,
                                   PromptTemplateLoader promptTemplateLoader,
                                   AiResponseParser aiResponseParser,
                                   PdfExtractService pdfExtractService) {
        this.chatClient = chatClient;
        this.promptTemplateLoader = promptTemplateLoader;
        this.aiResponseParser = aiResponseParser;
        this.pdfExtractService = pdfExtractService;
    }

    public AiParseResponse parseOrderFromText(String sourceText) {
        String cappedText = cap(sourceText, INPUT_CHAR_LIMIT);
        String systemPrompt = promptTemplateLoader.getTemplate("parse-order-system");

        try {
            ChatResponse chatResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(cappedText)
                    .call()
                    .chatResponse();
            if (chatResponse == null) {
                throw new AiParseException(ERROR_MESSAGE);
            }
            logTokenUsage(chatResponse);
            String content = chatResponse.getResult().getOutput().getText();
            return aiResponseParser.parseParseResponse(content);
        } catch (AiParseException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI parse-order request failed: {}", e.getClass().getSimpleName());
            throw new AiParseException(ERROR_MESSAGE, e);
        }
    }

    public AiParseResponse parseOrderFromPdf(MultipartFile file) {
        String extractedText = pdfExtractService.extract(file);
        log.info("PDF extracted: file={}, chars={}", file.getOriginalFilename(), extractedText.length());
        return parseOrderFromText(extractedText);
    }

    private void logTokenUsage(ChatResponse response) {
        try {
            var usage = response.getMetadata().getUsage();
            Integer prompt = usage.getPromptTokens();
            Integer completion = usage.getTotalTokens() - (prompt != null ? prompt : 0);
            log.info("AI parse-order token usage: promptTokens={}, completionTokens={}", prompt, completion);
        } catch (Exception e) {
            log.warn("Could not retrieve token usage: {}", e.getMessage());
        }
    }

    private static String cap(String text, int maxChars) {
        if (text == null) return "";
        return text.length() > maxChars ? text.substring(0, maxChars) : text;
    }
}
