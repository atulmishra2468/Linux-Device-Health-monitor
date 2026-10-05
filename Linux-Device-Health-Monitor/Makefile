# ==============================================================================
# Linux Device Health Monitor - Master Makefile
# ==============================================================================
# Operating System Enforcement: Must be Linux
UNAME_S := $(shell uname -s)
ifneq ($(UNAME_S),Linux)
$(error [FATAL] Linux Device Health Monitor runs exclusively on Linux. Detected OS: $(UNAME_S))
endif

# Compiler & Toolchain flags
CXX      := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -pedantic -Iinclude -O2
LDFLAGS  := -pthread

# Directories
SRC_DIR    := src
INC_DIR    := include
OBJ_DIR    := build
TEST_DIR   := tests
DRIVER_DIR := driver
LOGS_DIR   := logs

# Target executable
TARGET   := monitor

# Source files (excluding main for test linking)
CORE_SRCS := $(SRC_DIR)/Logger.cpp $(SRC_DIR)/DeviceInterface.cpp $(SRC_DIR)/SystemMonitor.cpp $(SRC_DIR)/ProcessMonitor.cpp
CORE_OBJS := $(patsubst $(SRC_DIR)/%.cpp, $(OBJ_DIR)/%.o, $(CORE_SRCS))

# All source files & Object files
SRCS     := $(wildcard $(SRC_DIR)/*.cpp)
OBJS     := $(patsubst $(SRC_DIR)/%.cpp, $(OBJ_DIR)/%.o, $(SRCS))

# Test executables
TEST_BINS := $(OBJ_DIR)/test_logger $(OBJ_DIR)/test_system_monitor $(OBJ_DIR)/test_process_monitor $(OBJ_DIR)/test_device_interface

.PHONY: all app driver test clean distclean check-env help

# Default target: build the C++ user-space monitoring application
all: app

# Build C++ Application
app: $(TARGET)

$(TARGET): $(OBJS)
	@echo "[CXX LD] Linking $@"
	@$(CXX) $(OBJS) -o $@ $(LDFLAGS)
	@echo "Build successful: ./$(TARGET)"

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp | $(OBJ_DIR)
	@echo "[CXX] Compiling $<"
	@$(CXX) $(CXXFLAGS) -c $< -o $@

$(OBJ_DIR):
	@mkdir -p $(OBJ_DIR)
	@mkdir -p $(LOGS_DIR)

# Build the Linux Kernel Module inside driver/
driver:
	@echo "=== Building Kernel Module ==="
	@$(MAKE) -C $(DRIVER_DIR)

# Build and execute unit tests
test: $(TEST_BINS)
	@echo "========================================"
	@echo " Running C++ Unit Tests"
	@echo "========================================"
	@echo ">>> Running Logger Test..."
	@./$(OBJ_DIR)/test_logger
	@echo ">>> Running SystemMonitor Test..."
	@./$(OBJ_DIR)/test_system_monitor
	@echo ">>> Running ProcessMonitor Test..."
	@./$(OBJ_DIR)/test_process_monitor
	@echo ">>> Running DeviceInterface Test..."
	@./$(OBJ_DIR)/test_device_interface
	@echo "========================================"
	@echo " All C++ Unit Tests Passed!"
	@echo " Note: For full 14-point kernel integration test, run:"
	@echo "   sudo ./tests/test_driver.sh"
	@echo "========================================"

$(OBJ_DIR)/test_logger: $(TEST_DIR)/test_logger.cpp $(OBJ_DIR)/Logger.o | $(OBJ_DIR)
	@$(CXX) $(CXXFLAGS) $< $(OBJ_DIR)/Logger.o -o $@ $(LDFLAGS)

$(OBJ_DIR)/test_system_monitor: $(TEST_DIR)/test_system_monitor.cpp $(OBJ_DIR)/SystemMonitor.o $(OBJ_DIR)/Logger.o | $(OBJ_DIR)
	@$(CXX) $(CXXFLAGS) $< $(OBJ_DIR)/SystemMonitor.o $(OBJ_DIR)/Logger.o -o $@ $(LDFLAGS)

$(OBJ_DIR)/test_process_monitor: $(TEST_DIR)/test_process_monitor.cpp $(OBJ_DIR)/ProcessMonitor.o $(OBJ_DIR)/Logger.o | $(OBJ_DIR)
	@$(CXX) $(CXXFLAGS) $< $(OBJ_DIR)/ProcessMonitor.o $(OBJ_DIR)/Logger.o -o $@ $(LDFLAGS)

$(OBJ_DIR)/test_device_interface: $(TEST_DIR)/test_device_interface.cpp $(OBJ_DIR)/DeviceInterface.o $(OBJ_DIR)/Logger.o | $(OBJ_DIR)
	@$(CXX) $(CXXFLAGS) $< $(OBJ_DIR)/DeviceInterface.o $(OBJ_DIR)/Logger.o -o $@ $(LDFLAGS)

# Clean application build artifacts
clean:
	@echo "Cleaning application build artifacts..."
	@rm -rf $(OBJ_DIR) $(TARGET)
	@if [ -d "$(DRIVER_DIR)" ] && [ -f "$(DRIVER_DIR)/Makefile" ]; then \
		$(MAKE) -C $(DRIVER_DIR) clean; \
	fi
	@echo "Clean completed."

# Deep clean including logs
distclean: clean
	@rm -f $(LOGS_DIR)/*.log
	@echo "Distclean completed."

# Environment verification
check-env:
	@echo "=== Linux Development Environment Check ==="
	@echo "Kernel Version : $$(uname -r)"
	@echo "G++ Version    : $$($(CXX) --version | head -n1)"
	@echo "Make Version   : $$(make --version | head -n1)"
	@echo "Headers Status : $$(test -d /lib/modules/$$(uname -r)/build && echo 'INSTALLED' || echo 'MISSING')"

help:
	@echo "Linux Device Health Monitor Build System"
	@echo "----------------------------------------"
	@echo "  make           : Compiles the C++ monitoring application"
	@echo "  make driver    : Compiles the Linux character device driver"
	@echo "  make test      : Compiles and runs all C++ unit tests"
	@echo "  make clean     : Removes object files and binaries"
	@echo "  make check-env : Verifies Linux kernel headers and g++ version"
	@echo "  make help      : Displays this help menu"
