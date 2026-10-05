/**
 * @file DeviceInterface.cpp
 * @brief Implementation of DeviceInterface class
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#include "DeviceInterface.hpp"
#include <fcntl.h>      // open, O_RDWR
#include <unistd.h>     // close, read, write
#include <cstring>      // strerror
#include <cerrno>       // errno
#include <vector>
#include <sstream>

namespace sysmon {

DeviceInterface::DeviceInterface(std::string_view devicePath, std::shared_ptr<Logger> logger)
    : m_devicePath(devicePath)
    , m_fd(-1)
    , m_logger(std::move(logger))
{
}

DeviceInterface::~DeviceInterface()
{
    disconnect();
}

DeviceInterface::DeviceInterface(DeviceInterface&& other) noexcept
    : m_devicePath(std::move(other.m_devicePath))
    , m_fd(other.m_fd)
    , m_lastError(std::move(other.m_lastError))
    , m_logger(std::move(other.m_logger))
{
    other.m_fd = -1;
}

DeviceInterface& DeviceInterface::operator=(DeviceInterface&& other) noexcept
{
    if (this != &other) {
        disconnect();
        m_devicePath = std::move(other.m_devicePath);
        m_fd = other.m_fd;
        m_lastError = std::move(other.m_lastError);
        m_logger = std::move(other.m_logger);
        other.m_fd = -1;
    }
    return *this;
}

void DeviceInterface::log(LogLevel level, const std::string& msg)
{
    if (m_logger) {
        m_logger->log(level, msg);
    }
}

bool DeviceInterface::connect()
{
    if (isConnected()) {
        return true; // Already connected
    }

    // Call POSIX open() system call on /dev/sysmonitor
    m_fd = ::open(m_devicePath.c_str(), O_RDWR);
    if (m_fd < 0) {
        std::ostringstream ss;
        ss << "Failed to open device '" << m_devicePath << "': " << std::strerror(errno);
        m_lastError = ss.str();
        log(LogLevel::ERROR, m_lastError);
        return false;
    }

    m_lastError.clear();
    std::ostringstream ss;
    ss << "Device connected: " << m_devicePath << " (File Descriptor = " << m_fd << ")";
    log(LogLevel::INFO, ss.str());

    return true;
}

void DeviceInterface::disconnect()
{
    if (m_fd >= 0) {
        int closedFd = m_fd;
        ::close(m_fd);
        m_fd = -1;

        std::ostringstream ss;
        ss << "Device disconnected: " << m_devicePath << " (closed fd " << closedFd << ")";
        log(LogLevel::INFO, ss.str());
    }
}

bool DeviceInterface::readData(std::string& buffer, size_t maxBytes)
{
    buffer.clear();
    if (!isConnected()) {
        m_lastError = "Cannot read: device is not connected";
        log(LogLevel::ERROR, m_lastError);
        return false;
    }

    std::vector<char> rawBuffer(maxBytes + 1, '\0');
    ssize_t bytesRead = ::read(m_fd, rawBuffer.data(), maxBytes);

    if (bytesRead < 0) {
        std::ostringstream ss;
        ss << "Read error on '" << m_devicePath << "': " << std::strerror(errno);
        m_lastError = ss.str();
        log(LogLevel::ERROR, m_lastError);
        return false;
    }

    rawBuffer[bytesRead] = '\0';
    buffer = std::string(rawBuffer.data(), bytesRead);

    // Strip trailing newline for clean display if present
    if (!buffer.empty() && buffer.back() == '\n') {
        buffer.pop_back();
    }

    std::ostringstream ss;
    ss << "Read " << bytesRead << " bytes from driver: '" << buffer << "'";
    log(LogLevel::INFO, ss.str());

    return true;
}

bool DeviceInterface::writeData(const std::string& command)
{
    if (!isConnected()) {
        m_lastError = "Cannot write: device is not connected";
        log(LogLevel::ERROR, m_lastError);
        return false;
    }

    ssize_t bytesWritten = ::write(m_fd, command.c_str(), command.length());
    if (bytesWritten < 0) {
        std::ostringstream ss;
        ss << "Write error on '" << m_devicePath << "': " << std::strerror(errno);
        m_lastError = ss.str();
        log(LogLevel::ERROR, m_lastError);
        return false;
    }

    std::ostringstream ss;
    ss << "Wrote " << bytesWritten << " bytes to driver: '" << command << "'";
    log(LogLevel::INFO, ss.str());

    return true;
}

bool DeviceInterface::isConnected() const noexcept
{
    return (m_fd >= 0);
}

int DeviceInterface::getFileDescriptor() const noexcept
{
    return m_fd;
}

std::string DeviceInterface::getLastError() const noexcept
{
    return m_lastError;
}

std::string DeviceInterface::getDevicePath() const noexcept
{
    return m_devicePath;
}

} // namespace sysmon
