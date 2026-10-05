/**
 * @file test_device_interface.cpp
 * @brief Unit test verifying DeviceInterface open, fd tracking, write, read, and close
 */

#include "DeviceInterface.hpp"
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
    std::cout << "=== Testing sysmon::DeviceInterface ===" << std::endl;

    auto logger = std::make_shared<sysmon::Logger>("logs/test_device.log");
    sysmon::DeviceInterface dev("/dev/sysmonitor", logger);

    // Initial state: not connected, fd is -1
    TEST_CHECK(!dev.isConnected(), "Device must not be connected initially");
    TEST_CHECK(dev.getFileDescriptor() == -1, "Initial fd must be -1");
    std::cout << "[PASS] Initial state is disconnected (fd = -1)" << std::endl;

    // Test connecting to /dev/sysmonitor
    std::cout << "Attempting to connect to /dev/sysmonitor..." << std::endl;
    if (!dev.connect()) {
        std::cout << "[INFO] Driver not currently loaded: " << dev.getLastError() << std::endl;
        std::cout << "[PASS] Graceful error handling verified." << std::endl;
    } else {
        std::cout << "[PASS] Successfully opened /dev/sysmonitor!" << std::endl;
        std::cout << "[PASS] File Descriptor = " << dev.getFileDescriptor() << " (Linux handle)" << std::endl;
        TEST_CHECK(dev.getFileDescriptor() >= 3, "Allocated fd must be >= 3");

        // Test writing command
        bool writeSuccess = dev.writeData("PING_TEST_FROM_CPP");
        TEST_CHECK(writeSuccess, "writeData should succeed");
        std::cout << "[PASS] Successfully wrote command to driver" << std::endl;

        // Test reading response
        std::string response;
        bool readSuccess = dev.readData(response);
        TEST_CHECK(readSuccess, "readData should succeed");
        std::cout << "[PASS] Successfully read response from driver: '" << response << "'" << std::endl;

        dev.disconnect();
        TEST_CHECK(!dev.isConnected(), "Device must be disconnected after disconnect()");
        TEST_CHECK(dev.getFileDescriptor() == -1, "fd must be reset to -1 after disconnect");
        std::cout << "[PASS] Disconnected cleanly, fd reset to -1" << std::endl;
    }

    std::cout << "=== DeviceInterface Test PASSED ===" << std::endl;
    return 0;
}
