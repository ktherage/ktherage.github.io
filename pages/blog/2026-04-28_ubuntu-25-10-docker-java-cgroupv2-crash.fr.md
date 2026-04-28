---
title: "Ubuntu 25.10 : La mise à jour qui a brické mes conteneurs Docker Java"
description: "Comment une simple mise à jour Ubuntu a fait planter mes conteneurs Selenium, et pourquoi le NullPointerException de cgroupv2 est le symptôme d'un problème de compatibilité entre le noyau Linux et les anciennes versions de Java."
cover:
  image: "img/pexels-docker-port.jpg"
  alt: "Container cranes at a bustling port during sunset"
  caption: "Photo by <a href=\"https://www.pexels.com/@thorl5/\">thorl5</a> on <a href=\"https://www.pexels.com\">Pexels</a>"
published: true
tags: [Ubuntu, Docker, Java, DevOps, Debug, cgroupv2]
excerpt: >-
  Après la mise à jour de mon système d'exploitaion d'Ubuntu 24.04 vers 25.10, mon conteneur Docker selenium/standalone-chrome s'est mis à planter avec un NullPointerException incompréhensible. Voici mon histoire.
---

## La mise à jour tranquille qui tourne au cauchemar

C'était un vendredi soir, comme les autres. Je décide enfin de faire ce que tout bon développeur évite : **mettre à jour son OS**. Ubuntu 24.04 LTS → 25.10, la petite mise à jour de routine. *"Ça ne peut que s'améliorer"*, me dis-je avec ce pessimisme propre à ceux qui ont vu trop de mises à jour mal se passer (Ubuntu 24.10 je te vois !).

Je lance la mise à jour en confiance. Tout se passe bien. Redémarrage. Tout fonctionne. Nickel.

Sauf que le lundi suivant, mes tests E2E ne passent plus. Le conteneur Docker `selenium/standalone-chrome:4.5.3` qui fonctionnait parfaitement la veille refuse désormais de démarrer. Il plante en boucle avec ce magnifique message d'erreur :

