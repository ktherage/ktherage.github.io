---
tags: [bash, curl, performance, testing, http, shell, web-development, command-line, devops]
excerpt: >-
  HTTP calls are essential to the functioning of the web and are critical to any web development project. You may have wondered how to quickly see how your HTTP call is performing. I’ll show you how I did it easily using Curl.
---
HTTP calls are essential to the functioning of the web and are critical to any web development project. You may have wondered how to quickly see how your HTTP call is performing. I’ll show you how I did it easily using Curl.

**TL;DR:** You just want the code (I perfectly understand that 😉)? Scroll to the piece of code.

# What was my need regarding HTTP calls?

I needed to have a quick idea of how the application cache system I’ve placed on an HTTP endpoint was performing, and I wanted it to be quick and simple.

With my notions of Shell and basic knowledge of Curl (a small gift from a colleague: you can find a Curl cheatsheet here), I knew that I could easily run a hundred times the same HTTP call and get the total time as a result.

This solution is a simple short solution that fits my needs which was to locally test my HTTP endpoint.
If you plan to do real performance/load testing on real servers like staging or production ones then you shall take a look at tools like (https://jmeter.apache.org/)[Apache JMeter], (https://gatling.io/)[Gatling], or other similar tools.

# How Curl helped me test my HTTP call?

So I opened my terminal and ran:

```bash
for i in {1..100}; do curl 'https://some-domain/some-uri/some-path?cache=false' \
-H 'cache-control: no-cache' \
-H 'pragma: no-cache' \
--compressed \
--insecure -s -o /dev/null -w "%{time_total}s\n";
done

# Which printed :
0.057703s
0.067895s
0.063033s
0.062455s
0.074864s
...
```

For some explanations, I copied the request sent by my browser as a Curl request (this could be easily done on most browsers see (https://quickref.me/curl)[here]) and wrapped it in a for loop which is running that HTTP call a hundred times.

**The only change I made to the Curl request** was to add the options `-s` for a quiet output, `-o /dev/null` to avoid having the response body printed and the most important one `-w "%{time_total}s\n"` which allows me to format Curl’s output to return the total time. You can have a full list of available “Write out variables” (https://everything.curl.dev/usingcurl/verbose/writeout.html#available-write-out-variables)[here].

And that’s it 🎉 ! **You can have a quick performance idea only with the tools you may already use.**

I hope you’ll find it helpful!

Please feel free to leave your comments or questions below.
