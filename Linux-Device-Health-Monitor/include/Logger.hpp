/**
 * @file Logger.hpp
 * @brief Thread-safe, timestamped logging system for Linux Device Health Monitor
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#pragma once

#include <string>
#include <fstream>
#include <mutex>
#include <vector>

namespace sysmon {

enum class LogLevel {
    INFO,
    WARNING,
    ERROR
};

class Logger {
public:
    /**
     * @brief Constructs Logger and opens target log file in append mode.
     * @param logFilePath Path to log file (default: "logs/system.log").
     */
    explicit Logger(const std::string& logFilePath = "logs/system.log");

    /**
     * @brief Destructor ensures any buffered log data is flushed and closed.
     */
    ~Logger();

    // Disable copy semantics to prevent duplicate file handle operations
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    /**
     * @brief Logs an event with a specific severity level and timestamp.
     */
    void log(LogLevel level, const std::string& message);

    /**
     * @brief Convenience helper methods
     */
    void logInfo(const std::string& message);
    void logWarning(const std::string& message);
    void logError(const std::string& message);

    /**
     * @brief Reads and returns the last N lines from the log file.
     * Used for the terminal menu's "View Logs" feature.
     * @param maxLines Number of trailing lines to retrieve (default: 20).
     */
    std::vector<std::string> getRecentLogs(size_t maxLines = 20);

    /**
     * @brief Checks if the log file was opened successfully.
     */
    [[nodiscard]] bool isOpen() const noexcept;

private:
    std::string m_logFilePath;
    std::ofstream m_fileStream;
    mutable std::mutex m_logMutex;

    /**
     * @brief Generates formatted timestamp: "YYYY-MM-DD HH:MM:SS"
     */
    [[nodiscard]] static std::string getCurrentTimestamp();

    /**
     * @brief Converts LogLevel enum to string representation
     */
    [[nodiscard]] static std::string levelToString(LogLevel level);
};

} // namespace sysmon
