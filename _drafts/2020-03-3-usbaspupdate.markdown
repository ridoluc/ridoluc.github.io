---
layout: post
title:  Update USBASP firmware
date:   2020-03-2 20:20:00 +0000
categories: attiny85 attiny10
---

How to update the firmware of an USBASP programmer to get rid of warnings and enable AVR TPI.  
<!-- excer -->
{: .abstr}

## The problem
What is the USBASP.
can be bought for cheap
Update the firmware for error message (cannot set clock)
```
avrdude : warning : Can not Set sck period . usbasp please check for firmware update .
```
or to support TPI 
Updating the firmware it's relatively easy and can be done with just an Arduino and some jumpers.

![Common USBASP](/assets/img/USBASP.jpeg)
*- a common USBASP programmer -*

## Set up Arduino as IPS

We need Arduino to act as a programmer. To do so we just need to upload a sketch already available within the Arduino examples.
Therefore from the Arduino IDE:
1. Go to File > Examples > ArduinoISP
2. Connect Arduino
3. Click on Upload

Done. Now Arduino is ready to upload a firmware to another device, the USBASP in our case.

## Wiring

The following scheme shows the connections between the arduino pins and the USBASP. Double check the connections as most of the issuaes come from a loose wire or wrong pins connected.

|Arduino|USBASP|
|---|---|
|5V|  2|
|GND|  10|
|13|  7|
|12|   9 (MISO)|
|11|  1 (MOSI)|
|10|  5 (RESET)|

![USBASP Pinout](/assets/img/USBASP-pinout.png)
{: .img_xs}


## Close jumper 2 
Make sure you close the JP2 in on the uSBASP board. Without doing so the board cannot be reprogrammed.
To **close jumper 2 on the USBASP** you can solder something to it or simply use a wire and tighten it to both holes being sure it doesn't move and lose the connection half way the firmware upload.

![Jumper to be closed](/assets/img/USBASP-JP2.png)
*- close the jumper using even just a wire or a paper clip. No need to solder. -*

## Firmware
download from 
http://www.fischl.de/usbasp

file usbasp.atmega8.2011-05-28.hex


## avrdude

using avrdude inside the folder

```./avrdude -C ./avrdude.conf -p m8 -c avrisp -P /dev/cu.usbmodem14101 -b 19200 -U flash:w:usbasp.atmega8.2011-05-28.hex:i 
```