```
chrome-1  | java.lang.reflect.InvocationTargetException
chrome-1  |     at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
chrome-1  |     at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
chrome-1  |     at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
chrome-1  |     at java.base/java.lang.reflect.Method.invoke(Method.java:566)
chrome-1  |     at org.openqa.selenium.grid.Bootstrap.runMain(Bootstrap.java:77)
chrome-1  |     at org.openqa.selenium.grid.Bootstrap.main(Bootstrap.java:70)
chrome-1  | Caused by: java.lang.NullPointerException
chrome-1  |     at java.base/jdk.internal.platform.cgroupv2.CgroupV2Subsystem.getInstance(CgroupV2Subsystem.java:81)
chrome-1  |     at java.base/jdk.internal.platform.CgroupSubsystemFactory.create(CgroupSubsystemFactory.java:113)
chrome-1  |     at java.base/jdk.internal.platform.CgroupMetrics.getInstance(CgroupMetrics.java:167)
chrome-1  |     at java.base/jdk.internal.platform.SystemMetrics.instance(SystemMetrics.java:29)
chrome-1  |     at java.base/jdk.internal.platform.Metrics.systemMetrics(Metrics.java:58)
chrome-1  |     at java.base/jdk.internal.platform.Container.metrics(Container.java:43)
chrome-1  |     at jdk.management/com.sun.management.internal.OperatingSystemImpl.<init>(OperatingSystemImpl.java:182)
chrome-1  |     at jdk.management/com.sun.management.internal.PlatformMBeanProviderImpl.getOperatingSystemMXBean(PlatformMBeanProviderImpl.java:281)
chrome-1  |     at jdk.management/com.sun.management.internal.PlatformMBeanProviderImpl$3.nameToMBeanMap(PlatformMBeanProviderImpl.java:198)
chrome-1  |     at java.management/java.lang.management.ManagementFactory.lambda$getPlatformMBeanServer$0(ManagementFactory.java:487)
chrome-1  |     at java.base/java.util.stream.ReferencePipeline$7$1.accept(ReferencePipeline.java:271)
chrome-1  |     at java.base/java.util.stream.ReferencePipeline$2$1.accept(ReferencePipeline.java:177)
chrome-1  |     at java.base/java.util.HashMap$ValueSpliterator.forEachRemaining(HashMap.java:1693)
chrome-1  |     at java.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:484)
chrome-1  |     at java.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:474)
chrome-1  |     at java.base/java.util.stream.ForEachOps$ForEachOp.evaluateSequential(ForEachOps.java:150)
chrome-1  |     at java.base/java.util.stream.ForEachOps$ForEachOp$OfRef.evaluateSequential(ForEachOps.java:173)
chrome-1  |     at java.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:234)
chrome-1  |     at java.base/java.util.stream.ReferencePipeline.forEach(ReferencePipeline.java:497)
chrome-1  |     at java.management/java.lang.management.ManagementFactory.getPlatformMBeanServer(ManagementFactory.java:488)
chrome-1  |     at org.openqa.selenium.grid.jmx.JMXHelper.register(JMXHelper.java:29)
chrome-1  |     at org.openqa.selenium.grid.server.BaseServerOptions.<init>(BaseServerOptions.java:48)
chrome-1  |     at org.openqa.selenium.grid.commands.Standalone.createHandlers(Standalone.java:124)
chrome-1  |     at org.openqa.selenium.grid.TemplateGridServerCommand.asServer(TemplateGridServerCommand.java:41)
chrome-1  |     at org.openqa.selenium.grid.commands.Standalone.execute(Standalone.java:245)
chrome-1  |     at org.openqa.selenium.grid.TemplateGridCommand.lambda$configure$4(TemplateGridCommand.java:129)
chrome-1  |     at org.openqa.selenium.grid.Main.launch(Main.java:83)
chrome-1  |     at org.openqa.selenium.grid.Main.go(Main.java:57)
chrome-1  |     at org.openqa.selenium.grid.Main.main(Main.java:42)
chrome-1  |     ... 6 more
```

**Ma première pensée :**
<div class="d-flex flex-row m-2 justify-content-center">
  <iframe src="https://giphy.com/embed/4ZxicT7ZQYcLShHOiz" width="480" height="274" style="" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
</div>

> Je suis développeur PHP, pas Java.

**Mon reflexe:**
<div class="d-flex flex-row m-2 justify-content-center">
  <iframe src="https://giphy.com/embed/pUVOeIagS1rrqsYQJe" width="480" height="288" style="" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
</div>

> Demandons à plus fort que soi. Gemini cricket (🤖🦗) 🥲.

## L'Enquête

Mon ami le cricket met le doigt sur **cgroupv2** dans la ligne `CgroupV2Subsystem.java:81` et fait le lien avec la mise à jour de mon système. Mais **cgroupv2**, c'est quoi ?

🤖🦗:
> Pour faire court, c'est ce qui permet à Docker 🐋 de limiter le CPU ou la RAM d'un container.

Concrètement :
* Docker dit à la JVM : *"Tu as le droit à 2Go de RAM"*.
* Java lit ces infos dans les **cgroups** (fichiers de gestion des ressources).
* Java ajuste son comportement (mémoire Heap, etc.) en conséquence.

**C'est censé être une bonne chose.** Cela évite que Java ne se fasse abattre par le *OOM Killer* du système hôte. Mais Java doit parser ces fichiers, et c'est là que le bât blesse.

> **Pourquoi un crash et pas juste une erreur ?**
> Dans le code source des anciennes JVM, si le chemin retourné par l'interface système n'est pas exactement celui attendu, la variable `mountPoint` reste à `null`. La JVM tente ensuite d'appeler une méthode sur cet objet inexistant. C'est l'arroseur arrosé : la fonction censée protéger votre application devient la cause de son exécution sommaire.

