package com.company.aivehicleorder.ai;

import com.company.aivehicleorder.dto.response.AiParseResponse;
import com.company.aivehicleorder.exception.AiParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiResponseParserTest {

    private AiResponseParser parser;

    @BeforeEach
    void setUp() {
        parser = new AiResponseParser();
    }

    @Test
    void validJson_allFieldsPopulated() {
        String json = """
                {
                  "customerName": "王先生",
                  "customerPhone": "0912-345-678",
                  "customerEmail": null,
                  "brand": "Mercedes-Benz",
                  "model": "GLC 300 Coupe",
                  "exteriorColor": "白",
                  "interiorColor": "黑",
                  "options": ["AMG Line"],
                  "expectedDeliveryMonth": "2026-06",
                  "confidence": 0.95,
                  "missingFields": []
                }
                """;

        AiParseResponse result = parser.parseParseResponse(json);

        assertThat(result.getCustomerName()).isEqualTo("王先生");
        assertThat(result.getCustomerPhone()).isEqualTo("0912-345-678");
        assertThat(result.getCustomerEmail()).isNull();
        assertThat(result.getBrand()).isEqualTo("Mercedes-Benz");
        assertThat(result.getModel()).isEqualTo("GLC 300 Coupe");
        assertThat(result.getExteriorColor()).isEqualTo("白");
        assertThat(result.getInteriorColor()).isEqualTo("黑");
        assertThat(result.getOptions()).containsExactly("AMG Line");
        assertThat(result.getExpectedDeliveryMonth()).isEqualTo("2026-06");
        assertThat(result.getConfidence()).isEqualTo(0.95);
        assertThat(result.getMissingFields()).isEmpty();
    }

    @Test
    void missingConfidence_defaultsToZero() {
        String json = """
                {
                  "customerName": "陳小姐",
                  "brand": "BMW",
                  "model": "X3",
                  "options": [],
                  "missingFields": ["customerPhone"]
                }
                """;

        AiParseResponse result = parser.parseParseResponse(json);

        assertThat(result.getConfidence()).isEqualTo(0.0);
        assertThat(result.getCustomerName()).isEqualTo("陳小姐");
    }

    @Test
    void unknownFields_ignoredWithoutException() {
        String json = """
                {
                  "customerName": "李大明",
                  "brand": "Audi",
                  "model": "Q5",
                  "confidence": 0.9,
                  "options": [],
                  "missingFields": [],
                  "unknownExtraField": "should be ignored",
                  "anotherUnknown": 999
                }
                """;

        AiParseResponse result = parser.parseParseResponse(json);

        assertThat(result.getCustomerName()).isEqualTo("李大明");
        assertThat(result.getConfidence()).isEqualTo(0.9);
    }

    @Test
    void nullOptions_defaultsToEmptyList() {
        String json = """
                {
                  "customerName": "測試",
                  "confidence": 0.5
                }
                """;

        AiParseResponse result = parser.parseParseResponse(json);

        assertThat(result.getOptions()).isNotNull().isEmpty();
        assertThat(result.getMissingFields()).isNotNull().isEmpty();
    }

    @Test
    void markdownFencedJson_parsedCorrectly() {
        String json = """
                ```json
                {
                  "customerName": "王先生",
                  "brand": "BMW",
                  "model": "X3",
                  "confidence": 0.8,
                  "options": [],
                  "missingFields": []
                }
                ```""";

        AiParseResponse result = parser.parseParseResponse(json);

        assertThat(result.getCustomerName()).isEqualTo("王先生");
        assertThat(result.getConfidence()).isEqualTo(0.8);
    }

    @Test
    void malformedJson_throwsAiParseException() {
        String badJson = "this is not json at all";

        assertThatThrownBy(() -> parser.parseParseResponse(badJson))
                .isInstanceOf(AiParseException.class)
                .hasMessageContaining("AI 無法解析訂單內容");
    }
}
