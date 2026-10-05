/**
 * @file kernel_monitor.c
 * @brief Thread-safe Linux Character Device Driver with Mutex Locking and Atomic State
 * 
 * Capstone Project: Linux Device Health Monitor
 * Target OS: Linux (Kernel 5.x / 6.x)
 * License: Dual GPL v2
 */

#define pr_fmt(fmt) KBUILD_MODNAME ": " fmt

#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>   /* copy_to_user, copy_from_user */
#include <linux/string.h>    /* strlen, strncpy */
#include <linux/mutex.h>     /* mutex locking for concurrency safety */
#include <linux/atomic.h>    /* atomic_t for thread-safe open count */
#include <linux/version.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Atul Mishra <atulmishra2468@gmail.com>");
MODULE_DESCRIPTION("Linux Device Health Monitor - Synchronized Character Device Driver");
MODULE_VERSION("1.4");

#define DEVICE_NAME "sysmonitor"
#define CLASS_NAME  "sysmon_class"
#define BUFFER_SIZE 256

/* Global device state variables */
static dev_t dev_number;
static struct cdev sysmon_cdev;
static struct class *sysmon_class   = NULL;
static struct device *sysmon_device = NULL;

/* Concurrency synchronization primitives */
static DEFINE_MUTEX(device_mutex);
static atomic_t open_count = ATOMIC_INIT(0);

/* Kernel memory buffer holding driver response and written commands */
static char kernel_buffer[BUFFER_SIZE] = "SYS_MONITOR_DRIVER_OK\n";
static size_t data_size = 0; // Initialized dynamically with strlen() in init

/**
 * @brief Device Open Callback
 * Triggered when user space calls: open("/dev/sysmonitor", O_RDWR);
 */
static int dev_open(struct inode *inodep, struct file *filep)
{
    int current_opens = atomic_inc_return(&open_count);
    pr_info("device opened by PID %d (%s), active opens: %d\n",
            current->pid, current->comm, current_opens);
    return 0;
}

/**
 * @brief Device Read Callback
 * Triggered when user space calls: read(fd, buffer, count); or `cat /dev/sysmonitor`
 * 
 * Safely copies kernel_buffer to user space with mutex protection.
 * Advances *offset and signals EOF (0 bytes) when offset reaches data_size.
 */
static ssize_t dev_read(struct file *filep, char __user *user_buffer, size_t len, loff_t *offset)
{
    size_t bytes_to_copy;
    size_t not_copied;
    ssize_t bytes_transferred;

    if (mutex_lock_interruptible(&device_mutex)) {
        return -ERESTARTSYS;
    }

    /* Check if user has already read the full buffer (EOF check) */
    if (*offset >= data_size) {
        mutex_unlock(&device_mutex);
        return 0; // Return 0 indicates EOF to user space
    }

    /* Calculate how many bytes can be safely read */
    bytes_to_copy = min(len, (size_t)(data_size - *offset));

    /*
     * copy_to_user(to, from, count):
     * Safely copies data from kernel address space to user address space.
     */
    not_copied = copy_to_user(user_buffer, kernel_buffer + *offset, bytes_to_copy);
    if (not_copied != 0) {
        pr_err("failed to copy %zu bytes to user space\n", not_copied);
        mutex_unlock(&device_mutex);
        return -EFAULT;
    }

    bytes_transferred = bytes_to_copy - not_copied;
    *offset += bytes_transferred;

    pr_info("read request: served %zd bytes to PID %d (new offset: %lld)\n",
            bytes_transferred, current->pid, *offset);

    mutex_unlock(&device_mutex);
    return bytes_transferred;
}

/**
 * @brief Device Write Callback
 * Triggered when user space calls: write(fd, buffer, count); or `echo "..." > /dev/sysmonitor`
 * 
 * Safely copies user command into kernel_buffer under mutex lock,
 * advances *offset, and ensures null-termination before logging.
 */
