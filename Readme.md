# PanResp - Panel Responsive methods, a la "responsive" web design, but with several additions

First, a demo: https://sdw.st/albums/pf/PanRespDemo.mp4 

Panresp means that everything sizes to the browser window width and code controlling panels can set the zoom on a panel (div really) basis.  Here, 'panel' is used to generically describe an element, such as a div, of any size or shape that holds other content, including other elements and custom elements.  Some scenarios assume there is some way for users to dynamically resize sibling panels, such as with a draggable 'splitter' UI element.  All of this is a great solution for both simple HTML+CSS and also custom elements and other components such as WebComponents, Polymer, lit-element/lit-html, etc.  This allows us to choose between causing something to scale down smoothly with width (and/or height) vs. typical HTML+CSS rejiggering.  Fonts (and anything tied to font scaling) scales differently, more slowly than everything else in a way that I find psychologically matching and pleasing.  Functionally this means that fonts (and other important elements) are usually neither too large or too small.  It is all highly tunable.

The main PanResp method is to use a vw-based formula for all CSS sizes.  These formulas are based on a local fallback CSS variable plus a cascaded CSS variable that is expected to be controlled at an appropriate top-level point in an application.  There are several insights combined to solve most CSS responsive sizing problems, including several that are not handled well or at all by existing methods.  In each webcomponent or other CSS context, a particular CSS sizing expression uses one of 3 simple formulas, and some simple guidelines, for every CSS sizing situation, including overriding all defaults that do not result in 0px sizes.  Even 1px values will distort a design unreasonably at the extremes.  At an upper level, usually in a webcomponent managing sub-elements, a function is called from the PanResp library that computes and sets the appropriate CSS variable values based on per-element configuration and current window and panel sizes, especially when splitters are being used to allow user-selected widths.

Because webcomponents and large Javascript libraries can have px, em, and other methods embedded in difficult to override and somewhat hidden ways, porting to be PanResp can sometimes take some effort.  For webcomponents (custom elements using shadowRoot), usually changing the webcomponent's CSS to accept external variables is the solution.  A good webcomponent will have a way to override the CSS on everything inside, perhaps with an @apply.  @apply is a Polymer 1.x & 2.x way to pass in a set of CSS statements in a single variable to apply to a particular selector, supported through polyfill for now.

## Basic rules: 
* If you would have used 48px, use 48vw in the formula as it will translate vw, viewport width, panel width, and configuration into the scaled equivalent of 48px.
* If you were using em / rem (ignoring the cascading & multiplicative nature of those), multiply the existing parameter by 16 (assuming 16px = 1em, which is close enough usually) and use that: 1em = 16vw...  1.5em = 24vw.

* Default values (begin with lowercase L, for 'local'), usually in :host{} of a WebComponent style declaration, perhaps in body{} at the top, or equivalent:
    * --lvw-scale: 0.0833;
    * --lfont-scale: 0.0833;
    * --lfixed-scale: 0.0833;
* --vw-fixed-scale - The value of this should result in a constant px size until a breakpoint has been reached, then scales down linearly.
    * calc(48vw*var(--vw-fixed-scale, var(--lvw-fixed-scale)))
* --vw-scale - Scale linearly with the size of the window.
    * calc(24vw*var(--vw-scale, var(--lvw-scale)));
* --font-scale - Scale non-linearly with the size of the window in way most pleasing and readable for fonts: Resist getting too large or small to quickly, maintaining usability in a much wider range than linear.
    * calc(24vw*var(--font-scale, var(--lfont-scale)));

## setTwoLineStyle()
The other PanResp library capability is to compute the style needed for an arbitrary line of text in a given font to fit in a PanResp panel on one or two lines of text.  To be explained better.  Used in the game title HTML panel.  Seems to need a little more work to factor in the panresp state of the current panel.

