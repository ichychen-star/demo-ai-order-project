package com.company.aivehicleorder.exception;

public class AiParseException extends RuntimeException {

    public AiParseException(String message) {
        super(message);
    }

    public AiParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
