---
layout: post
title:  "AVR Optimization #2: Mixing C and and Assembly"
description: "Guidelines to use C and Assembly code in the same project"
date:   2020-06-20 22:00:00 +0000
tags: attiny85 optimization
#slug: "--"

featured_img: "/assets/img/mix-c-asm/asm_code_image.png"
---


Modern compilers are really good at translating programming language into machine code. At times, however, you may find useful to freely manipulate registers and CPU operations. GCC gives you the option to mix C and Assembly code but it's helpful to follow certain guidelines.
<!-- excer -->
{: .abstr}

## The problem
While writing the code for an AVR based project I found myself short with program memory. Moreover, I wanted to access and modify the individual bits of a variable to generate a specific output.
The logic was really simple but the compiler translated my instructions in a non-working code and the solutions I found resulted in a very large code. So I figured out that was probably easier to write a function in assembly instead of forcing avr-gcc to translate the code into certain instructions. In the process, I also managed to save space deleting computations for edge cases unnecessary for my simple code.

My case is probably a rare case where the required code behaviour is too peculiar to be expressed in C. Nevertheless, there are other situations in which it's useful to combine C and assembly: speed-critical applications (despite it's hard to beat the modern compilers) or implementation of specific features for new architectures[^1].

I thought it would be useful to gather some guidelines and notes to use assembly code together with C.  These notes assume compilation with avr-gcc. 

## Mixing C and Assembly

The aim is to use an assembly function inside a C code. 
The assembly function (or more than one) will be located inside a file with **.S** (capital letter) extension. 
To make it works there are few things to watch out for and I will list below some that are not obvious.

### In the **.c** file

The assembly function just needs to be declared in the *.c* file:
```
void asm_function();
```
However if using **cpp** the function needs to be defined external:
```
extern "C" { void asm_function();}
```
This way the compiler knows the function definition exists somewhere and proceeds with the compilation.

Also, there is no need for an `#include` directive to the assembly file.

If there is a **.c** function used inside the assembly code that also has to be defined *external*.

### In the **.S** file
In the assembly file, we will indicate what memory section the code goes into and use `global` to make the function visible to the linker.

```
.section .text
.global asm_function
```
In this case `.text` indicates that the code has to be placed at memory addresses that contain the actual machine code. Another 

#### Preprocessor directives
The compiler directives in the **.S** file are the same as *C*: `#[directive]`
Remember to `#incude` the right file for the registers definitions if needed (i.e. `#include <avr/io.h>`)

Definition of names also follows *C* directive syntax and this is useful to define registers names and constants:
```
#define MyRegister R16
#define A_CONSTANT 32
```

#### Registers usage

Be careful with the usage of registers to avoid messing around with the execution of code somewhere else in the program.

There are, among others, two main types of registers usage to keep in mind[^2]:
- R18 ... R30: Free to use inside the assembly routine
- R2 ... R17: To be saved before use and restored when exiting the routine

To save the registers push them to the stack and pop them (obviously in the reverse order) before returning:

```
push r15
push r16
...
pop r16
pop r15
```


#### Passing arguments and returning values

The arguments are passed to the function through registers R18 to R25. As a convention, the first 8-bit of the argument are passed through register R24. Other arguments are passed using a decreasing number of register but always starting with an even one. This means that an argument 8-bit long is passed through R24 and R25 will remain empty. A 16-bit argument will be passed using an entire twin (R24-R25). Two arguments of 8-bits each will be passed using R24 and R22 and so on [^3]

```
Example function: 
void foo(uint8_t var0, uint16_t var1)

Registers used:

- R24: var0
- R25: empty
- R22: var1 low byte
- R23: var1 high byte

```
Same thing applies to returning values.

## Compiling

I usually use [PlatformIO](https://platformio.org/) to write/compile/upload the code. In this case just place all the **.S** files inside the *src* folder then compile. Super easy.

In case you are using the terminal or a makefile the compiler should be able to identify himself the assembly files. However be aware of the existence of the avr-gcc option `-x assembler-with-cpp`.

## Assembly blink program 
The following is a simple example where the *.c* file will call a function from an assembly file. The function is just a counter to provide a timing delay.

Here is the *main.c* file calling the `main` function:
```
#include <avr/io.h>

void delay(int);

int main(){
    DDRB = 0x01;        // Set Pin 1 as output
    while(1){
        delay(10000);    // Call assembly function 
        PORTB ^= 0x01;  // Toggle Pin 1
    }
    
}
```

And this is the assembly function in a file called *delay.S*:

```
.global delay

; Delay routine 
; Input:    Number of iterations: 16-bit in R24 and R25
;           Each iteration takes 4us (0.004ms)
;           Return takes 4us
;           100ms = (25000)*0.004 ms
delay: 
    subi    R24, 0x01   ; Subtract 1
    sbci    R25, 0x00   ; Subtract 0 with carry
    brne    .-6         ; Repeat until the result is zero
ret                     ; Return
```
Everything compiled with the following commands for the ATtiny85:

```
avr-gcc -g -Wall -Os -DF_CPU=1000000 -mmcu=attiny85 -c main.c
avr-gcc -g -Wall -Os -DF_CPU=1000000 -mmcu=attiny85 -c delay.S
avr-gcc -g -mmcu=attiny85 -o firmware.elf main.o delay.o
avr-objcopy -O ihex firmware.elf firmware.hex
```

## References
[^1]: avr-libc [documentation](https://www.nongnu.org/avr-libc/user-manual/assembler.html) on assembly programs.
[^2]: Atmel [Application Note](http://ww1.microchip.com/downloads/en/appnotes/doc42055.pdf) on mixing c ans asm code.
[^3]: avr-libc FAQ on [registers usage](https://www.nongnu.org/avr-libc/user-manual/FAQ.html#faq_reg_usage).
