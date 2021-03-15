---
layout: post
title: "ATtiny 1-series TWI library"
description: "Simple library for using the I2C (or TWI) peripherals of ATtiny 0-series and 1-series. I2C library for ATtiny412, ATtiny817."
date: 2021-03-15 12:00:00 +0000
tags: circuit attiny412 i2c
#slug: "--"
# usemathjax: true
# featured_img: "/assets/img/RunTiny/RunTiny_game_copy.jpg"
---

Simple and lighweight library for using the ATtiny 1-series TWI (I2C) peripheral.
<!-- excer -->
{: .abstr}

## Intro
Many sensor ICs, displays and other microcontrollers can be connected by I2C[^1] (or TWI - Two Wire Interface) using just two wires for clock and data. It's a convenient method of connecting multiple devices on a serial protocol and a must-have knowledge for electronic projects.

Most of the newest microcontrollers offer dedicated peripherals to manage this interface efficiently. Despite most of the operations are implemented in hardware, the user still needs to take care of some actions with software.

I like to be familiar with the code I'm using and fully understand the basic functioning. I wrote my TWI master library[^3] that I will briefly explain below. 

I tested this on an ATtiny412[^2] but it should work for most devices of the ATtiny 0 and 1-series families. The entire code is at the end of the page.

## Usage
The library is simple to use:
### 1. Initialize the peripheral
First initialize the TWI peripheral with 
```
TWI_Init()
```
### 2. Start the transmission
Start the transmission by writing the slave address on the bus with the read/write bit
```
TWI_InitTransmission(SLAVE_ADDR, TWI_WRITE); // for writing 
TWI_InitTransmission(SLAVE_ADDR, TWI_READ); // for reading 
```

### 3. Read / Write
Read or write data on bus with the following functions:
```
// Write one byte
TWI_SendByte(uint8_t data); 
// Write N bytes
TWI_SendN(uint8_t *pData, uint8_t len); 
// Read one byte
TWI_ReadByte(uint8_t *data); 
// Read N bytes
TWI_ReadN(uint8_t *pData, uint8_t len); 
```
these functions return the number of bytes read or written.

### 4. Stop the transmission
End with
```
TWI_EndSession();
```

## More details

### Initialization
The TWI peripheral is initialized by setting the bus clock frequency and then writing the enable bit. At this point, the status needs to be set in idle mode.
```
void TWI_Init(void)
{
    /* Select I2C pins PA1/PA2 */
    // PORTA_DIR = PIN1_bm |PIN2_bm;
    
    /* Master Baud Rate Control */
    TWI0.MBAUD = TWI_BAUD;
    
    /* Enable TWI */ 
    TWI0.MCTRLA = TWI_ENABLE_bm;
    
    /* Set bus state idle */
    TWI0.MSTATUS = TWI_BUSSTATE_IDLE_gc;
}
```

### Start the session
The communication is started by writing the slave address in the register together with the final bit indicating if the master wishes to read or write. 
```
TWI0.MADDR = (address<<1) | dir;
```
The microcontroller will take care of transmitting the address and the software just needs to check if the slave acknowledged the address and hance is available for the communication.
This is done by reading on the status register the flags for read and write operations completion and bus errors.  

```
    do
    {
        if(TWI0.MSTATUS & (TWI_WIF_bm | TWI_RIF_bm))
        {
            state = TWI_READY;
        }
        else if(TWI0.MSTATUS & (TWI_BUSERR_bm | TWI_ARBLOST_bm))
        {
            /* get here only in case of bus error or arbitration lost */
            state = TWI_ERROR;
        }
    } while(!state);
```

### Sending data
Sending one byte of data is done simply by writing the data into the TWI register master data MDATA:
```
uint8_t TWI_SendByte(uint8_t data)
{
    TWI0.MDATA = data;
    return RX_acked();
}
```
if the slave acknowledges the data reception, one more byte can be transmitted. The microcontroller will automatically issue a repeated start.

### Reading data
Reading data is done is a similar fashion by reading the data inside the `TWI0.MDATA` register.

```
uint8_t TWI_ReadByte(uint8_t *pData)
{
    if(TWI_GetStatus() == TWI_READY)
    {
        *pData = TWI0.MDATA;
        return 1;
    }
    else return 0;
}
```

### Ending the transmission
To issue a stop condition the CMD bits in MCRTLB register must be written:
```
    TWI0.MCTRLB = TWI_MCMD_STOP_gc;
```
## Conclusion
This is a basic interface for the TWI protocol. Nevertheless, it's functioning, simple to use and very lightweight - something valuable to me since I mostly use microcontrollers with limited space.
Following the same logic, it's easy to adapt the code to other microcontrollers. I hope this could help someone writing a custom library to use this fundamental tool.

## Complete code
### TWI.h
```
#ifndef _TWI_
#define _TWI_

#include <avr/io.h>
#include <stdint.h>

#define TWI_SCL_FREQ 100000

#define TWI_BAUD ((((float) F_CPU / (float) TWI_SCL_FREQ) - 10)/2)


typedef enum {
    TWI_INIT = 0, 
    TWI_READY,
    TWI_ERROR
} TWI_Status;

typedef enum{
    TWI_WRITE = 0,
    TWI_READ = 1
} TWI_Direction;

void    TWI_Init(void);
uint8_t TWI_InitTransmission(uint8_t address, TWI_Direction dir);
uint8_t TWI_SendByte(uint8_t data); 
uint8_t TWI_SendN(uint8_t *pData, uint8_t len); 
uint8_t TWI_ReadByte(uint8_t *data); 
uint8_t TWI_ReadN(uint8_t *pData, uint8_t len); 
uint8_t TWI_SendData(uint8_t address, uint8_t *pData, uint8_t len);
uint8_t TWI_GetData(uint8_t address, uint8_t *pData, uint8_t len); 
void    TWI_EndSession(void);


#endif
```

