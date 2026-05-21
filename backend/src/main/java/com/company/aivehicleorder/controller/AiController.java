package com.company.aivehicleorder.controller;

import com.company.aivehicleorder.ai.AiOrchestrationService;
import com.company.aivehicleorder.dto.request.AiParseTextRequest;
import com.company.aivehicleorder.dto.response.AiParseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI", description = "AI-powered order parsing endpoints")
public class AiController {

    private final AiOrchestrationService aiOrchestrationService;

    public AiController(AiOrchestrationService aiOrchestrationService) {
        this.aiOrchestrationService = aiOrchestrationService;
    }

    @PostMapping("/parse-text")
    @Operation(summary = "Parse order from text", description = "Extracts structured order fields from free-form customer text using AI")
    public AiParseResponse parseText(@Valid @RequestBody AiParseTextRequest request) {
        return aiOrchestrationService.parseOrderFromText(request.getSourceText());
    }

    @PostMapping(value = "/parse-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Parse order from PDF", description = "Extracts text from a PDF file and parses it into structured order fields using AI")
    public AiParseResponse parsePdf(@RequestParam("file") MultipartFile file) {
        return aiOrchestrationService.parseOrderFromPdf(file);
    }
}