static ssize_t dev_write(struct file *filep, const char __user *user_buffer, size_t len, loff_t *offset)
{
    size_t bytes_to_copy;
    size_t not_copied;
    ssize_t bytes_accepted;

    if (mutex_lock_interruptible(&device_mutex)) {
        return -ERESTARTSYS;
    }

    /* Prevent buffer overflow: clamp write size to kernel_buffer capacity */
    bytes_to_copy = min(len, (size_t)(BUFFER_SIZE - 1));

    /*
     * copy_from_user(to, from, count):
     * Safely copies data from user address space into kernel address space.
     */
    not_copied = copy_from_user(kernel_buffer, user_buffer, bytes_to_copy);
    if (not_copied != 0) {
        pr_err("failed to copy %zu bytes from user space\n", not_copied);
        mutex_unlock(&device_mutex);
        return -EFAULT;
    }

    bytes_accepted = bytes_to_copy - not_copied;

    /* Guarantee null-termination for safe string handling */
    kernel_buffer[bytes_accepted] = '\0';
    data_size = bytes_accepted;
    *offset += bytes_accepted;

    pr_info("received %zd bytes from PID %d: %s",
            bytes_accepted, current->pid, kernel_buffer);

    mutex_unlock(&device_mutex);
    return bytes_accepted;
}

/**
 * @brief Device Release Callback
 * Triggered when user space calls: close(fd);
 */
static int dev_release(struct inode *inodep, struct file *filep)
{
    int current_opens = atomic_dec_return(&open_count);
    pr_info("device released by PID %d, active opens: %d\n",
            current->pid, current_opens);
    return 0;
}

/* Bind all 4 VFS operations to the file_operations table */
static struct file_operations fops = {
    .owner   = THIS_MODULE,
    .open    = dev_open,
    .read    = dev_read,
    .write   = dev_write,
    .release = dev_release,
};

/**
 * @brief Module Initialization
 */
static int __init monitor_init(void)
{
    int ret;

    pr_info("initializing module\n");

    /* Initialize data_size dynamically using strlen() instead of hardcoded numbers */
    data_size = strlen(kernel_buffer);

    /* 1. Allocate Major & Minor numbers */
    ret = alloc_chrdev_region(&dev_number, 0, 1, DEVICE_NAME);
    if (ret < 0) {
        pr_err("failed to allocate Major number (error: %d)\n", ret);
        return ret;
    }

    /* 2. Bind file_operations */
    cdev_init(&sysmon_cdev, &fops);
    sysmon_cdev.owner = THIS_MODULE;

    ret = cdev_add(&sysmon_cdev, dev_number, 1);
    if (ret < 0) {
        unregister_chrdev_region(dev_number, 1);
        pr_err("failed to add cdev\n");
        return ret;
    }

    /* 3. Create sysfs class */
#if LINUX_VERSION_CODE >= KERNEL_VERSION(6, 4, 0)
    sysmon_class = class_create(CLASS_NAME);
#else
    sysmon_class = class_create(THIS_MODULE, CLASS_NAME);
#endif

    if (IS_ERR(sysmon_class)) {
        cdev_del(&sysmon_cdev);
        unregister_chrdev_region(dev_number, 1);
        return PTR_ERR(sysmon_class);
    }

    /* 4. Create /dev/sysmonitor device node */
    sysmon_device = device_create(sysmon_class, NULL, dev_number, NULL, DEVICE_NAME);
    if (IS_ERR(sysmon_device)) {
        class_destroy(sysmon_class);
        cdev_del(&sysmon_cdev);
        unregister_chrdev_region(dev_number, 1);
        return PTR_ERR(sysmon_device);
    }

    pr_info("device registered with Major %d, Minor %d\n",
            MAJOR(dev_number), MINOR(dev_number));
    pr_info("/dev/%s ready (payload size: %zu bytes)\n", DEVICE_NAME, data_size);
    return 0;
}

/**
 * @brief Module Cleanup
 */
static void __exit monitor_exit(void)
{
    device_destroy(sysmon_class, dev_number);
    class_destroy(sysmon_class);
    cdev_del(&sysmon_cdev);
    unregister_chrdev_region(dev_number, 1);

    pr_info("/dev/%s removed cleanly\n", DEVICE_NAME);
    pr_info("module unloaded\n");
}

module_init(monitor_init);
module_exit(monitor_exit);
