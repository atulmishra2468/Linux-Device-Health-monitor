cmake_minimum_required(VERSION 3.16)
project(LinuxDeviceHealthMonitor
    VERSION 1.4.0
    DESCRIPTION "Linux Device Health Monitor - C++ Application with Character Device Driver"
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Operating System Enforcement: Must be Linux
if(NOT CMAKE_SYSTEM_NAME STREQUAL "Linux")
    message(FATAL_ERROR "[FATAL] Linux Device Health Monitor is designed to run exclusively on Linux! Detected: ${CMAKE_SYSTEM_NAME}")
endif()

# Compiler flags
add_compile_options(-Wall -Wextra -pedantic -O2)

# Include directories
include_directories(include)

# Core library
set(CORE_SOURCES
    src/Logger.cpp
    src/DeviceInterface.cpp
    src/SystemMonitor.cpp
    src/ProcessMonitor.cpp
)

add_library(sysmon_core STATIC ${CORE_SOURCES})
target_link_libraries(sysmon_core PUBLIC pthread stdc++fs)

# Main executable
add_executable(monitor src/main.cpp)
target_link_libraries(monitor PRIVATE sysmon_core)

# Testing
enable_testing()

add_executable(test_logger tests/test_logger.cpp)
target_link_libraries(test_logger PRIVATE sysmon_core)
add_test(NAME LoggerTest COMMAND test_logger)

add_executable(test_system_monitor tests/test_system_monitor.cpp)
target_link_libraries(test_system_monitor PRIVATE sysmon_core)
add_test(NAME SystemMonitorTest COMMAND test_system_monitor)

add_executable(test_process_monitor tests/test_process_monitor.cpp)
target_link_libraries(test_process_monitor PRIVATE sysmon_core)
add_test(NAME ProcessMonitorTest COMMAND test_process_monitor)

add_executable(test_device_interface tests/test_device_interface.cpp)
target_link_libraries(test_device_interface PRIVATE sysmon_core)
add_test(NAME DeviceInterfaceTest COMMAND test_device_interface)
