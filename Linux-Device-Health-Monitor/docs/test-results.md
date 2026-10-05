# Linux Device Health Monitor - Testing & Verification Specification

**Project:** Linux Device Health Monitor – C++ System Monitor & Linux Character Device Driver  
**Author:** Atul Mishra <atulmishra2468@gmail.com>  
**Environment:** Linux (Ubuntu 20.04/22.04/24.04 LTS, Kernel 5.x / 6.x)  
**Compiler:** GCC / G++ (C++17, -Wall -Wextra -pedantic)  

---

## 1. Test Suite Architecture

Testing is split into two distinct tiers:
1. **User-Space Unit Tests (`make test`):**
   - Can be run by any non-root user without loading kernel modules.
   - Tests `Logger`, `SystemMonitor` (`/proc` parser), `ProcessMonitor` (RSS sorting and task extraction), and `DeviceInterface` error-handling when the driver is unattached.
2. **End-to-End Kernel Integration Tests (`sudo ./tests/test_driver.sh`):**
   - Requires kernel module insertion privileges (`CAP_SYS_MODULE` / sudo).
   - Validates the complete 14-step hardware-to-userland lifecycle: compilation, insertion, node creation, file descriptor allocation (`fd = 3`), read, write, procfs traversal, logging, and rmmod cleanup.

---

## 2. 14-Point Test Matrix

| Test ID | Target Component | Execution Command | Verification Criteria | Execution Requirement |
| :---: | :--- | :--- | :--- | :---: |
| **TEST 1** | Kernel Module Build | `make -C driver` | `kernel_monitor.ko` generated with 0 errors | User space |
| **TEST 2** | Kernel Module Loading | `sudo insmod driver/kernel_monitor.ko` | Module listed in `lsmod \| grep kernel_monitor` | Requires `sudo` |
| **TEST 3** | Devfs Node Creation | `ls -l /dev/sysmonitor` | Node exists with type `c` (character device) | Requires `sudo` |
| **TEST 4** | Driver `open()` | `exec 3<>/dev/sysmonitor` | Kernel allocates File Descriptor 3 | Requires `sudo` |
| **TEST 5** | Driver `read()` | `cat /dev/sysmonitor` | Returns `"SYS_MONITOR_DRIVER_OK"` without stray NUL | Requires `sudo` |
| **TEST 6** | Driver `write()` | `echo "..." > /dev/sysmonitor` | Kernel accepts payload and advances offset | Requires `sudo` |
| **TEST 7** | Driver `release()` | `exec 3<&-` | Closes file descriptor cleanly; logged in `dmesg` | Requires `sudo` |
| **TEST 8** | C++ App Build | `make` | Generates `./monitor` executable via C++17 | User space |
| **TEST 9** | C++ App Execution | `echo 5 \| ./monitor` | Launches menu and terminates cleanly with exit code 0 | User space |
| **TEST 10**| System Information | `./build/test_system_monitor` | Successfully reads CPU cores, RAM, and uptime | User space |
| **TEST 11**| Process Information | `./build/test_process_monitor` | Traverses `/proc`, extracts PIDs, sorts by RSS | User space |
| **TEST 12**| Driver Interface Test | `./build/test_device_interface` | Connects, writes command, reads response, disconnects | Requires loaded driver |
| **TEST 13**| Audit Logging | `cat logs/system.log` | Validates ISO timestamps: `[YYYY-MM-DD HH:MM:SS]` | User space |
| **TEST 14**| Driver Unload | `sudo rmmod kernel_monitor` | Node `/dev/sysmonitor` removed; 0 memory leaks | Requires `sudo` |

---

## 3. Running the Tests on Your Machine

### Step A: Run Non-Privileged C++ Unit Tests
```bash
make test
```
*Expected result:*
```text
========================================
 Running C++ Unit Tests
========================================
>>> Running Logger Test...
[PASS] Successfully wrote and read 3 log entries
>>> Running SystemMonitor Test...
[PASS] CPU Core Count:  8
[PASS] Memory Total:    16.0 GB
>>> Running ProcessMonitor Test...
[PASS] Total active processes found: 194
[PASS] Top process: PID 1248 (chrome) RSS: 382.4 MB
>>> Running DeviceInterface Test...
[PASS] Initial state is disconnected (fd = -1)
[PASS] Graceful error handling verified.
========================================
 All C++ Unit Tests Passed!
========================================
```

### Step B: Run Full 14-Point Kernel Integration Test
```bash
sudo ./tests/test_driver.sh
```
*Executes all 14 tests in sequence, verifying Kbuild, insmod, devfs creation, fd allocation, write, read, and rmmod cleanup.*
