package com.company.aivehicleorder.repository;

import com.company.aivehicleorder.entity.Vehicle;
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
class VehicleRepositoryTest {

    @Autowired
    private VehicleRepository vehicleRepository;

    // ── helpers ─────────────────────────────────────────────────────────────

    private Vehicle buildVehicle(String brand, String model, boolean active) {
        Vehicle v = new Vehicle();
        v.setBrand(brand);
        v.setModel(model);
        v.setBasePrice(new BigDecimal("2000000"));
        v.setActive(active);
        v.setCreatedAt(LocalDateTime.now());
        return v;
    }

    // ── TASK-BE-002 acceptance criteria ─────────────────────────────────────

    @Test
    void findAllByActiveTrueOrderByBrandAscModelAsc_returnsOnlyActiveVehicles() {
        vehicleRepository.saveAll(List.of(
                buildVehicle("BMW",    "X3",  true),
                buildVehicle("Audi",   "Q5",  true),
                buildVehicle("Toyota", "Camry", false)   // inactive — must be excluded
        ));

        List<Vehicle> result = vehicleRepository.findAllByActiveTrueOrderByBrandAscModelAsc();

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Vehicle::getBrand).doesNotContain("Toyota");
    }

    @Test
    void findAllByActiveTrueOrderByBrandAscModelAsc_sortsByBrandThenModel() {
        vehicleRepository.saveAll(List.of(
                buildVehicle("BMW",  "X4", true),
                buildVehicle("BMW",  "X3", true),
                buildVehicle("Audi", "Q5", true)
        ));

        List<Vehicle> result = vehicleRepository.findAllByActiveTrueOrderByBrandAscModelAsc();

        assertThat(result).extracting(Vehicle::getBrand).containsExactly("Audi", "BMW", "BMW");
        assertThat(result).extracting(Vehicle::getModel).containsExactly("Q5", "X3", "X4");
    }

    @Test
    void findAllByActiveTrueOrderByBrandAscModelAsc_returnsEmptyWhenNoneActive() {
        vehicleRepository.save(buildVehicle("BMW", "X3", false));

        List<Vehicle> result = vehicleRepository.findAllByActiveTrueOrderByBrandAscModelAsc();

        assertThat(result).isEmpty();
    }

    @Test
    void entityFieldMapping_allColumnsRoundtrip() {
        Vehicle saved = vehicleRepository.save(buildVehicle("Mercedes-Benz", "GLC 300 Coupe", true));
        vehicleRepository.flush();

        Vehicle found = vehicleRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getBrand()).isEqualTo("Mercedes-Benz");
        assertThat(found.getModel()).isEqualTo("GLC 300 Coupe");
        assertThat(found.getBasePrice()).isEqualByComparingTo(new BigDecimal("2000000"));
        assertThat(found.isActive()).isTrue();
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getId()).isNotNull();
    }
}
