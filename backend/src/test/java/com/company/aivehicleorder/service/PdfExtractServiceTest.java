package com.company.aivehicleorder.service;

import com.company.aivehicleorder.exception.AiParseException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PdfExtractServiceTest {

    private PdfExtractService service;

    @BeforeEach
    void setUp() {
        service = new PdfExtractService();
    }

    @Test
    void extract_validTextPdf_returnsNonEmptyText() throws IOException {
        byte[] pdfBytes = createPdfWithText("Wang Order BMW X3 Silver 2026-06");
        MockMultipartFile file = new MockMultipartFile("file", "order.pdf", "application/pdf", pdfBytes);

        String result = service.extract(file);

        assertThat(result).isNotBlank();
        assertThat(result).contains("BMW");
    }

    @Test
    void extract_fileSizeExceedsLimit_throwsMaxUploadSizeExceededException() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getSize()).thenReturn(11L * 1024 * 1024);

        assertThatThrownBy(() -> service.extract(file))
                .isInstanceOf(MaxUploadSizeExceededException.class);
    }

    @Test
    void extract_nonPdfFile_throwsAiParseException() throws IOException {
        byte[] notPdfBytes = "This is a plain text file, not a PDF".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "order.txt", "text/plain", notPdfBytes);

        assertThatThrownBy(() -> service.extract(file))
                .isInstanceOf(AiParseException.class)
                .hasMessageContaining("PDF 格式");
    }

    @Test
    void extract_blankPdf_throwsAiParseException() throws IOException {
        byte[] blankPdfBytes = createBlankPdf();
        MockMultipartFile file = new MockMultipartFile("file", "blank.pdf", "application/pdf", blankPdfBytes);

        assertThatThrownBy(() -> service.extract(file))
                .isInstanceOf(AiParseException.class)
                .hasMessageContaining("文字內容");
    }

    @Test
    void extract_textLongerThan3000Chars_isCappedAt3000() throws IOException {
        String longText = "A".repeat(5000);
        byte[] pdfBytes = createPdfWithText(longText);
        MockMultipartFile file = new MockMultipartFile("file", "long.pdf", "application/pdf", pdfBytes);

        String result = service.extract(file);

        assertThat(result.length()).isLessThanOrEqualTo(3000);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private byte[] createPdfWithText(String text) throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                cs.beginText();
                cs.setFont(font, 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text.length() > 200 ? text.substring(0, 200) : text);
                cs.endText();
            }
            doc.save(out);
            return out.toByteArray();
        }
    }

    private byte[] createBlankPdf() throws IOException {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage());
            doc.save(out);
            return out.toByteArray();
        }
    }
}
