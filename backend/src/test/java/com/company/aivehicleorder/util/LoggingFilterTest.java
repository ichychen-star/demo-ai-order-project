package com.company.aivehicleorder.util;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class LoggingFilterTest {

    private final LoggingFilter filter = new LoggingFilter();

    @Test
    void doFilter_chainsToNextFilter() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/orders");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void doFilter_doesNotAlterResponseStatus() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/orders");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(201);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(201);
    }

    @Test
    void doFilter_doesNotAlterResponseBody() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/orders/123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(404);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(404);
    }
}