# PanResp Backround & Rationale
These are some of the scenarios that PanResp can handle well:
* Some or all of the contents in an element should maintain the exact same relative size regardless of the width of the panel or browser window (viewport) that the panel is inside.  This completely prevents wrapping, overlap, and endless hand-tuning and debugging on various size / width / resolution / density / scaling scenarios for multiple devices.  In some cases, this is desired for everything, such as a game panel that should never have to be scrolled.  In other cases, this might be best for labels, buttons, bounding boxes, but text or other content perhaps should wrap and flow within certain bounds.
* CSS % and other measures often fail to do what you want in various ways resulting in complicated, hard to debug & maintain situations.
* Panels should be able to be resized dynamically relative to each other, or the window size changed, while maintaining the desired proportional sizing.
* Some or all of the contents in an element should maintain a fixed size, or a fixed size until a breakpoint after which smooth scaling is employed, based on the width of the browser window / viewport and the desired proportionality and width breakpoints for each panel.
* Some or all of the contents in an element should scale in a pleasing, highly readable fashion when the width and need for scaling operates on size.  Specifically, scaling images linearly is often the correct solution but scaling fonts, font-like things, and decoration or sizing around font-based content like labels, is much better when performed in a non-linear fashion.  Scaling up, fonts quickly become far too large for comfort and usefulness.  Scaling down, fonts quickly become unreadable.  PanResp uses a hand-tuned polynomial function to scale in a non-linear fashion so that fonts tend not to get too large and avoid getting too small to read until there is no space left.
* Avoiding everything breaking because of browser or (perhaps) system zoom of the browser window overall, fonts, etc.  The app could detect when the user has employed zoom, using a controlled translation to get a better, working result.
* Acting normally, as if fixed sizes were used, until below a certain threshold, such as: This panel should be 100% of target size until it is <20% of viewport width at which point it scales down to x% or even down to nothing, while the next panel should scale whenever width is <60% of viewport.

Insights that led to PanResp:
* Responsiveness can be difficult, especially with multiple devices with various resolutions, densities, orientations, etc.  Retina-level resolutions, the CSS virtual pixel resolution solution that is much different than actual resolution * density, zoom, etc. all make this a mess in most cases.  Creating hand-tuned breakpoints for various resolutions, densities, orientations, device types, and for all of the hierarchy of elements in a system is how much of this has been solved in existing systems.  This is a terrible solution in most cases, and is more time consuming and produces a worse result with less user control in nearly all cases.  It would have been unworkable for embedded content blocks of all kinds (PDF, etc.) and for an embedded 3D game engine with HTML panels.
* Most responsiveness techniques only solve a small subset of this.
* Applications with fixed UI elements, or expecting an overall panel to maintain relative size and placement, are very difficult to do with existing methods.  There is a simple way to use VW for this for the browser window width, but this does not work at all on its own for subpanels; more would be needed in CSS to make this work.  PanResp solves this specific problem.
* VW units, % of width of the browser window, are an awkward unit for some things, but it is a double floating point unit.  By using a certain factor in a formula, VW can be used as if they were px units at a canonical resolution, nominally 1200x800 here.
* (My) experience has shown that fonts should not be scaled linearly.  After experimentation and exploring several alternatives and all existing methods (including vw + constant px approaches, which get close in some cases), I used a hand-tuned polynomial to translate scale to a more appropriate scale for font-like elements.
* Often, there is no useful purpose in scaling above 100% of target size (16pt text for instance).  Or more precisely, shouldn't scale above 100% because of the browser window or panel width being greater than expected size, but if a user requests increasing scale, for poor eyesite perhaps, this should easily be supported.  Maintaining 100%, but scaling down, to nothing if necessary, should be easily supported when a user requests it.
* CSS Variables are the only thing that flows down through a hierarchy of webcomponents (custom elements using shadowRoot / shadowDOM) that can affect CSS formulas to instantly and efficiently control sizing.  CSS variables can be used in an expression with a local, default value that is overridden by an upper-level tuned value, controlling the whole subtree instantly with no other coordination or code.

