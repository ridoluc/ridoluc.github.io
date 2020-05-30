---
layout: post
title:  "AVR Optimization #1 - Avoid floating-point and other considerations"
description: "Code optimization tips for AVR microcontrollers. ATtiny85 self-contained function for sound generation with buzzer"
date:   2020-05-29 22:00:00 +0000
tags: attiny85 optimization
#slug: ""
mathjax: true
---

Microcontrollers with 8-bit architectures have hard times dealing with floating-point maths. To do that, they need large functions that are really slow and occupy a lot of space.  Here there are some examples on how to avoid it and other performance considerations.
<!-- excer -->
{: .abstr}


## The problem
I have been testing a simple, self-contained function to generate a square wave and make a sound of a defined duration with a passive buzzer. For this, I used the Timer1 of the ATtiny85. After writing a first draft I compiled it and I've been amazed to see a **flash memory usage of more than 1,300 bytes!**

Seriously? It's just beeping for a second and needs 1kb of memory? With a quick look, I realized there were many improvements possible. 
 
## The beeping function
The function is really simple and just does the following: 
- set the timer in CTC mode and the prescaler;
- calculate the value of the Output Compare Register (`OCR1C`) based on the sound frequency and how many periods are in a given sound duration;
- count the wave periods until the length of the sound is reached;
- shut down the timer.

The value of the register `OCR1C` for a certain frequency is given by this formula:

$$
OCR1C = \frac{f_{CPU}}{(2* p* f_{sound})} -1
$$

Where \\(p\\) is the prescaler that I set to 16.
To have a duration \\(D\\) (in **milliseconds**) we can count the number of the wave half-periods. This is given by:

$$
count = \frac{2*D * f_{sound}}{ 1000}
$$

This is the **poorly written, inefficient function**:
```
void beep_once( int frequency /*Herz*/,  int duration /*milliseconds*/)
{
    /*
    *  The frequency is given by:
    *  Freq = F_CLK / (2 * prescaler * (1 + OCR1C))
    */

    TCCR1 |= (5 << CS10);     // Set the prescaler to 16 bit (for 1MHz F_CPU), freq range from 31kHz to 250 Hz)
    TCCR1 |= (1 << CTC1);     // Set clear timer on compare bit
    OCR1C = (uint8_t)((F_CPU / frequency) >> 5); // 5 beacuse it's divided by 16*2
    TIMSK &= ~(1 << OCIE1B);  // Disable timer compare interrupt
    GTCCR |= 1 << COM1B0;     // Timer Counter Comparator B connected to output pin OC1B.
    unsigned int counter  = duration * ((float)frequency / 1000.) * 2;
    do
    {
        if ((TIFR >> OCF1B) & 0x01)
        {
            counter--;
            TIFR |= 1 << OCF1B; // Clear the flag
        }
    } while (counter);
    TCCR1 &= ~((1 << CS12) | (1 << CS11) | (1 << CS10));    // Stop the timer
    GTCCR &= ~(1 << COM1B0);  // Timer Counter Comparator B disconnected from output pin OC1B.
}
```
I tested it with the following code[^1].
```
int main(){
  DDRB = DDB4;
  beep_once(1500,500);
  beep_once(1000,1000);
  for(;;){}
}
```
Compiling with *avr-gcc* and `-Os` build flags I get a Flash usage of 1,380 bytes.
Let's dissect this horrible code to make it better.

## The optimization
### Floating-point math
First thing to mention is to **avoid run-time floating-point calculations** on AVR 8-bit microcontrollers. They are not geared to work with floats.  The floating-point (FP) operations are carried out by several compiler-integrated functions. These not only occupy a lot of space but are also incredibly slow. An FP division may take several hundreds of CPU cycles to complete.
The first change made to the code is the following:
```
// Old:
unsigned int counter  = duration * ((float)frequency / 1000.) * 2;
// New:
unsigned int counter  = (unsigned int)(((unsigned long) duration * frequency) / 1000) * 2;
```
This reduced the program size by **966 bytes**! This is the space needed by the floating-point functions.
Here I also casted the variable to an unsigned long to avoid an overflow.

