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
* The labels are quite difficult to see. Can can you maybe render the indented surface in a different color? Perhaps by clipping in a separate rectangle (for each side) just one epsilon infront of the real indented surface. That rectangle can then have a different color and should not be included in the stl download
* Crank up the shadows a little bit too maybe, it is a little soft.
* I asked for a visual preview of the label. I really mean it, I want to see a circle with the label similar to what is put on the design, but in the dropdown. But in black and white ofcourse.
* The configuration selection should be a list with 1 row per saved
* 'F2F' is totally unclear, please use exactly hex width (flat to flat)
* The deployed link is https://l0laapk3.github.io/3d_bit_gen/, the source code is at https://github.com/L0laapk3/3d_bit_gen (add a link to the source code on the bottom of the left panel)
* Is it possible to use a background worker for updating the model to not lag out the entire page?
* The distance between the bottom of the label icon & the top of the slot text should be fixed, to avoid overlapping the text & the label.
* there should be a configuration item for the text line width.
* on *every* position where a label is indented into the model, there should be text below. So it should be done by a single function.

----------

* I moved the mm to the input field instead of the label above it. But can you make it appear in grey text on the right side inside the text field, instead of below/behind it?
* The label icon selector is quite nice, but can you make it be a little bit taller? probably just extend it up to the bottom of the page if needed.
* dont reset the zoom pan orient controls everytime the model changes :)
* The back plane should also extend to the text, and the text is currently not taken into account when choosing the height of the labels on the print.
* if the height of the model is not enough to fit both the label and the text (if there is any text), it should shrink the 'group' that is the label, text & padding inbetween label and text, to make the height work out with some padding above and below.
* the label & text should really be one unit on the model, generated by one function, it should be the same on both sides.
* When doing two rows, it seems like the labels on the front row match the holes on the back row and vice versa.
* When I import the downloaded model into my slicer, it complains that the model is not watertight. I'm not sure if you can spot any mistakes with the way it is constructed?
* When I enter 0 as the number of slots, that doesnt seem to work.
* When I import the downloaded model into my slicer, the whole thing is sideways.
* On the configuration selector, on the right side, can you add a rename button to rename the configuration.
* The html preview of the label icons are quite good. However the labels that are actually used in the model are very much not. Can you share the definitions between the html and the model from a single place? Remember, the only difference should be that in the html, the circle is hollow/outline, while in the model, the circle is solid and the shape inside it is negative.

----------

* The model preview & downloaded model are now upside down.
* Previously we added a plane on both sides in render only (not download) to more clearly show the labels & text. Can you add it back? It doesnt quite have to be black, maybe a lighter blue could work.
* the default line width on the model should be 0.5, otherwise its thinner than printed lines.
* The labels & text are not quite right on the model. Currently there is a rounded square inset around both the text and the label. That should not be present. Currently the text is outset inside that previous inset, the text itself should be inset directly into the part. Also the label is currently outset inside the previous inset, with the symbol being inset again. Thats 3 levels of inversion, with the rounded square border removed, the circle of the label should be inset and the shape outset again.
* can you add another parameter: 'padding'. This should control: the distance between the flat edge of the hex hole & the front & back side & the other hex hole row, but also the distance between the tip of the hex hole & the left & right side & the next hex hole. It should replace the 'spacing' parameter.
* actually can you give the entire model a yellow color instead of blue to make it more visible?
* unfortunately the model is still not watertight, but I cant quite tell why, it doesnt show me.

----------

* The background plane used to show the inset more clearly, please don't cut circles/shapes for it, just make it a simple plane that spans across the entire base rectangle, minus the radius for width & some epsilon padding. You can color it in a light gray.
* we don't need auto migration of the config. delete it.
* the torx set default doesnt actually render anything anymore since last prompt. Can you rectify that
* I believe the watertight issues are originating from the letters. it seems like the different lines the letters are made of create walls, if they overlap it makes it not watertight.

----------

* There seems to be something wrong specifically with the torx label that makes the entire part pretty much dissapear?
* The background plane should always be the width of the widest row, currently it seems to be too wide if there are less than 8 slots.
* Rather than being able to enter the number of slots, each slot should have a delete button on the right of the label, there should be a + button below the existing slots, and it should be possible to drag reorder them.
* Some but not all of the labels have a label text, all of the label icons on the model should have the higher height. They should all be on the same height is what I'm trying to say. But they should still be lower if none of the labels have any text.
* The segments within one letter on the label text are still fighting. For example the 8 shape has the segments fight in the center and this makes it not watertight.
* When clicking the + button to create a new hex slot, this should copy the slot above (so the last one before adding).

----------

unfortunately i'm not able to evaluate your latest changes due to bugs:

* the slot list is quite buggy, there is a lot of padding on the index number, and the text field is suddenly super narrow, despite that it has put a line break on every line after the icon dropdown.
* The model label text is also buggy, it semes like it never shifts the icons up anymore, as a reminder, if any of the labels have text, all icons on both sides should be shifted up. the text should be a bit lower than where it is right now.
* for the slot label, the label icon selector does not have the same height as the label textbox.
* For the configuration selection, instead of having one central delete button, can you add a delete button on the right of rename for each of the configurations? And then the new button can have the same style as an existing configuration.

----------

* The text box size for the configuration name is not the same height as the normal box, so when you rename it it shrinks. can you make it the same size.
* Can you use the trashcan (red when hovered) icon for delete slot/configuration instead of the cross
* make sure there is always 1 hex slot per row, just create a new one if theres zero on update
* for the background pane in the render, can you use the width of the model that is currently loaded? It updates too fast: the background worker needs to generate the new model, and only when that new model is loading should the width be edited.
* Unfortunately the text in the model is STILL clipping into itself. The 8 looks messed up and any text results in non watertight model.

----------

* can you update the axis grid in the render for its size to be based on the size of the model. If the model is wide then its often larger than the grid itself
* The drag reordering blocks drag selection inside the text field, thats not good.
* The drag reordering should show a blue preview line of the new location
* The text in the model is STILL CLIPPING!!!