# Past statements about PanResp
Sept. 28th, 2017:
We are about to reach panresp (panel responsiveness) nirvana.  After finding the main mechanism for this, I was stuck for a while with getting it to cascade properly.  Finally solved that last night; implemented it nearly everywhere today.  Still not ready for usage as I need to fix some gaps, but it should solve many issues permanently.  Our CSS may require some tweaks for a while, but should die down quickly.

Panresp means that everything sizes to the browser window width and code controlling panels can set the zoom on a panel (div really) basis.  This allows us to choose between causing something to scale down smoothly with width (and/or height) vs. typical HTML+CSS rejiggering.  As previously noted, fonts (and anything tied to font scaling) scales differently, more slowly than everything else in a way that I find psychologically matching and pleasing.  And functionally it means that fonts (and other important elements) are usually neither too large or too small.  It is all highly tunable.

Practically, this means we can layout something like a content block editor and have it scale down smoothly without wrapping or clipping, as much as we desire.  The user can control the panel size with window width + splitters and we could even easily support +/- zoom on a per-div basis.

Basically, nothing in our system should use px, em, or rem.

I really need to publish how this works…  Seems quite novel.  Maybe right around when we are launching to get some attention from devs and similar key people.

why? character units? what does that even mean
 It an em is a publishing term; makes sense in a simple, raw usage.  HTML was derived from SGML which was about publishing documents.  They kept a lot of details around that.  Early on, TBL hadn’t thought of keeping styling and content separate.  Etc.  Now, pixels don’t come close to matching actual pixels, etc.

The different fixed units are all equivalent, just different multipliers.  % is half broken.  vw/vh is the solution to everything.  They didn’t think it through all the way, which is why my method is needed.  But it turns out to be nice enough, just with ugly expressions everywhere.  But at least I found a way to use px units which makes it straightforward:
50px -> calc(50vw*var(--vw-scale,var(--lvw-scale))) and
1em -> calc(16vw*var(--font-scale,var(--lfont-scale)))



var(--font-scale, var(--lfont-scale))


author/src/common.js loads src/util/panResp.js so class PanResp should exist.

It uses --font-scale if it is defined, otherwise it falls back to --lfont-scale.  There is a default, roughly correct CSS variable so that things are always visible and close to correct.  Then, if panResp (panel responsiveness (something I invented for this)) is active, --font-scale will have something exactly correct for the circumstance.

Why? Why do we use those variables so extensively (particularly font-scale) instead of things like vmin/vmax?

That’s a long story.  I will write up and publish the method soon and can explain it all then.  Basically, if you have certain constraints (that we often have), vmin/vmax are very rough solutions that don’t really solve it.  We’re doing things in our interface that no one has.  In some cases it is only mildly helpful; in others, it is crucial to accomplish what we are accomplishing.  And it makes everything we’re doing work well no matter resolution, aspect ratio, user choices of window or panel size, etc.

Why? Yeah, vmin/max is far from a perfect solution. But there are a lot of really robust scaling solutions that exist in simpler implementations that cover really broad cases. What's so different about our use case that necessitates such complexity?

Arbitrarily complex ui in a content block in a subdiv in a resizable panel that has to work and look good in all cases. Reflow and fonts and other things at the wrong size breaks many things. Plus, in a game, everything should scale smoothly. It is not a web page mode.

Everything else fails and takes a lot of work to even get barely acceptable.

We avoid breakpoints, media queries which wouldn't work for panels anyway etc.

This solution was hard to get right, but works perfectly in all circumstances in a tunable way.

I’m going to publish the whole method and related code soon as an open source project.  I’m sure people will argue about it, but there are a number of useful effects you can’t do any other way.  Perhaps I can talk to my old W3C buddies about adding something to CSS to make this built in, but for a while this is what it would take to have panresp.

