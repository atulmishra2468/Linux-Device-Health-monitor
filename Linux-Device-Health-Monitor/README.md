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
**Author:** Atul Mishra (`atulmishra2468@gmail.com`)

---

## 2. Project Overview
The **Linux Device Health Monitor** is an end-to-end systems programming project demonstrating the bridge between Linux User Space and Linux Kernel Space. The solution combines:
1. A **Custom Linux Character Device Driver** (`driver/kernel_monitor.c`) that registers a dynamic character device at `/dev/sysmonitor` and implements the fundamental VFS operations: `open()`, `read()`, `write()`, and `release()`.
2. A **Modern C++17 User-Space Dashboard** (`src/`) engineered with object-oriented principles, non-intrusively gathering live CPU, memory, uptime, and process metrics directly from `/proc`, while communicating bidirectionally with the device driver via POSIX file descriptors.

---

## 3. Problem Statement
Systems programmers must master how operating systems isolate user programs from kernel-level hardware operations. While high-level scripting languages abstract these boundaries away, low-level Linux systems programming demands direct interaction with the Virtual File System (VFS), POSIX system calls, memory safety boundaries (`copy_to_user`/`copy_from_user`), and kernel loadable modules. This project provides an educational, production-grade reference architecture illustrating these core tenets.

---

## 4. Objectives
- Develop a loadable Linux kernel module (LKM) in C using standard Linux kernel APIs.
- Dynamically register a character device and automatically create the `/dev/sysmonitor` node using `udev`.
- Implement safe user-kernel data transfer handling memory boundaries.
- Build a modular, Object-Oriented C++17 monitoring application without external runtime dependencies (no Python, no Node.js).
- Parse the `/proc` virtual filesystem directly for real-time CPU, RAM, and process state telemetry.
- Demonstrate Linux File Descriptor mechanics (`File Descriptor = 3`).
- Maintain persistent, thread-safe application event auditing in `logs/system.log`.

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

---

## 9. Hardware Requirements
- **Architecture:** x86_64 or ARM64 (aarch64).
- **Memory:** Minimum 1 GB RAM (2 GB recommended).
- **Disk Space:** 500 MB free disk space for kernel headers and build artifacts.

---

## 10. Software Requirements
- **Operating System:** Ubuntu Linux 20.04 LTS, 22.04 LTS, or 24.04 LTS (or equivalent Linux distro).
- **Kernel Version:** Linux Kernel 5.4 or higher (supports Linux 6.x kernels seamlessly).
- **Required Packages:**
  - `build-essential`
  - `linux-headers-$(uname -r)`
  - `g++` (version 9.3 or newer)
  - `make`
  - `kmod`

---

## 11. Installation
Update packages and install prerequisites on Ubuntu:

```bash
sudo apt update
sudo apt install -y build-essential linux-headers-$(uname -r) g++ make git kmod
```

Verify installed toolchains:
```bash
gcc --version
g++ --version
make --version
uname -r
```

---

## 12. Driver Compilation
Navigate to the `driver/` directory and compile using Kbuild:

```bash
cd driver
make
```

This compiles `kernel_monitor.c` and outputs `kernel_monitor.ko`.

---

## 13. Driver Loading & Verification
Insert the module into the active Linux kernel:

```bash
sudo insmod kernel_monitor.ko
```

Verify that the module is loaded and the device node was generated:
```bash
# 1. Verify kernel module in active module table
lsmod | grep kernel_monitor

# 2. Check kernel log ring buffer
sudo dmesg | grep "Device Health Monitor" | tail -n 5

# 3. Verify character device node created by udev
ls -l /dev/sysmonitor

# 4. Set read/write permissions for normal user access
sudo chmod 666 /dev/sysmonitor
```

---

## 14. Application Compilation
From the project root directory, run the Master Makefile:

```bash
cd ..
make clean
make
```

This compiles `src/*.cpp` into the standalone binary `./monitor`.

---

## 15. Application Execution
Launch the interactive terminal dashboard:

```bash
./monitor
```

---

## 16. Testing

### Tier 1: User-Space Unit Tests (Non-Privileged)
Run all C++ subsystem unit tests without needing kernel root privileges:
```bash
make test
```
Or via modern CMake & CTest:
```bash
mkdir -p build_cmake && cd build_cmake
cmake ..
cmake --build .
ctest --output-on-failure
cd ..
```

### Tier 2: Kernel Integration Test Suite (Privileged)
Execute the complete 14-point end-to-end integration test (requires `sudo` for `insmod` / `rmmod`):
```bash
chmod +x tests/test_driver.sh
sudo ./tests/test_driver.sh
```

---

## 17. Expected Output

### Main Dashboard Menu
```text
========================================
       LINUX DEVICE HEALTH MONITOR      
========================================
Kernel Version : Linux 6.5.0-xx-generic
CPU Cores      : 8
Memory Usage   : 7.2 GB / 16.0 GB
Processes      : 186
System Uptime  : 03:42:21

Driver Status  : CONNECTED (File Descriptor: 3)
----------------------------------------
1. System Information
2. Process Information
3. Driver Test
4. View Logs
5. Exit
----------------------------------------
Enter choice: 
```

