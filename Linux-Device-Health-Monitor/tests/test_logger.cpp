/**
 * @file test_logger.cpp
 * @brief Unit test verifying Logger functionality
 */

#include "Logger.hpp"
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
    std::cout << "=== Testing sysmon::Logger ===" << std::endl;

    sysmon::Logger logger("logs/test.log");
    TEST_CHECK(logger.isOpen(), "Logger should successfully open logs/test.log");

    logger.logInfo("Application initialized successfully");
    logger.logWarning("Device link latency elevated");
    logger.logError("Simulated test error condition");

    auto logs = logger.getRecentLogs(10);
    TEST_CHECK(logs.size() >= 3, "Should have at least 3 log entries");

    std::cout << "[PASS] Successfully wrote and read " << logs.size() << " log entries:" << std::endl;
    for (const auto& line : logs) {
        std::cout << "  " << line << std::endl;
    }

    std::cout << "=== Logger Test PASSED ===" << std::endl;
    return 0;
}
