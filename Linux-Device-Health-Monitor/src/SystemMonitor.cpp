/**
 * @file SystemMonitor.cpp
 * @brief Implementation of SystemMonitor class
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#include "SystemMonitor.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <iomanip>
#include <sys/utsname.h> // uname()

namespace sysmon {

SystemMonitor::SystemMonitor(std::shared_ptr<Logger> logger)
    : m_logger(std::move(logger))
{
    refreshStats();
}

void SystemMonitor::log(LogLevel level, const std::string& msg)
{
    if (m_logger) {
        m_logger->log(level, msg);
    }
}

bool SystemMonitor::refreshStats()
{
    bool ok = true;
    ok &= parseCpuInfo();
    ok &= parseMemInfo();
    ok &= parseUptime();
    ok &= parseKernelVersion();
    return ok;
}

const SystemStats& SystemMonitor::getStats() const noexcept
{
    return m_stats;
}

bool SystemMonitor::parseCpuInfo()
{
    std::ifstream file("/proc/cpuinfo");
    if (!file.is_open()) {
        log(LogLevel::ERROR, "Unable to open /proc/cpuinfo");
        m_stats.cpuModel = "Unknown";
        m_stats.cpuCoreCount = 1;
        return false;
    }

    std::string line;
    int coreCount = 0;
    std::string modelName;

    while (std::getline(file, line)) {
        if (line.rfind("model name", 0) == 0) {
            auto colonPos = line.find(':');
            if (colonPos != std::string::npos && modelName.empty()) {
                modelName = line.substr(colonPos + 1);
                // Trim leading whitespace
                size_t first = modelName.find_first_not_of(" \t");
                if (first != std::string::npos) {
                    modelName = modelName.substr(first);
                }
            }
        } else if (line.rfind("processor", 0) == 0) {
            coreCount++;
        }
    }

    m_stats.cpuModel = modelName.empty() ? "Generic x86_64 / ARM CPU" : modelName;
    m_stats.cpuCoreCount = (coreCount > 0) ? coreCount : 1;
    return true;
}

bool SystemMonitor::parseMemInfo()
{
    std::ifstream file("/proc/meminfo");
    if (!file.is_open()) {
        log(LogLevel::ERROR, "Unable to open /proc/meminfo");
        return false;
    }

    std::string line;
    unsigned long long memTotal = 0;
    unsigned long long memAvailable = 0;
    unsigned long long memFree = 0;
    unsigned long long buffers = 0;
    unsigned long long cached = 0;

    while (std::getline(file, line)) {
        std::istringstream iss(line);
        std::string key;
        unsigned long long val;
        std::string unit;

        if (iss >> key >> val >> unit) {
            if (key == "MemTotal:") {
                memTotal = val;
            } else if (key == "MemAvailable:") {
                memAvailable = val;
            } else if (key == "MemFree:") {
                memFree = val;
            } else if (key == "Buffers:") {
                buffers = val;
            } else if (key == "Cached:") {
                cached = val;
            }
        }
    }

    // Fallback if MemAvailable not present on older kernels
    if (memAvailable == 0) {
        memAvailable = memFree + buffers + cached;
    }

    m_stats.totalMemoryKB = memTotal;
    m_stats.availableMemoryKB = memAvailable;
    m_stats.usedMemoryKB = (memTotal > memAvailable) ? (memTotal - memAvailable) : 0;

    if (m_stats.totalMemoryKB > 0) {
        m_stats.memoryUsagePercentage = (static_cast<double>(m_stats.usedMemoryKB) /
                                         static_cast<double>(m_stats.totalMemoryKB)) * 100.0;
    } else {
        m_stats.memoryUsagePercentage = 0.0;
    }

    return true;
}

bool SystemMonitor::parseUptime()
{
    std::ifstream file("/proc/uptime");
    if (!file.is_open()) {
        log(LogLevel::ERROR, "Unable to open /proc/uptime");
        m_stats.uptimeSeconds = 0;
        m_stats.uptimeFormatted = "00:00:00";
        return false;
    }

    double uptimeSec = 0.0;
    if (file >> uptimeSec) {
        m_stats.uptimeSeconds = static_cast<unsigned long>(uptimeSec);
        m_stats.uptimeFormatted = formatUptime(m_stats.uptimeSeconds);
        return true;
    }

    return false;
}

bool SystemMonitor::parseKernelVersion()
{
    struct utsname uts{};
    if (uname(&uts) == 0) {
        m_stats.kernelVersion = std::string(uts.sysname) + " " + std::string(uts.release);
        return true;
    }

    // Fallback to /proc/version
    std::ifstream file("/proc/version");
    if (file.is_open()) {
        std::string line;
        if (std::getline(file, line)) {
            m_stats.kernelVersion = line.substr(0, 40) + "...";
            return true;
        }
    }

    m_stats.kernelVersion = "Linux (Unknown version)";
    return false;
}

std::string SystemMonitor::formatBytes(unsigned long long kilobytes)
{
    std::ostringstream ss;
    double gb = static_cast<double>(kilobytes) / (1024.0 * 1024.0);
    if (gb >= 1.0) {
        ss << std::fixed << std::setprecision(1) << gb << " GB";
    } else {
        double mb = static_cast<double>(kilobytes) / 1024.0;
        ss << std::fixed << std::setprecision(0) << mb << " MB";
    }
    return ss.str();
}

std::string SystemMonitor::formatUptime(unsigned long totalSeconds)
{
    unsigned long hours = totalSeconds / 3600;
    unsigned long minutes = (totalSeconds % 3600) / 60;
    unsigned long seconds = totalSeconds % 60;

    std::ostringstream ss;
    ss << std::setfill('0') << std::setw(2) << hours << ":"
       << std::setfill('0') << std::setw(2) << minutes << ":"
       << std::setfill('0') << std::setw(2) << seconds;
    return ss.str();
}

void SystemMonitor::displaySystemInformation() const
{
    std::cout << "\n========================================" << std::endl;
    std::cout << "         SYSTEM INFORMATION             " << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "Kernel Version   : " << m_stats.kernelVersion << std::endl;
    std::cout << "CPU Model        : " << m_stats.cpuModel << std::endl;
    std::cout << "CPU Cores        : " << m_stats.cpuCoreCount << std::endl;
    std::cout << "Memory Total     : " << formatBytes(m_stats.totalMemoryKB) << std::endl;
    std::cout << "Memory Available : " << formatBytes(m_stats.availableMemoryKB) << std::endl;
    std::cout << "Memory Used      : " << formatBytes(m_stats.usedMemoryKB) 
              << " (" << std::fixed << std::setprecision(1) << m_stats.memoryUsagePercentage << "%)" << std::endl;
    std::cout << "System Uptime    : " << m_stats.uptimeFormatted << std::endl;
    std::cout << "========================================" << std::endl;
}

} // namespace sysmon