### Driver Communication Test (Choice 3)
```text
========================================
     CHARACTER DEVICE DRIVER TEST       
========================================
Target Device : /dev/sysmonitor
Driver connected successfully.
Active File Descriptor = 3

[Linux Concept Explanation]
  The Linux kernel allocated file descriptor #3 in this process's
  file table to reference character device /dev/sysmonitor.

Sending test request to driver...
Driver response: SYS_MONITOR_DRIVER_OK

----------------------------------------
[SUCCESS] Driver communication successful!
Kernel dmesg log updated with process PID 4892.
========================================
```

---

## 18. Project Structure
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

## 19. Linux Concepts Demonstrated
- **User Space vs Kernel Space:** Enforcing hardware privilege levels (Ring 3 vs Ring 0).
- **Virtual File System (VFS):** How Unix models devices as files (`/dev/sysmonitor`).
- **File Descriptors:** The kernel integer indexing the process file table (`fd = 3`).
- **POSIX System Calls:** Direct usage of `open()`, `read()`, `write()`, and `close()`.
- **procfs Pseudo-Filesystem:** Reading live in-memory kernel statistics via `/proc`.
- **Kernel Ring Buffer:** Emitting messages using `printk()` and inspecting them via `dmesg`.

---

## 20. C++ Concepts Demonstrated
- **Object-Oriented Programming:** Modular class design with `SystemMonitor`, `ProcessMonitor`, `DeviceInterface`, and `Logger`.
- **RAII:** Strict resource lifecycle management closing file descriptors automatically.
- **Copy Deletion & Move Semantics:** `= delete` on copy constructors preventing double-close errors; `noexcept` move constructors.
- **Thread Safety:** Utilizing `std::mutex` and `std::lock_guard` for synchronized file writes.
- **Standard Library Algorithms:** Employing `<filesystem>`, `<chrono>`, `<deque>`, and `<algorithm>`.

---

## 21. Device Driver Concepts Demonstrated
- **Loadable Kernel Modules (LKM):** Dynamic insertion (`insmod`) and removal (`rmmod`).
- **Device Numbers:** Major numbers (driver identification) and Minor numbers (device instances) via `alloc_chrdev_region()`.
- **Device Registration:** Initializing `struct cdev` and binding `struct file_operations`.
- **Dynamic Devfs:** Automated node provisioning via `class_create()` and `device_create()`.
- **Memory Safety:** Isolating kernel memory using `copy_to_user()` and `copy_from_user()`.

---

## 22. Limitations
- Does not collect remote network cluster telemetry (designed for single-host Linux monitoring).
- Does not monitor hardware sensors requiring proprietary I2C/SMBus drivers.
- Device permissions require `sudo chmod 666 /dev/sysmonitor` or a customized udev rules file for non-root execution.

---

## 23. Future Scope
- Implement `ioctl()` commands for binary hardware query acceleration.
- Implement `mmap()` support for zero-copy ring buffer sharing between driver and daemon.
- Add an asynchronous event notification mechanism using Linux signals or `epoll()`.

---

## 24. Troubleshooting
| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `insmod: Operation not permitted` | Missing root privileges | Prepend `sudo`: `sudo insmod driver/kernel_monitor.ko` |
| `Failed to open /dev/sysmonitor` | Module not loaded or permissions | Load driver with `insmod` and run `sudo chmod 666 /dev/sysmonitor` |
| `class_create macro error` | Linux kernel signature difference | Handled automatically via `#if LINUX_VERSION_CODE >= KERNEL_VERSION(6,4,0)` |
| `Headers Status: MISSING` | Kernel headers not installed | Run `sudo apt install linux-headers-$(uname -r)` |

---

## 25. GitHub Repository Instructions

### Recommended Commit History Workflow
To maintain a professional, incremental Git history for your capstone submission, run the following commands sequentially:

```bash
# 1. Initialize Git repository
git init

# 2. Commit foundational structure
git add .gitignore Makefile docs/ logs/
git commit -m "Initial project structure and master build system"

# 3. Commit Linux kernel module
git add driver/
git commit -m "Added Linux character device driver with devfs node creation"

# 4. Commit C++ Logger and DeviceInterface
git add include/Logger.hpp src/Logger.cpp include/DeviceInterface.hpp src/DeviceInterface.cpp
git commit -m "Implemented thread-safe Logger and RAII DeviceInterface"

# 5. Commit SystemMonitor and ProcessMonitor
git add include/SystemMonitor.hpp src/SystemMonitor.cpp include/ProcessMonitor.hpp src/ProcessMonitor.cpp
git commit -m "Implemented SystemMonitor and ProcessMonitor procfs parsers"

# 6. Commit Terminal Dashboard
git add src/main.cpp
git commit -m "Added interactive terminal dashboard and driver communication test"

# 7. Commit Integration Test Suite & Documentation
git add tests/ docs/ README.md
git commit -m "Completed 14-point test suite and technical documentation"
```

Pushing to GitHub:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/Linux-Device-Health-Monitor.git
git push -u origin main
```
