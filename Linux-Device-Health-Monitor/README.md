# Linux Device Health Monitor
> A C++ System Monitoring Application with a Custom Linux Character Device Driver

[![OS: Linux](https://img.shields.io/badge/OS-Linux-orange.svg)](https://www.kernel.org/)
[![Kernel: 5.x / 6.x](https://img.shields.io/badge/Kernel-5.x%20%7C%206.x-blue.svg)](https://www.kernel.org/)
[![C++: Modern C++17](https://img.shields.io/badge/C%2B%2B-17-purple.svg)](https://en.cppreference.com/w/cpp/17)
[![Driver: Character Device](https://img.shields.io/badge/Driver-Char%20Dev-green.svg)](https://docs.kernel.org/)
[![Build: GNU Make](https://img.shields.io/badge/Build-GNU%20Make-brightgreen.svg)](https://www.gnu.org/software/make/)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL%20v2-lightgrey.svg)](LICENSE)

---

## 1. Project Title
**Linux Device Health Monitor – A C++ System Monitoring Application with a Custom Linux Character Device Driver**  


---

## 2. Project Overview
The **Linux Device Health Monitor** is an end-to-end systems programming project demonstrating the bridge between Linux User Space and Linux Kernel Space. The solution combines:
1. A **Custom Linux Character Device Driver** (`driver/kernel_monitor.c`) that registers a dynamic character device at `/dev/sysmonitor` and implements the fundamental VFS operations: `open()`, `read()`, `write()`, and `release()`.
2. A **Modern C++17 User-Space Dashboard** (`src/`) engineered with object-oriented principles, non-intrusively gathering live CPU, memory, uptime, and process metrics directly from `/proc`, while communicating bidirectionally with the device driver via POSIX file descriptors.

---

## 3. Problem Statement
Linux health information is scattered across many command-line tools, with no single live view and no simple way for programs to read it from the kernel. This project builds a complete pipeline, from kernel driver to C++ monitor to React dashboard, so system health can be seen at a glance.

---

## 4. Objectives
Build a kernel driver. Develop a Linux character device driver (/dev/sysmonitor) that exposes system data to user space through a simple file interface.
Collect metrics efficiently. Develop a C++17 monitor that reads live data from the kernel (including /proc) at regular intervals and prepares it for display.
Visualize health live. Create a React dashboard that shows key metrics such as CPU, memory, uptime and load in one easy-to-read view.
Keep the design modular. Separate the driver, monitor and dashboard into independent layers, so each can be tested and improved on its own.
Validate on a real system. Test the full pipeline on Ubuntu Linux and confirm it works from loading the module to viewing the dashboard.
Learn the full stack. Gain hands-on experience with kernel module development, systems programming in C++ and modern frontend development.

---

## 5. Features
- **Real-Time System Telemetry:** Live processor model, core count, memory utilization (Total/Available/Used with percentage), and uptime formatted as `HH:MM:SS`.
- **Process State Accounting:** Enumeration of active Linux tasks, extracting PIDs, PPIDs, executable names, resident memory (RSS), and scheduler states (`Running`, `Sleeping`, `Disk Sleep`, `Zombie`, `Idle`).
- **Interactive Character Device Testing:** Verifies driver communication in user space by sending commands via `write()` and receiving kernel responses via `read()`.
- **File Descriptor Transparency:** Explicitly demonstrates the allocation of file descriptor handles.
- **Thread-Safe Event Logging:** Appends timestamped operational events to `logs/system.log` with an in-app viewer.
- **Fault-Tolerant Error Handling:** Gracefully handles driver disconnection or missing permissions without application crashes.

---

## 6. System Architecture

```
                    LINUX DEVICE HEALTH MONITOR
                              |
               +--------------+--------------+
               |                             |
          USER SPACE                    KERNEL SPACE
               |                             |
       +-------v--------+             +------v---------+
       | C++ Application|             | Kernel Module  |
       |                |             |                |
       | SystemMonitor  |             | Character      |
       | ProcessMonitor |<----------->| Device Driver  |
       | DeviceInterface| /dev/       |                |
       | Logger         | sysmonitor  | open()         |
       +----------------+             | read()         |
                                      | write()        |
                                      | release()      |
                                      +-------+--------+
                                              |
                                              v
                                       Linux Kernel
```

---

## 7. Software Architecture

```
Presentation Layer (Terminal Menu Dashboard - src/main.cpp)
        |
        v
Application Layer (Object-Oriented C++17 Subsystems)
        |
        +-- SystemMonitor  (Parses /proc/cpuinfo, /proc/meminfo, /proc/uptime)
        +-- ProcessMonitor (Iterates /proc/[PID]/stat and /proc/[PID]/status)
        +-- DeviceInterface (Wraps open, read, write, close with RAII)
        +-- Logger         (Thread-safe mutex-locked file logger)
        |
        v
Linux Virtual File System (VFS)
        |
        +-- /proc/ pseudo-filesystem
        +-- POSIX system calls (sys_open, sys_read, sys_write, sys_close)
        +-- /dev/sysmonitor (Character Device Node)
        |
        v
Linux Kernel Space (driver/kernel_monitor.ko)
        |
        +-- file_operations dispatch table (dev_open, dev_read, dev_write, dev_release)
        +-- copy_to_user / copy_from_user memory isolation
        +-- printk() circular ring buffer (dmesg)
```

---

## 8. Technologies Used
- **Programming Languages:** Pure C (Linux Kernel Module) & Modern C++17 (User-Space Application).
- **Compilers:** GCC (Kernel Module) and G++ (C++17 Application).
- **Build Systems:** Linux Kbuild (for `.ko`) and GNU Make (for C++ Application).
- **Linux Subsystems:** VFS, udev, sysfs (`/sys`), procfs (`/proc`), printk ring buffer.





## 9. Project Structure
```text
Linux-Device-Health-Monitor/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI workflow
├── .gitignore
├── CMakeLists.txt               # Modern CMake & CTest build configuration
├── Makefile                     # Master Makefile (app, driver, test targets)
├── README.md                    # Complete 25-section project specification
├── driver/
│   ├── kernel_monitor.c         # Synchronized character device driver (mutex, atomic_t)
│   └── Makefile                 # Kbuild module Makefile
├── include/
│   ├── DeviceInterface.hpp      # RAII Linux File Descriptor Wrapper for /dev/sysmonitor
│   ├── SystemMonitor.hpp        # /proc parsing system telemetry collector
│   ├── ProcessMonitor.hpp       # /proc/[PID] task accounting and RSS sorter
│   └── Logger.hpp               # Thread-safe mutex-locked event logger
├── src/
│   ├── main.cpp                 # Interactive terminal dashboard & test runner
│   ├── DeviceInterface.cpp      # POSIX open(), read(), write(), close() handling
│   ├── SystemMonitor.cpp        # Stream parsing for /proc/cpuinfo, /proc/meminfo
│   ├── ProcessMonitor.cpp       # Process iterator with RSS descending sort
│   └── Logger.cpp               # Appends ISO timestamped logs to logs/system.log
├── docs/
│   └── test-results.md          # 14-Point Test verification specification
├── logs/
│   └── system.log               # Runtime application event log
└── tests/
    ├── test_driver.sh           # Automated 14-point kernel integration test script
    ├── test_logger.cpp          # Unit test for Logger subsystem
    ├── test_device_interface.cpp# Unit test for DeviceInterface subsystem
    ├── test_system_monitor.cpp  # Unit test for SystemMonitor procfs parser
    └── test_process_monitor.cpp # Unit test for ProcessMonitor RSS sorter
```

---

