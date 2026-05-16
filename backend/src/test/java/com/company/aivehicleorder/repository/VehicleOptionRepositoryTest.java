package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.VehicleOption;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VehicleOptionRepositoryTest {

    @Autowired
    private VehicleOptionRepository vehicleOptionRepository;

    // ── helpers ─────────────────────────────────────────────────────────────

    private VehicleOption buildOption(String name, BigDecimal price, boolean active) {
        VehicleOption o = new VehicleOption();
        o.setName(name);
        o.setPrice(price);
        o.setActive(active);
        o.setCreatedAt(LocalDateTime.now());
        return o;
    }

    // ── TASK-BE-002 acceptance criteria ─────────────────────────────────────

    @Test
    void findAllByActiveTrueOrderByNameAsc_returnsOnlyActiveOptions() {
        vehicleOptionRepository.saveAll(List.of(
                buildOption("AMG Line",    new BigDecimal("180000"), true),
                buildOption("夜色套件",      new BigDecimal("120000"), true),
                buildOption("停產套件",      new BigDecimal("50000"),  false)  // inactive — excluded
        ));

        List<VehicleOption> result = vehicleOptionRepository.findAllByActiveTrueOrderByNameAsc();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(VehicleOption::getName).doesNotContain("停產套件");
    }

    @Test
    void findAllByActiveTrueOrderByNameAsc_sortsByNameAscending() {
        vehicleOptionRepository.saveAll(List.of(
                buildOption("夜色套件",   new BigDecimal("120000"), true),
                buildOption("AMG Line", new BigDecimal("180000"), true),
                buildOption("HUD 抬頭顯示", new BigDecimal("70000"), true)
        ));

        List<VehicleOption> result = vehicleOptionRepository.findAllByActiveTrueOrderByNameAsc();

        // ASCII ordering: 'A' < 'H' < multi-byte CJK
        assertThat(result.get(0).getName()).isEqualTo("AMG Line");
        assertThat(result.get(1).getName()).isEqualTo("HUD 抬頭顯示");
    }

    @Test
    void findAllByActiveTrueOrderByNameAsc_returnsEmptyWhenNoneActive() {
        vehicleOptionRepository.save(buildOption("Old Option", new BigDecimal("10000"), false));

        List<VehicleOption> result = vehicleOptionRepository.findAllByActiveTrueOrderByNameAsc();

        assertThat(result).isEmpty();
    }

    @Test
    void entityFieldMapping_allColumnsRoundtrip() {
        VehicleOption saved = vehicleOptionRepository.save(
                buildOption("Burmester 音響", new BigDecimal("90000"), true));
        vehicleOptionRepository.flush();

        VehicleOption found = vehicleOptionRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getName()).isEqualTo("Burmester 音響");
        assertThat(found.getPrice()).isEqualByComparingTo(new BigDecimal("90000"));
        assertThat(found.isActive()).isTrue();
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getId()).isNotNull();
    }
}