### Constants
If there is a formula with more than one constant it may be a good idea to aggregate them in advance. So I changed the `1000/2 = 500`:
```
// Old:
unsigned int counter  = (unsigned int)(((unsigned long) duration * frequency) / 1000) * 2;
// New:
unsigned int counter  = (unsigned int)((unsigned long) duration * frequency) / 500;
```
This saved just **2 bytes** because the multiplication by 2 is a simple byte shift. If instead of 2 the operand was a different integer, it would have taken much more space.

### Bit shifting
I divided by 500. This is integer math but still a division it's quite expensive: a division with integers may take dozens of bytes and more than 200 cycles[^2]. 
There are alternatives to avoid it. One is to use bit shifting: `512 = 2^9 = 0x1<<9`.
In my case 500 is close enough to 512 that I can ignore the error.
I split the 9 to shift left by 5 one variable and by 4 the other. With this, I also avoid the 4 bytes long integer casting[^3].
```
// Old:
unsigned int counter  = (unsigned int)((unsigned long) duration * frequency) / 500;
// New:
unsigned int counter  = (unsigned int)( (duration>>5) * (frequency >>4));
```
And this was worth other **30 bytes**.

### Write to registers without reading
To set registers certain bits without modifying the others you can use `|=`.  However this implies the register is first read. 
For example `|=` is translated into the following assembly code:
```
in     r24, 0x2c  ; Read the register
ori    r24, 0x10  ; Performs the logical OR between the register and a constant,
out    0x2c, r24  ; Write data to the register
```
while the simple register write (with just `=` instead of `|=`) is done in two instructions: 
```
ldi    r24, 0x10  ; Load data into a register
out    0x2c, r24  ; Write data to the register
```
This works when you can ignore the other content of the register: I can't use it on the instruction `TIMSK &= ~(1 << OCIE1B);` because it would interfere with bits relative to Timer0.

Changing all the possible `|=` in `=` I saved 16 bytes.

### Unnecessary instructions
Pay attention to operations that can be simply solved with less steps.
Here the register is set in two times for readability but a good comment will do as well:
```
// Old:
TCCR1 = (5 << CS10);   // Set the prescaler to 16 bit (for 1MHz)(freq range from 31kHz to 250 Hz)
TCCR1 = (1 << CTC1);   // Set clear timer on compare bit
// New:
TCCR1 = (5 << CS10)|(1 << CTC1);// Set the prescaler to 16 bit (for 1MHz). Also set clear timer on compare bit
```
The following statement is to test for a bit and can be rewritten more simply:
```
// Old:
(TIFR >> OCF1B) & 0x01
//New:
TIFR & (1 << OCF1B)
```
These two changes cut away other **4 bytes**.

### Variable types
The variable types usually have a large impact on the code performances.  An operation done on two `int` variables takes considerably longer than the same on `short` variables. 
Same story with `unsigned` variables: these are way easier to handle for an 8-bit architecture. 
Therefore I specified the function arguments to be unsigned: `void beep_once(unsigned int, unsigned int);` as well as the clock frequency: `#define F_CPU 1000000UL`

With this I saved **60 bytes**. Not bad...

All in all, the program went from a size of 1,380 bytes to just 302 bytes. A reduction of 77%! 
This doesn't only mean that you have more space for other instructions but also that the program will be generally faster. 

Hope this can help someone write more efficient code. 
If you have suggestions let me know in the comments.

---

## Other posts you may be interested in
- [OLED Display driven by ATtiny10]({%post_url 2020-04-26-attiny10-oled-display%})
- [Bit Bang I2C protocol]({%post_url 2020-02-10-bitbang-i2c%})

## Notes
[^1]: I called the function twice because if there was just one the compiler would optimize it and it wouldn't show real metrics. 
[^2]: Check the [AVR200 application note](http://ww1.microchip.com/downloads/en/AppNotes/doc0936.pdf).
[^3]: Let me point out that this (and other tips shown) are extreme and hinder the readability of the code.