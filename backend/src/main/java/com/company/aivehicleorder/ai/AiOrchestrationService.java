package com.company.aivehicleorder.ai;

import com.company.aivehicleorder.dto.response.AiParseResponse;
import com.company.aivehicleorder.dto.response.OrderResponse;
import com.company.aivehicleorder.exception.AiParseException;
import com.company.aivehicleorder.service.OrderService;
import com.company.aivehicleorder.service.PdfExtractService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class AiOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestrationService.class);
    private static final int INPUT_CHAR_LIMIT = 2000;
    private static final String ERROR_MESSAGE = "AI 無法解析訂單內容，請手動調整。";

    private final ChatClient chatClient;
    private final PromptTemplateLoader promptTemplateLoader;
    private final AiResponseParser aiResponseParser;
    private final PdfExtractService pdfExtractService;
    private final OrderService orderService;

    public AiOrchestrationService(ChatClient chatClient,
                                   PromptTemplateLoader promptTemplateLoader,
                                   AiResponseParser aiResponseParser,
                                   PdfExtractService pdfExtractService,
                                   OrderService orderService) {
        this.chatClient = chatClient;
        this.promptTemplateLoader = promptTemplateLoader;
        this.aiResponseParser = aiResponseParser;
        this.pdfExtractService = pdfExtractService;
        this.orderService = orderService;
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
            logTokenUsage(chatResponse, "parse-order");
            String content = chatResponse.getResult().getOutput().getText();
            return aiResponseParser.parseParseResponse(content);
        } catch (AiParseException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI parse-order request failed: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            throw new AiParseException(ERROR_MESSAGE, e);
        }
    }

    public AiParseResponse parseOrderFromPdf(MultipartFile file) {
        String extractedText = pdfExtractService.extract(file);
        log.info("PDF extracted: file={}, chars={}", file.getOriginalFilename(), extractedText.length());
        return parseOrderFromText(extractedText);
    }

    public String generateSummary(OrderResponse order) {
        if (order.getAiSummary() != null) {
            log.warn("Re-generating AI summary for order: {}", order.getId());
        }
        String systemPrompt = promptTemplateLoader.getTemplate("generate-summary-system");
        String result = callAiForText(systemPrompt, buildOrderUserMessage(order), "generate-summary");
        orderService.updateAiContent(order.getId(), result, null);
        return result;
    }

    public String generateEmail(OrderResponse order) {
        if (order.getAiEmail() != null) {
            log.warn("Re-generating AI email for order: {}", order.getId());
        }
        String systemPrompt = promptTemplateLoader.getTemplate("generate-email-system");
        String result = callAiForText(systemPrompt, buildOrderUserMessage(order), "generate-email");
        orderService.updateAiContent(order.getId(), null, result);
        return result;
    }

    private String callAiForText(String systemPrompt, String userMessage, String operation) {
        try {
            ChatResponse chatResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userMessage)
                    .call()
                    .chatResponse();
            if (chatResponse == null) {
                throw new AiParseException(ERROR_MESSAGE);
            }
            logTokenUsage(chatResponse, operation);
            return chatResponse.getResult().getOutput().getText();
        } catch (AiParseException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI {} request failed: {}", operation, e.getClass().getSimpleName());
            throw new AiParseException(ERROR_MESSAGE, e);
        }
    }

    private static String buildOrderUserMessage(OrderResponse order) {
        String options = (order.getOptions() == null || order.getOptions().isEmpty())
                ? "無"
                : order.getOptions().stream()
                        .map(o -> o.getOptionName())
                        .collect(Collectors.joining("、"));
        return String.format(
                "customerName: %s%nvehicleName: %s%nexteriorColor: %s%ninteriorColor: %s%n" +
                "options: %s%nexpectedDeliveryMonth: %s%ntotalPrice: NT$%s",
                order.getCustomerName(),
                order.getVehicleName(),
                order.getExteriorColor(),
                order.getInteriorColor() != null ? order.getInteriorColor() : "N/A",
                options,
                order.getExpectedDeliveryMonth(),
                formatPrice(order.getTotalPrice()));
    }

    private static String formatPrice(BigDecimal price) {
        if (price == null) return "N/A";
        return String.format("%,.0f", price);
    }

    private void logTokenUsage(ChatResponse response, String operation) {
        try {
            var usage = response.getMetadata().getUsage();
            Integer prompt = usage.getPromptTokens();
            Integer completion = usage.getTotalTokens() - (prompt != null ? prompt : 0);
            log.info("AI {} token usage: promptTokens={}, completionTokens={}", operation, prompt, completion);
        } catch (Exception e) {
            log.warn("Could not retrieve token usage: {}", e.getMessage());
        }
    }

    private static String cap(String text, int maxChars) {
        if (text == null) return "";
        return text.length() > maxChars ? text.substring(0, maxChars) : text;
    }
}