## Le Plot Twist : La différence subtile entre Ubuntu 24.04 et 25.10

C'est ici que l'affaire devient fascinante.

Le véritable coupable, c'est l'évolution de systemd (passé en version 258 sur la version d'Ubuntu 25.10). Depuis la v256, systemd impose un 'durcissement' de la hiérarchie cgroup v2. Il ne se contente plus d'exposer les contrôleurs ; il les organise de façon beaucoup plus granulaire pour isoler les services. Les anciennes versions de Java, conçues à une époque où la hiérarchie était plus prévisible et moins protégée, se retrouvent littéralement 'aveugles' face à cette nouvelle structure.

**Et devinez quoi ?** La vieille logique d'initialisation de Java (avant Java 17) est beaucoup trop rigide pour comprendre ce nouveau format.

Au démarrage, le Java de notre conteneur fouille dans le système, ne trouve pas le contrôleur "memory" exactement là où il l'attendait, et assigne silencieusement null à sa variable interne. À la ligne suivante, le code tente d'appeler la méthode .getMountPoint() sur cet objet vide.

**BOOM**. NullPointerException. Mort instantanée du processus.

Le coupable n'était ni notre code, ni notre configuration Docker, mais une ancienne JVM incapable de s'adapter à la nouvelle hiérarchie d'un noyau Linux moderne. Normale aussi vous me direz.

## LA Solution

La solution propre, celle qu'on devrait toujours utiliser en production :

```bash
# Mettre à jour vers une version récente de l'image
docker pull selenium/standalone-chrome:4.20.0

# OU utiliser une image avec Java 17+
docker pull selenium/standalone-chrome:latest
```

## Le Hack de survie — Désactiver UseContainerSupport

Si vous ne pouvez pas mettre à jour l'image (contraintes legacy, validation QA, etc.), vous pouvez désactiver la détection de conteneur :

```bash
# Option 1 : Via variable d'environnement Docker
docker run -d \
  -e JAVA_OPTS="-XX:-UseContainerSupport" \
  selenium/standalone-chrome:4.5.3

# Option 2 : Via docker-compose.yml
services:
  chrome:
    image: selenium/standalone-chrome:4.5.3
    environment:
      - JAVA_OPTS=-XX:-UseContainerSupport
```

**⚠️ Avertissement important :**

- **NE FAITES PAS ÇA EN PRODUCTION.**, dans mon cas il s'agit d'un container de **developpement** en locale.
- Sans `UseContainerSupport`, Java ne connaît pas ses limites et peut se faire killer par le OOM Killer du système hôte.
- Cette solution est un **pansement temporaire** en attendant la mise à jour.

## La morale de cette histoire

Nos écosystèmes logiciels sont **fragiles**. Une simple mise à jour du noyau Linux — via une mise à jour d'Ubuntu dans mon cas — peut casser des conteneurs qui fonctionnaient parfaitement d'une version à l'autre.

**Les conseils philosophiques :**

> *Penser à nettoyer sa chambre régulièrement (je suis sûr que vous comprenez l'image) peut faire gagner beaucoup de temps.*

> *Ne faites jamais de mise à jour d'OS un vendredi.*

> *Prenez soin de toujours tester vos conteneurs Docker sur un environnement de staging après une mise à jour système.*

> *"Works on my machine" — jusqu'à la mise à jour du kernel.*


## Sources et Références

- [Oracle Docs : Java Container Support](https://docs.oracle.com/en/java/javase/17+containers/) 
- [Ubuntu 25.10 Release Notes](https://ubuntu.com/blog/ubuntu-25-10)
- [Docker & Java : Best Practices](https://docker-java.readthedocs.io/)
- [cgroup v2 kernel documentation](https://www.kernel.org/doc/Documentation/cgroup-v2.txt)
- [Systemd News : Changes in unified cgroup hierarchy handling (v256+)](https://systemd.io/)