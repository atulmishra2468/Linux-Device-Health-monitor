/**
 * @file test_process_monitor.cpp
 * @brief Unit test verifying ProcessMonitor correctly iterates /proc and extracts tasks
 */

#include "ProcessMonitor.hpp"
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
    std::cout << "=== Testing sysmon::ProcessMonitor ===" << std::endl;

    sysmon::ProcessMonitor procMon;
    bool refreshOk = procMon.refreshProcesses(15);
    TEST_CHECK(refreshOk, "refreshProcesses should succeed on Linux");

    size_t total = procMon.getTotalProcessCount();
    TEST_CHECK(total > 0, "Total process count must be > 0 on a running Linux machine");

    const auto& list = procMon.getProcesses();
    TEST_CHECK(!list.empty(), "Sampled process list should not be empty");

    std::cout << "[PASS] Total active processes found: " << total << std::endl;
    std::cout << "[PASS] Sampled " << list.size() << " top-memory processes successfully." << std::endl;

    // Verify first process has valid PID and name
    TEST_CHECK(list.front().pid > 0, "Process PID must be positive");
    TEST_CHECK(!list.front().name.empty(), "Process name must not be empty");
    std::cout << "[PASS] Top process: PID " << list.front().pid << " (" << list.front().name 
              << ") RSS: " << (list.front().rssKB / 1024.0) << " MB" << std::endl;

    std::cout << "\nTesting displayProcessInformation table formatting:" << std::endl;
    procMon.displayProcessInformation();

    std::cout << "=== ProcessMonitor Test PASSED ===" << std::endl;
    return 0;
}
