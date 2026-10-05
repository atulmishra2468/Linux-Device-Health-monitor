import kernelMonitorC from '../../Linux-Device-Health-Monitor/driver/kernel_monitor.c?raw';
import driverMakefile from '../../Linux-Device-Health-Monitor/driver/Makefile?raw';
import mainCpp from '../../Linux-Device-Health-Monitor/src/main.cpp?raw';
import loggerHpp from '../../Linux-Device-Health-Monitor/include/Logger.hpp?raw';
import loggerCpp from '../../Linux-Device-Health-Monitor/src/Logger.cpp?raw';
import deviceInterfaceHpp from '../../Linux-Device-Health-Monitor/include/DeviceInterface.hpp?raw';
import deviceInterfaceCpp from '../../Linux-Device-Health-Monitor/src/DeviceInterface.cpp?raw';
import systemMonitorHpp from '../../Linux-Device-Health-Monitor/include/SystemMonitor.hpp?raw';
import systemMonitorCpp from '../../Linux-Device-Health-Monitor/src/SystemMonitor.cpp?raw';
import processMonitorHpp from '../../Linux-Device-Health-Monitor/include/ProcessMonitor.hpp?raw';
import processMonitorCpp from '../../Linux-Device-Health-Monitor/src/ProcessMonitor.cpp?raw';
import rootMakefile from '../../Linux-Device-Health-Monitor/Makefile?raw';
import cmakeLists from '../../Linux-Device-Health-Monitor/CMakeLists.txt?raw';
import testDriverSh from '../../Linux-Device-Health-Monitor/tests/test_driver.sh?raw';
import readmeMd from '../../Linux-Device-Health-Monitor/README.md?raw';
import testResultsMd from '../../Linux-Device-Health-Monitor/docs/test-results.md?raw';

export interface SourceFile {
  id: string;
  name: string;
  path: string;
  language: 'c' | 'cpp' | 'makefile' | 'bash' | 'markdown' | 'header';
  sizeBytes: number;
  description: string;
  content: string;
}

export const SOURCE_CODE_FILES: SourceFile[] = [
  {
    id: 'kernel_monitor_c',
    name: 'kernel_monitor.c',
    path: 'driver/kernel_monitor.c',
    language: 'c',
    sizeBytes: kernelMonitorC.length,
    description: 'Linux Character Device Driver with open, read, write, release VFS handlers and mutex locking',
    content: kernelMonitorC
  },
  {
    id: 'driver_makefile',
    name: 'Makefile (driver)',
    path: 'driver/Makefile',
    language: 'makefile',
    sizeBytes: driverMakefile.length,
    description: 'Kbuild Linux kernel module build system script',
    content: driverMakefile
  },
  {
    id: 'main_cpp',
    name: 'main.cpp',
    path: 'src/main.cpp',
    language: 'cpp',
    sizeBytes: mainCpp.length,
    description: 'Interactive Terminal Dashboard, Menu, and Driver Communication Test',
    content: mainCpp
  },
  {
    id: 'device_interface_hpp',
    name: 'DeviceInterface.hpp',
    path: 'include/DeviceInterface.hpp',
    language: 'header',
    sizeBytes: deviceInterfaceHpp.length,
    description: 'RAII Linux File Descriptor Wrapper for /dev/sysmonitor',
    content: deviceInterfaceHpp
  },
  {
    id: 'device_interface_cpp',
    name: 'DeviceInterface.cpp',
    path: 'src/DeviceInterface.cpp',
    language: 'cpp',
    sizeBytes: deviceInterfaceCpp.length,
    description: 'POSIX open(), read(), write(), close() system call handlers',
    content: deviceInterfaceCpp
  },
  {
    id: 'system_monitor_hpp',
    name: 'SystemMonitor.hpp',
    path: 'include/SystemMonitor.hpp',
    language: 'header',
    sizeBytes: systemMonitorHpp.length,
    description: 'System Telemetry Collector Interface (/proc/cpuinfo, /proc/meminfo)',
    content: systemMonitorHpp
  },
  {
    id: 'system_monitor_cpp',
    name: 'SystemMonitor.cpp',
    path: 'src/SystemMonitor.cpp',
    language: 'cpp',
    sizeBytes: systemMonitorCpp.length,
    description: 'Linux /proc virtual filesystem stream parsing implementation',
    content: systemMonitorCpp
  },
  {
    id: 'process_monitor_hpp',
    name: 'ProcessMonitor.hpp',
    path: 'include/ProcessMonitor.hpp',
    language: 'header',
    sizeBytes: processMonitorHpp.length,
    description: 'Process Accounting Interface for active Linux tasks',
    content: processMonitorHpp
  },
  {
    id: 'process_monitor_cpp',
    name: 'ProcessMonitor.cpp',
    path: 'src/ProcessMonitor.cpp',
    language: 'cpp',
    sizeBytes: processMonitorCpp.length,
    description: 'Traversal of /proc/[PID]/stat with RSS-descending memory sorting',
    content: processMonitorCpp
  },
  {
    id: 'logger_hpp',
    name: 'Logger.hpp',
    path: 'include/Logger.hpp',
    language: 'header',
    sizeBytes: loggerHpp.length,
    description: 'Thread-safe timestamped logger interface',
    content: loggerHpp
  },
  {
    id: 'logger_cpp',
    name: 'Logger.cpp',
    path: 'src/Logger.cpp',
    language: 'cpp',
    sizeBytes: loggerCpp.length,
    description: 'Mutex-locked file logger writing to logs/system.log',
    content: loggerCpp
  },
  {
    id: 'root_makefile',
    name: 'Makefile (root)',
    path: 'Makefile',
    language: 'makefile',
    sizeBytes: rootMakefile.length,
    description: 'Master Makefile with app, driver, test, and check-env targets',
    content: rootMakefile
  },
  {
    id: 'cmake_lists',
    name: 'CMakeLists.txt',
    path: 'CMakeLists.txt',
    language: 'makefile',
    sizeBytes: cmakeLists.length,
    description: 'CMake build configuration with CTest integration',
    content: cmakeLists
  },
  {
    id: 'test_driver_sh',
    name: 'test_driver.sh',
    path: 'tests/test_driver.sh',
    language: 'bash',
    sizeBytes: testDriverSh.length,
    description: '14-Point Automated Integration Test Suite script',
    content: testDriverSh
  },
  {
    id: 'readme_md',
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    sizeBytes: readmeMd.length,
    description: 'Complete 25-Section Capstone Technical Specification',
    content: readmeMd
  },
  {
    id: 'test_results_md',
    name: 'test-results.md',
    path: 'docs/test-results.md',
    language: 'markdown',
    sizeBytes: testResultsMd.length,
    description: 'Test Verification Report and Privilege Breakdown',
    content: testResultsMd
  }
];