Only for certain cases.  Generally for us, we would want to control zoom ourselves.  The browser zooms fonts and other things in bad ways.  Depending on what circumstance is going on, panresp usually does the right thing.  And we can tune it more.  We’re not currently reacting directly to browser zoom much, but we can.  And we can have a per-panel zoom capability that is entirely separate and better than browser zoom.  For a while, I had -/+/0 zoom buttons for each panel.  We decided it was too geeky, but it is easy to put that somewhere for user customization.  Definitely needed for poor vision etc.

Even 1px values for shadows etc. have to be vw based.  They quickly dominate and distort much more than you would think at small sizes and disappear at larger sizes, making things look bad.  Everything has to be vw based which is made reasonable by the panresp formulas and usage parameters.

em/rem break very easily and respond to zoom.  px responds to browser zoom and can’t be made panresp.

Any use of px or em in HTML/CSS anywhere in our system needs to be replaced with appropriate panresp expressions based only on vw and our CSS variables.  Anything else is broken.  Generally, an em equates to 16px and the panresp units are treated equal to px units.  The actual size is usually close to px but there is a complex relationship and, for other reasons, the tuned parameters may be a little off of px exactly.  Ken should have the most experience with this after me, but ask me if you are having any trouble understanding what to do or debugging a change.

I’m fairly sure that the problem has to do with not having the panresp infrastructure in place for standalone games.  We need that to solve certain things in the game, but when it is only half there, an extra wide window causes sizes to blow up.  So perhaps she can just narrow the browser window for standalone games for now.  Later we can add the infrastructure so that it does the right thing.

About the default values:
It’s somewhat arbitrary, but a reasonable default.  It just has to match up with the vw-scale / font-scale css variable defaults so that the panResp pixel units match actual default pixel sizes.  If we changed it, we’d probably want to change all of those default constants.  The algorithm makes some assumptions that may not always be true, but probably will be for us for a while.  And zoom can be used to override to some extent.  Plus the font polynomial priors can be passed in.  When needed, we can support any number of polynomial size translation curves.

For the top level of apps, panResp.update() would be inserted in the current code at that level, above the panels and content blocks.  The content blocks just need to use the css variables.  panResp would get called once per panel, inside the loop that is already there.  We might also use it inside certain content blocks if we have splitters, such as room-edit and later game-edit / wiki.



Describing Panresp:

Is this fragile?  It took some serious effort for me to figure out how to do this, but it is fairly easy to use.  If CSS is done in a sane way that is.  I published the key panresp function as open source while I was CTO & cofounder of Yebo (originally Change My Path).

What is not accessible about the following interface?  A big point of panresp (panel responsiveness) is to give much more control to the user about the sizing of panels, text, images, etc.  And to allow this to be dynamic while using the interface.  In the interface below, sometimes you may be concentrating on the outline, other times the content panel, or on the metadata.  You may want to focus on one, keep two open, etc.  You may have a huge monitor or be on a small phone.  Most interfaces severely limit flexibility, which to me is a worse usability problem.  Look at that huge ribbon in Outlook: Zoom to see text, and you'll hardly see any of it because that ribbon is going to eat a lot of screen space.  Give me a splitter so that I can increase zoom overall, then minimize (negatively zoom) the ribbon & panels until I care about them.

This is what I built & why I needed it.  This supported zoom just fine, by sensing browser zoom level then reflecting that in the sizing relative to the current panresp zoom state.  The text sizing is a bit nuanced as well as it scales / zooms in a non-linear way while the chrome is linear.

https://sdw.st/albums/pf/PanRespDemo.mp4

Everything you see there uses vw sizing, with expressions that could use px-like or em-like numbers for ease of authoring.  There is a single function call per panel, called upon panel resize (due to browser window or splitter change), which sets a couple CSS variables that updates any number of child elements.

This is where I argued toward including this built into browser CSS to avoid the implementation work & glue:

https://github.com/w3c/csswg-drafts/issues/3874


