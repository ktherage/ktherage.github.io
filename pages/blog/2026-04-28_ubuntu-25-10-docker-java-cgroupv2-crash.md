---
title: "Ubuntu 25.10: The Update That Bricked My Java Docker Containers"
description: "How a simple Ubuntu update crashed my Selenium containers, and why the cgroupv2 NullPointerException is a symptom of a compatibility issue between the Linux kernel and legacy Java versions."
cover:
  image: "img/pexels-docker-port.jpg"
  alt: "Container cranes at a bustling port during sunset"
  caption: "Photo by <a href=\"[https://www.pexels.com/@thorl5/](https://www.pexels.com/@thorl5/)\">thorl5</a> on <a href=\"[https://www.pexels.com](https://www.pexels.com)\">Pexels</a>"
published: true
tags: [Ubuntu, Docker, Java, DevOps, Debug, cgroupv2]
excerpt: >-
  After updating my operating system from Ubuntu 24.04 to 25.10, my selenium/standalone-chrome Docker container started crashing with a cryptic NullPointerException. Here is my story.
---

## The Quiet Update That Turned Into a Nightmare

It was a Friday night, just like any other. I finally decided to do what every good developer avoids: **updating my OS**. Ubuntu 24.04 LTS → 25.10, just a routine little update. *"It can only get better,"* I told myself with that specific brand of pessimism reserved for those who have seen too many updates go south (Ubuntu 24.10, I’m looking at you!).

I launched the update with confidence. Everything went well. Reboot. Everything works. Perfect.

Except that the following Monday, my E2E tests were failing. The `selenium/standalone-chrome:4.5.3` Docker container, which worked perfectly the day before, now refused to start. It was crashing in a loop with this magnificent error message:

```
chrome-1  | java.lang.reflect.InvocationTargetException
chrome-1  |      at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
chrome-1  |      at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
chrome-1  |      at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
chrome-1  |      at java.base/java.lang.reflect.Method.invoke(Method.java:566)
chrome-1  |      at org.openqa.selenium.grid.Bootstrap.runMain(Bootstrap.java:77)
chrome-1  |      at org.openqa.selenium.grid.Bootstrap.main(Bootstrap.java:70)
chrome-1  | Caused by: java.lang.NullPointerException
chrome-1  |      at java.base/jdk.internal.platform.cgroupv2.CgroupV2Subsystem.getInstance(CgroupV2Subsystem.java:81)
chrome-1  |      at java.base/jdk.internal.platform.CgroupSubsystemFactory.create(CgroupSubsystemFactory.java:113)
chrome-1  |      at java.base/jdk.internal.platform.CgroupMetrics.getInstance(CgroupMetrics.java:167)
chrome-1  |      at java.base/jdk.internal.platform.SystemMetrics.instance(SystemMetrics.java:29)
chrome-1  |      at java.base/jdk.internal.platform.Metrics.systemMetrics(Metrics.java:58)
chrome-1  |      at java.base/jdk.internal.platform.Container.metrics(Container.java:43)
...
```

**My first thought:**
<div class="d-flex flex-row m-2 justify-content-center">
  <iframe src="https://giphy.com/embed/4ZxicT7ZQYcLShHOiz" width="480" height="274" style="" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
</div>

> I'm a PHP developer, not a Java one.

**My reflex:**
<div class="d-flex flex-row m-2 justify-content-center">
  <iframe src="https://giphy.com/embed/pUVOeIagS1rrqsYQJe" width="480" height="288" style="" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
</div>

> Let's ask someone smarter than me. Gemini cricket (🤖🦗) 🥲.

## The Investigation

My cricket friend pointed out **cgroupv2** on line `CgroupV2Subsystem.java:81` and linked it to my system update. But what exactly is **cgroupv2**?

🤖🦗:
> Long story short, it's what allows Docker 🐋 to limit a container's CPU or RAM.



In concrete terms:
* Docker tells the JVM: *"You are allowed 2GB of RAM."*
* Java reads this info from **cgroups** (resource management files).
* Java adjusts its behavior (Heap memory, etc.) accordingly.

**This is supposed to be a good thing.** It prevents Java from being slaughtered by the host system's *OOM Killer*. However, Java must parse these files, and that’s where things fall apart.

> **Why a crash instead of just an error?**
> In the source code of older JVMs, if the path returned by the system interface isn't exactly what's expected, the `mountPoint` variable remains `null`. The JVM then attempts to call a method on this non-existent object. It's a classic backfire: the function meant to protect your application becomes the very cause of its summary execution.

## The Plot Twist: The Subtle Difference Between Ubuntu 24.04 and 25.10

This is where it gets fascinating.

The real culprit is the evolution of **systemd** (now at version 258 in Ubuntu 25.10). Since v256, systemd has enforced a "hardening" of the cgroup v2 hierarchy. It no longer just exposes controllers; it organizes them in a much more granular way to isolate services. Legacy Java versions, designed back when the hierarchy was more predictable and less protected, find themselves literally "blind" to this new structure.

**And guess what?** The old Java initialization logic (pre-Java 17) is far too rigid to understand this new format.

At startup, the Java inside our container scouts the system, fails to find the "memory" controller exactly where it expected, and silently assigns `null` to its internal variable. On the very next line, the code tries to call the `.getMountPoint()` method on this empty object.

**BOOM**. NullPointerException. Instant process death.

The culprit wasn't our code or our Docker config, but an old JVM incapable of adapting to a modern Linux kernel's new hierarchy. *Fair enough, you might say.*

## THE Solution

The clean solution, the one you should always use in production:

```bash
# Update to a recent version of the image
docker pull selenium/standalone-chrome:4.20.0

# OR use an image with Java 17+
docker pull selenium/standalone-chrome:latest
```

## The Survival Hack — Disabling UseContainerSupport

If you cannot update the image (legacy constraints, QA validation, etc.), you can disable container detection:

```bash
# Option 1: Via Docker environment variable
docker run -d \
  -e JAVA_OPTS="-XX:-UseContainerSupport" \
  selenium/standalone-chrome:4.5.3

# Option 2: Via docker-compose.yml
services:
  chrome:
    image: selenium/standalone-chrome:4.5.3
    environment:
      - JAVA_OPTS=-XX:-UseContainerSupport
```

**⚠️ Important Warning:**

- **DO NOT DO THIS IN PRODUCTION.** In my case, this is a **local development** container.
- Without `UseContainerSupport`, Java is unaware of its limits and can be terminated by the host system's OOM Killer.
- This solution is a **temporary band-aid** while waiting for an update.

## The Morale of the Story

Our software ecosystems are **fragile**. A simple Linux kernel update—via an Ubuntu update in my case—can break containers that worked perfectly from one version to another.

**Philosophical advice:**

> *Remembering to "clean your room" regularly (I'm sure you get the metaphor) can save a lot of time.*

> *Never perform an OS update on a Friday.*

> *Always make sure to test your Docker containers in a staging environment after a system update.*

> *"Works on my machine" — until the kernel updates.*

## Sources and References

- [Oracle Docs: Java Container Support](https://docs.oracle.com/en/java/javase/17+containers/) 
- [Ubuntu 25.10 Release Notes](https://ubuntu.com/blog/ubuntu-25-10)
- [Docker & Java: Best Practices](https://docker-java.readthedocs.io/)
- [cgroup v2 kernel documentation](https://www.kernel.org/doc/Documentation/cgroup-v2.txt)
- [Systemd News: Changes in unified cgroup hierarchy handling (v256+)](https://systemd.io/)