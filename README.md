 Linux Device Health Monitor

A Linux-based device health monitoring application that provides insights into system performance, resource usage, and overall device health.

 🚀 Features

- 📊 System health monitoring
- 💻 CPU usage monitoring
- 🧠 Memory/RAM usage monitoring
- 💾 Disk usage monitoring
- 🌐 Network monitoring
- ⚡ Real-time system performance information
- 📈 Clean and responsive dashboard
- 🔍 System observability and health insights

 🛠️ Technologies Used

- React.js
- TypeScript
- Vite
- HTML5
- CSS3
- JavaScript
- Linux
- C++
- C

 📂 Project Structure

```text
Linux-Device-Health-monitor/
├── src/
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md


1. Problem Statement
Linux separates user programs from the kernel for security and stability.
Applications cannot directly access kernel memory or internal kernel data.
Students often learn user-space programming and kernel concepts separately, without
seeing the complete communication path.
We needed a practical, end-to-end demonstration of safe user-space ↔ kernel-space
communication.


2. What We Needed to Build
A custom Linux kernel module that can receive and return data.
A device interface accessible from user space.
A C++17 application that communicates with the driver.
System-health information: CPU, RAM, uptime and process memory usage.
Safe memory handling, concurrency protection, logging and testing.


3. Our Solution
We built a custom kernel driver and a C++17 system-monitoring application.
The driver dynamically creates /dev/sysmonitor.
The application communicates using open(), read(), write() and close().
The application reads /proc for CPU, RAM, uptime and process information.
This creates a complete user-space → kernel-space → user-space workflow.


4. How the Solution Works
USER SPACE
C++17 Monitor → SystemMonitor / ProcessMonitor / DeviceInterface / Logger
↓ open / read / write / close
KERNEL SPACE
VFS → /dev/sysmonitor → kernel_monitor.ko
↓
Kernel buffer + mutex protection + copy_to_user/copy_from_user
↓
printk() → dmesg


5. What Problems Were Solved?
✓ User–kernel communication: created a real device interface using /dev/sysmonitor.
✓ System monitoring: collected CPU, RAM and uptime and ranked processes by memory.
✓ Memory safety: controlled 256-byte buffer, clamped writes and safe user-copy functions.
✓ Concurrency: protected shared state with a mutex and used an atomic open counter.
✓ Reliability: added logging, tests, compiler warnings, Makefile/CMake and CI.
✓ Debugging: kernel events can be inspected through dmesg.


6. Result & Judge Demo
The project demonstrates the complete communication path rather than a standalone
monitoring script.
Demo: 1) make driver 2) sudo insmod kernel_monitor.ko 3) ls /dev/sysmonitor
4) dmesg 5) ./monitor 6) sudo rmmod kernel_monitor.ko
Key outcome: a safe, structured and testable bridge between user space and kernel space.


7. Final Takeaway
Problem: User space and kernel space are isolated, making their communication difficult to
understand and implement safely.
Solution: Custom kernel driver + /dev/sysmonitor + C++17 monitor + /proc + safe
memory/concurrency handling.
Impact: A practical end-to-end demonstration of Linux kernel interaction and system health
monitoring.
