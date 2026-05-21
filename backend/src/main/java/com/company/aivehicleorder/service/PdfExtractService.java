package com.company.aivehicleorder.service;

import com.company.aivehicleorder.exception.AiParseException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class PdfExtractService {

    private static final Logger log = LoggerFactory.getLogger(PdfExtractService.class);
    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    private static final int MAX_PAGES = 5;
    private static final int OUTPUT_CHAR_LIMIT = 3000;

    public String extract(MultipartFile file) {
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new MaxUploadSizeExceededException(MAX_FILE_BYTES);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new AiParseException("PDF 檔案讀取失敗，請重新上傳。", e);
        }

        if (!hasPdfMagicBytes(bytes)) {
            throw new AiParseException("上傳的檔案不是有效的 PDF 格式。");
        }

        String text = extractText(bytes);

        if (text.isBlank()) {
            throw new AiParseException("PDF 無可讀取的文字內容，請確認非掃描版本。");
        }

        String result = text.length() > OUTPUT_CHAR_LIMIT ? text.substring(0, OUTPUT_CHAR_LIMIT) : text;
        log.debug("PDF extracted: pages≤{}, chars={}", MAX_PAGES, result.length());
        return result;
    }

    private String extractText(byte[] bytes) {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            int pageCount = Math.min(doc.getNumberOfPages(), MAX_PAGES);
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(pageCount);
            String raw = stripper.getText(doc);
            return raw == null ? "" : raw.strip();
        } catch (IOException e) {
            throw new AiParseException("PDF 文字擷取失敗，請確認檔案格式正確。", e);
        }
    }

    private static boolean hasPdfMagicBytes(byte[] bytes) {
        return bytes != null && bytes.length >= 4
                && bytes[0] == 0x25   // %
                && bytes[1] == 0x50   // P
                && bytes[2] == 0x44   // D
                && bytes[3] == 0x46;  // F
    }
}
