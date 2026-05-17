package com.company.aivehicleorder.util;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class LoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) request;
        HttpServletResponse httpRes = (HttpServletResponse) response;
        long start = System.currentTimeMillis();
        try {
            chain.doFilter(request, response);
        } finally {
            long latency = System.currentTimeMillis() - start;
            log.info("{} {} {} {}ms",
                    httpReq.getMethod(),
                    httpReq.getRequestURI(),
                    httpRes.getStatus(),
                    latency);
        }
    }
}
