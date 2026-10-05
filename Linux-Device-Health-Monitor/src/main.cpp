/**
 * @file main.cpp
 * @brief Interactive Terminal Dashboard for Linux Device Health Monitor
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#ifndef __linux__
#error "Linux Device Health Monitor is designed to run exclusively on Linux (Kernel 5.x / 6.x)!"
#endif

#include <iostream>
#include <memory>
#include <string>
#include <limits>
#include <unistd.h>     // getpid()
#include "Logger.hpp"
#include "DeviceInterface.hpp"
#include "SystemMonitor.hpp"
#include "ProcessMonitor.hpp"

namespace {

void clearScreen() {
    // Standard ANSI escape sequence to clear terminal screen
    std::cout << "\033[2J\033[1;1H";
}

void printBannerHeader(const sysmon::SystemMonitor& sysMon,
                       const sysmon::ProcessMonitor& procMon,
                       const sysmon::DeviceInterface& dev)
{
    const auto& stats = sysMon.getStats();

    std::cout << "========================================" << std::endl;
    std::cout << "       LINUX DEVICE HEALTH MONITOR      " << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "Kernel Version : " << stats.kernelVersion << std::endl;
    std::cout << "CPU Cores      : " << stats.cpuCoreCount << std::endl;
    std::cout << "Memory Usage   : " 
              << sysmon::SystemMonitor::formatBytes(stats.usedMemoryKB) << " / "
              << sysmon::SystemMonitor::formatBytes(stats.totalMemoryKB) << std::endl;
    std::cout << "Processes      : " << procMon.getTotalProcessCount() << std::endl;
    std::cout << "System Uptime  : " << stats.uptimeFormatted << std::endl;
    std::cout << std::endl;

    if (dev.isConnected()) {
        std::cout << "Driver Status  : CONNECTED (File Descriptor: " << dev.getFileDescriptor() << ")" << std::endl;
    } else {
        std::cout << "Driver Status  : DISCONNECTED (/dev/sysmonitor not open)" << std::endl;
    }
    std::cout << "----------------------------------------" << std::endl;
}

void printMenu() {
    std::cout << "1. System Information" << std::endl;
    std::cout << "2. Process Information" << std::endl;
    std::cout << "3. Driver Test" << std::endl;
    std::cout << "4. View Logs" << std::endl;
    std::cout << "5. Exit" << std::endl;
    std::cout << "----------------------------------------" << std::endl;
    std::cout << "Enter choice: " << std::flush;
}

void waitForEnter() {
    std::cout << "\nPress Enter to return to main menu...";
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::cin.get();
}

} // anonymous namespace

int main() {
    // Step 1: Initialize logging system
    auto logger = std::make_shared<sysmon::Logger>("logs/system.log");
    logger->logInfo("Application started");

    // Step 2: Initialize Core Subsystem Monitors
    sysmon::SystemMonitor sysMonitor(logger);
    sysmon::ProcessMonitor procMonitor(logger);
    sysmon::DeviceInterface devInterface("/dev/sysmonitor", logger);

    // Step 3: Attempt initial connection to character device driver
    if (devInterface.connect()) {
        logger->logInfo("Initial driver connection successful");
    } else {
        logger->logWarning("Initial driver connection skipped: " + devInterface.getLastError());
    }

    bool running = true;
    while (running) {
        // Refresh dynamic metrics before rendering menu
        sysMonitor.refreshStats();
        procMonitor.refreshProcesses();

        clearScreen();
        printBannerHeader(sysMonitor, procMonitor, devInterface);
        printMenu();

        int choice = 0;
        if (!(std::cin >> choice)) {
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            std::cout << "\n[Error] Invalid input. Please enter a number between 1 and 5." << std::endl;
            waitForEnter();
            continue;
        }

        switch (choice) {
            case 1: { // System Information
                logger->logInfo("System information requested by user");
                clearScreen();
                sysMonitor.displaySystemInformation();
                waitForEnter();
                break;
            }

            case 2: { // Process Information
                logger->logInfo("Process information requested by user");
                clearScreen();
                procMonitor.displayProcessInformation();
                waitForEnter();
                break;
            }

            case 3: { // Driver Test
                logger->logInfo("Driver test initiated by user");
                clearScreen();
                std::cout << "========================================" << std::endl;
                std::cout << "     CHARACTER DEVICE DRIVER TEST       " << std::endl;
                std::cout << "========================================" << std::endl;
                std::cout << "Target Device : " << devInterface.getDevicePath() << std::endl;

                // Ensure connection is established
                if (!devInterface.isConnected()) {
                    std::cout << "Opening " << devInterface.getDevicePath() << "..." << std::endl;
                    if (!devInterface.connect()) {
                        std::cout << "\n[FAIL] Unable to connect to driver!" << std::endl;
                        std::cout << "Reason: " << devInterface.getLastError() << std::endl;
                        std::cout << "\nTroubleshooting Tip:" << std::endl;
                        std::cout << "  1. Ensure module is loaded: sudo insmod driver/kernel_monitor.ko" << std::endl;
                        std::cout << "  2. Ensure permissions:      sudo chmod 666 /dev/sysmonitor" << std::endl;
                        waitForEnter();
                        break;
                    }
                }

                std::cout << "Driver connected successfully." << std::endl;
                std::cout << "Active File Descriptor = " << devInterface.getFileDescriptor() << std::endl;
                std::cout << "\n[Linux Concept Explanation]" << std::endl;
                std::cout << "  The Linux kernel allocated file descriptor #" << devInterface.getFileDescriptor() 
                          << " in this process's" << std::endl;
                std::cout << "  file table to reference character device /dev/sysmonitor." << std::endl;

                std::cout << "\nSending test request to driver..." << std::endl;
                const std::string testCmd = "SYS_HEALTH_CHECK_PING";
                if (!devInterface.writeData(testCmd)) {
                    std::cout << "[FAIL] Write error: " << devInterface.getLastError() << std::endl;
                    waitForEnter();
                    break;
                }

                std::string response;
                if (!devInterface.readData(response)) {
                    std::cout << "[FAIL] Read error: " << devInterface.getLastError() << std::endl;
                    waitForEnter();
                    break;
                }

                std::cout << "Driver response: " << response << std::endl;
                std::cout << "\n----------------------------------------" << std::endl;
                std::cout << "[SUCCESS] Driver communication successful!" << std::endl;
                std::cout << "Kernel dmesg log updated with process PID " << getpid() << "." << std::endl;
                std::cout << "========================================" << std::endl;

                waitForEnter();
                break;
            }

            case 4: { // View Logs
                clearScreen();
                std::cout << "============================================================" << std::endl;
                std::cout << "                   APPLICATION LOGS                         " << std::endl;
                std::cout << " File: logs/system.log (Last 20 entries)                     " << std::endl;
                std::cout << "============================================================" << std::endl;

                auto recentLogs = logger->getRecentLogs(20);
                if (recentLogs.empty()) {
                    std::cout << "  [No log entries recorded yet]" << std::endl;
                } else {
                    for (const auto& line : recentLogs) {
                        std::cout << "  " << line << std::endl;
                    }
                }
                std::cout << "============================================================" << std::endl;

                waitForEnter();
                break;
            }

            case 5: { // Exit
                std::cout << "\nTerminating Linux Device Health Monitor..." << std::endl;
                devInterface.disconnect();
                logger->logInfo("Application terminated cleanly by user");
                running = false;
                break;
            }

            default: {
                std::cout << "\n[Error] Invalid choice: " << choice << ". Please enter 1-5." << std::endl;
                waitForEnter();
                break;
            }
        }
    }

    return 0;
}