### TWI.c
```
#include <TWI.h>

void TWI_Init(void)
{
    /* Select I2C pins PA1/PA2 */
    // PORTA_DIR = PIN1_bm |PIN2_bm;

    /* Master Baud Rate Control */
    TWI0.MBAUD = TWI_BAUD;

    /* Enable TWI */
    TWI0.MCTRLA = TWI_ENABLE_bm;

    /* Initialize the address register */
    TWI0.MADDR = 0x00;

    /* Initialize the data register */
    TWI0.MDATA = 0x00;

    /* Set bus state idle */
    TWI0.MSTATUS = TWI_BUSSTATE_IDLE_gc;
}

static TWI_Status TWI_GetStatus(void)
{
    TWI_Status state = TWI_INIT;
    do
    {
        if (TWI0.MSTATUS & (TWI_WIF_bm | TWI_RIF_bm))
        {
            state = TWI_READY;
        }
        else if (TWI0.MSTATUS & (TWI_BUSERR_bm | TWI_ARBLOST_bm))
        {
            /* get here only in case of bus error or arbitration lost */
            state = TWI_ERROR;
        }
    } while (!state);

    return state;
}

/* Returns 1 if the slave acknowleged the receipt and 0 if not */
static uint8_t RX_acked(void)
{
    // Actual status of the line O means ACK - 1 means NACK. Therefore ! MSTATUS bit
    return (!(TWI0.MSTATUS & TWI_RXACK_bm));
}

/* Returns 1 if address is ACKed */
uint8_t TWI_InitTransmission(uint8_t address, TWI_Direction dir)
{
    /* transmit the slave address */
    TWI0.MADDR = (address << 1) | dir;
    return ((TWI_GetStatus() == TWI_READY) && RX_acked());
}

/* Returns 1 if address is ACKed */
uint8_t TWI_SendByte(uint8_t data)
{
    TWI0.MDATA = data;
    return RX_acked();
}

/* Returns how many bytes have been sent, -1 means bus error */
uint8_t TWI_SendN(uint8_t *pData, uint8_t len)
{
    uint8_t retVal = 0;

    if ((len != 0) && (pData != 0))
    {
        while (len--)
        {
            TWI0.MDATA = *pData;
            if ((TWI_GetStatus() == TWI_READY) && RX_acked())
            {
                retVal++;
                pData++;
                continue;
            }
            else // did not get ACK after slave address
            {
                break;
            }
        }
    }

    return retVal;
}

/* Returns how many bytes have been sent, -1 means bus error*/
uint8_t TWI_SendData(uint8_t address, uint8_t *pData, uint8_t len)
{

    if (!TWI_InitTransmission(address, TWI_WRITE))
        return ((uint8_t)-1);

    return TWI_SendN(pData, len);
}

/* Returns how many bytes have been read */
uint8_t TWI_ReadByte(uint8_t *pData)
{
    if (TWI_GetStatus() == TWI_READY)
    {
        *pData = TWI0.MDATA;
        return 1;
    }
    else
        return 0;
}

/* Returns how many bytes have been read */
uint8_t TWI_ReadN(uint8_t *pData, uint8_t len)
{
    uint8_t retVal = 0;

    if ((len != 0) && (pData != 0)) // if pointer is initialized
    {
        while (len--)
        {
            if (TWI_GetStatus() == TWI_READY)
            {
                *pData = TWI0.MDATA;
                TWI0.MCTRLB = (len == 0) ? TWI_ACKACT_bm | TWI_MCMD_STOP_gc : TWI_MCMD_RECVTRANS_gc;
                retVal++;
                pData++;
                continue;
            }
            else
                break;
        }
    }

    return retVal;
}

/* Returns how many bytes have been received, -1 means NACK at address */
uint8_t TWI_GetData(uint8_t address, uint8_t *pData, uint8_t len)
{
    uint8_t retVal = (uint8_t)-1;

    if (!TWI_InitTransmission(address, TWI_READ))
        return retVal;

    retVal = 0;
    if ((len != 0) && (pData != 0))
    {
        while (len--)
        {
            if (TWI_GetStatus() == TWI_READY)
            {
                *pData = TWI0.MDATA;
                TWI0.MCTRLB = (len == 0) ? TWI_ACKACT_bm | TWI_MCMD_STOP_gc : TWI_MCMD_RECVTRANS_gc;
                retVal++;
                pData++;
                continue;
            }
            else
                break;
        }
    }

    return retVal;
}

void TWI_EndSession(void)
{
    TWI0.MCTRLB = TWI_MCMD_STOP_gc;
}
```

## Other posts you may be interested in
- [Programming the ATtiny 1-series]({%post_url 2020-09-27-Programming-attiny-1-series%})
- [Bit Bang I2C protocol]({%post_url 2020-02-10-bitbang-i2c%})

## References
[^1]: Wikipedia page for [I2C](https://en.wikipedia.org/wiki/I%C2%B2C)
[^2]: [Datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/ATtiny212-214-412-414-416-DataSheet-DS40002287A.pdf) for the ATtiny412
[^3]: Atmel [example code](https://github.com/microchip-pic-avr-examples/avr128da48-cnano-i2c-send-receive-mplabx) for the I2C protocol.
