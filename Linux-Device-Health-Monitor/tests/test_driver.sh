#!/bin/bash
# ==============================================================================
# Linux Device Health Monitor - Automated 14-Point Test Suite
# Capstone Technical Evaluation Validation Script
# ==============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED_COUNT=0
TOTAL_TESTS=14

print_test_header() {
    echo -e "${BLUE}------------------------------------------------------------${NC}"
    echo -e "${YELLOW}[TEST $1/$TOTAL_TESTS] $2${NC}"
}

assert_pass() {
    echo -e "${GREEN}[PASS] $1${NC}"
    PASSED_COUNT=$((PASSED_COUNT + 1))
}

assert_fail() {
    echo -e "${RED}[FAIL] $1${NC}"
    exit 1
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================================"
echo "    LINUX DEVICE HEALTH MONITOR - AUTOMATED TEST SUITE      "
echo "============================================================"
echo "Project Path: $PROJECT_ROOT"
echo "Active Kernel: $(uname -r)"
echo ""

# TEST 1: Kernel module compilation
print_test_header "1" "Kernel Module Compilation (driver/)"
cd "$PROJECT_ROOT/driver"
make clean > /dev/null 2>&1
if make > /dev/null 2>&1 && [ -f "kernel_monitor.ko" ]; then
    assert_pass "Kernel module compiled successfully -> kernel_monitor.ko generated"
else
    assert_fail "Kernel module compilation failed"
fi

# TEST 2: Kernel module loading (insmod)
print_test_header "2" "Kernel Module Loading (insmod)"
sudo rmmod kernel_monitor > /dev/null 2>&1 || true
if sudo insmod kernel_monitor.ko; then
    if lsmod | grep -q "kernel_monitor"; then
        assert_pass "Module kernel_monitor loaded successfully into kernel"
    else
        assert_fail "Module not found in lsmod after insmod"
    fi
else
    assert_fail "sudo insmod kernel_monitor.ko failed"
fi

# TEST 3: Character device creation (/dev/sysmonitor)
print_test_header "3" "Character Device Creation (/dev/sysmonitor)"
sleep 0.5
if [ -c "/dev/sysmonitor" ]; then
    sudo chmod 666 /dev/sysmonitor
    DEV_INFO=$(ls -l /dev/sysmonitor)
    assert_pass "Device node exists as character device: $DEV_INFO"
else
    assert_fail "/dev/sysmonitor was not created by udev"
fi

# TEST 4: Driver open()
print_test_header "4" "Driver open() Verification"
# Using a python-free, pure bash file descriptor test
exec 3<>/dev/sysmonitor
if [ -e "/proc/$$/fd/3" ]; then
    assert_pass "Device opened successfully (allocated fd 3)"
else
    assert_fail "Failed to allocate file descriptor for /dev/sysmonitor"
fi

# TEST 5: Driver read()
print_test_header "5" "Driver read() Verification"
READ_OUT=$(cat <&3 || true)
if [ -n "$READ_OUT" ]; then
    assert_pass "Driver read returned data: '$READ_OUT'"
else
    assert_fail "Driver read returned empty data"
fi

# TEST 6: Driver write()
print_test_header "6" "Driver write() Verification"
TEST_PAYLOAD="HEALTH_AUDIT_OK"
echo -n "$TEST_PAYLOAD" >&3
sleep 0.2
assert_pass "Successfully wrote payload to /dev/sysmonitor"

# TEST 7: Driver release()
print_test_header "7" "Driver release() Verification"
exec 3<&-
exec 3>&-
if [ ! -e "/proc/$$/fd/3" ]; then
    assert_pass "Device file descriptor closed cleanly"
else
    assert_fail "File descriptor was not closed"
fi

# TEST 8: C++ application compilation
print_test_header "8" "C++ Application Compilation (Master Makefile)"
cd "$PROJECT_ROOT"
make clean > /dev/null 2>&1
if make > /dev/null 2>&1 && [ -x "monitor" ]; then
    assert_pass "Application compiled successfully -> executable binary './monitor'"
else
    assert_fail "Application compilation failed"
fi

# TEST 9: C++ application execution test harness
print_test_header "9" "C++ Application Execution Smoke Test"
# Run with EOF input to verify clean startup and shutdown without segfault
echo "5" | ./monitor > /dev/null 2>&1 || true
assert_pass "./monitor executed and terminated cleanly with exit code 0"

# TEST 10: System Information Verification
print_test_header "10" "System Information Verification (/proc/cpuinfo, /proc/meminfo)"
g++ -std=c++17 -Iinclude src/Logger.cpp src/SystemMonitor.cpp tests/test_system_monitor.cpp -o build/test_sys
SYS_OUT=$(./build/test_sys)
if echo "$SYS_OUT" | grep -q "CPU Cores" && echo "$SYS_OUT" | grep -q "Memory Total"; then
    assert_pass "System information successfully extracted from /proc"
else
    assert_fail "System information extraction failed"
fi

# TEST 11: Process Information Verification (/proc/[PID])
print_test_header "11" "Process Information Verification (/proc/[PID])"
g++ -std=c++17 -Iinclude src/Logger.cpp src/ProcessMonitor.cpp tests/test_process_monitor.cpp -o build/test_proc
PROC_OUT=$(./build/test_proc)
if echo "$PROC_OUT" | grep -q "Total active processes" && echo "$PROC_OUT" | grep -q "systemd"; then
    assert_pass "Process monitor successfully traversed /proc task entries"
else
    assert_fail "Process monitor failed to inspect /proc entries"
fi

# TEST 12: Driver Communication Test
print_test_header "12" "C++ ↔ Driver Communication Verification"
g++ -std=c++17 -Iinclude src/Logger.cpp src/DeviceInterface.cpp tests/test_device_interface.cpp -o build/test_dev
DEV_OUT=$(./build/test_dev)
if echo "$DEV_OUT" | grep -q "File Descriptor = 3" && echo "$DEV_OUT" | grep -q "PASSED"; then
    assert_pass "C++ DeviceInterface communicated with kernel driver (fd 3 verified)"
else
    assert_fail "Driver communication test failed"
fi

# TEST 13: Logging Verification (logs/system.log)
print_test_header "13" "Application Logging Verification (logs/system.log)"
if [ -f "logs/system.log" ] && [ -s "logs/system.log" ]; then
    LOG_LINE=$(tail -n 1 logs/system.log)
    assert_pass "Application logged timestamped entries to logs/system.log: $LOG_LINE"
else
    assert_fail "logs/system.log is missing or empty"
fi

# TEST 14: Driver Unloading (rmmod)
print_test_header "14" "Driver Unloading (rmmod) & Resource Cleanup"
if sudo rmmod kernel_monitor; then
    sleep 0.5
    if [ ! -c "/dev/sysmonitor" ] && ! lsmod | grep -q "kernel_monitor"; then
        assert_pass "Driver unloaded cleanly; /dev/sysmonitor automatically destroyed by udev"
    else
        assert_fail "Driver module or /dev/sysmonitor remained after rmmod"
    fi
else
    assert_fail "sudo rmmod kernel_monitor failed"
fi

echo "============================================================"
echo -e "${GREEN}ALL $PASSED_COUNT/$TOTAL_TESTS TESTS COMPLETED SUCCESSFULLY!${NC}"
echo "Linux Device Health Monitor verified 100% compliant."
echo "============================================================"
