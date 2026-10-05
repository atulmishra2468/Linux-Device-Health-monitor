/**
 * @file SystemMonitor.hpp
 * @brief Gathers Linux system health metrics directly from /proc pseudo-filesystem
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#pragma once

#include <string>
#include <memory>
#include "Logger.hpp"

namespace sysmon {

struct SystemStats {
    std::string cpuModel;
    int cpuCoreCount{0};
    unsigned long long totalMemoryKB{0};
    unsigned long long availableMemoryKB{0};
    unsigned long long usedMemoryKB{0};
    double memoryUsagePercentage{0.0};
    unsigned long uptimeSeconds{0};
    std::string uptimeFormatted;
    std::string kernelVersion;
};

class SystemMonitor {
public:
    /**
     * @brief Constructs SystemMonitor with an optional Logger reference.
     */
    explicit SystemMonitor(std::shared_ptr<Logger> logger = nullptr);

    ~SystemMonitor() = default;

    /**
     * @brief Refreshes system statistics by querying /proc/cpuinfo, /proc/meminfo,
     * /proc/uptime, and /proc/version.
     * @return true if all primary metrics were parsed successfully.
     */
    bool refreshStats();

    /**
     * @brief Returns the most recently gathered system metrics snapshot.
     */
    [[nodiscard]] const SystemStats& getStats() const noexcept;

    /**
     * @brief Formats and prints a clean, structured system report to standard output.
     */
    void displaySystemInformation() const;

    /**
     * @brief Formats raw kilobytes into human-readable GB or MB string.
     */
    [[nodiscard]] static std::string formatBytes(unsigned long long kilobytes);

    /**
     * @brief Formats seconds into HH:MM:SS format.
     */
    [[nodiscard]] static std::string formatUptime(unsigned long totalSeconds);

private:
    SystemStats m_stats;
    std::shared_ptr<Logger> m_logger;

    bool parseCpuInfo();
    bool parseMemInfo();
    bool parseUptime();
    bool parseKernelVersion();

    void log(LogLevel level, const std::string& msg);
};

} // namespace sysmon
