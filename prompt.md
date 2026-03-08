I want to create a static github.io page from this repo.

The goal of the website is to generate .stl files for screw bit holders. so it should create a rectangle with hexagonal cutouts for the bits. 

It should use something like openscad to generate the stl on the client. I hear jscad could be an option maybe, research it please.

It should have a bunch of configurable options to generate the parametric print. All of these options should be stored in localstorage.

There should be a list of configurations. One should be selected at all times, there should be ways to create a new configuration, rename a configuration, and delete (with confirmation prompt (not console.prompt)).
The current active selected configuration should also be stored in localstorage.

The website should have a light and dark theme, and have a switch to toggle between light, follow system theme (default), & dark theme. Store the preference in localstorage.

So I envision 3 panels:
1. panel should have the website title & configuration selection
2. panel should have all the configuration parameters
3. large panel with a rendered preview & a floating `download (.stl)` button in the bottom right.

Regarding the configuration items:
It should in any case generate a single rectangle with cutouts for bits & text. There should be an option to either generate a single row (default) or two rows of bits.
In the latter case, the labels of the second row should be placed on the back side of the rectangle. If doing a single row, there should be an option whether or not to place the labels on both sides (default yes) or just one side.

each row should have a configurable amount of bit holes. There should be a fixed (configurable) spacing between the holes. If using the double row option, center the side that has the least amount of slots. The depth & hexagon width should also be customizable. These should all just be number input fields, dont add + - buttons or anything crazy. label indent depth should also be customizable with a single number.

For each bit slot, there should be a dropdown for the bit type. The dropdown should show the logo for each bit type (its always a circle outline with the shape in the center). Keep in mind, in the dropdown/visual, it should show a black hollow circle with the shape in black. But when actually indenting the logo onto the side at the bit location, the circle should be filled and the shape should be negative to outdent the shape back to the original rectangle size.
Each slot should also have a text field, this should be indented in the design underneath the logo. If the text is large, ensure it does not exceed a fixed width (depending on the hexagon hole size & some fraction of the spacing) and overlap with neighboring text.

If anything is unclear, please do ask.

----------

* The theme selector should be in the top right of the entire window floating.
* The dropdown with the configuration selector should not be a dropdown, all the available configurations should be listed as a row, it should be clickable & renameable from there.
* Replace the configuration name as title of panel 2 with the title 'Parameters'
* Hex Width should be hex width (flat to flat).
* there should be a global switch between inches and mm, but obviously mm should be the default. changing this should convert all the number fields & update labels.
* The dropdown for label type should be less wide when not opened. When not opened it should only show the label preview visually as previously described. The opened dropdown box can be wider and should contain both the label preview & the text.
* The width of the label dropdown + label text does not fit the config panel. Make the label text box stretch to fit the configuration panel.
* There are several problems with the 3D model:
** the rectangle with the hex holes is not facing upwards currently. It should be. Currently it is dimensioned such that the double row grows the height, it should grow the width then.
** The text & label does have the correct orientation unlike the rectangle and hex hole. So currently it is on the bottom or on the top intersecting the hole..
** It takes an extremely long time to update the preview. 1 second +. This is unacceptable.
** Can you add a parameter to round the 4 short edges in the height directions.
** The default hole depth should be like 8mm
* In all dropdowns, the grey text looks really weird & difficult to read, especially in light mode.

----------

* The ground plane should match the bottom of the rectangle, not the middle.
* The height should be configurable. But when you change the hole depth, it should update the height by the difference of the old vs new hole depth.
* The labels are quite difficult to see. Can can you maybe render the indented surface in a different color?
* Crank up the shadows a little bit too maybe, it is a little soft.
* I asked for a visual preview of the label. I really mean it, I want to see a circle with the label similar to what is put on the design, but in the dropdown. But in black and white ofcourse.
* The configuration selection should be a list with 1 row per saved
* F2F is totally unclear, please use hex width (flat to flat)
* There should be a config item 