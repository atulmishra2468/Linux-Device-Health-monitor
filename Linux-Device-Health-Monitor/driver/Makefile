# ==============================================================================
# Linux Device Health Monitor - Kernel Module Kbuild Makefile
# ==============================================================================

# obj-m informs Kbuild to compile kernel_monitor.c into a loadable module (.ko)
obj-m += kernel_monitor.o

# KDIR points to the kernel build directory containing headers and Makefiles
KDIR ?= /lib/modules/$(shell uname -r)/build

# Current working directory where the driver source code resides
PWD  := $(shell pwd)

# Default target: delegates compilation to the Linux kernel build system
default:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

# Clean target: removes intermediate object files, symbols, and .ko binaries
clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean
	rm -f *.o *.ko *.mod.c *.mod *.order *.symvers .*.cmd
	rm -rf .tmp_versions
