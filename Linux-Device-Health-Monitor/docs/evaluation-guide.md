# Linux Device Health Monitor - 5–10 Minute Capstone Evaluation & Defense Guide

This guide provides the exact verbal script, command sequence, and technical answers required for your 5–10 minute capstone demonstration.

---

## 1. Live Demonstration Script (Step-by-Step Flow)

| Step # | Time | Activity | Action / Command | Verbal Talking Point |
| :---: | :---: | :--- | :--- | :--- |
| **1** | 0:00 - 0:45 | **Problem & Objective** | Slide / Spoken Intro | *"My capstone bridges User Space and Kernel Space on Linux. In production systems, software needs real-time hardware telemetry, while the OS enforces strict memory protection between user processes and kernel mode."* |
| **2** | 0:45 - 1:30 | **Architecture Overview** | Show ASCII Diagram | *"We designed a modular C++17 dashboard communicating with the Linux procfs pseudo-filesystem and a custom Linux character device driver at `/dev/sysmonitor`."* |
| **3** | 1:30 - 2:00 | **Project Structure** | `tree -L 2` or `ls -l` | *"We have clean separation: `driver/` for the kernel module in C, `src/` & `include/` for modern C++17 classes, `docs/` for UML diagrams, and `tests/` for our automated test suite."* |
| **4** | 2:00 - 2:30 | **Compile the Driver** | `cd driver && make` | *"The driver uses Kbuild to compile `kernel_monitor.c` against the host kernel headers into a relocatable `.ko` module."* |
| **5** | 2:30 - 3:00 | **Load the Driver** | `sudo insmod kernel_monitor.ko` | *"Using `insmod`, the kernel loads the ELF object, executes `module_init()`, and dynamically allocates an unused Major number."* |
| **6** | 3:00 - 3:30 | **Inspect `/dev/sysmonitor`** | `ls -l /dev/sysmonitor` | *"Notice the leading 'c' in permissions. `class_create` and `device_create` notified udev, automatically creating the device node without needing manual `mknod`."* |
| **7** | 3:30 - 4:00 | **Inspect Kernel Ring Buffer** | `sudo dmesg \| grep "Device Health Monitor"` | *"We inspect `dmesg`. The driver printed registration details to the kernel ring buffer via `printk()`."* |
| **8** | 4:00 - 4:30 | **Compile C++ Application** | `cd .. && make` | *"The root Makefile compiles modern C++17 with `-Wall -Wextra -pedantic` into a fast, standalone binary `./monitor`."* |
| **9** | 4:30 - 5:15 | **Launch Dashboard** | `./monitor` | *"The dashboard renders an ASCII console interface displaying live CPU cores, RAM consumption, uptime, and driver status."* |
| **10**| 5:15 - 6:00 | **System Information (Opt 1)** | Select `1` | *"Option 1 reads `/proc/cpuinfo`, `/proc/meminfo`, and `/proc/uptime` directly through POSIX file streams, without spawning external processes like `top`."* |
| **11**| 6:00 - 6:45 | **Process Information (Opt 2)** | Select `2` | *"Option 2 iterates `/proc/[PID]/stat`, extracting task names, parent PIDs, resident memory, and states like Running, Sleeping, and Zombie."* |
| **12**| 6:45 - 7:45 | **Driver Test (Opt 3)** | Select `3` | *"Here is the core syscall demonstration: the app called `open("/dev/sysmonitor")` which returned POSIX File Descriptor 3. It executed `write()` to send a health check and `read()` to receive confirmation from supervisor mode."* |
| **13**| 7:45 - 8:15 | **View Application Logs (Opt 4)**| Select `4` | *"Our thread-safe `Logger` class recorded each lifecycle event with ISO timestamps in `logs/system.log`."* |
| **14**| 8:15 - 9:00 | **14-Point Automated Suite** | Exit and run `./tests/test_driver.sh` | *"We engineered an automated test runner validating all 14 lifecycle scenarios with 100% pass status."* |
| **15**| 9:00 - 10:00| **Clean Teardown & GitHub** | `sudo rmmod kernel_monitor` & `git log --oneline` | *"On teardown, `rmmod` releases the major number and destroys `/dev/sysmonitor`. The repository features a structured Git commit history."* |

---

## 2. Answers to All 20 Trainer Questions

### Q1: What is a Linux kernel module?
**Answer:** A Linux Kernel Module (LKM) is a compiled binary object (`.ko`) that can be loaded into or unloaded from the running kernel on demand without rebooting the system or recompiling the entire kernel.

### Q2: What is a character device driver?
**Answer:** A character device driver manages devices that read or write data sequentially as a stream of raw, unbuffered bytes (e.g., serial ports, terminal emulators, or our `/dev/sysmonitor`), as opposed to block devices which transfer fixed-size blocks (e.g., hard drives).

