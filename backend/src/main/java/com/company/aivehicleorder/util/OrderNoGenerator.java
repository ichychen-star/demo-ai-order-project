package com.company.aivehicleorder.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class OrderNoGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private OrderNoGenerator() {}

    public static String generate(LocalDate date, long todayOrderCount) {
        return String.format("ORD-%s-%04d", date.format(DATE_FMT), todayOrderCount + 1);
    }
}
