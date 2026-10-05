/**
 * @file DeviceInterface.hpp
 * @brief RAII C++ wrapper managing Linux file descriptors for /dev/sysmonitor
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#pragma once

#include <string>
#include <string_view>
#include <memory>
#include "Logger.hpp"

namespace sysmon {

class DeviceInterface {
public:
    /**
     * @brief Constructs DeviceInterface with target device path and optional Logger.
     * Does not automatically open until connect() is called.
     * @param devicePath Path to the device node (default: "/dev/sysmonitor").
     * @param logger Shared pointer or reference to application Logger.
     */
    explicit DeviceInterface(std::string_view devicePath = "/dev/sysmonitor",
                             std::shared_ptr<Logger> logger = nullptr);

    /**
     * @brief Destructor ensures file descriptor is closed (RAII principle).
     */
    ~DeviceInterface();

    // Disable copy semantics to prevent duplicate close() calls on same fd
    DeviceInterface(const DeviceInterface&) = delete;
    DeviceInterface& operator=(const DeviceInterface&) = delete;

    // Allow move semantics
    DeviceInterface(DeviceInterface&& other) noexcept;
    DeviceInterface& operator=(DeviceInterface&& other) noexcept;

    /**
     * @brief Opens /dev/sysmonitor using POSIX open() system call.
     * @return true if device successfully opened, false on error.
     */
    bool connect();

    /**
     * @brief Closes the open file descriptor using close().
     */
    void disconnect();

    /**
     * @brief Reads telemetry/status string from character device.
     * @param buffer Output buffer string.
     * @param maxBytes Maximum bytes to read (default: 256).
     * @return true on success, false on read error.
     */
    bool readData(std::string& buffer, size_t maxBytes = 256);

    /**
     * @brief Writes command string to character device.
     * @param command Text command to send to kernel driver.
     * @return true on success, false on write error.
     */
    bool writeData(const std::string& command);

    /**
     * @brief Checks if device is currently opened with a valid file descriptor.
     */
    [[nodiscard]] bool isConnected() const noexcept;

    /**
     * @brief Returns active Linux file descriptor number (e.g., 3).
     * Returns -1 if not connected.
     */
    [[nodiscard]] int getFileDescriptor() const noexcept;

    /**
     * @brief Returns human-readable error string from last failed operation.
     */
    [[nodiscard]] std::string getLastError() const noexcept;

    /**
     * @brief Returns target device node path (e.g., "/dev/sysmonitor").
     */
    [[nodiscard]] std::string getDevicePath() const noexcept;

private:
    std::string m_devicePath;
    int m_fd{-1}; // -1 indicates closed / invalid file descriptor
    std::string m_lastError;
    std::shared_ptr<Logger> m_logger;

    void log(LogLevel level, const std::string& msg);
};

} // namespace sysmon
