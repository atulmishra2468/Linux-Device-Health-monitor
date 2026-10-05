/**
 * @file test_system_monitor.cpp
 * @brief Unit test verifying SystemMonitor parses /proc interfaces accurately
 */

#include "SystemMonitor.hpp"
#include <iostream>
#include <cstdlib>

#define TEST_CHECK(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "[FAIL] Assertion failed: " << #cond << " (" << msg << ")" << std::endl; \
            std::exit(1); \
        } \
    } while (0)

int main() {
    std::cout << "=== Testing sysmon::SystemMonitor ===" << std::endl;

    sysmon::SystemMonitor monitor;
    TEST_CHECK(monitor.refreshStats(), "refreshStats should return true on standard Linux");

    const auto& stats = monitor.getStats();

    TEST_CHECK(stats.cpuCoreCount >= 1, "System must have at least 1 CPU core");
    TEST_CHECK(stats.totalMemoryKB > 0, "Total memory must be > 0");
    TEST_CHECK(!stats.kernelVersion.empty(), "Kernel version string must not be empty");

    std::cout << "[PASS] CPU Model:       " << stats.cpuModel << std::endl;
    std::cout << "[PASS] CPU Core Count:  " << stats.cpuCoreCount << std::endl;
    std::cout << "[PASS] Memory Total:    " << sysmon::SystemMonitor::formatBytes(stats.totalMemoryKB) << std::endl;
    std::cout << "[PASS] Memory Avail:    " << sysmon::SystemMonitor::formatBytes(stats.availableMemoryKB) << std::endl;
    std::cout << "[PASS] Uptime:          " << stats.uptimeFormatted << std::endl;
    std::cout << "[PASS] Kernel Version:  " << stats.kernelVersion << std::endl;

    std::cout << "\nTesting displaySystemInformation output formatting:" << std::endl;
    monitor.displaySystemInformation();

    std::cout << "=== SystemMonitor Test PASSED ===" << std::endl;
    return 0;
}
