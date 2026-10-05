/**
 * @file Logger.cpp
 * @brief Implementation of Logger class
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#include "Logger.hpp"
#include <iostream>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <filesystem>
#include <deque>

namespace sysmon {

Logger::Logger(const std::string& logFilePath)
    : m_logFilePath(logFilePath)
{
    try {
        // Ensure the parent directory (e.g. logs/) exists
        std::filesystem::path pathObj(m_logFilePath);
        if (pathObj.has_parent_path()) {
            std::filesystem::create_directories(pathObj.parent_path());
        }

        // Open in append mode
        m_fileStream.open(m_logFilePath, std::ios::out | std::ios::app);
        if (!m_fileStream.is_open()) {
            std::cerr << "[Logger Error] Unable to open log file at: " << m_logFilePath << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[Logger Exception] " << e.what() << std::endl;
    }
}

Logger::~Logger()
{
    std::lock_guard<std::mutex> lock(m_logMutex);
    if (m_fileStream.is_open()) {
        m_fileStream.flush();
        m_fileStream.close();
    }
}

bool Logger::isOpen() const noexcept
{
    std::lock_guard<std::mutex> lock(m_logMutex);
    return m_fileStream.is_open();
}

std::string Logger::getCurrentTimestamp()
{
    const auto now = std::chrono::system_clock::now();
    const auto inTimeT = std::chrono::system_clock::to_time_t(now);

    std::tm timeInfo{};
    // Use thread-safe POSIX localtime_r
    localtime_r(&inTimeT, &timeInfo);

    std::ostringstream ss;
    ss << std::put_time(&timeInfo, "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

std::string Logger::levelToString(LogLevel level)
{
    switch (level) {
        case LogLevel::INFO:    return "INFO";
        case LogLevel::WARNING: return "WARN";
        case LogLevel::ERROR:   return "ERROR";
        default:                return "UNKNOWN";
    }
}

void Logger::log(LogLevel level, const std::string& message)
{
    std::lock_guard<std::mutex> lock(m_logMutex);
    if (!m_fileStream.is_open()) {
        return;
    }

    m_fileStream << "[" << getCurrentTimestamp() << "] "
                 << "[" << levelToString(level) << "] "
                 << message << "\n";
    m_fileStream.flush();
}

void Logger::logInfo(const std::string& message)
{
    log(LogLevel::INFO, message);
}

void Logger::logWarning(const std::string& message)
{
    log(LogLevel::WARNING, message);
}

void Logger::logError(const std::string& message)
{
    log(LogLevel::ERROR, message);
}

std::vector<std::string> Logger::getRecentLogs(size_t maxLines)
{
    std::lock_guard<std::mutex> lock(m_logMutex);
    std::vector<std::string> results;

    std::ifstream inFile(m_logFilePath);
    if (!inFile.is_open()) {
        return results;
    }

    std::deque<std::string> lineQueue;
    std::string line;
    while (std::getline(inFile, line)) {
        if (!line.empty()) {
            lineQueue.push_back(line);
            if (lineQueue.size() > maxLines) {
                lineQueue.pop_front();
            }
        }
    }

    results.assign(lineQueue.begin(), lineQueue.end());
    return results;
}

} // namespace sysmon
