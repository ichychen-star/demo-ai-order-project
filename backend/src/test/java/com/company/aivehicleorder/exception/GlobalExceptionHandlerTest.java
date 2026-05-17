package com.company.aivehicleorder.exception;

import com.company.aivehicleorder.dto.response.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // Exists solely to obtain a MethodParameter via reflection for test setup
    @SuppressWarnings("unused")
    private static void dummyEndpoint(String body) {}

    private static MethodArgumentNotValidException buildValidationEx(BeanPropertyBindingResult br)
            throws NoSuchMethodException {
        Method method = GlobalExceptionHandlerTest.class.getDeclaredMethod("dummyEndpoint", String.class);
        return new MethodArgumentNotValidException(new MethodParameter(method, 0), br);
    }

    // ── 400 Validation ───────────────────────────────────────────────────────

    @Test
    void handleValidation_returns400ResponseWithFieldErrors() throws Exception {
        BeanPropertyBindingResult br = new BeanPropertyBindingResult(new Object(), "req");
        br.addError(new FieldError("req", "customerName", "must not be blank"));
        br.addError(new FieldError("req", "vehicleId",    "must not be null"));

        ApiErrorResponse response = handler.handleValidation(buildValidationEx(br));

        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getMessage()).isEqualTo("Validation failed");
        assertThat(response.getErrors()).hasSize(2);
        assertThat(response.getErrors()).contains("customerName: must not be blank");
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    void handleValidation_errorsContainNoStackTrace() throws Exception {
        BeanPropertyBindingResult br = new BeanPropertyBindingResult(new Object(), "req");
        br.addError(new FieldError("req", "name", "must not be blank"));

        ApiErrorResponse response = handler.handleValidation(buildValidationEx(br));

        // errors list contains only "field: message" strings — no exception class names
        assertThat(response.getErrors()).allMatch(e -> !e.contains("Exception") && !e.contains("\tat "));
    }

    // ── 404 EntityNotFoundException ──────────────────────────────────────────

    @Test
    void handleNotFound_returns404JsonNotHtml() {
        EntityNotFoundException ex = new EntityNotFoundException("Order 123 not found");

        ApiErrorResponse response = handler.handleNotFound(ex);

        assertThat(response.getStatus()).isEqualTo(404);
        assertThat(response.getMessage()).isEqualTo("Order 123 not found");
        assertThat(response.getErrors()).isEmpty();
        assertThat(response.getTimestamp()).isNotNull();
    }

    // ── 422 AiParseException ─────────────────────────────────────────────────

    @Test
    void handleAiParse_returns422WithUserFriendlyMessage() {
        AiParseException ex = new AiParseException("JSON parse error");

        ApiErrorResponse response = handler.handleAiParse(ex);

        assertThat(response.getStatus()).isEqualTo(422);
        assertThat(response.getMessage()).isEqualTo("AI 無法解析訂單內容，請手動調整。");
        assertThat(response.getErrors()).isEmpty();
    }

    @Test
    void handleAiParse_doesNotExposeInternalMessage() {
        AiParseException ex = new AiParseException("sensitive internal details");

        ApiErrorResponse response = handler.handleAiParse(ex);

        assertThat(response.getMessage()).doesNotContain("sensitive internal details");
    }

    // ── 413 MaxUploadSizeExceededException ───────────────────────────────────

    @Test
    void handleMaxUploadSize_returns413() {
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(10L * 1024 * 1024);

        ApiErrorResponse response = handler.handleMaxUploadSize(ex);

        assertThat(response.getStatus()).isEqualTo(413);
        assertThat(response.getMessage()).isNotBlank();
    }

    // ── 500 Generic Exception ────────────────────────────────────────────────

    @Test
    void handleGeneric_returns500WithNoStackTrace() {
        Exception ex = new RuntimeException("internal system failure");

        ApiErrorResponse response = handler.handleGeneric(ex);

        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getMessage()).isEqualTo("系統發生錯誤，請稍後再試。");
        assertThat(response.getErrors()).isEmpty();
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    void handleGeneric_doesNotExposeInternalDetails() {
        Exception ex = new RuntimeException("db connection refused at 192.168.1.1");

        ApiErrorResponse response = handler.handleGeneric(ex);

        assertThat(response.getMessage()).doesNotContain("192.168.1.1");
        assertThat(response.getMessage()).doesNotContain("db connection refused");
    }
}
