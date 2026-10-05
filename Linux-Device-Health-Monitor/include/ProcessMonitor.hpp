/**
 * @file ProcessMonitor.hpp
 * @brief Inspects active Linux processes by traversing /proc/[PID] entries
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#pragma once

#include <string>
#include <vector>
#include <memory>
#include "Logger.hpp"

namespace sysmon {

struct ProcessInfo {
    int pid{0};
    int ppid{0};
    std::string name;
    std::string state; // e.g. "Running", "Sleeping", "Zombie"
    char stateChar{'?'};
    unsigned long long rssKB{0}; // Resident Set Size in KB
};

class ProcessMonitor {
public:
    /**
     * @brief Constructs ProcessMonitor with an optional Logger reference.
     */
    explicit ProcessMonitor(std::shared_ptr<Logger> logger = nullptr);

    ~ProcessMonitor() = default;

    /**
     * @brief Traverses /proc directory, counts processes, and collects snapshot.
     * @param maxDisplayLimit Limit of processes to retain for table display (default: 15).
     * @return true if traversal succeeded.
     */
    bool refreshProcesses(size_t maxDisplayLimit = 15);

    /**
     * @brief Returns total number of active processes found in /proc.
     */
    [[nodiscard]] size_t getTotalProcessCount() const noexcept;

    /**
     * @brief Returns the snapshot of processes collected during last refresh.
     */
    [[nodiscard]] const std::vector<ProcessInfo>& getProcesses() const noexcept;

    /**
     * @brief Formats and prints a clean, tabular process table to standard output.
     */
    void displayProcessInformation() const;

    /**
     * @brief Converts single-character Linux process state to descriptive string.
     */
    [[nodiscard]] static std::string stateCharToDescription(char state);

private:
    std::vector<ProcessInfo> m_processes;
    size_t m_totalProcessCount{0};
    std::shared_ptr<Logger> m_logger;

    bool parseProcessEntry(int pid, ProcessInfo& info);
    void log(LogLevel level, const std::string& msg);
};

} // namespace sysmon
