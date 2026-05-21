package com.company.aivehicleorder.ai;

import com.company.aivehicleorder.dto.response.AiParseResponse;
import com.company.aivehicleorder.exception.AiParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.messages.AssistantMessage;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiOrchestrationServiceTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    ChatClient chatClient;

    @Mock
    PromptTemplateLoader promptTemplateLoader;

    @Mock
    AiResponseParser aiResponseParser;

    AiOrchestrationService service;

    @BeforeEach
    void setUp() {
        service = new AiOrchestrationService(chatClient, promptTemplateLoader, aiResponseParser);
        when(promptTemplateLoader.getTemplate("parse-order-system")).thenReturn("system prompt");
    }

    @Test
    void parseOrderFromText_success_returnsAiParseResponse() {
        ChatResponse chatResponse = buildChatResponse("{}");
        when(chatClient.prompt().system(anyString()).user(anyString()).call().chatResponse())
                .thenReturn(chatResponse);

        AiParseResponse expected = AiParseResponse.builder()
                .customerName("王先生").confidence(0.9).build();
        when(aiResponseParser.parseParseResponse("{}")).thenReturn(expected);

        AiParseResponse result = service.parseOrderFromText("王先生要訂 BMW X3");

        assertThat(result.getCustomerName()).isEqualTo("王先生");
        assertThat(result.getConfidence()).isEqualTo(0.9);
    }

    @Test
    void parseOrderFromText_chatClientThrows_wrapsAsAiParseException() {
        when(chatClient.prompt().system(anyString()).user(anyString()).call().chatResponse())
                .thenThrow(new RuntimeException("network timeout"));

        assertThatThrownBy(() -> service.parseOrderFromText("some text"))
                .isInstanceOf(AiParseException.class)
                .hasMessageContaining("AI 無法解析訂單內容");
    }

    @Test
    void parseOrderFromText_inputExceeds2000Chars_capsBefore2000() {
        String longInput = "A".repeat(3000);
        ChatResponse chatResponse = buildChatResponse("{}");
        when(chatClient.prompt().system(anyString()).user(anyString()).call().chatResponse())
                .thenReturn(chatResponse);
        when(aiResponseParser.parseParseResponse("{}")).thenReturn(AiParseResponse.builder().build());

        // Should not throw — capping is handled silently
        service.parseOrderFromText(longInput);
    }

    @Test
    void parseOrderFromText_nullInput_treatedAsEmptyString() {
        ChatResponse chatResponse = buildChatResponse("{}");
        when(chatClient.prompt().system(anyString()).user(anyString()).call().chatResponse())
                .thenReturn(chatResponse);
        when(aiResponseParser.parseParseResponse("{}")).thenReturn(AiParseResponse.builder().build());

        service.parseOrderFromText(null);
    }

    @Test
    void parseOrderFromText_nullChatResponse_throwsAiParseException() {
        when(chatClient.prompt().system(anyString()).user(anyString()).call().chatResponse())
                .thenReturn(null);

        assertThatThrownBy(() -> service.parseOrderFromText("some text"))
                .isInstanceOf(AiParseException.class)
                .hasMessageContaining("AI 無法解析訂單內容");
    }

    private ChatResponse buildChatResponse(String content) {
        AssistantMessage message = new AssistantMessage(content);
        Generation generation = new Generation(message);
        Usage usage = mock(Usage.class);
        when(usage.getPromptTokens()).thenReturn(10);
        when(usage.getTotalTokens()).thenReturn(20);
        ChatResponseMetadata metadata = ChatResponseMetadata.builder().usage(usage).build();
        return new ChatResponse(List.of(generation), metadata);
    }
}