### Q3: Why did you use a character device?
**Answer:** Because our monitoring messages and health status strings are sequential byte streams. Character devices are the standard, lightweight Linux mechanism for stream-oriented kernel-to-userland communication.

### Q4: What is `/dev/sysmonitor`?
**Answer:** It is a special device file (node) in the Virtual File System that acts as the entry point for user-space applications to communicate with our custom kernel driver.

### Q5: What is the difference between user space and kernel space?
**Answer:** They are hardware privilege levels enforced by the CPU MMU:
- **User Space (Ring 3):** Unprivileged mode where standard applications execute with isolated virtual address spaces; direct hardware access is blocked.
- **Kernel Space (Ring 0 / Supervisor):** Privileged mode where the Linux kernel and drivers execute with full hardware and memory access.

### Q6: What is a system call?
**Answer:** A system call (syscall) is the programmatic interface that allows a user-space application to request services from the operating system kernel (such as `open()`, `read()`, `write()`, and `close()`), triggering a CPU trap into supervisor mode.

### Q7: What is a file descriptor?
**Answer:** A non-negative integer returned by the kernel when a process opens a file or device. It acts as an index into the process's file descriptor table inside the kernel's `task_struct`.

### Q8: What does `open()` return?
**Answer:** On success, `open()` returns the lowest-numbered unused file descriptor for the process (typically `3` if `0`, `1`, and `2` are standard I/O). On failure, it returns `-1` and sets the global `errno`.

### Q9: What does `insmod` do?
**Answer:** `insmod` is a privileged command that invokes the `finit_module` system call to link and load an ELF kernel object file into kernel address space and execute its `module_init()` function.

### Q10: What does `rmmod` do?
**Answer:** `rmmod` invokes the `delete_module` system call to safely unload an unused module from the kernel, invoking its `module_exit()` cleanup routine and freeing kernel memory.

### Q11: Why is `printk()` used instead of `printf()`?
**Answer:** `printf()` is a user-space C library function dependent on libc and userland stdout streams. Kernel space has no access to libc; it uses `printk()` to log directly to the kernel circular ring buffer with defined log levels (`KERN_INFO`, `KERN_ERR`).

### Q12: What is `dmesg`?
**Answer:** `dmesg` (diagnostic message) is a Linux command-line utility used to view and control the kernel ring buffer, displaying boot-up and driver log messages.

### Q13: How does the C++ application communicate with the driver?
**Answer:** The C++ application uses standard POSIX file operations via the `DeviceInterface` class:
1. `open("/dev/sysmonitor", O_RDWR)` to obtain a file descriptor.
2. `write(fd, ...)` to send commands.
3. `read(fd, ...)` to receive responses.
4. `close(fd)` to disconnect.

### Q14: Why is the driver written in C?
**Answer:** The Linux kernel core and its internal APIs (`cdev`, `sysfs`, `kmalloc`) are authored in C. C provides direct control over memory layout, avoids C++ runtime overhead (like name mangling and RTTI), and is the official standard for kernel modules.

### Q15: Why is the application written in C++?
**Answer:** Modern C++17 provides strong object-oriented encapsulation, RAII for automated resource cleanup (guaranteeing file descriptors close), type safety, the Standard Template Library (`std::vector`, `std::string`, `std::mutex`), and high performance without virtual machine overhead.

### Q16: How is memory information obtained from Linux?
**Answer:** By reading and parsing `/proc/meminfo`, where the kernel exports real-time memory management counters (`MemTotal:`, `MemAvailable:`, and `MemFree:`).

### Q17: How is process information obtained?
**Answer:** By iterating through the `/proc` directory with C++17 `<filesystem>` to find numeric directories corresponding to Process IDs (PIDs), and parsing `/proc/[PID]/stat` for state, name, and parent PID.

### Q18: What happens if the driver is not loaded?
**Answer:** When the application calls `open("/dev/sysmonitor")`, the kernel returns `-1` with `errno = ENOENT` ("No such file or directory"). Our `DeviceInterface` handles this gracefully, logs the warning, and displays `Driver Status: DISCONNECTED` without crashing.

### Q19: What happens when the application calls `open("/dev/sysmonitor")`?
**Answer:** 
1. The VFS resolves the path to the character device inode.
2. The kernel verifies major and minor numbers.
3. The kernel invokes our driver's `dev_open` callback.
4. An entry is allocated in the process's file descriptor table, returning an integer (e.g., `fd = 3`).

### Q20: How do you prevent invalid memory access in the driver?
**Answer:** We never dereference user-space pointers directly. We use `copy_to_user()` and `copy_from_user()`, which check memory access boundaries and page table mappings, returning `-EFAULT` if a pointer is invalid. Buffer sizes are clamped using `min()` to prevent overflows.
