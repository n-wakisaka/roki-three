import numpy as np
import math

dt = 0.01
t = 5.0
num = (int)(t / dt)
v = np.array(range(num+1))*90.0/num
with open('arm.zvs', 'w') as f:
    for i in range(num+1):
        f.write(f'{dt} 2 ({math.radians(v[i])} 0.0)\n')
    for i in range(num):
        f.write(f'{dt} 2 ({math.radians(v[num])} {math.radians(v[i+1])})\n')
    for i in range(num):
        f.write(f'{dt} 2 ({math.radians(v[num-1-i])} {math.radians(v[num-1-i])})\n')
