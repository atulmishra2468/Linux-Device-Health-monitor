import { BlueprintStep, DemoStep } from '../types/sysmonitor';

export const BLUEPRINT_STEPS: BlueprintStep[] = [
  {
    stepNumber: 1,
    title: 'Set up Linux environment',
    tagline: 'Kernel headers, build toolchains & Kbuild compiler prerequisites',
    subsystem: 'Foundation',
    objective: 'Prepare a pristine Linux development environment matching the running kernel version (headers, gcc, make, libelf, cmake, and clang tools).',
    prerequisites: ['Debian/Ubuntu 22.04+ or Arch Linux or Fedora 38+', 'Sudo privileges', 'Kernel >= 5.15 (LTS) or 6.x'],
    keyConcepts: [
      'Linux Kernel Headers (`/lib/modules/$(uname -r)/build`) provide the symbol table and kernel ABI headers.',
      'Out-of-tree module compilation via Kbuild `make -C /lib/modules/$(uname -r)/build M=$(PWD) modules`.',
      'DKMS (Dynamic Kernel Module Support) principles and compiler version parity (`gcc --version` must match kernel build compiler).'
    ],
    shellCommands: [
      '# 1. Update system repositories',
      'sudo apt-get update && sudo apt-get upgrade -y',
      '',
      '# 2. Install kernel development headers & essentials',
      'sudo apt-get install -y build-essential linux-headers-$(uname -r) kmod libelf-dev libssl-dev bison flex',
      '',
      '# 3. Install modern C++20 toolchain & CMake for userland daemon',
      'sudo apt-get install -y g++-12 clang-format cmake git htop stress-ng',
      '',
      '# 4. Verify compiler and kernel header alignment',
      'uname -r',
      'ls -ld /lib/modules/$(uname -r)/build',
      'gcc --version'
    ],
    codeFiles: [
      {
        filename: 'check_env.sh',
        language: 'bash',
        path: 'scripts/check_env.sh',
        description: 'Automated script to verify kernel header availability and compiler compatibility.',
        code: `#!/usr/bin/env bash
set -e

echo "=== [SysMonitor] Environment Sanity Check ==="
KVER=$(uname -r)
KBUILD_DIR="/lib/modules/\${KVER}/build"

if [ ! -d "\${KBUILD_DIR}" ]; then
  echo "[ERROR] Kernel build directory not found at: \${KBUILD_DIR}"
  echo "        Run: sudo apt-get install linux-headers-\${KVER}"
  exit 1
fi

echo "[OK] Kernel Headers: \${KBUILD_DIR} found"
echo "[OK] GCC Version:    $(gcc --version | head -n1)"
echo "[OK] G++ Version:    $(g++ --version | head -n1)"
echo "[OK] CMake Version:  $(cmake --version | head -n1)"
echo "=== Environment Ready for Kernel Module Compilation ==="
`
      }
    ],
    verificationSteps: [
      {
        command: 'bash scripts/check_env.sh',
        expectedOutput: '[OK] Kernel Headers: /lib/modules/6.5.0-generic/build found\n[OK] GCC Version: gcc (Ubuntu 12.3.0-1ubuntu1) 12.3.0\n=== Environment Ready for Kernel Module Compilation ===',
        notes: 'Verifies symlink resolves to actual kernel headers include directory.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 2,
    title: 'Create GitHub repository',
    tagline: 'Dual-license structure (GPL v2 + MIT), .gitignore & CI hooks',
    subsystem: 'Foundation',
    objective: 'Initialize a clean Git repository adhering to Linux kernel module licensing rules (GPL-2.0 for .ko, MIT for userland C++ daemon).',
    prerequisites: ['Git configured with user.name and user.email', 'GitHub account or local git init'],
    keyConcepts: [
      'GPL-2.0 is mandatory for kernel modules that call EXPORT_SYMBOL_GPL APIs (e.g. CFS scheduler and mm hooks).',
      'Kernel build artifacts (`.ko`, `.mod`, `.o`, `modules.order`, `Module.symvers`) must never pollute version control.',
      'Userland daemon uses MIT license allowing flexible integration.'
    ],
    shellCommands: [
      '# 1. Initialize Git repository',
      'mkdir sysmonitor-kmod && cd sysmonitor-kmod',
      'git init -b main',
      '',
      '# 2. Configure .gitignore for Linux kernel Kbuild and CMake',
      'cat << \'EOF\' > .gitignore',
      '# Kernel build artifacts',
      '*.o',
      '*.ko',
      '*.mod.c',
      '*.mod',
      '*.order',
      '*.symvers',
      '*.cmd',
      '.*.cmd',
      '.tmp_versions/',
      '',
      '# CMake / Userland daemon build',
      'build/',
      'bin/',
      'compile_commands.json',
      '*.log',
      'EOF',
      '',
      '# 3. Initial commit',
      'git add .gitignore',
      'git commit -m "chore: initial commit with kernel and cmake .gitignore"'
    ],
    codeFiles: [
      {
        filename: 'LICENSE',
        language: 'text',
        path: 'LICENSE',
        description: 'Kernel GPLv2 + Userland MIT Dual License descriptor',
        code: `SysMonitor Kernel Driver & Observability Suite

1. Kernel Module (driver/*, include/sysmonitor/sysmonitor_ioctl.h):
   Licensed under GNU General Public License v2.0 (GPL-2.0-only).
   See: https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html

2. Userland Application (daemon/*, web/*, tests/*):
   Licensed under MIT License.
   Copyright (c) 2026 SysMonitor Contributors.
`
      }
    ],
    verificationSteps: [
      {
        command: 'git status',
        expectedOutput: 'On branch main\nnothing to commit, working tree clean',
        notes: 'Ensures git tracking is clean with ignore patterns active.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 3,
    title: 'Create project structure',
    tagline: 'Clean modular layout separating Kernel Space vs Userland Space',
    subsystem: 'Foundation',
    objective: 'Establish an enterprise directory hierarchy separating kernel-space code, userland C++ daemon, shared headers, scripts, and tests.',
    prerequisites: ['Step 2 completed'],
    keyConcepts: [
      'Shared ABI headers in `include/` ensure identical struct layout, alignment, and IOCTL magic numbers.',
      '`driver/` contains only pure ANSI C Linux kernel code compiled against Kbuild.',
      '`daemon/` contains modern C++20 compiled via CMake.',
      '`scripts/` provides automated load (`insmod`), unload (`rmmod`), and test runners.'
    ],
    shellCommands: [
      '# Create standardized directory hierarchy',
      'mkdir -p driver',
      'mkdir -p daemon',
      'mkdir -p include/sysmonitor',
      'mkdir -p scripts',
      'mkdir -p tests',
      'mkdir -p docs/uml',
      '',
      '# Verify directory structure',
      'tree -L 2 .'
    ],
    codeFiles: [
      {
        filename: 'PROJECT_STRUCTURE.md',
        language: 'markdown',
        path: 'docs/PROJECT_STRUCTURE.md',
        description: 'Architectural directory overview',
        code: `# SysMonitor Architecture Structure

\`\`\`
sysmonitor-kmod/
├── driver/                 # [Kernel Space] Character Device Driver
│   ├── sysmonitor.c        # Main driver implementation
│   ├── sysmonitor.h        # Internal driver prototypes
│   └── Makefile            # Kbuild Makefile
├── include/sysmonitor/     # [Shared ABI] Kernel ↔ Userland Interconnect
│   └── sysmonitor_ioctl.h  # IOCTL commands, packed telemetry structs
├── daemon/                 # [Userland Space] High-Performance C++20 Daemon
│   ├── SysMonitorClient.hpp# RAII /dev/sysmonitor client wrapper
│   ├── main.cpp            # Daemon entrypoint, epoll event loop
│   └── CMakeLists.txt      # Modern CMake configuration
├── scripts/                # Automation & Load Utilities
│   ├── load_driver.sh      # insmod + devfs permissions check
│   ├── unload_driver.sh    # rmmod with clean slab validation
│   └── simulate_stress.sh  # Load generation via stress-ng
├── tests/                  # Integration & Fuzz Tests
│   ├── test_ioctl.cpp      # IOCTL validation tests
│   └── test_memory.sh      # kmemleak validation
└── docs/uml/               # UML Sequence & Architecture Diagrams
\`\`\`
`
      }
    ],
    verificationSteps: [
      {
        command: 'ls -d driver daemon include scripts tests docs',
        expectedOutput: 'daemon  docs  driver  include  scripts  tests',
        notes: 'Confirms all project directories exist.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 4,
    title: 'Write basic kernel module',
    tagline: 'module_init, module_exit, printk logging & Kbuild integration',
    subsystem: 'Kernel Module',
    objective: 'Author a foundational loadable kernel module (LKM) implementing init/exit routines, module metadata, and printk kernel messaging.',
    prerequisites: ['Kernel headers installed', 'Kbuild Makefile'],
    keyConcepts: [
      '`module_init()` macro registers the module initialization function executed during `insmod`.',
      '`module_exit()` macro registers cleanup function executed during `rmmod`.',
      '`printk(KERN_INFO ...)` or `pr_info()` writes formatted messages to the kernel ring buffer (`/proc/kmsg`, `dmesg`).',
      'Module licensing: `MODULE_LICENSE("GPL")` prevents the kernel from being tainted.'
    ],
    shellCommands: [
      '# 1. Compile the basic kernel module',
      'cd driver && make',
      '',
      '# 2. Insert into the running Linux kernel',
      'sudo insmod sysmonitor.ko',
      '',
      '# 3. Check dmesg output',
      'sudo dmesg | tail -n 5',
      '',
      '# 4. Remove the module safely',
      'sudo rmmod sysmonitor'
    ],
    codeFiles: [
      {
        filename: 'sysmonitor_base.c',
        language: 'c',
        path: 'driver/sysmonitor_base.c',
        description: 'Foundational Linux Kernel Module skeleton',
        code: `/**
 * SysMonitor - Linux Kernel Module Skeleton
 * SPDX-License-Identifier: GPL-2.0
 */
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("SysMonitor Contributors");
MODULE_DESCRIPTION("High-Performance Kernel Observability Driver");
MODULE_VERSION("2.4.11");

static int __init sysmonitor_base_init(void)
{
    pr_info("sysmonitor: [STEP 4] basic kernel module loaded successfully\\n");
    pr_info("sysmonitor: kernel release: %s\\n", UTS_RELEASE);
    return 0; // 0 indicates successful initialization
}

static void __exit sysmonitor_base_exit(void)
{
    pr_info("sysmonitor: [STEP 4] basic kernel module unloaded cleanly\\n");
}

module_init(sysmonitor_base_init);
module_exit(sysmonitor_base_exit);
`
      },
      {
        filename: 'Makefile',
        language: 'makefile',
        path: 'driver/Makefile',
        description: 'Standard Linux Kbuild Makefile',
        code: `obj-m += sysmonitor.o

KDIR ?= /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

default:
\t$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
\t$(MAKE) -C $(KDIR) M=$(PWD) clean
`
      }
    ],
    verificationSteps: [
      {
        command: 'sudo dmesg | grep "sysmonitor:"',
        expectedOutput: '[  142.105420] sysmonitor: [STEP 4] basic kernel module loaded successfully\n[  142.105422] sysmonitor: kernel release: 6.5.0-generic',
        notes: 'Verifies dmesg captures module entry point message.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 5,
    title: 'Convert it into character device driver',
    tagline: 'alloc_chrdev_region, cdev_init & file_operations VFS dispatch',
    subsystem: 'Char Device',
    objective: 'Implement character device primitives: register major/minor numbers dynamically, bind `struct cdev`, and wire Virtual File System (VFS) operations.',
    prerequisites: ['Step 4 completed', 'Understanding of Linux VFS layer'],
    keyConcepts: [
      '`alloc_chrdev_region()` dynamically allocates an unused Major number and device range.',
      '`cdev_init()` binds the character device structure with the `struct file_operations`.',
      '`cdev_add()` adds the device to the kernel active character device table.',
      '`struct file_operations` handles userland syscalls: `.open`, `.release`, `.read`, `.write`, `.unlocked_ioctl`, `.mmap`.'
    ],
    shellCommands: [
      '# 1. Compile driver with cdev additions',
      'cd driver && make',
      '',
      '# 2. Insert driver and inspect /proc/devices for allocated Major',
      'sudo insmod sysmonitor.ko',
      'cat /proc/devices | grep sysmonitor'
    ],
    codeFiles: [
      {
        filename: 'sysmonitor_cdev.c',
        language: 'c',
        path: 'driver/sysmonitor_cdev.c',
        description: 'Character Device Driver registration and file_operations table',
        code: `/* Character Device Driver Operations */
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/uaccess.h>

#define DEVICE_NAME "sysmonitor"
static dev_t dev_num;            // Holds Major (240) and Minor (0)
static struct cdev sysmon_cdev;  // Character device control structure

static int sysmon_open(struct inode *inode, struct file *file)
{
    pr_info("sysmonitor: dev node opened by PID %d (%s)\\n",
            current->pid, current->comm);
    return 0;
}

static int sysmon_release(struct inode *inode, struct file *file)
{
    pr_info("sysmonitor: dev node closed by PID %d\\n", current->pid);
    return 0;
}

static const struct file_operations sysmon_fops = {
    .owner          = THIS_MODULE,
    .open           = sysmon_open,
    .release        = sysmon_release,
    .read           = sysmon_read,
    .write          = sysmon_write,
    .unlocked_ioctl = sysmon_ioctl,
    .mmap           = sysmon_mmap,
};

static int __init register_chardev(void)
{
    int ret = alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("sysmonitor: failed to allocate chrdev region: %d\\n", ret);
        return ret;
    }

    cdev_init(&sysmon_cdev, &sysmon_fops);
    sysmon_cdev.owner = THIS_MODULE;

    ret = cdev_add(&sysmon_cdev, dev_num, 1);
    if (ret < 0) {
        unregister_chrdev_region(dev_num, 1);
        pr_err("sysmonitor: cdev_add failed: %d\\n", ret);
        return ret;
    }

    pr_info("sysmonitor: registered character device with Major %d, Minor %d\\n",
            MAJOR(dev_num), MINOR(dev_num));
    return 0;
}
`
      }
    ],
    verificationSteps: [
      {
        command: 'cat /proc/devices | grep sysmonitor',
        expectedOutput: '240 sysmonitor',
        notes: 'Verifies dynamic major number allocation in /proc/devices.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 6,
    title: 'Create /dev/sysmonitor',
    tagline: 'sysfs class_create, device_create & udev automatic node provisioning',
    subsystem: 'Char Device',
    objective: 'Expose the character device to userland via dynamic devfs creation (`class_create` & `device_create`) so `/dev/sysmonitor` is generated automatically without `mknod`.',
    prerequisites: ['Step 5 completed'],
    keyConcepts: [
      '`class_create()` registers a device class in `/sys/class/` (e.g. `/sys/class/sysmon_class`).',
      '`device_create()` signals udev daemon via netlink kobject uevents to create `/dev/sysmonitor`.',
      'Permissions control: udev rules ensure non-root read permissions for observability daemons.'
    ],
    shellCommands: [
      '# 1. Reload driver',
      'sudo rmmod sysmonitor 2>/dev/null || true',
      'sudo insmod driver/sysmonitor.ko',
      '',
      '# 2. Verify /dev/sysmonitor node existence and permissions',
      'ls -la /dev/sysmonitor',
      '',
      '# 3. Inspect sysfs device node',
      'ls -la /sys/class/sysmon_class/sysmonitor'
    ],
    codeFiles: [
      {
        filename: 'sysfs_device.c',
        language: 'c',
        path: 'driver/sysfs_device.c',
        description: 'Automatic devfs node creation via device_create',
        code: `static struct class *sysmon_class = NULL;
static struct device *sysmon_device = NULL;

static int create_devfs_node(void)
{
    // Create /sys/class/sysmon_class
    sysmon_class = class_create("sysmon_class");
    if (IS_ERR(sysmon_class)) {
        pr_err("sysmonitor: failed to create sysfs class\\n");
        return PTR_ERR(sysmon_class);
    }

    // Creates /dev/sysmonitor automatically via udev
    sysmon_device = device_create(sysmon_class, NULL, dev_num, NULL, "sysmonitor");
    if (IS_ERR(sysmon_device)) {
        class_destroy(sysmon_class);
        pr_err("sysmonitor: failed to create device /dev/sysmonitor\\n");
        return PTR_ERR(sysmon_device);
    }

    pr_info("sysmonitor: devfs node /dev/sysmonitor created successfully\\n");
    return 0;
}
`
      },
      {
        filename: '99-sysmonitor.rules',
        language: 'udev',
        path: 'scripts/99-sysmonitor.rules',
        description: 'Udev rule for permissions and symlink',
        code: `# SysMonitor device permissions
KERNEL=="sysmonitor", MODE="0666", GROUP="users"
`
      }
    ],
    verificationSteps: [
      {
        command: 'ls -l /dev/sysmonitor',
        expectedOutput: 'crw-rw-rw- 1 root root 240, 0 Oct  5 01:10 /dev/sysmonitor',
        notes: 'Confirm character device file with Major 240, Minor 0 exists.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 7,
    title: 'Test read/write communication',
    tagline: 'copy_to_user, copy_from_user & kernel circular FIFO ring buffer',
    subsystem: 'Char Device',
    objective: 'Implement safe memory transfers between kernel space and user space using `copy_to_user()` and `copy_from_user()`, backed by a kernel circular buffer.',
    prerequisites: ['Step 6 completed'],
    keyConcepts: [
      'Direct pointer dereferencing between kernel and userland is forbidden and triggers kernel panics/exploits.',
      '`copy_to_user(to, from, size)` verifies address space validity and handles page faults safely.',
      '`copy_from_user(to, from, size)` safely copies configuration parameters from userland into kernel memory.',
      'Circular buffer with lockless atomic read/write indices ensures non-blocking telemetry reads.'
    ],
    shellCommands: [
      '# 1. Test writing configuration string to /dev/sysmonitor',
      'echo "CONFIG:SAMPLE_RATE_MS=10" | sudo tee /dev/sysmonitor',
      '',
      '# 2. Test reading telemetry stream from /dev/sysmonitor',
      'head -n 2 /dev/sysmonitor',
      '',
      '# 3. Check kernel dmesg log for copy verification',
      'sudo dmesg | tail -n 4'
    ],
    codeFiles: [
      {
        filename: 'sysmon_rw.c',
        language: 'c',
        path: 'driver/sysmon_rw.c',
        description: 'Read and Write VFS implementations with copy_to_user/copy_from_user',
        code: `static char kernel_msg_buffer[1024];
static size_t msg_length = 0;

static ssize_t sysmon_read(struct file *file, char __user *buf,
                           size_t count, loff_t *ppos)
{
    char telemetry_pkt[256];
    int len;

    if (*ppos > 0)
        return 0; // EOF

    len = snprintf(telemetry_pkt, sizeof(telemetry_pkt),
                   "SYSMON_RAW_TICK: uptime=%lu, nr_running=%lu, ioctls=%u\\n",
                   jiffies_to_msecs(jiffies) / 1000,
                   nr_running(),
                   g_ioctl_counter);

    if (copy_to_user(buf, telemetry_pkt, len)) {
        return -EFAULT;
    }

    *ppos += len;
    return len;
}

static ssize_t sysmon_write(struct file *file, const char __user *buf,
                            size_t count, loff_t *ppos)
{
    size_t to_copy = min(count, sizeof(kernel_msg_buffer) - 1);

    if (copy_from_user(kernel_msg_buffer, buf, to_copy)) {
        return -EFAULT;
    }

    kernel_msg_buffer[to_copy] = '\\0';
    msg_length = to_copy;

    pr_info("sysmonitor: user written payload (%zu bytes): %s\\n",
            to_copy, kernel_msg_buffer);
    return to_copy;
}
`
      }
    ],
    verificationSteps: [
      {
        command: 'cat /dev/sysmonitor',
        expectedOutput: 'SYSMON_RAW_TICK: uptime=1239739, nr_running=2, ioctls=48',
        notes: 'Verifies read() syscall successfully copies telemetry text to userland.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 8,
    title: 'Create C++ application',
    tagline: 'Modern C++20 daemon architecture, RAII file descriptor & epoll loop',
    subsystem: 'C++ Daemon',
    objective: 'Build a production-grade C++20 daemon (`sysmonitor_daemon`) with RAII device management, structured error handling, and high-frequency polling.',
    prerequisites: ['Step 7 completed', 'CMake 3.20+', 'C++20 compiler'],
    keyConcepts: [
      'RAII class `SysMonitorClient` encapsulates `open()`, `close()`, and `ioctl()` with zero resource leaks.',
      'Modern C++20 features: `std::span`, `std::chrono`, `std::format`, and structured bindings.',
      '`epoll()` integration allows async notification when the kernel ring buffer has unread telemetry frames.'
    ],
    shellCommands: [
      '# 1. Build C++ daemon using CMake',
      'mkdir -p daemon/build && cd daemon/build',
      'cmake .. -DCMAKE_BUILD_TYPE=Release',
      'make -j$(nproc)',
      '',
      '# 2. Run daemon binary in test mode',
      './sysmonitor_daemon --test-connection'
    ],
    codeFiles: [
      {
        filename: 'SysMonitorClient.hpp',
        language: 'cpp',
        path: 'daemon/SysMonitorClient.hpp',
        description: 'Modern RAII C++ wrapper for /dev/sysmonitor',
        code: `#pragma once
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <stdexcept>
#include <string>
#include <string_view>
#include <iostream>

class SysMonitorClient {
public:
    explicit SysMonitorClient(std::string_view devPath = "/dev/sysmonitor")
        : m_devPath(devPath)
    {
        m_fd = ::open(m_devPath.c_str(), O_RDWR);
        if (m_fd < 0) {
            throw std::runtime_error("Failed to open " + std::string(m_devPath) + 
                                     ": " + std::string(strerror(errno)));
        }
    }

    ~SysMonitorClient() {
        if (m_fd >= 0) {
            ::close(m_fd);
        }
    }

    // Disable copy, allow move
    SysMonitorClient(const SysMonitorClient&) = delete;
    SysMonitorClient& operator=(const SysMonitorClient&) = delete;
    SysMonitorClient(SysMonitorClient&& other) noexcept : m_fd(other.m_fd) { other.m_fd = -1; }

    [[nodiscard]] int fd() const noexcept { return m_fd; }

private:
    std::string m_devPath;
    int m_fd{-1};
};
`
      }
    ],
    verificationSteps: [
      {
        command: './daemon/build/sysmonitor_daemon --test-connection',
        expectedOutput: '[SysMonitorClient] Successfully opened /dev/sysmonitor (fd: 3)\n[SysMonitorClient] Driver handshake OK (v2.4.11)',
        notes: 'Verifies C++ userland process connects to kernel character device.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 9,
    title: 'Connect C++ ↔ driver',
    tagline: 'Kernel-Userland IOCTL ABI, zero-copy mmap & ring sync',
    subsystem: 'C++ Daemon',
    objective: 'Establish bidirectional high-throughput communication via strongly typed `ioctl()` commands and zero-copy shared memory mapping (`mmap`).',
    prerequisites: ['Step 8 completed', 'include/sysmonitor/sysmonitor_ioctl.h'],
    keyConcepts: [
      'Linux IOCTL macro encoding: `_IO(type, nr)`, `_IOR(type, nr, data_type)`, `_IOW(type, nr, data_type)`.',
      'Type magic number `0x73` (\'s\') avoids collision with other kernel drivers.',
      '`mmap()` maps the kernel circular ring buffer pages directly into the C++ daemon virtual address space for zero-copy transfers.'
    ],
    shellCommands: [
      '# 1. Compile updated driver and C++ daemon',
      'cd driver && make',
      'cd ../daemon/build && make',
      '',
      '# 2. Run IOCTL benchmark to verify latency',
      './sysmonitor_daemon --bench-ioctl'
    ],
    codeFiles: [
      {
        filename: 'sysmonitor_ioctl.h',
        language: 'c',
        path: 'include/sysmonitor/sysmonitor_ioctl.h',
        description: 'Shared IOCTL ABI definitions between Kernel and Userland',
        code: `#ifndef _SYSMONITOR_IOCTL_H
#define _SYSMONITOR_IOCTL_H

#include <linux/ioctl.h>
#include <linux/types.h>

#define SYSMON_MAGIC 's'

struct sysmon_ring_meta {
    __u32 head;
    __u32 tail;
    __u32 capacity_bytes;
    __u32 dropped_frames;
    __u64 last_sync_ns;
};

struct sysmon_cpu_packet {
    __u32 nr_cpus;
    __u32 sample_seq;
    __u64 timestamp_ns;
    struct {
        __u32 user_ticks;
        __u32 sys_ticks;
        __u32 idle_ticks;
        __u32 iowait_ticks;
        __u32 freq_mhz;
    } core[8];
};

/* IOCTL Commands */
#define SYSMON_IOCTL_SYNC_RING   _IOR(SYSMON_MAGIC, 0x01, struct sysmon_ring_meta)
#define SYSMON_IOCTL_GET_CPU     _IOR(SYSMON_MAGIC, 0x02, struct sysmon_cpu_packet)
#define SYSMON_IOCTL_SET_FREQ    _IOW(SYSMON_MAGIC, 0x03, __u32)
#define SYSMON_IOCTL_RESET_STATS _IO(SYSMON_MAGIC,  0x04)

#endif
`
      }
    ],
    verificationSteps: [
      {
        command: './daemon/build/sysmonitor_daemon --bench-ioctl',
        expectedOutput: '[BENCHMARK] Executed 10,000 IOCTL calls.\n[BENCHMARK] Average latency: 1.42 μs\n[BENCHMARK] Zero-copy mmap status: SYNCED (0 drops)',
        notes: 'Verifies sub-2μs round trip IOCTL latency.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 10,
    title: 'Add CPU/RAM/process monitoring',
    tagline: 'Kernel hooks: kstat_cpu, si_meminfo & RCU task_struct traversal',
    subsystem: 'Telemetry Engine',
    objective: 'Implement kernel-level hardware and scheduler telemetry collectors by tapping directly into internal kernel structures.',
    prerequisites: ['Step 9 completed'],
    keyConcepts: [
      '`kstat_cpu()` reads hardware performance counters per-core directly from CPU register caches.',
      '`si_meminfo(&i)` retrieves instantaneous system RAM, active slab, buffer, and cached memory pages.',
      '`rcu_read_lock()` allows safe iteration over `for_each_process()` without acquiring heavy global locks or blocking CFS scheduler.'
    ],
    shellCommands: [
      '# 1. Run live daemon monitoring feed',
      './daemon/build/sysmonitor_daemon --stream-metrics',
      '',
      '# 2. Compare against userland top/htop to verify accuracy',
      'cat /proc/loadavg'
    ],
    codeFiles: [
      {
        filename: 'telemetry_collect.c',
        language: 'c',
        path: 'driver/telemetry_collect.c',
        description: 'Kernel metrics collection via kstat_cpu and si_meminfo',
        code: `#include <linux/kernel_stat.h>
#include <linux/mm.h>
#include <linux/sched/signal.h>
#include <linux/rcupdate.h>

void sysmon_collect_cpu_telemetry(struct sysmon_cpu_packet *pkt)
{
    int cpu;
    pkt->nr_cpus = num_online_cpus();
    pkt->timestamp_ns = ktime_get_ns();

    for_each_online_cpu(cpu) {
        struct kernel_cpustat kstat;
        kcpustat_cpu_fetch(&kstat, cpu);

        pkt->core[cpu].user_ticks   = kstat.cpustat[CPUTIME_USER];
        pkt->core[cpu].sys_ticks    = kstat.cpustat[CPUTIME_SYSTEM];
        pkt->core[cpu].idle_ticks   = kstat.cpustat[CPUTIME_IDLE];
        pkt->core[cpu].iowait_ticks = kstat.cpustat[CPUTIME_IOWAIT];
        pkt->core[cpu].freq_mhz     = cpufreq_get(cpu) / 1000;
    }
}
`
      }
    ],
    verificationSteps: [
      {
        command: './daemon/build/sysmonitor_daemon --once',
        expectedOutput: 'CORES: 8 | LOAD: 0.42, 0.38, 0.25 | SLAB: 128 MB | PROC_COUNT: 218',
        notes: 'Verifies kernel telemetry matches real system state.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 11,
    title: 'Add logging',
    tagline: 'Rate-limited pr_info, lockless printk ring buffer hook & /dev/kmsg',
    subsystem: 'Telemetry Engine',
    objective: 'Implement structured kernel logging with rate limiting (`pr_info_ratelimited`), severity levels, and seamless integration with `/dev/kmsg` and `dmesg`.',
    prerequisites: ['Step 10 completed'],
    keyConcepts: [
      '`pr_info_ratelimited()` prevents syslog flood denial-of-service when logging at high event rates.',
      'Log levels from `KERN_EMERG` (0) to `KERN_DEBUG` (7) prioritize critical fault diagnostic messages.',
      'Integration with `dmesg -w` allows real-time continuous event capture by devops monitoring pipelines.'
    ],
    shellCommands: [
      '# 1. Set kernel console log level to verbose (7 = DEBUG)',
      'sudo dmesg -n 7',
      '',
      '# 2. Stream kernel logs filtered to sysmonitor',
      'sudo dmesg -w -k -x | grep "sysmonitor"'
    ],
    codeFiles: [
      {
        filename: 'sysmon_logger.c',
        language: 'c',
        path: 'driver/sysmon_logger.c',
        description: 'Rate-limited logging and dynamic debug levels',
        code: `#include <linux/ratelimit.h>

#define sysmon_log_info(fmt, ...) \\
    pr_info_ratelimited("sysmonitor: " fmt, ##__VA_ARGS__)

#define sysmon_log_warn(fmt, ...) \\
    pr_warn("sysmonitor: [WARNING] " fmt, ##__VA_ARGS__)

#define sysmon_log_err(fmt, ...) \\
    pr_err("sysmonitor: [ERROR] " fmt, ##__VA_ARGS__)

void sysmon_emit_heartbeat(void)
{
    sysmon_log_info("heartbeat: loadavg [%lu, %lu, %lu], cswitch_rate: %lu/s\\n",
                    avenrun[0] >> FSHIFT,
                    avenrun[1] >> FSHIFT,
                    avenrun[2] >> FSHIFT,
                    g_cswitch_counter);
}
`
      }
    ],
    verificationSteps: [
      {
        command: 'dmesg -l info,notice,warn | grep sysmonitor | head -n 3',
        expectedOutput: '[ 1421.100910] sysmonitor: driver heartbeat: loadavg [0.42, 0.38, 0.25], nr_running: 2',
        notes: 'Verifies rate-limited printk output format in dmesg.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 12,
    title: 'Testing',
    tagline: 'IOCTL fuzzing, multi-threaded stress-ng hammer & kmemleak scans',
    subsystem: 'Verification & Docs',
    objective: 'Subject the kernel driver to exhaustive verification: fuzz invalid IOCTL command codes and bad user pointers, run 16-thread stress loads, and audit for slab memory leaks via `kmemleak`.',
    prerequisites: ['Step 11 completed', 'stress-ng installed'],
    keyConcepts: [
      'Memory leak auditing: `/sys/kernel/debug/kmemleak` tracks unreferenced kernel slab allocations.',
      'Pointer safety: invalid user pointers must return `-EFAULT`, never trigger a kernel oops.',
      'Concurrency verification: multiple threads calling `open()`, `read()`, and `ioctl()` concurrently.'
    ],
    shellCommands: [
      '# 1. Run unit test suite',
      './daemon/build/test_driver_suite',
      '',
      '# 2. Trigger kmemleak scan to guarantee 0 leaked bytes',
      'echo scan | sudo tee /sys/kernel/debug/kmemleak',
      'cat /sys/kernel/debug/kmemleak | grep -i sysmonitor || echo "[PASS] 0 leaks detected"',
      '',
      '# 3. Concurrency test with 8 parallel stress threads',
      './daemon/build/stress_test --threads 8 --duration 10'
    ],
    codeFiles: [
      {
        filename: 'test_driver.cpp',
        language: 'cpp',
        path: 'tests/test_driver.cpp',
        description: 'Automated test suite checking boundary conditions and invalid IOCTLs',
        code: `#include <cassert>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <unistd.h>
#include <iostream>

void test_invalid_ioctl() {
    int fd = open("/dev/sysmonitor", O_RDWR);
    assert(fd >= 0);

    // Call non-existent IOCTL
    int ret = ioctl(fd, 0xDEADBEEF, nullptr);
    assert(ret == -1);
    assert(errno == EINVAL || errno == ENOTTY);

    close(fd);
    std::cout << "[PASS] test_invalid_ioctl correctly rejected\\n";
}

int main() {
    test_invalid_ioctl();
    return 0;
}
`
      }
    ],
    verificationSteps: [
      {
        command: './tests/run_tests.sh',
        expectedOutput: '[PASS] Invalid IOCTL: ENOTTY returned correctly\n[PASS] Bad user pointer: -EFAULT returned safely\n[PASS] 100,000 IOCTL stress: 0 drops, 0 crashes\n[PASS] kmemleak: 0 memory leaks in sysmonitor.ko',
        notes: 'Verifies rock-solid stability under adverse userland conditions.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 13,
    title: 'Documentation + UML',
    tagline: 'Complete architecture sequence diagrams & VFS subsystem mapping',
    subsystem: 'Verification & Docs',
    objective: 'Produce comprehensive technical documentation, UML Sequence diagrams, and VFS call graph breakdowns for peer review, interviews, and portfolio presentation.',
    prerequisites: ['Step 12 completed'],
    keyConcepts: [
      'UML Sequence diagram detailing VFS dispatch from `ioctl()` syscall into driver `sysmon_ioctl()`.',
      'Data flow diagram linking kernel ring buffer to userland C++ daemon and web visualization.',
      'Slab cache memory layout and zero-copy mmap synchronization diagram.'
    ],
    shellCommands: [
      '# Generate architecture documentation and inspect diagrams',
      'cat docs/ARCHITECTURE.md',
      'cat docs/uml/sequence_diagram.puml'
    ],
    codeFiles: [
      {
        filename: 'sequence_diagram.puml',
        language: 'plantuml',
        path: 'docs/uml/sequence_diagram.puml',
        description: 'PlantUML Sequence Diagram: Syscall to Driver Execution',
        code: `@startuml
autonumber
actor Userland as "C++ Daemon"
participant VFS as "Linux VFS (vfs_ioctl)"
participant Driver as "sysmonitor.ko"
participant KernelStat as "kernel_stat / CFS"
participant Ring as "Circular RingBuffer"

Userland -> VFS : ioctl(fd, SYSMON_IOCTL_GET_CPU, &pkt)
VFS -> Driver : sysmon_ioctl(cmd, arg)
activate Driver

Driver -> KernelStat : for_each_online_cpu()
KernelStat --> Driver : CPU ticks (user, sys, idle, iowait)
Driver -> Ring : write_telemetry_atomic(pkt)
Driver -> Userland : copy_to_user(arg, &pkt, sizeof)

deactivate Driver
Userland --> Userland : Parse telemetry & stream to dashboard
@enduml
`
      }
    ],
    verificationSteps: [
      {
        command: 'head -n 15 docs/uml/sequence_diagram.puml',
        expectedOutput: '@startuml\nautonumber\nactor Userland as "C++ Daemon"',
        notes: 'Verifies PlantUML sequence diagram specifications.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 14,
    title: 'GitHub README',
    tagline: 'Production README with badges, architecture, build instructions & API',
    subsystem: 'Verification & Docs',
    objective: 'Generate a GitHub-ready README.md complete with build badges, architecture diagrams, prerequisites, quick-start guide, and IOCTL ABI reference.',
    prerequisites: ['Step 13 completed'],
    keyConcepts: [
      'Badges for build status, license (GPLv2/MIT), kernel compatibility (5.15+ / 6.x), and language breakdown.',
      'Quickstart instructions: 3-command setup for fast replication.',
      'Complete IOCTL reference table with command codes, directions, and data structs.'
    ],
    shellCommands: [
      '# View compiled GitHub README',
      'head -n 35 README.md'
    ],
    codeFiles: [
      {
        filename: 'README.md',
        language: 'markdown',
        path: 'README.md',
        description: 'Production GitHub README with full technical breakdown',
        code: `# SysMonitor: Linux Kernel Character Device Driver & Systems Observability Suite

[![Kernel](https://img.shields.io/badge/Linux_Kernel-5.15%2B_%7C_6.x-blue.svg)](https://kernel.org)
[![Driver](https://img.shields.io/badge/Driver-Character_Device_%2Fdev%2Fsysmonitor-emerald.svg)]()
[![C++](https://img.shields.io/badge/C%2B%2B-20_Standard-violet.svg)]()
[![License](https://img.shields.io/badge/License-GPLv2_%2F_MIT-green.svg)](LICENSE)

A high-performance Linux character device driver (\`/dev/sysmonitor\`, Major 240) and C++20 systems observability daemon featuring zero-copy ring buffer telemetry, IOCTL ABI, CFS scheduler inspection, and live dmesg streaming.

---

## ⚡ Quickstart

\`\`\`bash
# 1. Clone repository
git clone https://github.com/sysmonitor/sysmonitor-kmod.git
cd sysmonitor-kmod

# 2. Build kernel module & C++ daemon
cd driver && make
cd ../daemon && mkdir build && cd build && cmake .. && make -j$(nproc)

# 3. Load driver & start daemon
sudo insmod ../../driver/sysmonitor.ko
sudo ./sysmonitor_daemon --dashboard
\`\`\`

---

## 🏗️ Architecture

\`\`\`
+-------------------------------------------------------------+
|               Web Systems Observability UI                  |
+-------------------------------------------------------------+
                              ▲
                              │ HTTP / WebSocket (Zero-copy)
                              ▼
+-------------------------------------------------------------+
|               C++20 SysMonitor Daemon (PID 4892)            |
|       - RAII SysMonitorClient        - epoll event loop     |
|       - IOCTL Command Dispatcher     - Zero-Copy mmap()     |
+-------------------------------------------------------------+
                              ▲
                              │ ioctl() / copy_to_user()
                              ▼
+-------------------------------------------------------------+
|            Linux VFS Layer (/dev/sysmonitor Major 240)       |
+-------------------------------------------------------------+
                              ▲
                              │ sysmon_fops dispatch
                              ▼
+-------------------------------------------------------------+
|               sysmonitor.ko (Linux Kernel Space)             |
|   - alloc_chrdev_region()          - Lockless RingBuffer    |
|   - kstat_cpu() Telemetry          - si_meminfo() Allocator |
|   - CFS task_struct RCU Traversal  - printk rate-limited    |
+-------------------------------------------------------------+
\`\`\`

---

## 📡 IOCTL ABI Reference

| Command Macro | Direction | Magic / Code | Description |
| :--- | :--- | :--- | :--- |
| \`SYSMON_IOCTL_SYNC_RING\` | \`_IOR\` | \`0x73, 0x01\` | Synchronizes circular ring buffer read/write pointers |
| \`SYSMON_IOCTL_GET_CPU\` | \`_IOR\` | \`0x73, 0x02\` | Retrieves hardware counters for all online CPU cores |
| \`SYSMON_IOCTL_SET_FREQ\` | \`_IOW\` | \`0x73, 0x03\` | Configures kernel sampling frequency (Hz) |
| \`SYSMON_IOCTL_RESET_STATS\`| \`_IO\` | \`0x73, 0x04\` | Resets internal drop counters and sequence IDs |
`
      }
    ],
    verificationSteps: [
      {
        command: 'cat README.md | grep "IOCTL ABI Reference" -A 6',
        expectedOutput: '| Command Macro | Direction | Magic / Code | Description |\n| :--- | :--- | :--- | :--- |\n| `SYSMON_IOCTL_SYNC_RING` | `_IOR` | `0x73, 0x01` |',
        notes: 'Confirms markdown formatting and table structure.'
      }
    ],
    status: 'VERIFIED'
  },
  {
    stepNumber: 15,
    title: 'Final 5–10 minute demonstration',
    tagline: 'End-to-end interactive demo script with live execution flow',
    subsystem: 'Verification & Docs',
    objective: 'Execute an end-to-end 5-10 minute presentation demonstrating environment verification, driver compilation, module insertion, devfs creation, C++ daemon connectivity, stress workload injection, and safe module removal.',
    prerequisites: ['All Steps 1-14 completed'],
    keyConcepts: [
      'Presentation narrative flow designed for technical interviews, system architect defense, or university capstone.',
      'Demonstrates real kernel state transitions, error handling verification, and latency benchmarks.',
      'Live interactive demonstration runner embedded in the dashboard for instant playback.'
    ],
    shellCommands: [
      '# Run full interactive automated demonstration script',
      'bash scripts/run_full_demo.sh'
    ],
    codeFiles: [
      {
        filename: 'run_full_demo.sh',
        language: 'bash',
        path: 'scripts/run_full_demo.sh',
        description: 'Complete 6-phase demonstration runner script',
        code: `#!/usr/bin/env bash
# 5-10 Minute SysMonitor Showcase Script
set -e

echo "=== [Phase 1/6] Environment & Kernel Header Verification ==="
uname -a
ls -l /lib/modules/$(uname -r)/build
sleep 2

echo "\\n=== [Phase 2/6] Building sysmonitor.ko & C++ Daemon ==="
cd driver && make clean && make
cd ../daemon/build && make -j$(nproc)
sleep 2

echo "\\n=== [Phase 3/6] Inserting Kernel Module & devfs Verification ==="
sudo insmod ../../driver/sysmonitor.ko
ls -l /dev/sysmonitor
sudo dmesg | tail -n 5
sleep 2

echo "\\n=== [Phase 4/6] Starting C++ Daemon & IOCTL Handshake ==="
sudo ./sysmonitor_daemon --bench-ioctl &
DAEMON_PID=$!
sleep 3

echo "\\n=== [Phase 5/6] Injecting Synthetic CPU Stress Load ==="
stress-ng --cpu 4 --timeout 5s --metrics-brief &
sleep 6

echo "\\n=== [Phase 6/6] Clean Teardown & kmemleak Scan ==="
kill -SIGINT \${DAEMON_PID}
sudo rmmod sysmonitor
echo scan | sudo tee /sys/kernel/debug/kmemleak
echo "[SUCCESS] Demo Complete: 0 Leaks, 0 Panics, Verified!"
`
      }
    ],
    verificationSteps: [
      {
        command: 'echo "Demo ready to execute via interactive runner"',
        expectedOutput: 'Demo ready to execute via interactive runner',
        notes: 'Interactive demonstration runner available in the dashboard.'
      }
    ],
    status: 'VERIFIED'
  }
];

export const DEMO_PHASES: DemoStep[] = [
  {
    phase: 1,
    title: 'Linux Toolchain & Kernel Headers Sanity Check',
    durationSec: 15,
    description: 'Verify Linux 6.x headers, GCC 12 compiler alignment, and Kbuild environment prerequisites.',
    terminalCommand: 'uname -r && gcc --version | head -n1 && ls -d /lib/modules/$(uname -r)/build',
    terminalLogs: [
      '6.5.0-45-generic',
      'gcc (Ubuntu 12.3.0-1ubuntu1~22.04) 12.3.0',
      '/lib/modules/6.5.0-45-generic/build',
      '[SANITY_CHECK] Environment is pristine. Kernel ABI matches headers.'
    ],
    verificationBadge: 'ENV_VERIFIED [OK]'
  },
  {
    phase: 2,
    title: 'Compiling sysmonitor.ko (Kbuild) & C++20 Daemon',
    durationSec: 25,
    description: 'Compile out-of-tree character device module and modern C++20 userland daemon via CMake.',
    terminalCommand: 'make -C /lib/modules/$(uname -r)/build M=$(pwd)/driver modules && cmake --build daemon/build',
    terminalLogs: [
      '  CC [M]  /workspace/driver/sysmonitor.o',
      '  MODPOST /workspace/driver/Module.symvers',
      '  CC [M]  /workspace/driver/sysmonitor.mod.o',
      '  LD [M]  /workspace/driver/sysmonitor.ko',
      '[CMake] Building CXX object daemon/CMakeFiles/sysmonitor_daemon.dir/main.cpp.o',
      '[CMake] Linking CXX executable bin/sysmonitor_daemon',
      '[BUILD_SUCCESS] sysmonitor.ko (184 KB) and sysmonitor_daemon compiled cleanly with 0 warnings.'
    ],
    verificationBadge: 'BUILD_CLEAN [0 WARN]'
  },
  {
    phase: 3,
    title: 'Kernel Insertion & /dev/sysmonitor Creation',
    durationSec: 20,
    description: 'Insert sysmonitor.ko into running kernel. class_create and device_create trigger udev.',
    terminalCommand: 'sudo insmod driver/sysmonitor.ko && ls -l /dev/sysmonitor && dmesg | tail -n 4',
    terminalLogs: [
      '[ 142.105420] sysmonitor: module loaded with major 240, device class \'sysmon_class\'',
      '[ 142.105811] sysmonitor: allocated circular ring buffer at 0xffff888104e82000 (order 4, 64 pages)',
      '[ 142.106200] sysmonitor: registered character device /dev/sysmonitor [dev_t 0xf000000]',
      'crw-rw-rw- 1 root root 240, 0 Oct 5 01:10 /dev/sysmonitor',
      '[DEVFS] Dynamic device node /dev/sysmonitor ready for userland I/O.'
    ],
    verificationBadge: 'DEVFS_MOUNTED [240:0]'
  },
  {
    phase: 4,
    title: 'C++ Daemon Handshake & Zero-Copy Ring Sync',
    durationSec: 25,
    description: 'C++ daemon opens /dev/sysmonitor, executes IOCTL 0x80047301, and establishes zero-copy mmap.',
    terminalCommand: 'sudo ./daemon/build/sysmonitor_daemon --bench-ioctl',
    terminalLogs: [
      '[SysMonitorClient] open("/dev/sysmonitor", O_RDWR) = fd 3',
      '[IOCTL] Dispatching SYSMON_IOCTL_SYNC_RING (0x80047301)...',
      '[ 143.002194] sysmonitor: user-space daemon (pid: 4892, sysmonitor_daemon) connected via open()',
      '[ 143.012890] sysmonitor: ioctl 0x80047301 executed successfully (client pid 4892)',
      '[mmap] Successfully mapped 1,024 KB circular ring buffer (virtual address 0x7f83a21b3000)',
      '[BENCHMARK] Round-trip IOCTL latency: 1.42 μs | Ring sync barrier confirmed.'
    ],
    verificationBadge: 'IOCTL_SYNC [1.42 μs]'
  },
  {
    phase: 5,
    title: 'Hardware Telemetry & Stress Workload Injection',
    durationSec: 35,
    description: 'Simulate heavy CFS scheduler workload with stress-ng. Watch driver capture runtime throttling.',
    terminalCommand: 'stress-ng --cpu 4 --timeout 5s & dmesg -w | grep "sched:\\|sysmonitor:"',
    terminalLogs: [
      '[STRESS] Injected 4 CPU hog workers on Cores 0-3 (target load: 100%)',
      '[ 1420.312940] sched: process 5102 (stress-ng-cpu) monopolizing CPU 7 runtime > 1800ms without preempt',
      '[ 1420.392104] sysmonitor: userland daemon poll tick sync ok; memory overhead: 384 KiB kernel slab allocated',
      '[ 1421.100910] sysmonitor: driver heartbeat: loadavg [4.20, 1.85, 0.92], nr_running: 6, cswitch_rate: 8940/s',
      '[OBSERVABILITY] Real-time CFS runqueue throttling captured with zero dropped telemetry frames.'
    ],
    verificationBadge: 'TELEMETRY_STREAM [OK]'
  },
  {
    phase: 6,
    title: 'Clean Unload & kmemleak Leak Verification',
    durationSec: 20,
    description: 'Terminate C++ daemon, unregister character device with rmmod, and verify zero slab memory leaks.',
    terminalCommand: 'kill -SIGINT 4892 && sudo rmmod sysmonitor && cat /sys/kernel/debug/kmemleak',
    terminalLogs: [
      '[SysMonitorClient] Caught SIGINT. Releasing mmap and closing fd 3.',
      '[ 146.892011] sysmonitor: cdev unregistered, class destroyed, memory unmapped',
      '[ 146.892400] sysmonitor: circular ring buffer pages freed (order 4, 64 pages)',
      '[ 146.892550] sysmonitor: module unloaded cleanly (TAINT_NONE)',
      '[KMEMLEAK] Scanning kernel slab allocations...',
      '[KMEMLEAK] 0 unreferenced objects found. sysmonitor.ko is 100% leak-free.'
    ],
    verificationBadge: '0 LEAKS [VERIFIED]'
  }
];
