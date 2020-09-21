logic is a tool to describe hw logic in a conbination of javascript and verilog.


todos:
  * generate HW schematic
  * implement several basic modules

Notes about generating schematic:
  Currently there IS a way to gen, the procedure is like below:
    1. generate the JSON netlist using [yosys2digitaljs](https://github.com/tilk/yosys2digitaljs)
    2. generate HTML div using [digitaljs](https://github.com/tilk/digitaljs)
  
  There is an online solution of this: https://digitaljs.tilk.eu

  The problem is that:
    1. This solution aim to create a simulatable and interactive chart, which result in slow processing
    2. This chart generated from this solution is not very balance, some entrys very large (due to bit width?)
       and some lines extremly long
    3. Cuz the chart is generated from netlist, so some variable name is not readable

  And my idea is to generate illustrating chart directly from the JS module
  (not converted verilog, or sythesised netlist)