/**
 * @file ProcessMonitor.cpp
 * @brief Implementation of ProcessMonitor class with RSS-based sorting
 * 
 * Capstone Project: Linux Device Health Monitor
 * Standard: Modern C++17
 */

#include "ProcessMonitor.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <iomanip>
#include <filesystem>
#include <cctype>
#include <algorithm>

namespace sysmon {

ProcessMonitor::ProcessMonitor(std::shared_ptr<Logger> logger)
    : m_logger(std::move(logger))
{
    // Defer full /proc traversal until refreshProcesses() is called
}

void ProcessMonitor::log(LogLevel level, const std::string& msg)
{
    if (m_logger) {
        m_logger->log(level, msg);
    }
}

std::string ProcessMonitor::stateCharToDescription(char state)
{
    switch (state) {
        case 'R': return "Running";
        case 'S': return "Sleeping";
        case 'D': return "Disk Sleep";
        case 'Z': return "Zombie";
        case 'T': return "Stopped";
        case 't': return "Tracing Stop";
        case 'X': return "Dead";
        case 'I': return "Idle (Kernel)";
        default:  return "Unknown";
    }
}

bool ProcessMonitor::parseProcessEntry(int pid, ProcessInfo& info)
{
    // Path: /proc/[PID]/stat
    std::string statPath = "/proc/" + std::to_string(pid) + "/stat";
    std::ifstream file(statPath);
    if (!file.is_open()) {
        return false;
    }

    std::string content;
    if (!std::getline(file, content)) {
        return false;
    }

    size_t openParen = content.find('(');
    size_t closeParen = content.rfind(')');

    if (openParen == std::string::npos || closeParen == std::string::npos || closeParen <= openParen) {
        return false;
    }

    info.pid = pid;
    info.name = content.substr(openParen + 1, closeParen - openParen - 1);

    std::string remainder = content.substr(closeParen + 1);
    std::istringstream iss(remainder);

    char stateChar = '?';
    int ppid = 0;
    if (iss >> stateChar >> ppid) {
        info.stateChar = stateChar;
        info.state = stateCharToDescription(stateChar);
        info.ppid = ppid;
    } else {
        info.stateChar = '?';
        info.state = "Unknown";
        info.ppid = 0;
    }

    // Extract Resident Set Size (RSS) from /proc/[pid]/status
    std::string statusPath = "/proc/" + std::to_string(pid) + "/status";
    std::ifstream statusFile(statusPath);
    info.rssKB = 0;
    if (statusFile.is_open()) {
        std::string sLine;
        while (std::getline(statusFile, sLine)) {
            if (sLine.rfind("VmRSS:", 0) == 0) {
                std::istringstream sIss(sLine);
                std::string key;
                unsigned long long rss;
                if (sIss >> key >> rss) {
                    info.rssKB = rss;
                }
                break;
            }
        }
    }

    return true;
}

bool ProcessMonitor::refreshProcesses(size_t maxDisplayLimit)
{
    m_processes.clear();
    m_totalProcessCount = 0;

    std::vector<ProcessInfo> parsedProcesses;

    try {
        namespace fs = std::filesystem;
        for (const auto& entry : fs::directory_iterator("/proc")) {
            if (entry.is_directory()) {
                std::string filename = entry.path().filename().string();
                if (!filename.empty() && std::all_of(filename.begin(), filename.end(), ::isdigit)) {
                    m_totalProcessCount++;
                    int pid = std::stoi(filename);
                    ProcessInfo info;
                    if (parseProcessEntry(pid, info)) {
                        parsedProcesses.push_back(std::move(info));
                    }
                }
            }
        }
    } catch (const std::exception& e) {
        log(LogLevel::ERROR, std::string("Error scanning /proc: ") + e.what());
        return false;
    }

    // Sort by Resident Set Size (RSS) in descending order (highest memory first)
    std::sort(parsedProcesses.begin(), parsedProcesses.end(),
              [](const ProcessInfo& a, const ProcessInfo& b) {
                  if (a.rssKB != b.rssKB) {
                      return a.rssKB > b.rssKB;
                  }
                  return a.pid < b.pid;
              });

    if (parsedProcesses.size() > maxDisplayLimit) {
        parsedProcesses.resize(maxDisplayLimit);
    }

    m_processes = std::move(parsedProcesses);
    return true;
}

size_t ProcessMonitor::getTotalProcessCount() const noexcept
{
    return m_totalProcessCount;
}

const std::vector<ProcessInfo>& ProcessMonitor::getProcesses() const noexcept
{
    return m_processes;
}

void ProcessMonitor::displayProcessInformation() const
{
    std::cout << "\n============================================================" << std::endl;
    std::cout << "                 PROCESS INFORMATION                        " << std::endl;
    std::cout << " Total Active Processes : " << m_totalProcessCount << std::endl;
    std::cout << " Displaying Top " << m_processes.size() << " Processes (Sorted by RSS Memory)" << std::endl;
    std::cout << "============================================================" << std::endl;
    std::cout << std::left 
              << std::setw(8)  << "PID"
              << std::setw(8)  << "PPID"
              << std::setw(26) << "PROCESS NAME"
              << std::setw(14) << "STATE"
              << std::setw(10) << "RSS (MB)"
              << std::endl;
    std::cout << "------------------------------------------------------------" << std::endl;

    for (const auto& p : m_processes) {
        double rssMB = static_cast<double>(p.rssKB) / 1024.0;
        std::cout << std::left 
                  << std::setw(8)  << p.pid
                  << std::setw(8)  << p.ppid
                  << std::setw(26) << (p.name.length() > 24 ? p.name.substr(0, 21) + "..." : p.name)
                  << std::setw(14) << p.state
                  << std::fixed << std::setprecision(1) << std::setw(10) << rssMB
                  << std::endl;
    }
    std::cout << "============================================================" << std::endl;
}

} // namespace sysmon
