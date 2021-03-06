/* Credits: https://github.com/Squarific/Paint.js */
module.exports=(...args)=>{
	return (function($,...paintArgs){
		var jQuery=$;
		function Controls (container, controls) {
			this.controls = controls || [];
			this.byName = {};
		  
		  this.controlContainerLeft = container.appendChild(document.createElement("div"));
			this.controlContainerLeft.className = "control-container controls-left";
			
			this.controlContainerBottom = container.appendChild(document.createElement("div"));
			this.controlContainerBottom.className = "control-container controls-bottom";
			
			this.buildControls();
		}

		// Removes everything from the container and
		// Creates the given controls, includes adding them to .byName
		Controls.prototype.buildControls = function buildControls () {
			// Empty the container
			while (this.controlContainerLeft.firstChild) {
				this.controlContainerLeft.removeChild(this.controlContainerLeft.firstChild);
			}
			while (this.controlContainerBottom.firstChild) {
				this.controlContainerBottom.removeChild(this.controlContainerBottom.firstChild);
			}

			// Create each controler from its definition
			// Add to the container and .byName
			for (var cKey = 0; cKey < this.controls.length; cKey++) {
				var control = this.createControl(this.controls[cKey])
				switch(this.controls[cKey].place){
					case 'left':
						this.controlContainerLeft.appendChild(control.containerAppend);
					break;
					case 'bottom':
						this.controlContainerBottom.appendChild(control.containerAppend);
					default:
						if(this.controlContainerLeft.querySelector('.container-'+this.controls[cKey].place)) this.controlContainerLeft.querySelector('.container-'+this.controls[cKey].place).appendChild(control.containerAppend);
					break;
				}
				this.byName[this.controls[cKey].name] = control;
				if (typeof control.executeAfterAppend == "function") {
					control.executeAfterAppend();
				}
			}
		};

		// CreateControl calls the constructor for the given control
		Controls.prototype.createControl = function createControl (control) {
			if (typeof this.constructors[control.type] == "function") {
				return this.constructors[control.type](control);
			}

			// Control is not defined
			console.error("Unknown control: " + control.type, control);
			return {
				containerAppend: document.createTextNode("Unknown control: " + control.type)
			};
		};

		// Object that holds all the contruction functions for the controllers
		// A construction object should return whatever should be stored in .byName["nameOfTheControl"]
		// The returned object should at least have:
		//{
		//	input: domElement,              //DomElement of which .value can be get and set,
		//	containerAppend: domElement,    // Element that should be appended to the container
		//}
		Controls.prototype.constructors = {};

		Controls.prototype.constructors.button = function createButton (control) {
			var input = document.createElement("button");
			input.className = (control.classAppend || "") + " control-button btn rounded-0 btn-sm";

			if (control.value)
				input.value = control.value;

			if (control.text)
				input.appendChild(document.createTextNode(control.text));
			
			if (control.html){
				let htmlElem=document.createElement(control.html)
				htmlElem.setAttribute('class',control.elemClass);
				input.appendChild(htmlElem);
			}
			
			if (control.image) {
				var img = input.appendChild(document.createElement("img"));
				img.src = control.image;
				img.alt = control.alt;
			}

			if (control.title)
				input.title = control.title;

			if (control.data)
				for (var datakey in control.data)
					input.setAttribute("data-" + datakey, control.data[datakey]);

			input.addEventListener("click", function (event) {
				control.action(input.value);
				event.preventDefault();
			});

			return {
				input: input,
				containerAppend: input
			}
		};

		Controls.prototype.constructors.integer = function createIntegerInput (control) {
			var container = document.createElement("div");
			container.className = (control.classAppend || "") + "control-integer w-auto";

			var groupContainer=document.createElement("div");
			groupContainer.className = "input-group";

			
			// Create the actual input field
			var input = document.createElement("input");
			input.type = control.range ? "range" : "number";
			input.value = control.value;
			input.className = (control.classAppend || "") + "form-control custom-range h-auto pl-1 mr-2 bg-white rounded-0";
			if(!control.range){
				input.style="width: 60px;";	
			}
			if (control.text)
				input.placeholder = control.text;

			if (control.title)
				input.title = control.title;

			if (control.max)
				input.max = control.max;

			if (control.min)
				input.min = control.min;

			if (control.data)
				for (var datakey in control.data)
					input.setAttribute("data-" + datakey, control.data[datakey]);
			
			// var integerOutput = container.appendChild(document.createElement("div"));
			// integerOutput.className = "control-integer-output";
			// integerOutput.textContent = '0';
			
			input.addEventListener("input", function () {
				//integerOutput.textContent = input.value;
				control.action(input.value, true);
			});

			if(control.range){
				var prependContainer=document.createElement('div');
				prependContainer.className='input-group-prepend';
				// Create the minus button
				var minusButton = groupContainer.appendChild(prependContainer.appendChild(this.button({
					html: "i",
					elemClass: 'fa fa-minus',
					action: function () {
						var max = parseInt(input.max || Infinity);
						var nextValue = parseInt(input.value) - 1;
						input.value = Math.min(max, nextValue);
						control.action(input.value, true);
					}
				}).containerAppend));
			}
			// Append the input
			groupContainer.appendChild(input);
	
			if(control.range){
				var appendContainer=document.createElement('div');
				appendContainer.className='input-group-append';

				// Create a plus button
				groupContainer.appendChild(appendContainer.appendChild(this.button({
					html: "i",
					elemClass: 'fa fa-plus',
					action: function () {
						var max = parseInt(input.max || Infinity);
						var nextValue = parseInt(input.value) + 1;
						input.value = Math.min(max, nextValue);
						control.action(input.value, true);
					}
				}).containerAppend));
			}
				container.appendChild(groupContainer);

			return {
				input: input,
				//integerOutput: integerOutput,
				containerAppend: container
			}
		};
		Controls.prototype.constructors.html = function createHtml (control) {
			// Create the actual input field
			var input = document.createElement("div");
			input.innerHTML = control.value;
			input.className = (control.classAppend || "")+" control-button btn rounded-0 btn-sm";

			if (control.title)
				input.title = control.title;

			if (control.data)
				for (var datakey in control.data)
					input.setAttribute("data-" + datakey, control.data[datakey]);
			return {
				input: input,
				containerAppend: input
			}
		};
		Controls.prototype.constructors.group = function createGroup (control) {
			var container = document.createElement("div");
			container.className = (control.classAppend || "") + "container-group position-relative";
			container.appendChild(this.button({
				html: "i",
				elemClass: control.elemClass,
				title: control.title,
				action: function () {}
			}).containerAppend);
			var controlGroupContainer = document.createElement("div");
			controlGroupContainer.className='control-group position-absolute'+' container-'+control.value;
			controlGroupContainer.style.display='none';
			
			container.appendChild(controlGroupContainer);
			
			container.addEventListener("mouseover", function (event) {
				controlGroupContainer.style.display='block';
				event.preventDefault();
			});
			container.addEventListener("mouseout", function (event) {
				controlGroupContainer.style.display='none';
				event.preventDefault();
			});
			
			return {
				input: container,
				containerAppend: container
			}
		};

		Controls.prototype.constructors.text = function createTextInput (control) {
			// Create the actual input field
			var input = document.createElement("input");
			input.type = "text";
			input.value = control.value;
			input.className = (control.classAppend || "") + "control-text-input";

			if (control.text)
				input.placeholder = control.text;

			if (control.title)
				input.title = control.title;

			if (control.max)
				input.max = control.max;

			if (control.min)
				input.min = control.min;

			if (control.data)
				for (var datakey in control.data)
					input.setAttribute("data-" + datakey, control.data[datakey]);

			input.addEventListener("input", function () {
				control.action(input.value);
			});

			return {
				input: input,
				containerAppend: input
			}
		};

		Controls.prototype.constructors.color = function createColorInput (control) {
			// Create the actual input field
			var input = document.createElement("input");
			input.type = "text";
			input.value = control.value;
			input.className = (control.classAppend || "") + "control-color-input";

			if (control.data)
				for (var datakey in control.data)
					input.setAttribute("data-" + datakey, control.data[datakey]);

			var returnData = {
				input: input,
				containerAppend: input,
				executeAfterAppend: function () {
					var spectrum = $(input).spectrum({
						className: control.name,
						title: control.title,
						showAlpha: true,
						showInput: true,
						showInitial: true,
						preferredFormat: "rgb",
						showPalette: true,
						maxSelectionSize: 32,
						clickoutFiresChange: true,
						localStorageKey: "anondraw.palette",
						move: function (color) {
							control.action(color);
						}
					});
				}
			};

			return returnData;
		};

		Controls.prototype.constructors.gradient = function createGradientInput (control) {
			var gradientDom = document.createElement("div");
			gradientDom.className = (control.classAppend || "") + "control-gradient";

			var gradientCreator = new GradientCreator(gradientDom);
			gradientCreator.addEventListener("change", control.action)

			return {
				input: gradientDom,
				containerAppend: gradientDom,
				gradientCreator: gradientCreator
			};
		};/*
			LICENSE: MIT
			Author: Filip Smets
		*/

		/*
			Creates the creator
			Everything inside container could be removed
			All properties of container could be overwritten, including style
		*/
		function GradientCreator (container) {
			this._container = container;
			this.setupDom();
			this.rerender();
		}

		GradientCreator.prototype.INITIAL_STOPS = [{
			pos: 0,
			color: "rgba(255, 0, 0, 1)"
		}, {
			pos: 0.15,
			color: "rgba(255, 255, 0, 1)"
		}, {
			pos: 0.3,
			color: "rgba(0, 255, 0, 1)"
		}, {
			pos: 0.5,
			color: "rgba(0, 255, 255, 1)"
		}, {
			pos: 0.65,
			color: "rgba(0, 0, 255, 1)"
		}, {
			pos: 0.80,
			color: "rgba(255, 0, 255, 1)"
		}, {
			pos: 1,
			color: "rgba(255, 0, 0, 1)"
		}];

		/*
			#################
			# DOM FUNCTIONS #
			#################
		*/

		/*
			Removes everything inside the container, then creates all elements
			Container will be taken from this._container
		*/
		GradientCreator.prototype.setupDom = function setupDom () {
			// Remove all elements in the container
			while (this._container.firstChild)
				this._container.removeChild(this._container.firstChild)

			this.createPreviewDom();
			this.createColorSelector();
		};

		/*
			Create a div for the preview and add inital colors
		*/
		GradientCreator.prototype.createPreviewDom = function createPreviewDom () {
			var preview = this._container.appendChild(document.createElement("div"));
			preview.classList.add("gradient-preview");
			this._previewDom = preview;

			document.addEventListener("mousemove", function (event) {
				if (!this._draggingStop) return;
				var relativeWidth = this.getRelativeWidth(event, this._previewDom);

				// Clamp between 0 and 1
				relativeWidth = Math.min(1, Math.max(0, relativeWidth));

				this._draggingStop.style.left = relativeWidth * 100 + "%";
				this._hasDragged = true;
				this.hideColorPicker();
				this.rerender();
			}.bind(this));

			document.addEventListener("touchmove", function (event) {
				if (!this._draggingStop) return;
				var relativeWidth = this.getRelativeWidth(event, this._previewDom);

				// Clamp between 0 and 1
				relativeWidth = Math.min(1, Math.max(0, relativeWidth));

				this._draggingStop.style.left = relativeWidth * 100 + "%";
				this._hasDragged = true;
				this.hideColorPicker();
				this.rerender();
			}.bind(this));

			document.addEventListener("mouseup", function (event) {
				delete this._draggingStop;
			}.bind(this));

			document.addEventListener("touchend", function (event) {
				delete this._draggingStop;
			}.bind(this));

			document.addEventListener("click", function (event) {
				if (event.target.classList.contains("gradient-stop")) return;
				this.hideColorPicker();
			}.bind(this));

			preview.addEventListener("dblclick", function (event) {
				var relativeWidth = this.getRelativeWidth(event, this._previewDom);
				this.createStop({
					pos: relativeWidth,
					color: tinycolor()
				});
			}.bind(this));

			this.INITIAL_STOPS.forEach(this.createStop.bind(this));
		};

		/*
			This function creates a stop dom element from {pos: 0-1, color: tinycolor/csscolor/...}
			It also fires the change event and rerenders
		*/
		GradientCreator.prototype.createStop = function createStop (stop) {
			var stopDom = this._previewDom.appendChild(document.createElement("div"))
			stopDom.className = "gradient-stop";
			stopDom.style.background = stop.color;
			stopDom.style.left = stop.pos * 100 + "%";
			stopDom.color = tinycolor(stop.color);

			stopDom.addEventListener("mousedown", function (event) {
				this._draggingStop = stopDom;
				this._hasDragged = false;
			}.bind(this));

			stopDom.addEventListener("touchstart", function (event) {
				this._draggingStop = stopDom;
				this._hasDragged = false;
			}.bind(this));

			stopDom.addEventListener("click", function (event) {
				if (this._hasDragged) return;
				this.changeColorOf(stopDom);
			}.bind(this))

			stopDom.addEventListener("dblclick", function (event) {
				stopDom.parentNode.removeChild(stopDom);

				if (event.stopPropagation) event.stopPropagation();
				event.cancelBubble = true;

				this.rerender();
			}.bind(this))

			this.rerender();
		};

		GradientCreator.prototype.hideColorPicker = function hideColorPicker () {
			delete this._changingColorOf;

			// Search for the color picker
			for (var k = 0; k < this._previewDom.children.length; k++) {

				// Found
				if (this._previewDom.children[k].classList.contains("sp-container")) {
						this._previewDom.children[k].classList.add("hide");
				}
			}
		};

		GradientCreator.prototype.changeColorOf = function changeColorOf (stop) {
			// Search for the color picker
			for (var k = 0; k < this._previewDom.children.length; k++) {

				// Found
				if (this._previewDom.children[k].classList.contains("sp-container")) {

					// Place it at the stop
					this._previewDom.children[k].style.left = stop.style.left;

					// If we are already changing the color of this one just remove the color picker
					if (this._changingColorOf == stop) {
						this._previewDom.children[k].classList.add("hide");

					// Otherwise show it
					} else {
						this._previewDom.children[k].classList.remove("hide");
						$(this.spectrumInput).spectrum("set", stop.color);
					}
				}
			}

			this._changingColorOf = stop;
		};

		/*
			Creates the color selector
		*/
		GradientCreator.prototype.createColorSelector = function createColorSelector () {
			var input = this._previewDom.appendChild(document.createElement("input"));
			input.type = "color";

			this.spectrumInput = input;

			$(this.spectrumInput).spectrum({
				showAlpha: true,
				showInput: true,
				showButtons: false,
				flat: true,
				showInitial: true,
				preferredFormat: "rgb",
				showPalette: true,
				maxSelectionSize: 32,
				clickoutFiresChange: true,		
				move: function (color) {
					if (this._changingColorOf) {
						this._changingColorOf.color = color;
						this._changingColorOf.style.background = color;
						this.rerender();
					}
				}.bind(this)
			});

			this.hideColorPicker();
		};

		/*

			###################
			# General methods #
			###################

		*/

		/*
			Get an array of the current stops
			Example: [{pos: 0, color: tinycolor()}, {pos: 1, color: tinycolor()}]
		*/
		GradientCreator.prototype.getStops = function getStops () {
			var stops = [];

			for (var key = 0; key < this._previewDom.children.length; key++) {
				if (!this._previewDom.children[key].classList.contains("gradient-stop")) continue;
				stops.push({
					pos: parseFloat(this._previewDom.children[key].style.left.slice(0, -1)) / 100,
					color: this._previewDom.children[key].color
				});
			}

			stops.sort(function (a, b) {
				return a.pos - b.pos;
			});

			return stops;
		};

		/*
			Given an event object it will return the relative width between 0 and 1.
			Works with touch events.
		*/
		GradientCreator.prototype.getRelativeWidth = function getRelativeWidth (event, target) {
			// If there is no clientX/Y (meaning no mouse event) and there are no changed touches
			// meaning no touch event, then we can't get the coords relative to the target element
			// for this event
			if (typeof event.clientX !== "number" && (!event.changedTouches || !event.changedTouches[0] || typeof event.changedTouches[0].clientX !== "number"))
				return 0;

			// Return the coordinates relative to the target element
			var clientX = (typeof event.clientX === 'number') ? event.clientX : event.changedTouches[0].clientX,
			    target = target || event.target || document.elementFromPoint(clientX, clientY);

			var boundingClientRect = target.getBoundingClientRect();
			var relativeX = clientX - boundingClientRect.left;

			return relativeX / boundingClientRect.width;
		};


		/*
			Replace the css of the preview div to match the stops
			Should be called when the stops have changed
			This function also fires the change event
		*/
		GradientCreator.prototype.rerender = function rerender () {
			var parsedStops = this.getStops().map(function (stop, index, stops) {
				return stop.color + " " + stop.pos * 100 + "%";
			});

			this._previewDom.style.background = "linear-gradient(90deg, " + parsedStops.join(",") + ")";

			this.dispatchEvent({
				type: "change",
				stops: this.getStops()
			});
		};

		/**
		 * Event dispatcher
		 * License mit
		 * https://github.com/mrdoob/eventdispatcher.js
		 * @author mrdoob / http://mrdoob.com/
		 */

		var EventDispatcher = function () {}

		EventDispatcher.prototype = {

			constructor: EventDispatcher,

			apply: function ( object ) {

				object.addEventListener = EventDispatcher.prototype.addEventListener;
				object.hasEventListener = EventDispatcher.prototype.hasEventListener;
				object.removeEventListener = EventDispatcher.prototype.removeEventListener;
				object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;

			},

			addEventListener: function ( type, listener ) {

				if ( this._listeners === undefined ) this._listeners = {};

				var listeners = this._listeners;

				if ( listeners[ type ] === undefined ) {

					listeners[ type ] = [];

				}

				if ( listeners[ type ].indexOf( listener ) === - 1 ) {

					listeners[ type ].push( listener );

				}

			},

			hasEventListener: function ( type, listener ) {

				if ( this._listeners === undefined ) return false;

				var listeners = this._listeners;

				if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {

					return true;

				}

				return false;

			},

			removeEventListener: function ( type, listener ) {

				if ( this._listeners === undefined ) return;

				var listeners = this._listeners;
				var listenerArray = listeners[ type ];

				if ( listenerArray !== undefined ) {

					var index = listenerArray.indexOf( listener );

					if ( index !== - 1 ) {

						listenerArray.splice( index, 1 );

					}

				}

			},

			dispatchEvent: function ( event ) {
					
				if ( this._listeners === undefined ) return;

				var listeners = this._listeners;
				var listenerArray = listeners[ event.type ];

				if ( listenerArray !== undefined ) {

					event.target = this;

					var array = [];
					var length = listenerArray.length;

					for ( var i = 0; i < length; i ++ ) {

						array[ i ] = listenerArray[ i ];

					}

					for ( var i = 0; i < length; i ++ ) {

						array[ i ].call( this, event );

					}

				}

			}

		};

		EventDispatcher.prototype.apply(GradientCreator.prototype);/**
		 * Intro.js v2.0
		 * https://github.com/usablica/intro.js
		 * MIT licensed
		 *
		 * Copyright (C) 2013 usabli.ca - A weekend project by Afshin Mehrabani (@afshinmeh)
		 */

		(function (root, factory) {
		  if (typeof exports === 'object') {
		    // CommonJS
		    factory(exports);
		  } else if (typeof define === 'function' && define.amd) {
		    // AMD. Register as an anonymous module.
		    define(['exports'], factory);
		  } else {
		    // Browser globals
		    factory(root);
		  }
		} (this, function (exports) {
		  //Default config/variables
		  var VERSION = '2.0';

		  /**
		   * IntroJs main class
		   *
		   * @class IntroJs
		   */
		  function IntroJs(obj) {
		    this._targetElement = obj;
		    this._introItems = [];

		    this._options = {
		      /* Next button label in tooltip box */
		      nextLabel: 'Next &rarr;',
		      /* Previous button label in tooltip box */
		      prevLabel: '&larr; Back',
		      /* Skip button label in tooltip box */
		      skipLabel: 'Skip',
		      /* Done button label in tooltip box */
		      doneLabel: 'Done',
		      /* Default tooltip box position */
		      tooltipPosition: 'bottom',
		      /* Next CSS class for tooltip boxes */
		      tooltipClass: '',
		      /* CSS class that is added to the helperLayer */
		      highlightClass: '',
		      /* Close introduction when pressing Escape button? */
		      exitOnEsc: true,
		      /* Close introduction when clicking on overlay layer? */
		      exitOnOverlayClick: true,
		      /* Show step numbers in introduction? */
		      showStepNumbers: true,
		      /* Let user use keyboard to navigate the tour? */
		      keyboardNavigation: true,
		      /* Show tour control buttons? */
		      showButtons: true,
		      /* Show tour bullets? */
		      showBullets: true,
		      /* Show tour progress? */
		      showProgress: false,
		      /* Scroll to highlighted element? */
		      scrollToElement: true,
		      /* Set the overlay opacity */
		      overlayOpacity: 0.8,
		      /* Precedence of positions, when auto is enabled */
		      positionPrecedence: ["bottom", "top", "right", "left"],
		      /* Disable an interaction with element? */
		      disableInteraction: false,
		      /* Default hint position */
		      hintPosition: 'top-middle',
		      /* Hint button label */
		      hintButtonLabel: 'Got it'
		    };
		  }

		  /**
		   * Initiate a new introduction/guide from an element in the page
		   *
		   * @api private
		   * @method _introForElement
		   * @param {Object} targetElm
		   * @returns {Boolean} Success or not?
		   */
		  function _introForElement(targetElm) {
		    var introItems = [],
		        self = this;

		    if (this._options.steps) {
		      //use steps passed programmatically
		      for (var i = 0, stepsLength = this._options.steps.length; i < stepsLength; i++) {
		        var currentItem = _cloneObject(this._options.steps[i]);
		        //set the step
		        currentItem.step = introItems.length + 1;
		        //use querySelector function only when developer used CSS selector
		        if (typeof(currentItem.element) === 'string') {
		          //grab the element with given selector from the page
		          currentItem.element = document.querySelector(currentItem.element);
		        }

		        //intro without element
		        if (typeof(currentItem.element) === 'undefined' || currentItem.element == null) {
		          var floatingElementQuery = document.querySelector(".introjsFloatingElement");

		          if (floatingElementQuery == null) {
		            floatingElementQuery = document.createElement('div');
		            floatingElementQuery.className = 'introjsFloatingElement';

		            document.body.appendChild(floatingElementQuery);
		          }

		          currentItem.element  = floatingElementQuery;
		          currentItem.position = 'floating';
		        }

		        if (currentItem.element != null) {
		          introItems.push(currentItem);
		        }
		      }

		    } else {
		      //use steps from data-* annotations
		      var allIntroSteps = targetElm.querySelectorAll('*[data-intro]');
		      //if there's no element to intro
		      if (allIntroSteps.length < 1) {
		        return false;
		      }

		      //first add intro items with data-step
		      for (var i = 0, elmsLength = allIntroSteps.length; i < elmsLength; i++) {
		        var currentElement = allIntroSteps[i];
		        var step = parseInt(currentElement.getAttribute('data-step'), 10);

		        if (step > 0) {
		          introItems[step - 1] = {
		            element: currentElement,
		            intro: currentElement.getAttribute('data-intro'),
		            step: parseInt(currentElement.getAttribute('data-step'), 10),
		            tooltipClass: currentElement.getAttribute('data-tooltipClass'),
		            highlightClass: currentElement.getAttribute('data-highlightClass'),
		            position: currentElement.getAttribute('data-position') || this._options.tooltipPosition
		          };
		        }
		      }

		      //next add intro items without data-step
		      //todo: we need a cleanup here, two loops are redundant
		      var nextStep = 0;
		      for (var i = 0, elmsLength = allIntroSteps.length; i < elmsLength; i++) {
		        var currentElement = allIntroSteps[i];

		        if (currentElement.getAttribute('data-step') == null) {

		          while (true) {
		            if (typeof introItems[nextStep] == 'undefined') {
		              break;
		            } else {
		              nextStep++;
		            }
		          }

		          introItems[nextStep] = {
		            element: currentElement,
		            intro: currentElement.getAttribute('data-intro'),
		            step: nextStep + 1,
		            tooltipClass: currentElement.getAttribute('data-tooltipClass'),
		            highlightClass: currentElement.getAttribute('data-highlightClass'),
		            position: currentElement.getAttribute('data-position') || this._options.tooltipPosition
		          };
		        }
		      }
		    }

		    //removing undefined/null elements
		    var tempIntroItems = [];
		    for (var z = 0; z < introItems.length; z++) {
		      introItems[z] && tempIntroItems.push(introItems[z]);  // copy non-empty values to the end of the array
		    }

		    introItems = tempIntroItems;

		    //Ok, sort all items with given steps
		    introItems.sort(function (a, b) {
		      return a.step - b.step;
		    });

		    //set it to the introJs object
		    self._introItems = introItems;

		    //add overlay layer to the page
		    if(_addOverlayLayer.call(self, targetElm)) {
		      //then, start the show
		      _nextStep.call(self);

		      var skipButton     = targetElm.querySelector('.introjs-skipbutton'),
		          nextStepButton = targetElm.querySelector('.introjs-nextbutton');

		      self._onKeyDown = function(e) {
		        if (e.keyCode === 27 && self._options.exitOnEsc == true) {
		          //escape key pressed, exit the intro
		          //check if exit callback is defined
		          if (self._introExitCallback != undefined) {
		            self._introExitCallback.call(self);
		          }
		          _exitIntro.call(self, targetElm);
		        } else if(e.keyCode === 37) {
		          //left arrow
		          _previousStep.call(self);
		        } else if (e.keyCode === 39) {
		          //right arrow
		          _nextStep.call(self);
		        } else if (e.keyCode === 13) {
		          //srcElement === ie
		          var target = e.target || e.srcElement;
		          if (target && target.className.indexOf('introjs-prevbutton') > 0) {
		            //user hit enter while focusing on previous button
		            _previousStep.call(self);
		          } else if (target && target.className.indexOf('introjs-skipbutton') > 0) {
		            //user hit enter while focusing on skip button
		            if (self._introItems.length - 1 == self._currentStep && typeof (self._introCompleteCallback) === 'function') {
		                self._introCompleteCallback.call(self);
		            }
		            //check if any callback is defined
		            if (self._introExitCallback != undefined) {
		              self._introExitCallback.call(self);
		            }
		            _exitIntro.call(self, targetElm);
		          } else {
		            //default behavior for responding to enter
		            _nextStep.call(self);
		          }

		          //prevent default behaviour on hitting Enter, to prevent steps being skipped in some browsers
		          if(e.preventDefault) {
		            e.preventDefault();
		          } else {
		            e.returnValue = false;
		          }
		        }
		      };

		      self._onResize = function(e) {
		        _setHelperLayerPosition.call(self, document.querySelector('.introjs-helperLayer'));
		        _setHelperLayerPosition.call(self, document.querySelector('.introjs-tooltipReferenceLayer'));
		      };

		      if (window.addEventListener) {
		        if (this._options.keyboardNavigation) {
		          window.addEventListener('keydown', self._onKeyDown, true);
		        }
		        //for window resize
		        window.addEventListener('resize', self._onResize, true);
		      } else if (document.attachEvent) { //IE
		        if (this._options.keyboardNavigation) {
		          document.attachEvent('onkeydown', self._onKeyDown);
		        }
		        //for window resize
		        document.attachEvent('onresize', self._onResize);
		      }
		    }
		    return false;
		  }

		 /*
		   * makes a copy of the object
		   * @api private
		   * @method _cloneObject
		  */
		  function _cloneObject(object) {
		      if (object == null || typeof (object) != 'object' || typeof (object.nodeType) != 'undefined') {
		        return object;
		      }
		      var temp = {};
		      for (var key in object) {
		        if (typeof (jQuery) != 'undefined' && object[key] instanceof jQuery) {
		          temp[key] = object[key];
		        } else {
		          temp[key] = _cloneObject(object[key]);
		        }
		      }
		      return temp;
		  }
		  /**
		   * Go to specific step of introduction
		   *
		   * @api private
		   * @method _goToStep
		   */
		  function _goToStep(step) {
		    //because steps starts with zero
		    this._currentStep = step - 2;
		    if (typeof (this._introItems) !== 'undefined') {
		      _nextStep.call(this);
		    }
		  }

		  /**
		   * Go to next step on intro
		   *
		   * @api private
		   * @method _nextStep
		   */
		  function _nextStep() {
		    this._direction = 'forward';

		    if (typeof (this._currentStep) === 'undefined') {
		      this._currentStep = 0;
		    } else {
		      ++this._currentStep;
		    }

		    if ((this._introItems.length) <= this._currentStep) {
		      //end of the intro
		      //check if any callback is defined
		      if (typeof (this._introCompleteCallback) === 'function') {
		        this._introCompleteCallback.call(this);
		      }
		      _exitIntro.call(this, this._targetElement);
		      return;
		    }

		    var nextStep = this._introItems[this._currentStep];
		    if (typeof (this._introBeforeChangeCallback) !== 'undefined') {
		      this._introBeforeChangeCallback.call(this, nextStep.element);
		    }

		    _showElement.call(this, nextStep);
		  }

		  /**
		   * Go to previous step on intro
		   *
		   * @api private
		   * @method _nextStep
		   */
		  function _previousStep() {
		    this._direction = 'backward';

		    if (this._currentStep === 0) {
		      return false;
		    }

		    var nextStep = this._introItems[--this._currentStep];
		    if (typeof (this._introBeforeChangeCallback) !== 'undefined') {
		      this._introBeforeChangeCallback.call(this, nextStep.element);
		    }

		    _showElement.call(this, nextStep);
		  }

		  /**
		   * Exit from intro
		   *
		   * @api private
		   * @method _exitIntro
		   * @param {Object} targetElement
		   */
		  function _exitIntro(targetElement) {
		    //remove overlay layer from the page
		    var overlayLayer = targetElement.querySelector('.introjs-overlay');

		    //return if intro already completed or skipped
		    if (overlayLayer == null) {
		      return;
		    }

		    //for fade-out animation
		    overlayLayer.style.opacity = 0;
		    setTimeout(function () {
		      if (overlayLayer.parentNode) {
		        overlayLayer.parentNode.removeChild(overlayLayer);
		      }
		    }, 500);

		    //remove all helper layers
		    var helperLayer = targetElement.querySelector('.introjs-helperLayer');
		    if (helperLayer) {
		      helperLayer.parentNode.removeChild(helperLayer);
		    }

		    var referenceLayer = targetElement.querySelector('.introjs-tooltipReferenceLayer');
		    if (referenceLayer) {
		      referenceLayer.parentNode.removeChild(referenceLayer);
		    }
		    //remove disableInteractionLayer
		    var disableInteractionLayer = targetElement.querySelector('.introjs-disableInteraction');
		    if (disableInteractionLayer) {
		      disableInteractionLayer.parentNode.removeChild(disableInteractionLayer);
		    }

		    //remove intro floating element
		    var floatingElement = document.querySelector('.introjsFloatingElement');
		    if (floatingElement) {
		      floatingElement.parentNode.removeChild(floatingElement);
		    }

		    //remove `introjs-showElement` class from the element
		    var showElement = document.querySelector('.introjs-showElement');
		    if (showElement) {
		      showElement.className = showElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, ''); // This is a manual trim.
		    }

		    //remove `introjs-fixParent` class from the elements
		    var fixParents = document.querySelectorAll('.introjs-fixParent');
		    if (fixParents && fixParents.length > 0) {
		      for (var i = fixParents.length - 1; i >= 0; i--) {
		        fixParents[i].className = fixParents[i].className.replace(/introjs-fixParent/g, '').replace(/^\s+|\s+$/g, '');
		      }
		    }

		    //clean listeners
		    if (window.removeEventListener) {
		      window.removeEventListener('keydown', this._onKeyDown, true);
		    } else if (document.detachEvent) { //IE
		      document.detachEvent('onkeydown', this._onKeyDown);
		    }

		    //set the step to zero
		    this._currentStep = undefined;
		  }

		  /**
		   * Render tooltip box in the page
		   *
		   * @api private
		   * @method _placeTooltip
		   * @param {HTMLElement} targetElement
		   * @param {HTMLElement} tooltipLayer
		   * @param {HTMLElement} arrowLayer
		   * @param {HTMLElement} helperNumberLayer
		   * @param {Boolean} hintMode
		   */
		  function _placeTooltip(targetElement, tooltipLayer, arrowLayer, helperNumberLayer, hintMode) {
		    var tooltipCssClass = '',
		        currentStepObj,
		        tooltipOffset,
		        targetOffset,
		        windowSize,
		        currentTooltipPosition;

		    hintMode = hintMode || false;

		    //reset the old style
		    tooltipLayer.style.top        = null;
		    tooltipLayer.style.right      = null;
		    tooltipLayer.style.bottom     = null;
		    tooltipLayer.style.left       = null;
		    tooltipLayer.style.marginLeft = null;
		    tooltipLayer.style.marginTop  = null;

		    arrowLayer.style.display = 'inherit';

		    if (typeof(helperNumberLayer) != 'undefined' && helperNumberLayer != null) {
		      helperNumberLayer.style.top  = null;
		      helperNumberLayer.style.left = null;
		    }

		    //prevent error when `this._currentStep` is undefined
		    if (!this._introItems[this._currentStep]) return;

		    //if we have a custom css class for each step
		    currentStepObj = this._introItems[this._currentStep];
		    if (typeof (currentStepObj.tooltipClass) === 'string') {
		      tooltipCssClass = currentStepObj.tooltipClass;
		    } else {
		      tooltipCssClass = this._options.tooltipClass;
		    }

		    tooltipLayer.className = ('introjs-tooltip ' + tooltipCssClass).replace(/^\s+|\s+$/g, '');

		    currentTooltipPosition = this._introItems[this._currentStep].position;
		    if ((currentTooltipPosition == "auto" || this._options.tooltipPosition == "auto")) {
		      if (currentTooltipPosition != "floating") { // Floating is always valid, no point in calculating
		        currentTooltipPosition = _determineAutoPosition.call(this, targetElement, tooltipLayer, currentTooltipPosition);
		      }
		    }
		    targetOffset  = _getOffset(targetElement);
		    tooltipOffset = _getOffset(tooltipLayer);
		    windowSize    = _getWinSize();

		    switch (currentTooltipPosition) {
		      case 'top':
		        arrowLayer.className = 'introjs-arrow bottom';

		        if (hintMode) {
		          var tooltipLayerStyleLeft = 0;
		        } else {
		          var tooltipLayerStyleLeft = 15;
		        }

		        _checkRight(targetOffset, tooltipLayerStyleLeft, tooltipOffset, windowSize, tooltipLayer);
		        tooltipLayer.style.bottom = (targetOffset.height +  20) + 'px';
		        break;
		      case 'right':
		        tooltipLayer.style.left = (targetOffset.width + 20) + 'px';
		        if (targetOffset.top + tooltipOffset.height > windowSize.height) {
		          // In this case, right would have fallen below the bottom of the screen.
		          // Modify so that the bottom of the tooltip connects with the target
		          arrowLayer.className = "introjs-arrow left-bottom";
		          tooltipLayer.style.top = "-" + (tooltipOffset.height - targetOffset.height - 20) + "px";
		        } else {
		          arrowLayer.className = 'introjs-arrow left';
		        }
		        break;
		      case 'left':
		        if (!hintMode && this._options.showStepNumbers == true) {
		          tooltipLayer.style.top = '15px';
		        }

		        if (targetOffset.top + tooltipOffset.height > windowSize.height) {
		          // In this case, left would have fallen below the bottom of the screen.
		          // Modify so that the bottom of the tooltip connects with the target
		          tooltipLayer.style.top = "-" + (tooltipOffset.height - targetOffset.height - 20) + "px";
		          arrowLayer.className = 'introjs-arrow right-bottom';
		        } else {
		          arrowLayer.className = 'introjs-arrow right';
		        }
		        tooltipLayer.style.right = (targetOffset.width + 20) + 'px';

		        break;
		      case 'floating':
		        arrowLayer.style.display = 'none';

		        //we have to adjust the top and left of layer manually for intro items without element
		        tooltipLayer.style.left   = '50%';
		        tooltipLayer.style.top    = '50%';
		        tooltipLayer.style.marginLeft = '-' + (tooltipOffset.width / 2)  + 'px';
		        tooltipLayer.style.marginTop  = '-' + (tooltipOffset.height / 2) + 'px';

		        if (typeof(helperNumberLayer) != 'undefined' && helperNumberLayer != null) {
		          helperNumberLayer.style.left = '-' + ((tooltipOffset.width / 2) + 18) + 'px';
		          helperNumberLayer.style.top  = '-' + ((tooltipOffset.height / 2) + 18) + 'px';
		        }

		        break;
		      case 'bottom-right-aligned':
		        arrowLayer.className      = 'introjs-arrow top-right';

		        var tooltipLayerStyleRight = 0;
		        _checkLeft(targetOffset, tooltipLayerStyleRight, tooltipOffset, tooltipLayer);
		        tooltipLayer.style.top    = (targetOffset.height +  20) + 'px';
		        break;

		      case 'bottom-middle-aligned':
		        arrowLayer.className      = 'introjs-arrow top-middle';

		        var tooltipLayerStyleLeftRight = targetOffset.width / 2 - tooltipOffset.width / 2;

		        // a fix for middle aligned hints
		        if (hintMode) {
		          tooltipLayerStyleLeftRight += 5;
		        }

		        if (_checkLeft(targetOffset, tooltipLayerStyleLeftRight, tooltipOffset, tooltipLayer)) {
		          tooltipLayer.style.right = null;
		          _checkRight(targetOffset, tooltipLayerStyleLeftRight, tooltipOffset, windowSize, tooltipLayer);
		        }
		        tooltipLayer.style.top = (targetOffset.height + 20) + 'px';
		        break;

		      case 'bottom-left-aligned':
		      // Bottom-left-aligned is the same as the default bottom
		      case 'bottom':
		      // Bottom going to follow the default behavior
		      default:
		        arrowLayer.className = 'introjs-arrow top';

		        var tooltipLayerStyleLeft = 0;
		        _checkRight(targetOffset, tooltipLayerStyleLeft, tooltipOffset, windowSize, tooltipLayer);
		        tooltipLayer.style.top    = (targetOffset.height +  20) + 'px';
		        break;
		    }
		  }

		  /**
		   * Set tooltip left so it doesn't go off the right side of the window
		   *
		   * @return boolean true, if tooltipLayerStyleLeft is ok.  false, otherwise.
		   */
		  function _checkRight(targetOffset, tooltipLayerStyleLeft, tooltipOffset, windowSize, tooltipLayer) {
		    if (targetOffset.left + tooltipLayerStyleLeft + tooltipOffset.width > windowSize.width) {
		      // off the right side of the window
		      tooltipLayer.style.left = (windowSize.width - tooltipOffset.width - targetOffset.left) + 'px';
		      return false;
		    }
		    tooltipLayer.style.left = tooltipLayerStyleLeft + 'px';
		    return true;
		  }

		  /**
		   * Set tooltip right so it doesn't go off the left side of the window
		   *
		   * @return boolean true, if tooltipLayerStyleRight is ok.  false, otherwise.
		   */
		  function _checkLeft(targetOffset, tooltipLayerStyleRight, tooltipOffset, tooltipLayer) {
		    if (targetOffset.left + targetOffset.width - tooltipLayerStyleRight - tooltipOffset.width < 0) {
		      // off the left side of the window
		      tooltipLayer.style.left = (-targetOffset.left) + 'px';
		      return false;
		    }
		    tooltipLayer.style.right = tooltipLayerStyleRight + 'px';
		    return true;
		  }

		  /**
		   * Determines the position of the tooltip based on the position precedence and availability
		   * of screen space.
		   *
		   * @param {Object} targetElement
		   * @param {Object} tooltipLayer
		   * @param {Object} desiredTooltipPosition
		   *
		   */
		  function _determineAutoPosition(targetElement, tooltipLayer, desiredTooltipPosition) {

		    // Take a clone of position precedence. These will be the available
		    var possiblePositions = this._options.positionPrecedence.slice();

		    var windowSize = _getWinSize();
		    var tooltipHeight = _getOffset(tooltipLayer).height + 10;
		    var tooltipWidth = _getOffset(tooltipLayer).width + 20;
		    var targetOffset = _getOffset(targetElement);

		    // If we check all the possible areas, and there are no valid places for the tooltip, the element
		    // must take up most of the screen real estate. Show the tooltip floating in the middle of the screen.
		    var calculatedPosition = "floating";

		    // Check if the width of the tooltip + the starting point would spill off the right side of the screen
		    // If no, neither bottom or top are valid
		    if (targetOffset.left + tooltipWidth > windowSize.width || ((targetOffset.left + (targetOffset.width / 2)) - tooltipWidth) < 0) {
		      _removeEntry(possiblePositions, "bottom");
		      _removeEntry(possiblePositions, "top");
		    } else {
		      // Check for space below
		      if ((targetOffset.height + targetOffset.top + tooltipHeight) > windowSize.height) {
		        _removeEntry(possiblePositions, "bottom");
		      }

		      // Check for space above
		      if (targetOffset.top - tooltipHeight < 0) {
		        _removeEntry(possiblePositions, "top");
		      }
		    }

		    // Check for space to the right
		    if (targetOffset.width + targetOffset.left + tooltipWidth > windowSize.width) {
		      _removeEntry(possiblePositions, "right");
		    }

		    // Check for space to the left
		    if (targetOffset.left - tooltipWidth < 0) {
		      _removeEntry(possiblePositions, "left");
		    }

		    // At this point, our array only has positions that are valid. Pick the first one, as it remains in order
		    if (possiblePositions.length > 0) {
		      calculatedPosition = possiblePositions[0];
		    }

		    // If the requested position is in the list, replace our calculated choice with that
		    if (desiredTooltipPosition && desiredTooltipPosition != "auto") {
		      if (possiblePositions.indexOf(desiredTooltipPosition) > -1) {
		        calculatedPosition = desiredTooltipPosition;
		      }
		    }

		    return calculatedPosition;
		  }

		  /**
		   * Remove an entry from a string array if it's there, does nothing if it isn't there.
		   *
		   * @param {Array} stringArray
		   * @param {String} stringToRemove
		   */
		  function _removeEntry(stringArray, stringToRemove) {
		    if (stringArray.indexOf(stringToRemove) > -1) {
		      stringArray.splice(stringArray.indexOf(stringToRemove), 1);
		    }
		  }

		  /**
		   * Update the position of the helper layer on the screen
		   *
		   * @api private
		   * @method _setHelperLayerPosition
		   * @param {Object} helperLayer
		   */
		  function _setHelperLayerPosition(helperLayer) {
		    if (helperLayer) {
		      //prevent error when `this._currentStep` in undefined
		      if (!this._introItems[this._currentStep]) return;

		      var currentElement  = this._introItems[this._currentStep],
		          elementPosition = _getOffset(currentElement.element),
		          widthHeightPadding = 10;

		      // if the target element is fixed, the tooltip should be fixed as well.
		      if (_isFixed(currentElement.element)) {
		        helperLayer.className += ' introjs-fixedTooltip';
		      }

		      if (currentElement.position == 'floating') {
		        widthHeightPadding = 0;
		      }

		      //set new position to helper layer
		      helperLayer.setAttribute('style', 'width: ' + (elementPosition.width  + widthHeightPadding)  + 'px; ' +
		                                        'height:' + (elementPosition.height + widthHeightPadding)  + 'px; ' +
		                                        'top:'    + (elementPosition.top    - 5)   + 'px;' +
		                                        'left: '  + (elementPosition.left   - 5)   + 'px;');

		    }
		  }

		  /**
		   * Add disableinteraction layer and adjust the size and position of the layer
		   *
		   * @api private
		   * @method _disableInteraction
		   */
		  function _disableInteraction() {
		    var disableInteractionLayer = document.querySelector('.introjs-disableInteraction');
		    if (disableInteractionLayer === null) {
		      disableInteractionLayer = document.createElement('div');
		      disableInteractionLayer.className = 'introjs-disableInteraction';
		      this._targetElement.appendChild(disableInteractionLayer);
		    }

		    _setHelperLayerPosition.call(this, disableInteractionLayer);
		  }

		  /**
		   * Show an element on the page
		   *
		   * @api private
		   * @method _showElement
		   * @param {Object} targetElement
		   */
		  function _showElement(targetElement) {

		    if (typeof (this._introChangeCallback) !== 'undefined') {
		      this._introChangeCallback.call(this, targetElement.element);
		    }

		    var self = this,
		        oldHelperLayer = document.querySelector('.introjs-helperLayer'),
		        oldReferenceLayer = document.querySelector('.introjs-tooltipReferenceLayer'),
		        highlightClass = 'introjs-helperLayer',
		        elementPosition = _getOffset(targetElement.element);

		    //check for a current step highlight class
		    if (typeof (targetElement.highlightClass) === 'string') {
		      highlightClass += (' ' + targetElement.highlightClass);
		    }
		    //check for options highlight class
		    if (typeof (this._options.highlightClass) === 'string') {
		      highlightClass += (' ' + this._options.highlightClass);
		    }

		    if (oldHelperLayer != null) {
		      var oldHelperNumberLayer = oldReferenceLayer.querySelector('.introjs-helperNumberLayer'),
		          oldtooltipLayer      = oldReferenceLayer.querySelector('.introjs-tooltiptext'),
		          oldArrowLayer        = oldReferenceLayer.querySelector('.introjs-arrow'),
		          oldtooltipContainer  = oldReferenceLayer.querySelector('.introjs-tooltip'),
		          skipTooltipButton    = oldReferenceLayer.querySelector('.introjs-skipbutton'),
		          prevTooltipButton    = oldReferenceLayer.querySelector('.introjs-prevbutton'),
		          nextTooltipButton    = oldReferenceLayer.querySelector('.introjs-nextbutton');

		      //update or reset the helper highlight class
		      oldHelperLayer.className = highlightClass;
		      //hide the tooltip
		      oldtooltipContainer.style.opacity = 0;
		      oldtooltipContainer.style.display = "none";

		      if (oldHelperNumberLayer != null) {
		        var lastIntroItem = this._introItems[(targetElement.step - 2 >= 0 ? targetElement.step - 2 : 0)];

		        if (lastIntroItem != null && (this._direction == 'forward' && lastIntroItem.position == 'floating') || (this._direction == 'backward' && targetElement.position == 'floating')) {
		          oldHelperNumberLayer.style.opacity = 0;
		        }
		      }

		      //set new position to helper layer
		      _setHelperLayerPosition.call(self, oldHelperLayer);
		      _setHelperLayerPosition.call(self, oldReferenceLayer);

		      //remove `introjs-fixParent` class from the elements
		      var fixParents = document.querySelectorAll('.introjs-fixParent');
		      if (fixParents && fixParents.length > 0) {
		        for (var i = fixParents.length - 1; i >= 0; i--) {
		          fixParents[i].className = fixParents[i].className.replace(/introjs-fixParent/g, '').replace(/^\s+|\s+$/g, '');
		        };
		      }

		      //remove old classes
		      var oldShowElement = document.querySelector('.introjs-showElement');
		      oldShowElement.className = oldShowElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, '');

		      //we should wait until the CSS3 transition is competed (it's 0.3 sec) to prevent incorrect `height` and `width` calculation
		      if (self._lastShowElementTimer) {
		        clearTimeout(self._lastShowElementTimer);
		      }
		      self._lastShowElementTimer = setTimeout(function() {
		        //set current step to the label
		        if (oldHelperNumberLayer != null) {
		          oldHelperNumberLayer.innerHTML = targetElement.step;
		        }
		        //set current tooltip text
		        oldtooltipLayer.innerHTML = targetElement.intro;
		        //set the tooltip position
		        oldtooltipContainer.style.display = "block";
		        _placeTooltip.call(self, targetElement.element, oldtooltipContainer, oldArrowLayer, oldHelperNumberLayer);

		        //change active bullet
		        oldReferenceLayer.querySelector('.introjs-bullets li > a.active').className = '';
		        oldReferenceLayer.querySelector('.introjs-bullets li > a[data-stepnumber="' + targetElement.step + '"]').className = 'active';

		        oldReferenceLayer.querySelector('.introjs-progress .introjs-progressbar').setAttribute('style', 'width:' + _getProgress.call(self) + '%;');

		        //show the tooltip
		        oldtooltipContainer.style.opacity = 1;
		        if (oldHelperNumberLayer) oldHelperNumberLayer.style.opacity = 1;

		        //reset button focus
		        if (nextTooltipButton.tabIndex === -1) {
		          //tabindex of -1 means we are at the end of the tour - focus on skip / done
		          skipTooltipButton.focus();
		        } else {
		          //still in the tour, focus on next
		          nextTooltipButton.focus();
		        }
		      }, 350);

		    } else {
		      var helperLayer       = document.createElement('div'),
		          referenceLayer    = document.createElement('div'),
		          arrowLayer        = document.createElement('div'),
		          tooltipLayer      = document.createElement('div'),
		          tooltipTextLayer  = document.createElement('div'),
		          bulletsLayer      = document.createElement('div'),
		          progressLayer     = document.createElement('div'),
		          buttonsLayer      = document.createElement('div');

		      helperLayer.className = highlightClass;
		      referenceLayer.className = 'introjs-tooltipReferenceLayer';

		      //set new position to helper layer
		      _setHelperLayerPosition.call(self, helperLayer);
		      _setHelperLayerPosition.call(self, referenceLayer);

		      //add helper layer to target element
		      this._targetElement.appendChild(helperLayer);
		      this._targetElement.appendChild(referenceLayer);

		      arrowLayer.className = 'introjs-arrow';

		      tooltipTextLayer.className = 'introjs-tooltiptext';
		      tooltipTextLayer.innerHTML = targetElement.intro;

		      bulletsLayer.className = 'introjs-bullets';

		      if (this._options.showBullets === false) {
		        bulletsLayer.style.display = 'none';
		      }

		      var ulContainer = document.createElement('ul');

		      for (var i = 0, stepsLength = this._introItems.length; i < stepsLength; i++) {
		        var innerLi    = document.createElement('li');
		        var anchorLink = document.createElement('a');

		        anchorLink.onclick = function() {
		          self.goToStep(this.getAttribute('data-stepnumber'));
		        };

		        if (i === (targetElement.step-1)) anchorLink.className = 'active';

		        anchorLink.href = 'javascript:void(0);';
		        anchorLink.innerHTML = "&nbsp;";
		        anchorLink.setAttribute('data-stepnumber', this._introItems[i].step);

		        innerLi.appendChild(anchorLink);
		        ulContainer.appendChild(innerLi);
		      }

		      bulletsLayer.appendChild(ulContainer);

		      progressLayer.className = 'introjs-progress';

		      if (this._options.showProgress === false) {
		        progressLayer.style.display = 'none';
		      }
		      var progressBar = document.createElement('div');
		      progressBar.className = 'introjs-progressbar';
		      progressBar.setAttribute('style', 'width:' + _getProgress.call(this) + '%;');

		      progressLayer.appendChild(progressBar);

		      buttonsLayer.className = 'introjs-tooltipbuttons';
		      if (this._options.showButtons === false) {
		        buttonsLayer.style.display = 'none';
		      }

		      tooltipLayer.className = 'introjs-tooltip';
		      tooltipLayer.appendChild(tooltipTextLayer);
		      tooltipLayer.appendChild(bulletsLayer);
		      tooltipLayer.appendChild(progressLayer);

		      //add helper layer number
		      if (this._options.showStepNumbers == true) {
		        var helperNumberLayer = document.createElement('span');
		        helperNumberLayer.className = 'introjs-helperNumberLayer';
		        helperNumberLayer.innerHTML = targetElement.step;
		        referenceLayer.appendChild(helperNumberLayer);
		      }

		      tooltipLayer.appendChild(arrowLayer);
		      referenceLayer.appendChild(tooltipLayer);

		      //next button
		      var nextTooltipButton = document.createElement('a');

		      nextTooltipButton.onclick = function() {
		        if (self._introItems.length - 1 != self._currentStep) {
		          _nextStep.call(self);
		        }
		      };

		      nextTooltipButton.href = 'javascript:void(0);';
		      nextTooltipButton.innerHTML = this._options.nextLabel;

		      //previous button
		      var prevTooltipButton = document.createElement('a');

		      prevTooltipButton.onclick = function() {
		        if (self._currentStep != 0) {
		          _previousStep.call(self);
		        }
		      };

		      prevTooltipButton.href = 'javascript:void(0);';
		      prevTooltipButton.innerHTML = this._options.prevLabel;

		      //skip button
		      var skipTooltipButton = document.createElement('a');
		      skipTooltipButton.className = 'introjs-button introjs-skipbutton';
		      skipTooltipButton.href = 'javascript:void(0);';
		      skipTooltipButton.innerHTML = this._options.skipLabel;

		      skipTooltipButton.onclick = function() {
		        if (self._introItems.length - 1 == self._currentStep && typeof (self._introCompleteCallback) === 'function') {
		          self._introCompleteCallback.call(self);
		        }

		        if (self._introItems.length - 1 != self._currentStep && typeof (self._introExitCallback) === 'function') {
		          self._introExitCallback.call(self);
		        }

		        _exitIntro.call(self, self._targetElement);
		      };

		      buttonsLayer.appendChild(skipTooltipButton);

		      //in order to prevent displaying next/previous button always
		      if (this._introItems.length > 1) {
		        buttonsLayer.appendChild(prevTooltipButton);
		        buttonsLayer.appendChild(nextTooltipButton);
		      }

		      tooltipLayer.appendChild(buttonsLayer);

		      //set proper position
		      _placeTooltip.call(self, targetElement.element, tooltipLayer, arrowLayer, helperNumberLayer);
		    }

		    //disable interaction
		    if (this._options.disableInteraction === true) {
		      _disableInteraction.call(self);
		    }

		    prevTooltipButton.removeAttribute('tabIndex');
		    nextTooltipButton.removeAttribute('tabIndex');

		    if (this._currentStep == 0 && this._introItems.length > 1) {
		      prevTooltipButton.className = 'introjs-button introjs-prevbutton introjs-disabled';
		      prevTooltipButton.tabIndex = '-1';
		      nextTooltipButton.className = 'introjs-button introjs-nextbutton';
		      skipTooltipButton.innerHTML = this._options.skipLabel;
		    } else if (this._introItems.length - 1 == this._currentStep || this._introItems.length == 1) {
		      skipTooltipButton.innerHTML = this._options.doneLabel;
		      prevTooltipButton.className = 'introjs-button introjs-prevbutton';
		      nextTooltipButton.className = 'introjs-button introjs-nextbutton introjs-disabled';
		      nextTooltipButton.tabIndex = '-1';
		    } else {
		      prevTooltipButton.className = 'introjs-button introjs-prevbutton';
		      nextTooltipButton.className = 'introjs-button introjs-nextbutton';
		      skipTooltipButton.innerHTML = this._options.skipLabel;
		    }

		    //Set focus on "next" button, so that hitting Enter always moves you onto the next step
		    nextTooltipButton.focus();

		    //add target element position style
		    targetElement.element.className += ' introjs-showElement';

		    var currentElementPosition = _getPropValue(targetElement.element, 'position');
		    if (currentElementPosition !== 'absolute' &&
		        currentElementPosition !== 'relative') {
		      //change to new intro item
		      targetElement.element.className += ' introjs-relativePosition';
		    }

		    var parentElm = targetElement.element.parentNode;
		    while (parentElm != null) {
		      if (parentElm.tagName.toLowerCase() === 'body') break;

		      //fix The Stacking Contenxt problem.
		      //More detail: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context
		      var zIndex = _getPropValue(parentElm, 'z-index');
		      var opacity = parseFloat(_getPropValue(parentElm, 'opacity'));
		      var transform = _getPropValue(parentElm, 'transform') || _getPropValue(parentElm, '-webkit-transform') || _getPropValue(parentElm, '-moz-transform') || _getPropValue(parentElm, '-ms-transform') || _getPropValue(parentElm, '-o-transform');
		      if (/[0-9]+/.test(zIndex) || opacity < 1 || (transform !== 'none' && transform !== undefined)) {
		        parentElm.className += ' introjs-fixParent';
		      }

		      parentElm = parentElm.parentNode;
		    }

		    if (!_elementInViewport(targetElement.element) && this._options.scrollToElement === true) {
		      var rect = targetElement.element.getBoundingClientRect(),
		        winHeight = _getWinSize().height,
		        top = rect.bottom - (rect.bottom - rect.top),
		        bottom = rect.bottom - winHeight;

		      //Scroll up
		      if (top < 0 || targetElement.element.clientHeight > winHeight) {
		        window.scrollBy(0, top - 30); // 30px padding from edge to look nice

		      //Scroll down
		      } else {
		        window.scrollBy(0, bottom + 100); // 70px + 30px padding from edge to look nice
		      }
		    }

		    if (typeof (this._introAfterChangeCallback) !== 'undefined') {
		      this._introAfterChangeCallback.call(this, targetElement.element);
		    }
		  }

		  /**
		   * Get an element CSS property on the page
		   * Thanks to JavaScript Kit: http://www.javascriptkit.com/dhtmltutors/dhtmlcascade4.shtml
		   *
		   * @api private
		   * @method _getPropValue
		   * @param {Object} element
		   * @param {String} propName
		   * @returns Element's property value
		   */
		  function _getPropValue (element, propName) {
		    var propValue = '';
		    if (element.currentStyle) { //IE
		      propValue = element.currentStyle[propName];
		    } else if (document.defaultView && document.defaultView.getComputedStyle) { //Others
		      propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propName);
		    }

		    //Prevent exception in IE
		    if (propValue && propValue.toLowerCase) {
		      return propValue.toLowerCase();
		    } else {
		      return propValue;
		    }
		  };

		  /**
		   * Checks to see if target element (or parents) position is fixed or not
		   *
		   * @api private
		   * @method _isFixed
		   * @param {Object} element
		   * @returns Boolean
		   */
		  function _isFixed (element) {
		    var p = element.parentNode;

		    if (p.nodeName === 'HTML') {
		      return false;
		    }

		    if (_getPropValue(element, 'position') == 'fixed') {
		      return true;
		    }

		    return _isFixed(p);
		  };

		  /**
		   * Provides a cross-browser way to get the screen dimensions
		   * via: http://stackoverflow.com/questions/5864467/internet-explorer-innerheight
		   *
		   * @api private
		   * @method _getWinSize
		   * @returns {Object} width and height attributes
		   */
		  function _getWinSize() {
		    if (window.innerWidth != undefined) {
		      return { width: window.innerWidth, height: window.innerHeight };
		    } else {
		      var D = document.documentElement;
		      return { width: D.clientWidth, height: D.clientHeight };
		    }
		  }

		  /**
		   * Add overlay layer to the page
		   * http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
		   *
		   * @api private
		   * @method _elementInViewport
		   * @param {Object} el
		   */
		  function _elementInViewport(el) {
		    var rect = el.getBoundingClientRect();

		    return (
		      rect.top >= 0 &&
		      rect.left >= 0 &&
		      (rect.bottom+80) <= window.innerHeight && // add 80 to get the text right
		      rect.right <= window.innerWidth
		    );
		  }

		  /**
		   * Add overlay layer to the page
		   *
		   * @api private
		   * @method _addOverlayLayer
		   * @param {Object} targetElm
		   */
		  function _addOverlayLayer(targetElm) {
		    var overlayLayer = document.createElement('div'),
		        styleText = '',
		        self = this;

		    //set css class name
		    overlayLayer.className = 'introjs-overlay';

		    //check if the target element is body, we should calculate the size of overlay layer in a better way
		    if (targetElm.tagName.toLowerCase() === 'body') {
		      styleText += 'top: 0;bottom: 0; left: 0;right: 0;position: fixed;';
		      overlayLayer.setAttribute('style', styleText);
		    } else {
		      //set overlay layer position
		      var elementPosition = _getOffset(targetElm);
		      if (elementPosition) {
		        styleText += 'width: ' + elementPosition.width + 'px; height:' + elementPosition.height + 'px; top:' + elementPosition.top + 'px;left: ' + elementPosition.left + 'px;';
		        overlayLayer.setAttribute('style', styleText);
		      }
		    }

		    targetElm.appendChild(overlayLayer);

		    overlayLayer.onclick = function() {
		      if (self._options.exitOnOverlayClick == true) {

		        //check if any callback is defined
		        if (self._introExitCallback != undefined) {
		          self._introExitCallback.call(self);
		        }
		        _exitIntro.call(self, targetElm);
		      }
		    };

		    setTimeout(function() {
		      styleText += 'opacity: ' + self._options.overlayOpacity.toString() + ';';
		      overlayLayer.setAttribute('style', styleText);
		    }, 10);

		    return true;
		  };

		  /**
		   * Removes open hint (tooltip hint)
		   *
		   * @api private
		   * @method _removeHintTooltip
		   */
		  function _removeHintTooltip() {
		    var tooltip = this._targetElement.querySelector('.introjs-hintReference');


		    if (tooltip) {
		      var step = tooltip.getAttribute('data-step');
		      tooltip.parentNode.removeChild(tooltip);
		      return step;
		    }
		  };

		  /**
		   * Start parsing hint items
		   *
		   * @api private
		   * @param {Object} targetElm
		   * @method _startHint
		   */
		  function _populateHints(targetElm) {
		    var self = this;
		    this._introItems = []

		    if (this._options.hints) {
		      for (var i = 0, l = this._options.hints.length; i < l; i++) {
		        var currentItem = _cloneObject(this._options.hints[i]);

		        if (typeof(currentItem.element) === 'string') {
		          //grab the element with given selector from the page
		          currentItem.element = document.querySelector(currentItem.element);
		        }

		        currentItem.hintPosition = currentItem.hintPosition || 'top-middle';

		        if (currentItem.element != null) {
		          this._introItems.push(currentItem);
		        }
		      }
		    } else {
		      var hints = targetElm.querySelectorAll('*[data-hint]');

		      if (hints.length < 1) {
		        return false;
		      }

		      //first add intro items with data-step
		      for (var i = 0, l = hints.length; i < l; i++) {
		        var currentElement = hints[i];

		        this._introItems.push({
		          element: currentElement,
		          hint: currentElement.getAttribute('data-hint'),
		          hintPosition: currentElement.getAttribute('data-hintPosition') || this._options.hintPosition,
		          tooltipClass: currentElement.getAttribute('data-tooltipClass'),
		          position: currentElement.getAttribute('data-position') || this._options.tooltipPosition
		        });
		      }
		    }

		    _addHints.call(this);

		    if (document.addEventListener) {
		      document.addEventListener('click', _removeHintTooltip.bind(this), false);
		      //for window resize
		      window.addEventListener('resize', _reAlignHints.bind(this), true);
		    } else if (document.attachEvent) { //IE
		      //for window resize
		      document.attachEvent('onclick', _removeHintTooltip.bind(this));
		      document.attachEvent('onresize', _reAlignHints.bind(this));
		    }
		  };

		  /**
		   * Re-aligns all hint elements
		   *
		   * @api private
		   * @method _reAlignHints
		   */
		  function _reAlignHints() {
		    for (var i = 0, l = this._introItems.length; i < l; i++) {
		      var item = this._introItems[i];
		      _alignHintPosition.call(this, item.hintPosition, item.element, item.targetElement)
		    }
		  }

		  /**
		   * Hide a hint
		   *
		   * @api private
		   * @method _hideHint
		   */
		  function _hideHint(stepId) {
		    _removeHintTooltip.call(this);
		    var hint = this._targetElement.querySelector('.introjs-hint[data-step="' + stepId + '"]');

		    if (hint) {
		      hint.className += ' introjs-hidehint';
		    }

		    // call the callback function (if any)
		    if (typeof (this._hintCloseCallback) !== 'undefined') {
		      this._hintCloseCallback.call(this, stepId);
		    }
		  };

		  /**
		   * Add all available hints to the page
		   *
		   * @api private
		   * @method _addHints
		   */
		  function _addHints() {
		    var self = this;

		    var oldHintsWrapper = document.querySelector('.introjs-hints');

		    if (oldHintsWrapper != null) {
		      hintsWrapper = oldHintsWrapper;
		    } else {
		      var hintsWrapper = document.createElement('div');
		      hintsWrapper.className = 'introjs-hints';
		    }

		    for (var i = 0, l = this._introItems.length; i < l; i++) {
		      var item = this._introItems[i];

		      // avoid append a hint twice
		      if (document.querySelector('.introjs-hint[data-step="' + i + '"]'))
		        continue;

		      var hint = document.createElement('a');
		      hint.href = "javascript:void(0);";

		      (function (hint, item, i) {
		        // when user clicks on the hint element
		        hint.onclick = function(e) {
		          var evt = e ? e : window.event;
		          if (evt.stopPropagation)    evt.stopPropagation();
		          if (evt.cancelBubble != null) evt.cancelBubble = true;

		          _hintClick.call(self, hint, item, i);
		        };
		      }(hint, item, i));

		      hint.className = 'introjs-hint';

		      // hint's position should be fixed if the target element's position is fixed
		      if (_isFixed(item.element)) {
		        hint.className += ' introjs-fixedhint';
		      }

		      var hintDot = document.createElement('div');
		      hintDot.className = 'introjs-hint-dot';
		      var hintPulse = document.createElement('div');
		      hintPulse.className = 'introjs-hint-pulse';

		      hint.appendChild(hintDot);
		      hint.appendChild(hintPulse);
		      hint.setAttribute('data-step', i);

		      // we swap the hint element with target element
		      // because _setHelperLayerPosition uses `element` property
		      item.targetElement = item.element;
		      item.element = hint;

		      // align the hint position
		      _alignHintPosition.call(this, item.hintPosition, hint, item.targetElement);

		      hintsWrapper.appendChild(hint);
		    }

		    // adding the hints wrapper
		    document.body.appendChild(hintsWrapper);

		    // call the callback function (if any)
		    if (typeof (this._hintsAddedCallback) !== 'undefined') {
		      this._hintsAddedCallback.call(this);
		    }
		  };

		  /**
		   * Aligns hint position
		   *
		   * @api private
		   * @method _alignHintPosition
		   * @param {String} position
		   * @param {Object} hint
		   * @param {Object} element
		   */
		  function _alignHintPosition(position, hint, element) {
		    // get/calculate offset of target element
		    var offset = _getOffset.call(this, element);

		    // align the hint element
		    switch (position) {
		      default:
		      case 'top-left':
		        hint.style.left = offset.left + 'px';
		        hint.style.top = offset.top + 'px';
		        break;
		      case 'top-right':
		        hint.style.left = (offset.left + offset.width) + 'px';
		        hint.style.top = offset.top + 'px';
		        break;
		      case 'bottom-left':
		        hint.style.left = offset.left + 'px';
		        hint.style.top = (offset.top + offset.height) + 'px';
		        break;
		      case 'bottom-right':
		        hint.style.left = (offset.left + offset.width) + 'px';
		        hint.style.top = (offset.top + offset.height) + 'px';
		        break;
		      case 'bottom-middle':
		        hint.style.left = (offset.left + (offset.width / 2)) + 'px';
		        hint.style.top = (offset.top + offset.height) + 'px';
		        break;
		      case 'top-middle':
		        hint.style.left = (offset.left + (offset.width / 2)) + 'px';
		        hint.style.top = offset.top + 'px';
		        break;
		    }
		  };

		  /**
		   * Triggers when user clicks on the hint element
		   *
		   * @api private
		   * @method _hintClick
		   * @param {Object} hintElement
		   * @param {Object} item
		   * @param {Number} stepId
		   */
		  function _hintClick(hintElement, item, stepId) {
		    // call the callback function (if any)
		    if (typeof (this._hintClickCallback) !== 'undefined') {
		      this._hintClickCallback.call(this, hintElement, item, stepId);
		    }

		    // remove all open tooltips
		    var removedStep = _removeHintTooltip.call(this);

		    // to toggle the tooltip
		    if (parseInt(removedStep, 10) == stepId) {
		      return;
		    }

		    var tooltipLayer = document.createElement('div');
		    var tooltipTextLayer = document.createElement('div');
		    var arrowLayer = document.createElement('div');
		    var referenceLayer = document.createElement('div');

		    tooltipLayer.className = 'introjs-tooltip';

		    tooltipLayer.onclick = function (e) {
		      //IE9 & Other Browsers
		      if (e.stopPropagation) {
		        e.stopPropagation();
		      }
		      //IE8 and Lower
		      else {
		        e.cancelBubble = true;
		      }
		    };

		    tooltipTextLayer.className = 'introjs-tooltiptext';

		    var tooltipWrapper = document.createElement('p');
		    tooltipWrapper.innerHTML = item.hint;

		    var closeButton = document.createElement('a');
		    closeButton.className = 'introjs-button';
		    closeButton.innerHTML = this._options.hintButtonLabel;
		    closeButton.onclick = _hideHint.bind(this, stepId);

		    tooltipTextLayer.appendChild(tooltipWrapper);
		    tooltipTextLayer.appendChild(closeButton);

		    arrowLayer.className = 'introjs-arrow';
		    tooltipLayer.appendChild(arrowLayer);

		    tooltipLayer.appendChild(tooltipTextLayer);

		    // set current step for _placeTooltip function
		    this._currentStep = hintElement.getAttribute('data-step');

		    // align reference layer position
		    referenceLayer.className = 'introjs-tooltipReferenceLayer introjs-hintReference';
		    referenceLayer.setAttribute('data-step', hintElement.getAttribute('data-step'));
		    _setHelperLayerPosition.call(this, referenceLayer);

		    referenceLayer.appendChild(tooltipLayer);
		    document.body.appendChild(referenceLayer);

		    //set proper position
		    _placeTooltip.call(this, hintElement, tooltipLayer, arrowLayer, null, true);
		  };

		  /**
		   * Get an element position on the page
		   * Thanks to `meouw`: http://stackoverflow.com/a/442474/375966
		   *
		   * @api private
		   * @method _getOffset
		   * @param {Object} element
		   * @returns Element's position info
		   */
		  function _getOffset(element) {
		    var elementPosition = {};

		    //set width
		    elementPosition.width = element.offsetWidth;

		    //set height
		    elementPosition.height = element.offsetHeight;

		    //calculate element top and left
		    var _x = 0;
		    var _y = 0;
		    while (element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
		      _x += element.offsetLeft;
		      _y += element.offsetTop;
		      element = element.offsetParent;
		    }
		    //set top
		    elementPosition.top = _y;
		    //set left
		    elementPosition.left = _x;

		    return elementPosition;
		  };

		  /**
		   * Gets the current progress percentage
		   *
		   * @api private
		   * @method _getProgress
		   * @returns current progress percentage
		   */
		  function _getProgress() {
		    // Steps are 0 indexed
		    var currentStep = parseInt((this._currentStep + 1), 10);
		    return ((currentStep / this._introItems.length) * 100);
		  };

		  /**
		   * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
		   * via: http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
		   *
		   * @param obj1
		   * @param obj2
		   * @returns obj3 a new object based on obj1 and obj2
		   */
		  function _mergeOptions(obj1,obj2) {
		    var obj3 = {};
		    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
		    return obj3;
		  };

		  var introJs = function (targetElm) {
		    if (typeof (targetElm) === 'object') {
		      //Ok, create a new instance
		      return new IntroJs(targetElm);

		    } else if (typeof (targetElm) === 'string') {
		      //select the target element with query selector
		      var targetElement = document.querySelector(targetElm);

		      if (targetElement) {
		        return new IntroJs(targetElement);
		      } else {
		        throw new Error('There is no element with given selector.');
		      }
		    } else {
		      return new IntroJs(document.body);
		    }
		  };

		  /**
		   * Current IntroJs version
		   *
		   * @property version
		   * @type String
		   */
		  introJs.version = VERSION;

		  //Prototype
		  introJs.fn = IntroJs.prototype = {
		    clone: function () {
		      return new IntroJs(this);
		    },
		    setOption: function(option, value) {
		      this._options[option] = value;
		      return this;
		    },
		    setOptions: function(options) {
		      this._options = _mergeOptions(this._options, options);
		      return this;
		    },
		    start: function () {
		      _introForElement.call(this, this._targetElement);
		      return this;
		    },
		    goToStep: function(step) {
		      _goToStep.call(this, step);
		      return this;
		    },
		    nextStep: function() {
		      _nextStep.call(this);
		      return this;
		    },
		    previousStep: function() {
		      _previousStep.call(this);
		      return this;
		    },
		    exit: function() {
		      _exitIntro.call(this, this._targetElement);
		      return this;
		    },
		    refresh: function() {
		      _setHelperLayerPosition.call(this, document.querySelector('.introjs-helperLayer'));
		      _setHelperLayerPosition.call(this, document.querySelector('.introjs-tooltipReferenceLayer'));
		      return this;
		    },
		    onbeforechange: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._introBeforeChangeCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onbeforechange was not a function');
		      }
		      return this;
		    },
		    onchange: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._introChangeCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onchange was not a function.');
		      }
		      return this;
		    },
		    onafterchange: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._introAfterChangeCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onafterchange was not a function');
		      }
		      return this;
		    },
		    oncomplete: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._introCompleteCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for oncomplete was not a function.');
		      }
		      return this;
		    },
		    onhintsadded: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._hintsAddedCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onhintsadded was not a function.');
		      }
		      return this;
		    },
		    onhintclick: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._hintClickCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onhintclick was not a function.');
		      }
		      return this;
		    },
		    onhintclose: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._hintCloseCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onhintclose was not a function.');
		      }
		      return this;
		    },
		    onexit: function(providedCallback) {
		      if (typeof (providedCallback) === 'function') {
		        this._introExitCallback = providedCallback;
		      } else {
		        throw new Error('Provided callback for onexit was not a function.');
		      }
		      return this;
		    },
		    addHints: function() {
		      _populateHints.call(this, this._targetElement);
		      return this;
		    }
		  };

		  exports.introJs = introJs;
		  return introJs;
		}));
		(function() {
			var QuickSettings = {
				_topZ: 500,

				_panel: null,
				_titleBar: null,
				_content: null,
				_startX: 0,
				_startY: 0,
				_hidden: false,
				_collapsed: false,
				_controls: null,
				_keyCode: -1,
				_draggable: true,
				_collapsible: true,
				_globalChangeHandler: null,
				_callbacks: {},

				create: function(x, y, title) {
					var obj = Object.create(this);
					obj._init(x, y, title);
					return obj;
				},

				_init: function(x, y, title) {
					this._bindHandlers();
					this._createPanel(x, y);
					this._createTitleBar(title || "QuickSettings");
					this._createContent();

					document.body.appendChild(this._panel);
				},

				_bindHandlers: function() {
					this._startDrag = this._startDrag.bind(this);
					this._drag = this._drag.bind(this);
					this._endDrag = this._endDrag.bind(this);
					this._doubleClickTitle = this._doubleClickTitle.bind(this);
					this._onKeyUp = this._onKeyUp.bind(this);
				},

				_createPanel: function(x, y) {
					this._panel = document.createElement("div");
					this._panel.className = "msettings_main";
					this._panel.style.zIndex = ++QuickSettings._topZ;
					this.setPosition(x || 0, y || 0);
					this._controls = {};
				},

				_createTitleBar: function(text) {
					this._titleBar = document.createElement("div");
					this._titleBar.textContent = text;
					this._titleBar.className = "msettings_title_bar";

					this._titleBar.addEventListener("mousedown", this._startDrag);
					this._titleBar.addEventListener("touchstart", this._startDrag);
					this._titleBar.addEventListener("dblclick", this._doubleClickTitle);

					this._panel.appendChild(this._titleBar);
				},

				_createContent: function() {
					this._content = document.createElement("div");
					this._content.className = "msettings_content";
					this._panel.appendChild(this._content);
				},

				setPosition: function(x, y) {
					this._panel.style.left = x + "px";
					this._panel.style.top = Math.max(y, 0) + "px";
				},

				setSize: function(w, h) {
					this._panel.style.width = w + "px";
					this._content.style.width = w + "px";
					this._content.style.height = (h - this._titleBar.offsetHeight) + "px";
				},

				setWidth: function(w) {
					this._panel.style.width = w + "px";
					this._content.style.width = w + "px";
				},

				setDraggable: function(draggable) {
					this._draggable = draggable;
					if(this._draggable || this._collapsible) {
						this._titleBar.style.cursor = "pointer";
					}
					else {
						this._titleBar.style.cursor = "default";
					}
				},

				setCollapsible: function(collapsible) {
					this._collapsible = collapsible;
					if(this._draggable || this._collapsible) {
						this._titleBar.style.cursor = "pointer";
					}
					else {
						this._titleBar.style.cursor = "default";
					}
				},

				_startDrag: function(event) {
					if(this._draggable) {
						this._panel.style.zIndex = ++QuickSettings._topZ;
						document.addEventListener("touchmove", this._drag);
						document.addEventListener("mousemove", this._drag);
						document.addEventListener("touchend", this._endDrag);
						document.addEventListener("mouseup", this._endDrag);
						this._startX = event.clientX || event.changedTouches[0].clientX;
						this._startY = event.clientY || event.changedTouches[0].clientY;
					}
					event.preventDefault();
				},

				_drag: function(event) {
					var x = parseInt(this._panel.style.left),
						y = parseInt(this._panel.style.top),
						mouseX = event.clientX || event.changedTouches[0].clientX,
						mouseY = event.clientY || event.changedTouches[0].clientY;

					this.setPosition(x + mouseX - this._startX, y + mouseY - this._startY);
					this._startX = mouseX;
					this._startY = mouseY;
					event.preventDefault();
				},

				_endDrag: function(event) {
					document.removeEventListener("touchmove", this._drag);
					document.removeEventListener("mousemove", this._drag);
					document.removeEventListener("touchend", this._endDrag);
					document.removeEventListener("mouseup", this._endDrag);
					event.preventDefault();
				},

				_doubleClickTitle: function() {
					if(this._collapsible) {
						this.toggleCollapsed();
					}
				},

				setGlobalChangeHandler: function(handler) {
					this._globalChangeHandler = handler;
				},

				addCallbackHandler: function (title, callback) {
					if (typeof callback !== "function")
						throw "addCallbackHandler expects a function as second argument";

					this._callbacks[title] = this._callbacks[title] || [];
					if (this._callbacks[title].indexOf(callback) !== -1) return;
					this._callbacks[title].push(callback);
				},

				removeCallbackHandler: function (title, callback) {
					var index = this._callbacks[title].indexOf(callback);
					while (index !== -1) {
						this._callbacks[title].splice(index, 1);
						var index = this._callbacks[title].indexOf(callback);
					}
				},

				_callCallbacks: function (title, event) {
					this._callbacks[title] = this._callbacks[title] || [];
					for (var k = 0; k < this._callbacks[title].length; k++) {
						this._callbacks[title][k](event);
					}
				},

				toggleCollapsed: function() {
					if(this._collapsed) {
						this.expand();
					}
					else {
						this.collapse();
					}
				},

				collapse: function() {
					this._panel.removeChild(this._content);
					this._collapsed = true;
				},

				expand: function() {
					this._panel.appendChild(this._content);
					this._collapsed = false;
				},

				hide: function() {
					this._panel.style.display = "none";
					this._hidden = true;
				},

				show: function() {
					this._panel.style.display = "";
					this._panel.style.zIndex = ++QuickSettings._topZ;
					this._hidden = false;
				},

				_createContainer: function() {
					var container = document.createElement("div");
					container.className = "msettings_container";
					return container;
				},

				_createLabel: function(title) {
					var label = document.createElement("div");
					label.innerHTML = title;
					label.className = "msettings_label";
					return label;
				},

				setKey: function(char) {
					this._keyCode = char.toUpperCase().charCodeAt(0);
					document.body.addEventListener("keyup", this.onKeyUp);
				},

				_onKeyUp: function(event) {
					if(event.keyCode === this._keyCode) {
						this.toggleVisibility();
					}
				},

				toggleVisibility: function() {
					if(this._hidden) {
						this.show();
					}
					else {
						this.hide();
					}
				},

				bindRange: function(title, min, max, value, step, object) {
					this.addRange(title, min, max, value, step, function(value) {
						object[title] = value;
					});
				},

				addControl: function (props) {
					if (typeof props.type !== "string")
						throw "AddControl needs an object with a type";

					var value = localStorage.getItem("quicksettings-" + props.title) || props.value || props.color || props.text;
					var callback = props.callback || function () {};

					switch (props.type.toLowerCase()) {
						case "range":
							this.addRange(props.title, props.min, props.max, parseFloat(value), props.step, callback);
						break;
						case "color":
							this.addColor(props.title, value, callback);
						break;
						case "boolean":
							this.addBoolean(props.title, typeof value == "string" ? value == "true" : value, callback);
						break;
						case "text":
							this.addText(props.title, value, callback);
						break;
						case "textarea":
							this.addTextArea(props);
						break;
						case "dropdown":
							this.addDropDown(props.title, props.items, callback, value);
						break;
					}

					this.addCallbackHandler(props.title, function (event) {
						localStorage.setItem("quicksettings-" + props.title, event.index || event.value);
					});
				},

				addRange: function(title, min, max, value, step, callback) {
					var container = this._createContainer();

					var range = document.createElement("input");
					range.type = "range";
					range.id = title;
					range.min = min || 0;
					range.max = max || 100;
					range.step = step || 1;
					range.value = value || 0;
					range.className = "msettings_range";

					var label = this._createLabel("<b>" + title + ":</b> " + range.value);

					container.appendChild(label);
					container.appendChild(range);
					this._content.appendChild(container);
					this._controls[title] = {
						container: container,
						control: range,
						label: label,
						callback: callback
					};

					var eventName = "input";
					if(this._isIE()) {
						eventName = "change";
					}
					var gch = this._globalChangeHandler;
					var qs = this;
					range.addEventListener(eventName, function() {
						label.innerHTML = "<b>" + title + ":</b> " + range.value;
						if(callback) {
							callback(parseFloat(range.value));
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {value: parseFloat(range.value)});
					});
				}, 

				_isIE: function() {
					if(navigator.userAgent.indexOf("rv:11") != -1) {
						return true;
					}
					if(navigator.userAgent.indexOf("MSIE") != -1) {
						return true;
					}
					return false;
				},

				getRangeValue: function(title) {
					return parseFloat(this._controls[title].control.value);
				},

				setRangeValue: function(title, value, notify) {
					var control = this._controls[title];
					control.control.value = value;
					control.label.innerHTML = "<b>" + title + ":</b> " + control.control.value;
					if (!notify) return;
					if(control.callback) {
						control.callback(parseFloat(control.control.value));
					}
					if(this._globalChangeHandler) {
						this._globalChangeHandler();
					}
				},

				setRangeParameters: function(title, min, max, step) {
					var control = this._controls[title];
					control.control.min = min;
					control.control.max = max;
					control.control.step = step;
				},

				bindBoolean: function(title, value, object) {
					this.addBoolean(title, value, function(value) {
						object[title] = value;
					});
				},

				addBoolean: function(title, value, callback) {
					var container = this._createContainer();

					var label = document.createElement("span");
					label.className = "msettings_checkbox_label";
					label.textContent = title;

					var checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkbox.id = title;
					checkbox.checked = value;
					checkbox.className = "msettings_checkbox";

					container.appendChild(checkbox);
					container.appendChild(label);
					this._content.appendChild(container);
					this._controls[title] = {
						container: container,
						control: checkbox,
						callback: callback
					};

					var gch = this._globalChangeHandler;
					var qs = this;
					checkbox.addEventListener("change", function() {
						if(callback) {
							callback(checkbox.checked);
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {value: checkbox.checked});
					});
					label.addEventListener("click", function() {
						if(checkbox.disabled) {
							return;
						}
						checkbox.checked = !checkbox.checked;
						if(callback) {
							callback(checkbox.checked);
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {value: checkbox.checked});
					});
				},

				getBoolean: function(title) {
					return this._controls[title].control.checked;
				},

				setBoolean: function(title, value, notify) {
					this._controls[title].control.checked = value;
					if (!notify) return;
					if(this._controls[title].callback) {
						this._controls[title].callback(value);
					}
					if(this._globalChangeHandler) {
						this._globalChangeHandler();
					}
					this._callCallbacks(title, {value: value});
				},

				addButton: function(title, callback) {
					var container = this._createContainer();

					var button = document.createElement("input");
					button.type = "button";
					button.id = title;
					button.value = title;
					button.className = "msettings_button";

					container.appendChild(button);
					this._content.appendChild(container);
					this._controls[title] = {
						container: container,
						control: button
					}

					var gch = this._globalChangeHandler;
					var qs = this;
					button.addEventListener("click", function() {
						if(callback) {
							callback(button);
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {button: button});
					});
				},

				bindColor: function(title, color, object) {
					this.addColor(title, color, function(value) {
						object[title] = value;
					});
				},

				addColor: function(title, color, callback) {
					var container = this._createContainer();
					var label = this._createLabel("<b>" + title + ":</b> " + color);

					var colorInput = document.createElement("input");
					try {
						colorInput.type = "color";
					}
					catch(e) {
						colorInput.type = "text";
					}
					colorInput.id = title;
					colorInput.value = color || "#ff0000";
					colorInput.className = "msettings_color";

					container.appendChild(label);
					container.appendChild(colorInput);
					this._content.appendChild(container);
					this._controls[title] = {
						container: container,
						control: colorInput,
						label: label,
						callback: callback
					};

					var gch = this._globalChangeHandler;
					var qs = this;
					colorInput.addEventListener("input", function() {
						label.innerHTML = "<b>" + title + ":</b> " + colorInput.value;
						if(callback) {
							callback(colorInput.value);
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {value: colorInput.value});
					});
				},

				getColor: function(title) {
					return this._controls[title].control.value;
				},

				setColor: function(title, value, notify) {
					var control = this._controls[title];
					control.control.value = value;
					control.label.innerHTML = "<b>" + title + ":</b> " + control.control.value;
					if (!notify) return;
					if(control.callback) {
						control.callback(control.control.value);
					}
					if(this._globalChangeHandler) {
						this._globalChangeHandler();
					}
					this._callCallbacks(title, {value: value});
				},

				bindText: function(title, text, object) {
					this.addText(title, text, function(value) {
						object[title] = value;
					});
				},

				addText: function(title, text, callback) {
					var container = this._createContainer();
					var label = this._createLabel("<b>" + title + "</b>");

					var textInput = document.createElement("input");
					textInput.type = "text";
					textInput.id = title;
					textInput.value = text || "";
					textInput.className = "msettings_text_input";

					container.appendChild(label);
					container.appendChild(textInput);
					this._content.appendChild(container);
					this._controls[title] = {
						container: container,
						control: textInput,
						label: label,
						callback: callback
					}

					var gch = this._globalChangeHandler;
					var qs = this;
					textInput.addEventListener("input", function() {
						if(callback) {
							callback(textInput.value);
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {value: textInput.value});
					});
				}, 

				addTextArea: function(title, text, callback) {
					var container = this._createContainer();
					var label = this._createLabel("<b>" + title + "</b>");

					var textInput = document.createElement("textarea");
					textInput.id = title;
					textInput.rows = 5;
					textInput.value = text || "";
					textInput.className = "msettings_textarea";

					container.appendChild(label);
					container.appendChild(textInput);
					this._content.appendChild(container);
					this._controls[title] = {
						container: container,
						control: textInput,
						label: label,
						callback: callback
					}

					var gch = this._globalChangeHandler;
					var qs = this;
					textInput.addEventListener("input", function() {
						if(callback) {
							callback(textInput.value);
						}
						if(gch) {
							gch();
						}
						qs._callCallbacks(title, {value: textInput.value});
					});
				}, 

				setTextAreaRows: function(title, rows) {
					this._controls[title].control.rows = rows;
				},

				getText: function(title) {
					return this._controls[title].control.value;
				},

				setText: function(title, text, notify) {
					var control = this._controls[title];
					control.control.value = text;
					if (!notify) return;
					if(control.callback) {
						control.callback(text);
					}
					if(this._globalChangeHandler) {
						this._globalChangeHandler();
					}
					this._callCallbacks(title, {value: text});
				},

				addInfo: function(title, info) {
					var container = this._createContainer();
					container.innerHTML = info;
					this._controls[title] = {
						container: container
					};
					this._content.appendChild(container);
				},

				bindDropDown: function(title, items, object) {
					this.addDropDown(title, items, function(value) {
						object[title] = value.value;
					});
				},

				addDropDown: function(title, items, callback, selectedIndex) {
					var container = this._createContainer();

					var label = this._createLabel("<b>" + title + "</b>");
					var select = document.createElement("select");
					for(var i = 0; i < items.length; i++) {
						var option = document.createElement("option");
						option.label = items[i];
						select.add(option);
					};
					if (selectedIndex) select.selectedIndex = selectedIndex;

					var gch = this._globalChangeHandler;
					var qs = this;
					select.addEventListener("change", function() {
						var index = select.selectedIndex,
							options = select.options;

						if(callback) {
							callback({
								index: index,
								value: options[index].label
							});
						}
						if(gch) {
							gch();
						}

						qs._callCallbacks(title, {
							index: index,
							value: options[index].label
						});
					});
					select.className = "msettings_select";

					container.appendChild(label);
					container.appendChild(select);
					this._content.appendChild(container);

					this._controls[title] = {
						container: container,
						control: select,
						label: label,
						callback: callback
					};
				},

				getDropDownValue: function(title) {
					var control = this._controls[title],
						select = control.control,
						index = select.selectedIndex,
						options = select.options;
					return {
						index: index,
						value: options[index].label
					}
				},

				setDropDownIndex: function(title, index, notify) {
					var control = this._controls[title],
						options = control.control.options;
					control.control.selectedIndex = index;
					if (!notify) return;
					if(control.callback) {
						control.callback({
							index: index,
							value: options[index].label
						});
					}
					if(this._globalChangeHandler) {
						this._globalChangeHandler();
					}
					this._callCallbacks(title, {
						index: index,
						value: options[index].label
					});
				},

				getInfo: function(title) {
					return this._controls[title].container.innerHTML;
				},

				setInfo: function(title, info) {
					this._controls[title].container.innerHTML = info;
				},

				addImage: function(title, imageURL) {
					var container = this._createContainer(),
						label = this._createLabel("<b>" + title + "</b>");
						img = document.createElement("img");
					img.className = "msettings_image";
					img.src = imageURL;

					container.appendChild(label);
					container.appendChild(img);
					this._content.appendChild(container);

					this._controls[title] = {
						container: container,
						control: img,
						label: label
					};
				},

				setImageURL: function(title, imageURL) {
					this._controls[title].control.src = imageURL;
				},

				addProgressBar: function(title, max, value, showNumbers) {
					var container = this._createContainer(),
						label = this._createLabel("");
						progress = document.createElement("progress");
					progress.className = "msettings_progress";
					progress.max = max;
					progress.value = value;
					if(showNumbers) {
						label.innerHTML = "<b>" + title + ":<b> " + value + " / " + max;
					}
					else {
						label.innerHTML = "<b>" + title + "<b>";
					}

					container.appendChild(label);
					container.appendChild(progress);
					this._content.appendChild(container);

					this._controls[title] = {
						container: container,
						control: progress,
						showNumbers: showNumbers,
						label: label
					};
				},

				getProgress: function(title) {
					return this._controls[title].control.value;
				},

				setProgress: function(title, value) {
					var progress = this._controls[title].control;
					progress.value = value;
					if(this._controls[title].showNumbers) {
						this._controls[title].label.innerHTML = "<b>" + title + ":<b> " + progress.value + " / " + progress.max;
					}
					else {
						this._controls[title].label.innerHTML = "<b>" + title + "<b>";
					}
				},

				addElement: function(title, element) {
					var container = this._createContainer(),
						label = this._createLabel("<b>" + title + "</b>");

					container.appendChild(label);
					container.appendChild(element);
					this._content.appendChild(container);

					this._controls[title] = {
						container: container,
						label: label
					};
				},

				addHTML: function(title, html) {
					var div = document.createElement("div");
					div.innerHTML = html;
					this.addElement(title, div);
				},

				removeControl: function(title) {
					if(this._controls[title]){
						var container = this._controls[title].container;
					}
					if(container && container.parentElement) {
						container.parentElement.removeChild(container);
					}
					this._controls[title] = null;
				},

				enableControl: function(title) {
					if(this._controls[title].control) {
						this._controls[title].control.disabled = false;
					}
				},

				disableControl: function(title) {
					if(this._controls[title].control) {
						this._controls[title].control.disabled = true;
					}
				}
			};

			if (typeof define === "function" && define.amd) {
			    define(QuickSettings);
			} else {
			   window.QuickSettings = QuickSettings;
			}

		}());
		// Spectrum Colorpicker v1.6.0
		// https://github.com/bgrins/spectrum
		// Author: Brian Grinstead
		// License: MIT
		(function (factory) {
		    "use strict";

		    // if (typeof define === 'function' && define.amd) { // AMD
		    //     define(['jquery'], factory);
		    // }
		    // else if (typeof exports == "object" && typeof module == "object") { // CommonJS
		    //     module.exports = factory;
		    // }
		    // else { // Browser
		        factory(jQuery);
		    // }
		})(function($, undefined) {
		    "use strict";

		    var defaultOpts = {

		        // Callbacks
		        beforeShow: noop,
		        move: noop,
		        change: noop,
		        show: noop,
		        hide: noop,

		        // Options
		        color: false,
		        flat: false,
		        showInput: false,
		        allowEmpty: false,
		        showButtons: true,
		        clickoutFiresChange: false,
		        showInitial: false,
		        showPalette: false,
		        showPaletteOnly: false,
		        hideAfterPaletteSelect: false,
		        togglePaletteOnly: false,
		        showSelectionPalette: true,
		        localStorageKey: false,
		        appendTo: "body",
		        maxSelectionSize: 7,
		        cancelText: "cancel",
		        chooseText: "choose",
		        togglePaletteMoreText: "more",
		        togglePaletteLessText: "less",
		        clearText: "Clear Color Selection",
		        noColorSelectedText: "No Color Selected",
		        preferredFormat: false,
		        className: "", // Deprecated - use containerClassName and replacerClassName instead.
		        containerClassName: "",
		        replacerClassName: "",
		        showAlpha: false,
		        theme: "sp-light",
		        palette: [["#ffffff", "#000000", "#ff0000", "#ff8000", "#ffff00", "#008000", "#0000ff", "#4b0082", "#9400d3"]],
		        selectionPalette: [],
		        disabled: false,
		        offset: null
		    },
		    spectrums = [],
		    IE = !!/msie/i.exec( window.navigator.userAgent ),
		    rgbaSupport = (function() {
		        function contains( str, substr ) {
		            return !!~('' + str).indexOf(substr);
		        }

		        var elem = document.createElement('div');
		        var style = elem.style;
		        style.cssText = 'background-color:rgba(0,0,0,.5)';
		        return contains(style.backgroundColor, 'rgba') || contains(style.backgroundColor, 'hsla');
		    })(),
		    inputTypeColorSupport = (function() {
		        var colorInput = $("<input type='color' value='#000000' />")[0];
		        return colorInput.type === "color" && colorInput.value !== "!";
		    })(),
		    replaceInput = [
		        "<div class='control-button btn rounded-0 btn-sm'>",
		            "<i class='tool-item tool-colorpicker sp-preview-inner'></i>",
		        "</div>"
		    ].join(''),
		    markup = (function () {

		        // IE does not support gradients with multiple stops, so we need to simulate
		        //  that for the rainbow slider with 8 divs that each have a single gradient
		        var gradientFix = "";
		        if (IE) {
		            for (var i = 1; i <= 6; i++) {
		                gradientFix += "<div class='sp-" + i + "'></div>";
		            }
		        }

		        return [
		            "<div class='sp-container sp-hidden'>",
		                "<div class='sp-palette-container'>",
		                    "<div class='sp-palette sp-thumb sp-cf'></div>",
		                    "<div class='sp-palette-button-container sp-cf'>",
		                        "<button type='button' class='sp-palette-toggle'></button>",
		                    "</div>",
		                "</div>",
		                "<div class='sp-picker-container'>",
		                    "<div class='sp-top sp-cf'>",
		                        "<div class='sp-fill'></div>",
		                        "<div class='sp-top-inner'>",
		                            "<div class='sp-color'>",
		                                "<div class='sp-sat'>",
		                                    "<div class='sp-val'>",
		                                        "<div class='sp-dragger'></div>",
		                                    "</div>",
		                                "</div>",
		                            "</div>",
		                            "<div class='sp-clear sp-clear-display'>",
		                            "</div>",
		                            "<div class='sp-hue'>",
		                                "<div class='sp-slider'></div>",
		                                gradientFix,
		                            "</div>",
		                        "</div>",
		                        "<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>",
		                    "</div>",
		                    "<div class='sp-input-container sp-cf'>",
		                        "<input class='sp-input' type='text' spellcheck='false'  />",
		                    "</div>",
		                    "<div class='sp-initial sp-thumb sp-cf'></div>",
		                    "<div class='sp-button-container sp-cf'>",
		                        "<a class='sp-cancel' href='#'></a>",
		                        "<button type='button' class='sp-choose'></button>",
		                    "</div>",
		                "</div>",
		            "</div>"
		        ].join("");
		    })();

		    function paletteTemplate (p, color, className, opts) {
		        var html = [];
		        for (var i = 0; i < p.length; i++) {
		            var current = p[i];
		            if(current) {
		                var tiny = tinycolor(current);
		                var c = tiny.toHsl().l < 0.5 ? "sp-thumb-el sp-thumb-dark" : "sp-thumb-el sp-thumb-light";
		                c += (tinycolor.equals(color, current)) ? " sp-thumb-active" : "";
		                var formattedString = tiny.toString(opts.preferredFormat || "rgb");
		                var swatchStyle = rgbaSupport ? ("background-color:" + tiny.toRgbString()) : "filter:" + tiny.toFilter();
		                html.push('<span title="' + formattedString + '" data-color="' + tiny.toRgbString() + '" class="' + c + '"><span class="sp-thumb-inner" style="' + swatchStyle + ';" /></span>');
		            } else {
		                var cls = 'sp-clear-display';
		                html.push($('<div />')
		                    .append($('<span data-color="" style="background-color:transparent;" class="' + cls + '"></span>')
		                        .attr('title', opts.noColorSelectedText)
		                    )
		                    .html()
		                );
		            }
		        }
		        return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
		    }

		    function hideAll() {
		        for (var i = 0; i < spectrums.length; i++) {
		            if (spectrums[i]) {
		                spectrums[i].hide();
		            }
		        }
		    }

		    function instanceOptions(o, callbackContext) {
		        var opts = $.extend({}, defaultOpts, o);
		        opts.callbacks = {
		            'move': bind(opts.move, callbackContext),
		            'change': bind(opts.change, callbackContext),
		            'show': bind(opts.show, callbackContext),
		            'hide': bind(opts.hide, callbackContext),
		            'beforeShow': bind(opts.beforeShow, callbackContext)
		        };

		        return opts;
		    }

		    function spectrum(element, o) {

		        var opts = instanceOptions(o, element),
		            flat = opts.flat,
		            showSelectionPalette = opts.showSelectionPalette,
		            localStorageKey = opts.localStorageKey,
		            theme = opts.theme,
		            callbacks = opts.callbacks,
		            resize = throttle(reflow, 10),
		            visible = false,
		            dragWidth = 0,
		            dragHeight = 0,
		            dragHelperHeight = 0,
		            slideHeight = 0,
		            slideWidth = 0,
		            alphaWidth = 0,
		            alphaSlideHelperWidth = 0,
		            slideHelperHeight = 0,
		            currentHue = 0,
		            currentSaturation = 0,
		            currentValue = 0,
		            currentAlpha = 1,
		            palette = [],
		            paletteArray = [],
		            paletteLookup = {},
		            selectionPalette = opts.selectionPalette.slice(0),
		            maxSelectionSize = opts.maxSelectionSize,
		            draggingClass = "sp-dragging",
		            shiftMovementDirection = null;
		            
		        var doc = element.ownerDocument,
		            body = doc.body,
		            boundElement = $(element),
		            disabled = false,
		            container = $(markup, doc).addClass(theme),
		            pickerContainer = container.find(".sp-picker-container"),
		            dragger = container.find(".sp-color"),
		            dragHelper = container.find(".sp-dragger"),
		            slider = container.find(".sp-hue"),
		            slideHelper = container.find(".sp-slider"),
		            alphaSliderInner = container.find(".sp-alpha-inner"),
		            alphaSlider = container.find(".sp-alpha"),
		            alphaSlideHelper = container.find(".sp-alpha-handle"),
		            textInput = container.find(".sp-input"),
		            paletteContainer = container.find(".sp-palette"),
		            initialColorContainer = container.find(".sp-initial"),
		            cancelButton = container.find(".sp-cancel"),
		            clearButton = container.find(".sp-clear"),
		            chooseButton = container.find(".sp-choose"),
		            toggleButton = container.find(".sp-palette-toggle"),
		            isInput = boundElement.is("input"),
		            isInputTypeColor = isInput && inputTypeColorSupport && boundElement.attr("type") === "color",
		            shouldReplace = isInput && !flat,
		            replacer = (shouldReplace) ? $(replaceInput).addClass(theme).addClass(opts.className).addClass(opts.replacerClassName).attr("title",opts.title) : $([]),
		            offsetElement = (shouldReplace) ? replacer : boundElement,
		            previewElement = replacer.find(".sp-preview-inner"),
		            initialColor = opts.color || (isInput && boundElement.val()),
		            colorOnShow = false,
		            preferredFormat = opts.preferredFormat,
		            currentPreferredFormat = preferredFormat,
		            clickoutFiresChange = !opts.showButtons || opts.clickoutFiresChange,
		            isEmpty = !initialColor,
		            allowEmpty = opts.allowEmpty && !isInputTypeColor;
		        function applyOptions() {

		            if (opts.showPaletteOnly) {
		                opts.showPalette = true;
		            }

		            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);

		            if (opts.palette) {
		                palette = opts.palette.slice(0);
		                paletteArray = $.isArray(palette[0]) ? palette : [palette];
		                paletteLookup = {};
		                for (var i = 0; i < paletteArray.length; i++) {
		                    for (var j = 0; j < paletteArray[i].length; j++) {
		                        var rgb = tinycolor(paletteArray[i][j]).toRgbString();
		                        paletteLookup[rgb] = true;
		                    }
		                }
		            }

		            container.toggleClass("sp-flat", flat);
		            container.toggleClass("sp-input-disabled", !opts.showInput);
		            container.toggleClass("sp-alpha-enabled", opts.showAlpha);
		            container.toggleClass("sp-clear-enabled", allowEmpty);
		            container.toggleClass("sp-buttons-disabled", !opts.showButtons);
		            container.toggleClass("sp-palette-buttons-disabled", !opts.togglePaletteOnly);
		            container.toggleClass("sp-palette-disabled", !opts.showPalette);
		            container.toggleClass("sp-palette-only", opts.showPaletteOnly);
		            container.toggleClass("sp-initial-disabled", !opts.showInitial);
		            container.addClass(opts.className).addClass(opts.containerClassName);

		            reflow();
		        }

		        function initialize() {

		            if (IE) {
		                container.find("*:not(input)").attr("unselectable", "on");
		            }

		            applyOptions();

		            if (shouldReplace) {
		                boundElement.after(replacer).hide();
		            }

		            if (!allowEmpty) {
		                clearButton.hide();
		            }

		            if (flat) {
		                boundElement.after(container).hide();
		            }
		            else {

		                var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
		                if (appendTo.length !== 1) {
		                    appendTo = $("body");
		                }

		                appendTo.append(container);
		            }

		            updateSelectionPaletteFromStorage();

		            offsetElement.bind("click.spectrum touchstart.spectrum", function (e) {
		                if (!disabled) {
		                    toggle();
		                }

		                e.stopPropagation();

		                if (!$(e.target).is("input")) {
		                    e.preventDefault();
		                }
		            });

		            if(boundElement.is(":disabled") || (opts.disabled === true)) {
		                disable();
		            }

		            // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
		            container.click(stopPropagation);

		            // Handle user typed input
		            textInput.change(setFromTextInput);
		            textInput.bind("paste", function () {
		                setTimeout(setFromTextInput, 1);
		            });
		            textInput.keydown(function (e) { if (e.keyCode == 13) { setFromTextInput(); } });

		            cancelButton.text(opts.cancelText);
		            cancelButton.bind("click.spectrum", function (e) {
		                e.stopPropagation();
		                e.preventDefault();
		                revert();
		                hide();
		            });

		            clearButton.attr("title", opts.clearText);
		            clearButton.bind("click.spectrum", function (e) {
		                e.stopPropagation();
		                e.preventDefault();
		                isEmpty = true;
		                move();

		                if(flat) {
		                    //for the flat style, this is a change event
		                    updateOriginalInput(true);
		                }
		            });

		            chooseButton.text(opts.chooseText);
		            chooseButton.bind("click.spectrum", function (e) {
		                e.stopPropagation();
		                e.preventDefault();

		                if (isValid()) {
		                    updateOriginalInput(true);
		                    hide();
		                }
		            });

		            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);
		            toggleButton.bind("click.spectrum", function (e) {
		                e.stopPropagation();
		                e.preventDefault();

		                opts.showPaletteOnly = !opts.showPaletteOnly;

		                // To make sure the Picker area is drawn on the right, next to the
		                // Palette area (and not below the palette), first move the Palette
		                // to the left to make space for the picker, plus 5px extra.
		                // The 'applyOptions' function puts the whole container back into place
		                // and takes care of the button-text and the sp-palette-only CSS class.
		                if (!opts.showPaletteOnly && !flat) {
		                    container.css('left', '-=' + (pickerContainer.outerWidth(true) + 5));
		                }
		                applyOptions();
		            });

		            draggable(alphaSlider, function (dragX, dragY, e) {
		                currentAlpha = (dragX / alphaWidth);
		                isEmpty = false;
		                if (e.shiftKey) {
		                    currentAlpha = Math.round(currentAlpha * 10) / 10;
		                }

		                move();
		            }, dragStart, dragStop);

		            draggable(slider, function (dragX, dragY) {
		                currentHue = parseFloat(dragY / slideHeight);
		                isEmpty = false;
		                if (!opts.showAlpha) {
		                    currentAlpha = 1;
		                }
		                move();
		            }, dragStart, dragStop);

		            draggable(dragger, function (dragX, dragY, e) {

		                // shift+drag should snap the movement to either the x or y axis.
		                if (!e.shiftKey) {
		                    shiftMovementDirection = null;
		                }
		                else if (!shiftMovementDirection) {
		                    var oldDragX = currentSaturation * dragWidth;
		                    var oldDragY = dragHeight - (currentValue * dragHeight);
		                    var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);

		                    shiftMovementDirection = furtherFromX ? "x" : "y";
		                }

		                var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
		                var setValue = !shiftMovementDirection || shiftMovementDirection === "y";

		                if (setSaturation) {
		                    currentSaturation = parseFloat(dragX / dragWidth);
		                }
		                if (setValue) {
		                    currentValue = parseFloat((dragHeight - dragY) / dragHeight);
		                }

		                isEmpty = false;
		                if (!opts.showAlpha) {
		                    currentAlpha = 1;
		                }

		                move();

		            }, dragStart, dragStop);

		            if (!!initialColor) {
		                set(initialColor);

		                // In case color was black - update the preview UI and set the format
		                // since the set function will not run (default color is black).
		                updateUI();
		                currentPreferredFormat = preferredFormat || tinycolor(initialColor).format;

		                addColorToSelectionPalette(initialColor);
		            }
		            else {
		                updateUI();
		            }

		            if (flat) {
		                show();
		            }

		            function paletteElementClick(e) {
		                if (e.data && e.data.ignore) {
		                    set($(e.target).closest(".sp-thumb-el").data("color"));
		                    move();
		                }
		                else {
		                    set($(e.target).closest(".sp-thumb-el").data("color"));
		                    move();
		                    updateOriginalInput(true);
		                    if (opts.hideAfterPaletteSelect) {
		                      hide();
		                    }
		                }

		                return false;
		            }

		            var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
		            paletteContainer.delegate(".sp-thumb-el", paletteEvent, paletteElementClick);
		            initialColorContainer.delegate(".sp-thumb-el:nth-child(1)", paletteEvent, { ignore: true }, paletteElementClick);
		        }

		        function updateSelectionPaletteFromStorage() {

		            if (localStorageKey && window.localStorage) {

		                // Migrate old palettes over to new format.  May want to remove this eventually.
		                try {
		                    var oldPalette = window.localStorage[localStorageKey].split(",#");
		                    if (oldPalette.length > 1) {
		                        delete window.localStorage[localStorageKey];
		                        $.each(oldPalette, function(i, c) {
		                             addColorToSelectionPalette(c);
		                        });
		                    }
		                }
		                catch(e) { }

		                try {
		                    selectionPalette = window.localStorage[localStorageKey].split(";");
		                }
		                catch (e) { }
		            }
		        }

		        function addColorToSelectionPalette(color) {
		            if (showSelectionPalette) {
		                var rgb = tinycolor(color).toRgbString();
		                if (!paletteLookup[rgb] && $.inArray(rgb, selectionPalette) === -1) {
		                    selectionPalette.push(rgb);
		                    while(selectionPalette.length > maxSelectionSize) {
		                        selectionPalette.shift();
		                    }
		                }

		                if (localStorageKey && window.localStorage) {
		                    try {
		                        window.localStorage[localStorageKey] = selectionPalette.join(";");
		                    }
		                    catch(e) { }
		                }
		            }
		        }

		        function getUniqueSelectionPalette() {
		            var unique = [];
		            if (opts.showPalette) {
		                for (var i = 0; i < selectionPalette.length; i++) {
		                    var rgb = tinycolor(selectionPalette[i]).toRgbString();

		                    if (!paletteLookup[rgb]) {
		                        unique.push(selectionPalette[i]);
		                    }
		                }
		            }

		            return unique.reverse().slice(0, opts.maxSelectionSize);
		        }

		        function drawPalette() {

		            var currentColor = get();

		            var html = $.map(paletteArray, function (palette, i) {
		                return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i, opts);
		            });

		            updateSelectionPaletteFromStorage();

		            if (selectionPalette) {
		                html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection", opts));
		            }

		            paletteContainer.html(html.join(""));
		        }

		        function drawInitial() {
		            if (opts.showInitial) {
		                var initial = colorOnShow;
		                var current = get();
		                initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial", opts));
		            }
		        }

		        function dragStart() {
		            if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
		                reflow();
		            }
		            container.addClass(draggingClass);
		            shiftMovementDirection = null;
		            boundElement.trigger('dragstart.spectrum', [ get() ]);
		        }

		        function dragStop() {
		            container.removeClass(draggingClass);
		            boundElement.trigger('dragstop.spectrum', [ get() ]);
		        }

		        function setFromTextInput() {

		            var value = textInput.val();

		            if ((value === null || value === "") && allowEmpty) {
		                set(null);
		                updateOriginalInput(true);
		            }
		            else {
		                var tiny = tinycolor(value);
		                if (tiny.isValid()) {
		                    set(tiny);
		                    updateOriginalInput(true);
		                }
		                else {
		                    textInput.addClass("sp-validation-error");
		                }
		            }
		        }

		        function toggle() {
		            if (visible) {
		                hide();
		            }
		            else {
		                show();
		            }
		        }

		        function show() {
		            var event = $.Event('beforeShow.spectrum');

		            if (visible) {
		                reflow();
		                return;
		            }

		            boundElement.trigger(event, [ get() ]);

		            if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
		                return;
		            }

		            hideAll();
		            visible = true;

		            $(doc).bind("click.spectrum", clickout);
		            $(window).bind("resize.spectrum", resize);
		            replacer.addClass("sp-active");
		            container.removeClass("sp-hidden");

		            reflow();
		            updateUI();

		            colorOnShow = get();

		            drawInitial();
		            callbacks.show(colorOnShow);
		            boundElement.trigger('show.spectrum', [ colorOnShow ]);
		        }

		        function clickout(e) {
		            // Return on right click.
		            if (e.button == 2) { return; }

		            if (clickoutFiresChange) {
		                updateOriginalInput(true);
		            }
		            else {
		                revert();
		            }
		            hide();
		        }

		        function hide() {
		            // Return if hiding is unnecessary
		            if (!visible || flat) { return; }
		            visible = false;

		            $(doc).unbind("click.spectrum", clickout);
		            $(window).unbind("resize.spectrum", resize);

		            replacer.removeClass("sp-active");
		            container.addClass("sp-hidden");

		            callbacks.hide(get());
		            boundElement.trigger('hide.spectrum', [ get() ]);
		        }

		        function revert() {
		            set(colorOnShow, true);
		        }

		        function set(color, ignoreFormatChange) {
		            if (tinycolor.equals(color, get())) {
		                // Update UI just in case a validation error needs
		                // to be cleared.
		                updateUI();
		                return;
		            }

		            var newColor, newHsv;
		            if (!color && allowEmpty) {
		                isEmpty = true;
		            } else {
		                isEmpty = false;
		                newColor = tinycolor(color);
		                newHsv = newColor.toHsv();

		                currentHue = (newHsv.h % 360) / 360;
		                currentSaturation = newHsv.s;
		                currentValue = newHsv.v;
		                currentAlpha = newHsv.a;
		            }
		            updateUI();

		            if (newColor && newColor.isValid() && !ignoreFormatChange) {
		                currentPreferredFormat = preferredFormat || newColor.getFormat();
		            }
		        }

		        function get(opts) {
		            opts = opts || { };

		            if (allowEmpty && isEmpty) {
		                return null;
		            }

		            return tinycolor.fromRatio({
		                h: currentHue,
		                s: currentSaturation,
		                v: currentValue,
		                a: Math.round(currentAlpha * 100) / 100
		            }, { format: opts.format || currentPreferredFormat });
		        }

		        function isValid() {
		            return !textInput.hasClass("sp-validation-error");
		        }

		        function move() {
		            updateUI();

		            callbacks.move(get());
		            boundElement.trigger('move.spectrum', [ get() ]);
		        }

		        function updateUI() {

		            textInput.removeClass("sp-validation-error");

		            updateHelperLocations();

		            // Update dragger background color (gradients take care of saturation and value).
		            var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
		            dragger.css("background-color", flatColor.toHexString());

		            // Get a format that alpha will be included in (hex and names ignore alpha)
		            var format = currentPreferredFormat;
		            if (currentAlpha < 1 && !(currentAlpha === 0 && format === "name")) {
		                if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
		                    format = "rgb";
		                }
		            }

		            var realColor = get({ format: format }),
		                displayColor = '';

		            var parentpreviewElem=previewElement.parent();
		            
		             //reset background info for preview element
		            previewElement.removeClass("sp-clear-display");
		            if(parentpreviewElem.hasClass('tool-color')){
		            	previewElement.css('background-color', 'black');
		            }else if(parentpreviewElem.hasClass('tool-strokecolor')){
		            	previewElement.css('border', '3px solid black');
		            }else{
		            	previewElement.css('color', 'black');
		            }
		            
		            if (!realColor && allowEmpty) {
		                // Update the replaced elements background with icon indicating no color selection
		                previewElement.addClass("sp-clear-display");
		            }
		            else {
		                var realHex = realColor.toHexString(),
		                    realRgb = realColor.toRgbString();

		                // Update the replaced elements background color (with actual selected color)
		                if (rgbaSupport || realColor.alpha === 1) {
		                    if(parentpreviewElem.hasClass('tool-color')){
						            	previewElement.css('background-color', realRgb);
						            }else if(parentpreviewElem.hasClass('tool-strokecolor')){
						            	previewElement.css('border', '3px solid '+realRgb);
						            }else{
						            	previewElement.css('color', realRgb);
						            }
		                }
		                else {
		                    if(parentpreviewElem.hasClass('tool-color')){
						            	previewElement.css('background-color', 'black');
						            }else if(parentpreviewElem.hasClass('tool-strokecolor')){
						            	previewElement.css('border', '3px solid black');
						            }else{
						            	previewElement.css('color', 'black');
						            }
		                    previewElement.css("filter", realColor.toFilter());
		                }

		                if (opts.showAlpha) {
		                    var rgb = realColor.toRgb();
		                    rgb.a = 0;
		                    var realAlpha = tinycolor(rgb).toRgbString();
		                    var gradient = "linear-gradient(left, " + realAlpha + ", " + realHex + ")";

		                    if (IE) {
		                        alphaSliderInner.css("filter", tinycolor(realAlpha).toFilter({ gradientType: 1 }, realHex));
		                    }
		                    else {
		                        alphaSliderInner.css("background", "-webkit-" + gradient);
		                        alphaSliderInner.css("background", "-moz-" + gradient);
		                        alphaSliderInner.css("background", "-ms-" + gradient);
		                        // Use current syntax gradient on unprefixed property.
		                        alphaSliderInner.css("background",
		                            "linear-gradient(to right, " + realAlpha + ", " + realHex + ")");
		                    }
		                }

		                displayColor = realColor.toString(format);
		            }

		            // Update the text entry input as it changes happen
		            if (opts.showInput) {
		                textInput.val(displayColor);
		            }

		            if (opts.showPalette) {
		                drawPalette();
		            }

		            drawInitial();
		        }

		        function updateHelperLocations() {
		            var s = currentSaturation;
		            var v = currentValue;

		            if(allowEmpty && isEmpty) {
		                //if selected color is empty, hide the helpers
		                alphaSlideHelper.hide();
		                slideHelper.hide();
		                dragHelper.hide();
		            }
		            else {
		                //make sure helpers are visible
		                alphaSlideHelper.show();
		                slideHelper.show();
		                dragHelper.show();

		                // Where to show the little circle in that displays your current selected color
		                var dragX = s * dragWidth;
		                var dragY = dragHeight - (v * dragHeight);
		                dragX = Math.max(
		                    -dragHelperHeight,
		                    Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
		                );
		                dragY = Math.max(
		                    -dragHelperHeight,
		                    Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
		                );
		                dragHelper.css({
		                    "top": dragY + "px",
		                    "left": dragX + "px"
		                });

		                var alphaX = currentAlpha * alphaWidth;
		                alphaSlideHelper.css({
		                    "left": (alphaX - (alphaSlideHelperWidth / 2)) + "px"
		                });

		                // Where to show the bar that displays your current selected hue
		                var slideY = (currentHue) * slideHeight;
		                slideHelper.css({
		                    "top": (slideY - slideHelperHeight) + "px"
		                });
		            }
		        }

		        function updateOriginalInput(fireCallback) {
		            var color = get(),
		                displayColor = '',
		                hasChanged = !tinycolor.equals(color, colorOnShow);

		            if (color) {
		                displayColor = color.toString(currentPreferredFormat);
		                // Update the selection palette with the current color
		                addColorToSelectionPalette(color);
		            }

		            if (isInput) {
		                boundElement.val(displayColor);
		            }

		            if (fireCallback && hasChanged) {
		                callbacks.change(color);
		                boundElement.trigger('change', [ color ]);
		            }
		        }

		        function reflow() {
		            dragWidth = dragger.width();
		            dragHeight = dragger.height();
		            dragHelperHeight = dragHelper.height();
		            slideWidth = slider.width();
		            slideHeight = slider.height();
		            slideHelperHeight = slideHelper.height();
		            alphaWidth = alphaSlider.width();
		            alphaSlideHelperWidth = alphaSlideHelper.width();

		            if (!flat) {
		                container.css("position", "absolute");
		                if (opts.offset) {
		                    container.offset(opts.offset);
		                } else {
		                    container.offset(getOffset(container, offsetElement));
		                }
		            }

		            updateHelperLocations();

		            if (opts.showPalette) {
		                drawPalette();
		            }

		            boundElement.trigger('reflow.spectrum');
		        }

		        function destroy() {
		            boundElement.show();
		            offsetElement.unbind("click.spectrum touchstart.spectrum");
		            container.remove();
		            replacer.remove();
		            spectrums[spect.id] = null;
		        }

		        function option(optionName, optionValue) {
		            if (optionName === undefined) {
		                return $.extend({}, opts);
		            }
		            if (optionValue === undefined) {
		                return opts[optionName];
		            }

		            opts[optionName] = optionValue;
		            applyOptions();
		        }

		        function enable() {
		            disabled = false;
		            boundElement.attr("disabled", false);
		            offsetElement.removeClass("sp-disabled");
		        }

		        function disable() {
		            hide();
		            disabled = true;
		            boundElement.attr("disabled", true);
		            offsetElement.addClass("sp-disabled");
		        }

		        function setOffset(coord) {
		            opts.offset = coord;
		            reflow();
		        }

		        initialize();

		        var spect = {
		            show: show,
		            hide: hide,
		            toggle: toggle,
		            reflow: reflow,
		            option: option,
		            enable: enable,
		            disable: disable,
		            offset: setOffset,
		            set: function (c) {
		                set(c);
		                updateOriginalInput();
		            },
		            get: get,
		            destroy: destroy,
		            container: container
		        };

		        spect.id = spectrums.push(spect) - 1;

		        return spect;
		    }

		    /**
		    * checkOffset - get the offset below/above and left/right element depending on screen position
		    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
		    */
		    function getOffset(picker, input) {
		        var extraY = 0;
		        var dpWidth = picker.outerWidth();
		        var dpHeight = picker.outerHeight();
		        var inputHeight = input.outerHeight();
		        var doc = picker[0].ownerDocument;
		        var docElem = doc.documentElement;
		        var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
		        var viewHeight = docElem.clientHeight + $(doc).scrollTop();
		        var offset = input.offset();
		        offset.top += inputHeight;

		        offset.left -=
		            Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
		            Math.abs(offset.left + dpWidth - viewWidth) : 0);

		        offset.top -=
		            Math.min(offset.top, ((offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
		            Math.abs(dpHeight + inputHeight - extraY) : extraY));

		        return offset;
		    }

		    /**
		    * noop - do nothing
		    */
		    function noop() {

		    }

		    /**
		    * stopPropagation - makes the code only doing this a little easier to read in line
		    */
		    function stopPropagation(e) {
		        e.stopPropagation();
		    }

		    /**
		    * Create a function bound to a given object
		    * Thanks to underscore.js
		    */
		    function bind(func, obj) {
		        var slice = Array.prototype.slice;
		        var args = slice.call(arguments, 2);
		        return function () {
		            return func.apply(obj, args.concat(slice.call(arguments)));
		        };
		    }

		    /**
		    * Lightweight drag helper.  Handles containment within the element, so that
		    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
		    */
		    function draggable(element, onmove, onstart, onstop) {
		        onmove = onmove || function () { };
		        onstart = onstart || function () { };
		        onstop = onstop || function () { };
		        var doc = document;
		        var dragging = false;
		        var offset = {};
		        var maxHeight = 0;
		        var maxWidth = 0;
		        var hasTouch = ('ontouchstart' in window);

		        var duringDragEvents = {};
		        duringDragEvents["selectstart"] = prevent;
		        duringDragEvents["dragstart"] = prevent;
		        duringDragEvents["touchmove mousemove"] = move;
		        duringDragEvents["touchend mouseup"] = stop;

		        function prevent(e) {
		            if (e.stopPropagation) {
		                e.stopPropagation();
		            }
		            if (e.preventDefault) {
		                e.preventDefault();
		            }
		            e.returnValue = false;
		        }

		        function move(e) {
		            if (dragging) {
		                // Mouseup happened outside of window
		                if (IE && doc.documentMode < 9 && !e.button) {
		                    return stop();
		                }

		                var touches = e.originalEvent && e.originalEvent.touches;
		                var pageX = touches ? touches[0].pageX : e.pageX;
		                var pageY = touches ? touches[0].pageY : e.pageY;

		                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
		                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

		                if (hasTouch) {
		                    // Stop scrolling in iOS
		                    prevent(e);
		                }

		                onmove.apply(element, [dragX, dragY, e]);
		            }
		        }

		        function start(e) {
		            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);

		            if (!rightclick && !dragging) {
		                if (onstart.apply(element, arguments) !== false) {
		                    dragging = true;
		                    maxHeight = $(element).height();
		                    maxWidth = $(element).width();
		                    offset = $(element).offset();

		                    $(doc).bind(duringDragEvents);
		                    $(doc.body).addClass("sp-dragging");

		                    if (!hasTouch) {
		                        move(e);
		                    }

		                    prevent(e);
		                }
		            }
		        }

		        function stop() {
		            if (dragging) {
		                $(doc).unbind(duringDragEvents);
		                $(doc.body).removeClass("sp-dragging");
		                onstop.apply(element, arguments);
		            }
		            dragging = false;
		        }

		        $(element).bind("touchstart mousedown", start);
		    }

		    function throttle(func, wait, debounce) {
		        var timeout;
		        return function () {
		            var context = this, args = arguments;
		            var throttler = function () {
		                timeout = null;
		                func.apply(context, args);
		            };
		            if (debounce) clearTimeout(timeout);
		            if (debounce || !timeout) timeout = setTimeout(throttler, wait);
		        };
		    }

		    /**
		    * Define a jQuery plugin
		    */
		    var dataID = "spectrum.id";
		    $.fn.spectrum = function (opts, extra) {

		        if (typeof opts == "string") {

		            var returnValue = this;
		            var args = Array.prototype.slice.call( arguments, 1 );

		            this.each(function () {
		                var spect = spectrums[$(this).data(dataID)];
		                if (spect) {
		                    var method = spect[opts];
		                    if (!method) {
		                        throw new Error( "Spectrum: no such method: '" + opts + "'" );
		                    }

		                    if (opts == "get") {
		                        returnValue = spect.get();
		                    }
		                    else if (opts == "container") {
		                        returnValue = spect.container;
		                    }
		                    else if (opts == "option") {
		                        returnValue = spect.option.apply(spect, args);
		                    }
		                    else if (opts == "destroy") {
		                        spect.destroy();
		                        $(this).removeData(dataID);
		                    }
		                    else {
		                        method.apply(spect, args);
		                    }
		                }
		            });

		            return returnValue;
		        }

		        // Initializing a new instance of spectrum
		        return this.spectrum("destroy").each(function () {
		            var options = $.extend({}, opts, $(this).data());
		            var spect = spectrum(this, options);
		            $(this).data(dataID, spect.id);
		        });
		    };

		    $.fn.spectrum.load = true;
		    $.fn.spectrum.loadOpts = {};
		    $.fn.spectrum.draggable = draggable;
		    $.fn.spectrum.defaults = defaultOpts;

		    $.spectrum = { };
		    $.spectrum.localization = { };
		    $.spectrum.palettes = { };

		    $.fn.spectrum.processNativeColorInputs = function () {
		        if (!inputTypeColorSupport) {
		            $("input[type=color]").spectrum({
		                preferredFormat: "hex6"
		            });
		        }
		    };

		    // TinyColor v1.1.1
		    // https://github.com/bgrins/TinyColor
		    // Brian Grinstead, MIT License

		    (function() {

		    var trimLeft = /^[\s,#]+/,
		        trimRight = /\s+$/,
		        tinyCounter = 0,
		        math = Math,
		        mathRound = math.round,
		        mathMin = math.min,
		        mathMax = math.max,
		        mathRandom = math.random;

		    var tinycolor = function tinycolor (color, opts) {

		        color = (color) ? color : '';
		        opts = opts || { };

		        // If input is already a tinycolor, return itself
		        if (color instanceof tinycolor) {
		           return color;
		        }
		        // If we are called as a function, call using new instead
		        if (!(this instanceof tinycolor)) {
		            return new tinycolor(color, opts);
		        }

		        var rgb = inputToRGB(color);
		        this._originalInput = color,
		        this._r = rgb.r,
		        this._g = rgb.g,
		        this._b = rgb.b,
		        this._a = rgb.a,
		        this._roundA = mathRound(100*this._a) / 100,
		        this._format = opts.format || rgb.format;
		        this._gradientType = opts.gradientType;

		        // Don't let the range of [0,255] come back in [0,1].
		        // Potentially lose a little bit of precision here, but will fix issues where
		        // .5 gets interpreted as half of the total, instead of half of 1
		        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
		        if (this._r < 1) { this._r = mathRound(this._r); }
		        if (this._g < 1) { this._g = mathRound(this._g); }
		        if (this._b < 1) { this._b = mathRound(this._b); }

		        this._ok = rgb.ok;
		        this._tc_id = tinyCounter++;
		    };

		    tinycolor.prototype = {
		        isDark: function() {
		            return this.getBrightness() < 128;
		        },
		        isLight: function() {
		            return !this.isDark();
		        },
		        isValid: function() {
		            return this._ok;
		        },
		        getOriginalInput: function() {
		          return this._originalInput;
		        },
		        getFormat: function() {
		            return this._format;
		        },
		        getAlpha: function() {
		            return this._a;
		        },
		        getBrightness: function() {
		            var rgb = this.toRgb();
		            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
		        },
		        setAlpha: function(value) {
		            this._a = boundAlpha(value);
		            this._roundA = mathRound(100*this._a) / 100;
		            return this;
		        },
		        toHsv: function() {
		            var hsv = rgbToHsv(this._r, this._g, this._b);
		            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
		        },
		        toHsvString: function() {
		            var hsv = rgbToHsv(this._r, this._g, this._b);
		            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
		            return (this._a == 1) ?
		              "hsv("  + h + ", " + s + "%, " + v + "%)" :
		              "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
		        },
		        toHsl: function() {
		            var hsl = rgbToHsl(this._r, this._g, this._b);
		            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
		        },
		        toHslString: function() {
		            var hsl = rgbToHsl(this._r, this._g, this._b);
		            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
		            return (this._a == 1) ?
		              "hsl("  + h + ", " + s + "%, " + l + "%)" :
		              "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
		        },
		        toHex: function(allow3Char) {
		            return rgbToHex(this._r, this._g, this._b, allow3Char);
		        },
		        toHexString: function(allow3Char) {
		            return '#' + this.toHex(allow3Char);
		        },
		        toHex8: function() {
		            return rgbaToHex(this._r, this._g, this._b, this._a);
		        },
		        toHex8String: function() {
		            return '#' + this.toHex8();
		        },
		        toRgb: function() {
		            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
		        },
		        toRgbString: function() {
		            return (this._a == 1) ?
		              "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
		              "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
		        },
		        toPercentageRgb: function() {
		            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
		        },
		        toPercentageRgbString: function() {
		            return (this._a == 1) ?
		              "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
		              "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
		        },
		        toName: function() {
		            if (this._a === 0) {
		                return "transparent";
		            }

		            if (this._a < 1) {
		                return false;
		            }

		            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
		        },
		        toFilter: function(secondColor) {
		            var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
		            var secondHex8String = hex8String;
		            var gradientType = this._gradientType ? "GradientType = 1, " : "";

		            if (secondColor) {
		                var s = tinycolor(secondColor);
		                secondHex8String = s.toHex8String();
		            }

		            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
		        },
		        toString: function(format) {
		            var formatSet = !!format;
		            format = format || this._format;

		            var formattedString = false;
		            var hasAlpha = this._a < 1 && this._a >= 0;
		            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

		            if (needsAlphaFormat) {
		                // Special case for "transparent", all other non-alpha formats
		                // will return rgba when there is transparency.
		                if (format === "name" && this._a === 0) {
		                    return this.toName();
		                }
		                return this.toRgbString();
		            }
		            if (format === "rgb") {
		                formattedString = this.toRgbString();
		            }
		            if (format === "prgb") {
		                formattedString = this.toPercentageRgbString();
		            }
		            if (format === "hex" || format === "hex6") {
		                formattedString = this.toHexString();
		            }
		            if (format === "hex3") {
		                formattedString = this.toHexString(true);
		            }
		            if (format === "hex8") {
		                formattedString = this.toHex8String();
		            }
		            if (format === "name") {
		                formattedString = this.toName();
		            }
		            if (format === "hsl") {
		                formattedString = this.toHslString();
		            }
		            if (format === "hsv") {
		                formattedString = this.toHsvString();
		            }

		            return formattedString || this.toHexString();
		        },

		        _applyModification: function(fn, args) {
		            var color = fn.apply(null, [this].concat([].slice.call(args)));
		            this._r = color._r;
		            this._g = color._g;
		            this._b = color._b;
		            this.setAlpha(color._a);
		            return this;
		        },
		        lighten: function() {
		            return this._applyModification(lighten, arguments);
		        },
		        brighten: function() {
		            return this._applyModification(brighten, arguments);
		        },
		        darken: function() {
		            return this._applyModification(darken, arguments);
		        },
		        desaturate: function() {
		            return this._applyModification(desaturate, arguments);
		        },
		        saturate: function() {
		            return this._applyModification(saturate, arguments);
		        },
		        greyscale: function() {
		            return this._applyModification(greyscale, arguments);
		        },
		        spin: function() {
		            return this._applyModification(spin, arguments);
		        },

		        _applyCombination: function(fn, args) {
		            return fn.apply(null, [this].concat([].slice.call(args)));
		        },
		        analogous: function() {
		            return this._applyCombination(analogous, arguments);
		        },
		        complement: function() {
		            return this._applyCombination(complement, arguments);
		        },
		        monochromatic: function() {
		            return this._applyCombination(monochromatic, arguments);
		        },
		        splitcomplement: function() {
		            return this._applyCombination(splitcomplement, arguments);
		        },
		        triad: function() {
		            return this._applyCombination(triad, arguments);
		        },
		        tetrad: function() {
		            return this._applyCombination(tetrad, arguments);
		        }
		    };

		    // If input is an object, force 1 into "1.0" to handle ratios properly
		    // String input requires "1.0" as input, so 1 will be treated as 1
		    tinycolor.fromRatio = function(color, opts) {
		        if (typeof color == "object") {
		            var newColor = {};
		            for (var i in color) {
		                if (color.hasOwnProperty(i)) {
		                    if (i === "a") {
		                        newColor[i] = color[i];
		                    }
		                    else {
		                        newColor[i] = convertToPercentage(color[i]);
		                    }
		                }
		            }
		            color = newColor;
		        }

		        return tinycolor(color, opts);
		    };

		    // Given a string or object, convert that input to RGB
		    // Possible string inputs:
		    //
		    //     "red"
		    //     "#f00" or "f00"
		    //     "#ff0000" or "ff0000"
		    //     "#ff000000" or "ff000000"
		    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
		    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
		    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
		    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
		    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
		    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
		    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
		    //
		    function inputToRGB(color) {

		        var rgb = { r: 0, g: 0, b: 0 };
		        var a = 1;
		        var ok = false;
		        var format = false;

		        if (typeof color == "string") {
		            color = stringInputToObject(color);
		        }

		        if (typeof color == "object") {
		            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
		                rgb = rgbToRgb(color.r, color.g, color.b);
		                ok = true;
		                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
		            }
		            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
		                color.s = convertToPercentage(color.s);
		                color.v = convertToPercentage(color.v);
		                rgb = hsvToRgb(color.h, color.s, color.v);
		                ok = true;
		                format = "hsv";
		            }
		            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
		                color.s = convertToPercentage(color.s);
		                color.l = convertToPercentage(color.l);
		                rgb = hslToRgb(color.h, color.s, color.l);
		                ok = true;
		                format = "hsl";
		            }

		            if (color.hasOwnProperty("a")) {
		                a = color.a;
		            }
		        }

		        a = boundAlpha(a);

		        return {
		            ok: ok,
		            format: color.format || format,
		            r: mathMin(255, mathMax(rgb.r, 0)),
		            g: mathMin(255, mathMax(rgb.g, 0)),
		            b: mathMin(255, mathMax(rgb.b, 0)),
		            a: a
		        };
		    }


		    // Conversion Functions
		    // --------------------

		    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
		    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

		    // `rgbToRgb`
		    // Handle bounds / percentage checking to conform to CSS color spec
		    // <http://www.w3.org/TR/css3-color/>
		    // *Assumes:* r, g, b in [0, 255] or [0, 1]
		    // *Returns:* { r, g, b } in [0, 255]
		    function rgbToRgb(r, g, b){
		        return {
		            r: bound01(r, 255) * 255,
		            g: bound01(g, 255) * 255,
		            b: bound01(b, 255) * 255
		        };
		    }

		    // `rgbToHsl`
		    // Converts an RGB color value to HSL.
		    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
		    // *Returns:* { h, s, l } in [0,1]
		    function rgbToHsl(r, g, b) {

		        r = bound01(r, 255);
		        g = bound01(g, 255);
		        b = bound01(b, 255);

		        var max = mathMax(r, g, b), min = mathMin(r, g, b);
		        var h, s, l = (max + min) / 2;

		        if(max == min) {
		            h = s = 0; // achromatic
		        }
		        else {
		            var d = max - min;
		            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		            switch(max) {
		                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
		                case g: h = (b - r) / d + 2; break;
		                case b: h = (r - g) / d + 4; break;
		            }

		            h /= 6;
		        }

		        return { h: h, s: s, l: l };
		    }

		    // `hslToRgb`
		    // Converts an HSL color value to RGB.
		    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
		    // *Returns:* { r, g, b } in the set [0, 255]
		    function hslToRgb(h, s, l) {
		        var r, g, b;

		        h = bound01(h, 360);
		        s = bound01(s, 100);
		        l = bound01(l, 100);

		        function hue2rgb(p, q, t) {
		            if(t < 0) t += 1;
		            if(t > 1) t -= 1;
		            if(t < 1/6) return p + (q - p) * 6 * t;
		            if(t < 1/2) return q;
		            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		            return p;
		        }

		        if(s === 0) {
		            r = g = b = l; // achromatic
		        }
		        else {
		            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		            var p = 2 * l - q;
		            r = hue2rgb(p, q, h + 1/3);
		            g = hue2rgb(p, q, h);
		            b = hue2rgb(p, q, h - 1/3);
		        }

		        return { r: r * 255, g: g * 255, b: b * 255 };
		    }

		    // `rgbToHsv`
		    // Converts an RGB color value to HSV
		    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
		    // *Returns:* { h, s, v } in [0,1]
		    function rgbToHsv(r, g, b) {

		        r = bound01(r, 255);
		        g = bound01(g, 255);
		        b = bound01(b, 255);

		        var max = mathMax(r, g, b), min = mathMin(r, g, b);
		        var h, s, v = max;

		        var d = max - min;
		        s = max === 0 ? 0 : d / max;

		        if(max == min) {
		            h = 0; // achromatic
		        }
		        else {
		            switch(max) {
		                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
		                case g: h = (b - r) / d + 2; break;
		                case b: h = (r - g) / d + 4; break;
		            }
		            h /= 6;
		        }
		        return { h: h, s: s, v: v };
		    }

		    // `hsvToRgb`
		    // Converts an HSV color value to RGB.
		    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
		    // *Returns:* { r, g, b } in the set [0, 255]
		     function hsvToRgb(h, s, v) {

		        h = bound01(h, 360) * 6;
		        s = bound01(s, 100);
		        v = bound01(v, 100);

		        var i = math.floor(h),
		            f = h - i,
		            p = v * (1 - s),
		            q = v * (1 - f * s),
		            t = v * (1 - (1 - f) * s),
		            mod = i % 6,
		            r = [v, q, p, p, t, v][mod],
		            g = [t, v, v, q, p, p][mod],
		            b = [p, p, t, v, v, q][mod];

		        return { r: r * 255, g: g * 255, b: b * 255 };
		    }

		    // `rgbToHex`
		    // Converts an RGB color to hex
		    // Assumes r, g, and b are contained in the set [0, 255]
		    // Returns a 3 or 6 character hex
		    function rgbToHex(r, g, b, allow3Char) {

		        var hex = [
		            pad2(mathRound(r).toString(16)),
		            pad2(mathRound(g).toString(16)),
		            pad2(mathRound(b).toString(16))
		        ];

		        // Return a 3 character hex if possible
		        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
		            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
		        }

		        return hex.join("");
		    }
		        // `rgbaToHex`
		        // Converts an RGBA color plus alpha transparency to hex
		        // Assumes r, g, b and a are contained in the set [0, 255]
		        // Returns an 8 character hex
		        function rgbaToHex(r, g, b, a) {

		            var hex = [
		                pad2(convertDecimalToHex(a)),
		                pad2(mathRound(r).toString(16)),
		                pad2(mathRound(g).toString(16)),
		                pad2(mathRound(b).toString(16))
		            ];

		            return hex.join("");
		        }

		    // `equals`
		    // Can be called with any tinycolor input
		    tinycolor.equals = function (color1, color2) {
		        if (!color1 || !color2) { return false; }
		        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
		    };
		    tinycolor.random = function() {
		        return tinycolor.fromRatio({
		            r: mathRandom(),
		            g: mathRandom(),
		            b: mathRandom()
		        });
		    };


		    // Modification Functions
		    // ----------------------
		    // Thanks to less.js for some of the basics here
		    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

		    function desaturate(color, amount) {
		        amount = (amount === 0) ? 0 : (amount || 10);
		        var hsl = tinycolor(color).toHsl();
		        hsl.s -= amount / 100;
		        hsl.s = clamp01(hsl.s);
		        return tinycolor(hsl);
		    }

		    function saturate(color, amount) {
		        amount = (amount === 0) ? 0 : (amount || 10);
		        var hsl = tinycolor(color).toHsl();
		        hsl.s += amount / 100;
		        hsl.s = clamp01(hsl.s);
		        return tinycolor(hsl);
		    }

		    function greyscale(color) {
		        return tinycolor(color).desaturate(100);
		    }

		    function lighten (color, amount) {
		        amount = (amount === 0) ? 0 : (amount || 10);
		        var hsl = tinycolor(color).toHsl();
		        hsl.l += amount / 100;
		        hsl.l = clamp01(hsl.l);
		        return tinycolor(hsl);
		    }

		    function brighten(color, amount) {
		        amount = (amount === 0) ? 0 : (amount || 10);
		        var rgb = tinycolor(color).toRgb();
		        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
		        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
		        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
		        return tinycolor(rgb);
		    }

		    function darken (color, amount) {
		        amount = (amount === 0) ? 0 : (amount || 10);
		        var hsl = tinycolor(color).toHsl();
		        hsl.l -= amount / 100;
		        hsl.l = clamp01(hsl.l);
		        return tinycolor(hsl);
		    }

		    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
		    // Values outside of this range will be wrapped into this range.
		    function spin(color, amount) {
		        var hsl = tinycolor(color).toHsl();
		        var hue = (mathRound(hsl.h) + amount) % 360;
		        hsl.h = hue < 0 ? 360 + hue : hue;
		        return tinycolor(hsl);
		    }

		    // Combination Functions
		    // ---------------------
		    // Thanks to jQuery xColor for some of the ideas behind these
		    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

		    function complement(color) {
		        var hsl = tinycolor(color).toHsl();
		        hsl.h = (hsl.h + 180) % 360;
		        return tinycolor(hsl);
		    }

		    function triad(color) {
		        var hsl = tinycolor(color).toHsl();
		        var h = hsl.h;
		        return [
		            tinycolor(color),
		            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
		            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
		        ];
		    }

		    function tetrad(color) {
		        var hsl = tinycolor(color).toHsl();
		        var h = hsl.h;
		        return [
		            tinycolor(color),
		            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
		            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
		            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
		        ];
		    }

		    function splitcomplement(color) {
		        var hsl = tinycolor(color).toHsl();
		        var h = hsl.h;
		        return [
		            tinycolor(color),
		            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
		            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
		        ];
		    }

		    function analogous(color, results, slices) {
		        results = results || 6;
		        slices = slices || 30;

		        var hsl = tinycolor(color).toHsl();
		        var part = 360 / slices;
		        var ret = [tinycolor(color)];

		        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
		            hsl.h = (hsl.h + part) % 360;
		            ret.push(tinycolor(hsl));
		        }
		        return ret;
		    }

		    function monochromatic(color, results) {
		        results = results || 6;
		        var hsv = tinycolor(color).toHsv();
		        var h = hsv.h, s = hsv.s, v = hsv.v;
		        var ret = [];
		        var modification = 1 / results;

		        while (results--) {
		            ret.push(tinycolor({ h: h, s: s, v: v}));
		            v = (v + modification) % 1;
		        }

		        return ret;
		    }

		    // Utility Functions
		    // ---------------------

		    tinycolor.mix = function(color1, color2, amount) {
		        amount = (amount === 0) ? 0 : (amount || 50);

		        var rgb1 = tinycolor(color1).toRgb();
		        var rgb2 = tinycolor(color2).toRgb();

		        var p = amount / 100;
		        var w = p * 2 - 1;
		        var a = rgb2.a - rgb1.a;

		        var w1;

		        if (w * a == -1) {
		            w1 = w;
		        } else {
		            w1 = (w + a) / (1 + w * a);
		        }

		        w1 = (w1 + 1) / 2;

		        var w2 = 1 - w1;

		        var rgba = {
		            r: rgb2.r * w1 + rgb1.r * w2,
		            g: rgb2.g * w1 + rgb1.g * w2,
		            b: rgb2.b * w1 + rgb1.b * w2,
		            a: rgb2.a * p  + rgb1.a * (1 - p)
		        };

		        return tinycolor(rgba);
		    };


		    // Readability Functions
		    // ---------------------
		    // <http://www.w3.org/TR/AERT#color-contrast>

		    // `readability`
		    // Analyze the 2 colors and returns an object with the following properties:
		    //    `brightness`: difference in brightness between the two colors
		    //    `color`: difference in color/hue between the two colors
		    tinycolor.readability = function(color1, color2) {
		        var c1 = tinycolor(color1);
		        var c2 = tinycolor(color2);
		        var rgb1 = c1.toRgb();
		        var rgb2 = c2.toRgb();
		        var brightnessA = c1.getBrightness();
		        var brightnessB = c2.getBrightness();
		        var colorDiff = (
		            Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) +
		            Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) +
		            Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b)
		        );

		        return {
		            brightness: Math.abs(brightnessA - brightnessB),
		            color: colorDiff
		        };
		    };

		    // `readable`
		    // http://www.w3.org/TR/AERT#color-contrast
		    // Ensure that foreground and background color combinations provide sufficient contrast.
		    // *Example*
		    //    tinycolor.isReadable("#000", "#111") => false
		    tinycolor.isReadable = function(color1, color2) {
		        var readability = tinycolor.readability(color1, color2);
		        return readability.brightness > 125 && readability.color > 500;
		    };

		    // `mostReadable`
		    // Given a base color and a list of possible foreground or background
		    // colors for that base, returns the most readable color.
		    // *Example*
		    //    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
		    tinycolor.mostReadable = function(baseColor, colorList) {
		        var bestColor = null;
		        var bestScore = 0;
		        var bestIsReadable = false;
		        for (var i=0; i < colorList.length; i++) {

		            // We normalize both around the "acceptable" breaking point,
		            // but rank brightness constrast higher than hue.

		            var readability = tinycolor.readability(baseColor, colorList[i]);
		            var readable = readability.brightness > 125 && readability.color > 500;
		            var score = 3 * (readability.brightness / 125) + (readability.color / 500);

		            if ((readable && ! bestIsReadable) ||
		                (readable && bestIsReadable && score > bestScore) ||
		                ((! readable) && (! bestIsReadable) && score > bestScore)) {
		                bestIsReadable = readable;
		                bestScore = score;
		                bestColor = tinycolor(colorList[i]);
		            }
		        }
		        return bestColor;
		    };


		    // Big List of Colors
		    // ------------------
		    // <http://www.w3.org/TR/css3-color/#svg-color>
		    var names = tinycolor.names = {
		        aliceblue: "f0f8ff",
		        antiquewhite: "faebd7",
		        aqua: "0ff",
		        aquamarine: "7fffd4",
		        azure: "f0ffff",
		        beige: "f5f5dc",
		        bisque: "ffe4c4",
		        black: "000",
		        blanchedalmond: "ffebcd",
		        blue: "00f",
		        blueviolet: "8a2be2",
		        brown: "a52a2a",
		        burlywood: "deb887",
		        burntsienna: "ea7e5d",
		        cadetblue: "5f9ea0",
		        chartreuse: "7fff00",
		        chocolate: "d2691e",
		        coral: "ff7f50",
		        cornflowerblue: "6495ed",
		        cornsilk: "fff8dc",
		        crimson: "dc143c",
		        cyan: "0ff",
		        darkblue: "00008b",
		        darkcyan: "008b8b",
		        darkgoldenrod: "b8860b",
		        darkgray: "a9a9a9",
		        darkgreen: "006400",
		        darkgrey: "a9a9a9",
		        darkkhaki: "bdb76b",
		        darkmagenta: "8b008b",
		        darkolivegreen: "556b2f",
		        darkorange: "ff8c00",
		        darkorchid: "9932cc",
		        darkred: "8b0000",
		        darksalmon: "e9967a",
		        darkseagreen: "8fbc8f",
		        darkslateblue: "483d8b",
		        darkslategray: "2f4f4f",
		        darkslategrey: "2f4f4f",
		        darkturquoise: "00ced1",
		        darkviolet: "9400d3",
		        deeppink: "ff1493",
		        deepskyblue: "00bfff",
		        dimgray: "696969",
		        dimgrey: "696969",
		        dodgerblue: "1e90ff",
		        firebrick: "b22222",
		        floralwhite: "fffaf0",
		        forestgreen: "228b22",
		        fuchsia: "f0f",
		        gainsboro: "dcdcdc",
		        ghostwhite: "f8f8ff",
		        gold: "ffd700",
		        goldenrod: "daa520",
		        gray: "808080",
		        green: "008000",
		        greenyellow: "adff2f",
		        grey: "808080",
		        honeydew: "f0fff0",
		        hotpink: "ff69b4",
		        indianred: "cd5c5c",
		        indigo: "4b0082",
		        ivory: "fffff0",
		        khaki: "f0e68c",
		        lavender: "e6e6fa",
		        lavenderblush: "fff0f5",
		        lawngreen: "7cfc00",
		        lemonchiffon: "fffacd",
		        lightblue: "add8e6",
		        lightcoral: "f08080",
		        lightcyan: "e0ffff",
		        lightgoldenrodyellow: "fafad2",
		        lightgray: "d3d3d3",
		        lightgreen: "90ee90",
		        lightgrey: "d3d3d3",
		        lightpink: "ffb6c1",
		        lightsalmon: "ffa07a",
		        lightseagreen: "20b2aa",
		        lightskyblue: "87cefa",
		        lightslategray: "789",
		        lightslategrey: "789",
		        lightsteelblue: "b0c4de",
		        lightyellow: "ffffe0",
		        lime: "0f0",
		        limegreen: "32cd32",
		        linen: "faf0e6",
		        magenta: "f0f",
		        maroon: "800000",
		        mediumaquamarine: "66cdaa",
		        mediumblue: "0000cd",
		        mediumorchid: "ba55d3",
		        mediumpurple: "9370db",
		        mediumseagreen: "3cb371",
		        mediumslateblue: "7b68ee",
		        mediumspringgreen: "00fa9a",
		        mediumturquoise: "48d1cc",
		        mediumvioletred: "c71585",
		        midnightblue: "191970",
		        mintcream: "f5fffa",
		        mistyrose: "ffe4e1",
		        moccasin: "ffe4b5",
		        navajowhite: "ffdead",
		        navy: "000080",
		        oldlace: "fdf5e6",
		        olive: "808000",
		        olivedrab: "6b8e23",
		        orange: "ffa500",
		        orangered: "ff4500",
		        orchid: "da70d6",
		        palegoldenrod: "eee8aa",
		        palegreen: "98fb98",
		        paleturquoise: "afeeee",
		        palevioletred: "db7093",
		        papayawhip: "ffefd5",
		        peachpuff: "ffdab9",
		        peru: "cd853f",
		        pink: "ffc0cb",
		        plum: "dda0dd",
		        powderblue: "b0e0e6",
		        purple: "800080",
		        rebeccapurple: "663399",
		        red: "f00",
		        rosybrown: "bc8f8f",
		        royalblue: "4169e1",
		        saddlebrown: "8b4513",
		        salmon: "fa8072",
		        sandybrown: "f4a460",
		        seagreen: "2e8b57",
		        seashell: "fff5ee",
		        sienna: "a0522d",
		        silver: "c0c0c0",
		        skyblue: "87ceeb",
		        slateblue: "6a5acd",
		        slategray: "708090",
		        slategrey: "708090",
		        snow: "fffafa",
		        springgreen: "00ff7f",
		        steelblue: "4682b4",
		        tan: "d2b48c",
		        teal: "008080",
		        thistle: "d8bfd8",
		        tomato: "ff6347",
		        turquoise: "40e0d0",
		        violet: "ee82ee",
		        wheat: "f5deb3",
		        white: "fff",
		        whitesmoke: "f5f5f5",
		        yellow: "ff0",
		        yellowgreen: "9acd32"
		    };

		    // Make it easy to access colors via `hexNames[hex]`
		    var hexNames = tinycolor.hexNames = flip(names);


		    // Utilities
		    // ---------

		    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
		    function flip(o) {
		        var flipped = { };
		        for (var i in o) {
		            if (o.hasOwnProperty(i)) {
		                flipped[o[i]] = i;
		            }
		        }
		        return flipped;
		    }

		    // Return a valid alpha value [0,1] with all invalid values being set to 1
		    function boundAlpha(a) {
		        a = parseFloat(a);

		        if (isNaN(a) || a < 0 || a > 1) {
		            a = 1;
		        }

		        return a;
		    }

		    // Take input from [0, n] and return it as [0, 1]
		    function bound01(n, max) {
		        if (isOnePointZero(n)) { n = "100%"; }

		        var processPercent = isPercentage(n);
		        n = mathMin(max, mathMax(0, parseFloat(n)));

		        // Automatically convert percentage into number
		        if (processPercent) {
		            n = parseInt(n * max, 10) / 100;
		        }

		        // Handle floating point rounding errors
		        if ((math.abs(n - max) < 0.000001)) {
		            return 1;
		        }

		        // Convert into [0, 1] range if it isn't already
		        return (n % max) / parseFloat(max);
		    }

		    // Force a number between 0 and 1
		    function clamp01(val) {
		        return mathMin(1, mathMax(0, val));
		    }

		    // Parse a base-16 hex value into a base-10 integer
		    function parseIntFromHex(val) {
		        return parseInt(val, 16);
		    }

		    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
		    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
		    function isOnePointZero(n) {
		        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
		    }

		    // Check to see if string passed in is a percentage
		    function isPercentage(n) {
		        return typeof n === "string" && n.indexOf('%') != -1;
		    }

		    // Force a hex value to have 2 characters
		    function pad2(c) {
		        return c.length == 1 ? '0' + c : '' + c;
		    }

		    // Replace a decimal with it's percentage value
		    function convertToPercentage(n) {
		        if (n <= 1) {
		            n = (n * 100) + "%";
		        }

		        return n;
		    }

		    // Converts a decimal to a hex value
		    function convertDecimalToHex(d) {
		        return Math.round(parseFloat(d) * 255).toString(16);
		    }
		    // Converts a hex value to a decimal
		    function convertHexToDecimal(h) {
		        return (parseIntFromHex(h) / 255);
		    }

		    var matchers = (function() {

		        // <http://www.w3.org/TR/css3-values/#integers>
		        var CSS_INTEGER = "[-\\+]?\\d+%?";

		        // <http://www.w3.org/TR/css3-values/#number-value>
		        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

		        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
		        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

		        // Actual matching.
		        // Parentheses and commas are optional, but not required.
		        // Whitespace can take the place of commas or opening paren
		        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
		        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

		        return {
		            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
		            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
		            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
		            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
		            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
		            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
		            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
		            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
		            hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
		        };
		    })();

		    // `stringInputToObject`
		    // Permissive string parsing.  Take in a number of formats, and output an object
		    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
		    function stringInputToObject(color) {

		        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
		        var named = false;
		        if (names[color]) {
		            color = names[color];
		            named = true;
		        }
		        else if (color == 'transparent') {
		            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
		        }

		        // Try to match string input using regular expressions.
		        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
		        // Just return an object and let the conversion functions handle that.
		        // This way the result will be the same whether the tinycolor is initialized with string or object.
		        var match;
		        if ((match = matchers.rgb.exec(color))) {
		            return { r: match[1], g: match[2], b: match[3] };
		        }
		        if ((match = matchers.rgba.exec(color))) {
		            return { r: match[1], g: match[2], b: match[3], a: match[4] };
		        }
		        if ((match = matchers.hsl.exec(color))) {
		            return { h: match[1], s: match[2], l: match[3] };
		        }
		        if ((match = matchers.hsla.exec(color))) {
		            return { h: match[1], s: match[2], l: match[3], a: match[4] };
		        }
		        if ((match = matchers.hsv.exec(color))) {
		            return { h: match[1], s: match[2], v: match[3] };
		        }
		        if ((match = matchers.hsva.exec(color))) {
		            return { h: match[1], s: match[2], v: match[3], a: match[4] };
		        }
		        if ((match = matchers.hex8.exec(color))) {
		            return {
		                a: convertHexToDecimal(match[1]),
		                r: parseIntFromHex(match[2]),
		                g: parseIntFromHex(match[3]),
		                b: parseIntFromHex(match[4]),
		                format: named ? "name" : "hex8"
		            };
		        }
		        if ((match = matchers.hex6.exec(color))) {
		            return {
		                r: parseIntFromHex(match[1]),
		                g: parseIntFromHex(match[2]),
		                b: parseIntFromHex(match[3]),
		                format: named ? "name" : "hex"
		            };
		        }
		        if ((match = matchers.hex3.exec(color))) {
		            return {
		                r: parseIntFromHex(match[1] + '' + match[1]),
		                g: parseIntFromHex(match[2] + '' + match[2]),
		                b: parseIntFromHex(match[3] + '' + match[3]),
		                format: named ? "name" : "hex"
		            };
		        }

		        return false;
		    }

		    window.tinycolor = tinycolor;
		    })();


		    $(function () {
		        if ($.fn.spectrum.load) {
		            $.fn.spectrum.processNativeColorInputs();
		        }
		    });

		});
		function TiledCanvas (canvas, settings) {
		    this.canvas = canvas;
		    this.ctx = this.canvas.getContext('2d');

		    this.leftTopX = 0;
		    this.leftTopY = 0;
		    this.zoom = 1; // 2 = two times zoomed in

		    this.affecting = [[0, 0], [0, 0]];
		    this.chunks = {};
		    // this.chunks[chunkX][chunkY] is a context or 'empty'

		    this.settings = this.normalizeDefaults(settings, this.defaultSettings);
		    this.contextQueue = [];
		    this.context = this.createContext();
		    this.lastClear = Date.now();
		}

		TiledCanvas.prototype.MIN_INACTIVE_UNLOAD_TIME = 10 * 1000;
		TiledCanvas.prototype.MAX_DRAW_TIME = 1000 / 30;

		TiledCanvas.prototype.defaultSettings = {
		    chunkSize: 1024,                      // The size of the chunks in pixels
		    fadeTime: 500,                       // Fade time for the loading animation
		    maxLoadedChunks: 100,                 // We'll try never loading more than this amount of chunks if possible
			blurOnZoom: true,
			zoomLevelToPixelate: 5
		};

		TiledCanvas.prototype.cloneObject = function (obj) {
			var clone = {};
			for (var k in obj) {
				if (typeof obj[k] === "object" && !(obj[k] instanceof Array)) {
					clone[k] = this.cloneObject(obj[k]);
				} else {
					clone[k] = obj[k]
				}
			}
			return clone;
		};

		TiledCanvas.prototype.normalizeDefaults = function normalizeDefaults (target, defaults) {
			target = target || {};
			var normalized = this.cloneObject(target);
			for (var k in defaults) {
				if (typeof defaults[k] === "object" && !(defaults[k] instanceof Array)) {
					normalized[k] = this.normalizeDefaults(target[k] || {}, defaults[k]);
				} else {
					normalized[k] = target[k] || defaults[k];
				}
			}
			return normalized;
		};

		// Function that schedules one redraw, if you call this twice
		// within the same frame, or twice before a redraw is done, only one redraw
		// will actually be executed
		TiledCanvas.prototype.redrawOnce = function redrawOnce () {
		    if (!this._redrawTimeout)
		        this._redrawTimeout = requestAnimationFrame(this.redraw.bind(this, false));
		};

		// Forces a full redraw now, might be paused halfway if it takes too long
		// Cancels queued breakdraws
		// You should probably not call this function yourself, use redrawOnce
		TiledCanvas.prototype.redraw = function redraw () {
			cancelAnimationFrame(this._redrawTimeout);
			delete this._redrawTimeout;
			
			// If we are still drawing the last frame, wait for it to finish
			if (this.breakDrawing || this.breakDrawingRequest) {
				this.redrawOnce();
				return;
			}

			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

			this.ctx.save();
			this.ctx.setTransform(1, 0, 0, 1, 0, 0);
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
			this.ctx.restore();
			
		    var startChunkX = Math.floor(this.leftTopX / this.settings.chunkSize),
		        endChunkX   = Math.ceil((this.leftTopX + this.canvas.width / this.zoom) / this.settings.chunkSize),
		        startChunkY = Math.floor(this.leftTopY / this.settings.chunkSize),
		        endChunkY   = Math.ceil((this.leftTopY + this.canvas.height / this.zoom) / this.settings.chunkSize);

			this.breakDraw(startChunkX, startChunkY, startChunkY, endChunkX, endChunkY);
		};


		/*
			If a redraw takes too long the user will be left with an unresponsive application.
			To remedy this we have to return control back to the js interpreter
			
			We will save the last chunkX and chunkY. We have to block all new redrawOnce untill we are done though.
			We also have to remember our original leftTopX and leftTopY and zoom
			If they changed, we abort and just draw again.
			
			This function will make sure next frame we continue and remember all the right params
		*/
		TiledCanvas.prototype.breakDrawInit = function breakDrawInit (chunkX, chunkY, startChunkY, endChunkX, endChunkY) {
			// This shouldn't happen, but if it does, abort everything and just redraw
			// This can only happen if we are drawing twice in the same frame
			if (this.breakDrawingRequest) {
				console.error("BreakDrawInit called while there is already a breakdraw request. Full redraw in the next frame scheduled.");
				this.breakDrawing = false;
				cancelAnimationFrame(this.breakDrawingRequest);
				delete this.breakDrawingRequest;
				this.redrawOnce();
				return;
			}
			
			this.breakDrawing = true;
			this.breakDrawingLeftTopX = this.leftTopX;
			this.breakDrawingLeftTopY = this.leftTopY;
			this.breakDrawingZoom = this.zoom;
			this.breakDrawingRequest = requestAnimationFrame(this.breakDraw.bind(this, chunkX, chunkY, startChunkY, endChunkX, endChunkY));
		};


		TiledCanvas.prototype.breakDraw = function breakDraw (chunkX, chunkY, startChunkY, endChunkX, endChunkY) {
			cancelAnimationFrame(this.breakDrawingRequest);
			delete this.breakDrawingRequest;

			// If we are breakdrawing already, and our params mismacht, abort and just redraw
			if (this.breakDrawing && (
					this.leftTopX !== this.breakDrawingLeftTopX ||
					this.leftTopY !== this.breakDrawingLeftTopY ||
					this.zoom !== this.breakDrawingZoom
				)) {
				this.breakDrawing = false;
				cancelAnimationFrame(this.breakDrawingRequest);
				delete this.breakDrawingRequest;
				this.redrawOnce();
				return;
			}
				
			var start = Date.now();
			for (; chunkX < endChunkX; chunkX++) {
		        for (chunkY = startChunkY; chunkY < endChunkY; chunkY++) {
					if (Date.now() - start > this.MAX_DRAW_TIME) {
						this.breakDrawInit(chunkX, chunkY, startChunkY, endChunkX, endChunkY);
						return;
					}
					
		            this.drawChunk(chunkX, chunkY);
		        }
		    }
			
			this.breakDrawing = false;
		};

		TiledCanvas.prototype.drawChunk = function drawChunk (chunkX, chunkY) {
		    if (this.chunks[chunkX] && this.chunks[chunkX][chunkY]) {
		        if (this.chunks[chunkX][chunkY] == "empty") return;
			
				this.chunks[chunkX][chunkY].lastDrawn = Date.now();

		        this.ctx.drawImage(this.chunks[chunkX][chunkY].canvas, ((chunkX * this.settings.chunkSize) - this.leftTopX) * this.zoom, ((chunkY * this.settings.chunkSize) - this.leftTopY) * this.zoom, this.settings.chunkSize * this.zoom, this.settings.chunkSize * this.zoom);

				if (!this.breakDrawing && this.chunks[chunkX][chunkY].addedTime)
					this.drawFade(chunkX, chunkY);
				
		    } else if(typeof this.requestUserChunk == "function") {
		        this.requestChunk(chunkX, chunkY);
				
				if (this.breakDrawing) {
					this.ctx.fillStyle = "#456789";
					this.ctx.fillRect(((chunkX * this.settings.chunkSize) - this.leftTopX) * this.zoom, ((chunkY * this.settings.chunkSize) - this.leftTopY) * this.zoom, this.settings.chunkSize * this.zoom, this.settings.chunkSize * this.zoom);
				} else if (this.loadingImage) {
		            this.ctx.drawImage(this.loadingImage, ((chunkX * this.settings.chunkSize) - this.leftTopX) * this.zoom, ((chunkY * this.settings.chunkSize) - this.leftTopY) * this.zoom, this.settings.chunkSize * this.zoom, this.settings.chunkSize * this.zoom);
		        }
		    }
		};

		TiledCanvas.prototype.drawFade = function drawFade (chunkX, chunkY) {
			if (!this.loadingImage) return;
			
			// If this chunk got recently added we want a fade effect
			// If we are breakdrawing though, we don't wanna be fancy
			var deltaAdded = Date.now() - this.chunks[chunkX][chunkY].addedTime;
			this.ctx.globalAlpha = Math.max(0, 1 - deltaAdded / this.settings.fadeTime);

			if (deltaAdded > this.settings.fadeTime)
				delete this.chunks[chunkX][chunkY].addedTime;

			// Force a redraw to avoid optimization of not drawing
			this.redrawOnce();

			var originalwidth = this.settings.chunkSize * this.zoom;
			var width = originalwidth * this.ctx.globalAlpha;
			this.ctx.drawImage(this.loadingImage,
				((chunkX * this.settings.chunkSize) - this.leftTopX) * this.zoom + (originalwidth - width) / 2,
				((chunkY * this.settings.chunkSize) - this.leftTopY) * this.zoom + (originalwidth - width) / 2,
				width,
				width);

			this.ctx.globalAlpha = 1;
		};

		TiledCanvas.prototype.drawToCanvas = function drawToCanvas (canvas, from, to) {		
			var minX = Math.min(from[0], to[0]),
			    maxX = Math.max(from[0], to[0]),
			    minY = Math.min(from[1], to[1]),
			    maxY = Math.max(from[1], to[1]);

			var width = maxX - minX,
			    height = maxY - minY;	

			var startChunkX = Math.floor(minX / this.settings.chunkSize),
			    endChunkX   = Math.ceil((minX + width) / this.settings.chunkSize),
			    startChunkY = Math.floor(minY / this.settings.chunkSize),
			    endChunkY   = Math.ceil((maxY + height) / this.settings.chunkSize);	

			var ctx = canvas.getContext("2d");

			for (var chunkX = startChunkX; chunkX < endChunkX; chunkX++) {
				for (var chunkY = startChunkY; chunkY < endChunkY; chunkY++) {
					if (this.chunks[chunkX] && this.chunks[chunkX][chunkY] && this.chunks[chunkX][chunkY] !== "empty") {
						ctx.drawImage(
							this.chunks[chunkX][chunkY].canvas,
							chunkX * this.settings.chunkSize - minX,
							chunkY * this.settings.chunkSize - minY
						);
					}
				}
			}
		};

		TiledCanvas.prototype.goto = function goto (x, y) {
		    this.leftTopX = x;
		    this.leftTopY = y;
		    this.redrawOnce();
		};

		TiledCanvas.prototype.relativeZoom = function relativeZoom (zoom, pointX, pointY) {
		    this.absoluteZoom(this.zoom * zoom, pointX, pointY);
		};

		TiledCanvas.prototype.absoluteZoom = function absoluteZoom (zoom, pointX, pointY) {	
			if (typeof pointX !== "number" || typeof pointY !== "number") {
				this.zoom = zoom;
				this.reinitializeImageSmoothing();
				this.redrawOnce();
				return;
			}
			
			pointX = this.leftTopX + (pointX / this.zoom);
			pointY = this.leftTopY + (pointY / this.zoom);
			
			var ratioX = (pointX - this.leftTopX) / (this.canvas.width / this.zoom);
			var ratioY = (pointY - this.leftTopY) / (this.canvas.height / this.zoom);
			
			var newX = pointX - ((ratioX * this.canvas.width) / zoom);
			var newY = pointY - ((ratioY * this.canvas.height) / zoom);
			
			this.zoom = zoom;
			this.reinitializeImageSmoothing();
			this.goto(newX, newY);
		};

		TiledCanvas.prototype.reinitializeImageSmoothing = function reinitializeImageSmoothing () {
			var blurCanvas = this.settings.blurOnZoom || (this.zoom < this.settings.zoomLevelToPixelate);
			this.ctx.mozImageSmoothingEnabled = blurCanvas;
			this.ctx.webkitImageSmoothingEnabled = blurCanvas;
			this.ctx.msImageSmoothingEnabled = blurCanvas;
			this.ctx.imageSmoothingEnabled = blurCanvas;
		};

		TiledCanvas.prototype.execute = function execute () {
		    this.executeNoRedraw();
		    this.redrawOnce();
		};

		TiledCanvas.prototype.executeNoRedraw = function executeNoRedraw () {
		    for (var chunkX = this.affecting[0][0]; chunkX < this.affecting[1][0]; chunkX++) {
		        for (var chunkY = this.affecting[0][1]; chunkY < this.affecting[1][1]; chunkY++) {
		            this.executeChunk(chunkX, chunkY);
		        }
		    }
		    this.contextQueue = [];
		};

		TiledCanvas.prototype.clearAll = function clearAll () {
		    this.contextQueue = [];
		    this.requestChunkCallbackList = {};
		    this.chunks = {};
		    this.lastClear = Date.now();
		};

		// Request the chunk and call the callback once done
		// Can be called as often as you'd like without breaking
		// Callbacks are guarenteed to run in the order requestChunk is called in
		TiledCanvas.prototype.requestChunk = function requestChunk (chunkX, chunkY, callback) {
		    if (this.chunks[chunkX] && this.chunks[chunkX][chunkY]) {
		        if (callback) callback();
				return;
		    }
		    
		    // Request a chunk and redraw once we got it
		    if (typeof this.requestUserChunk !== "function") return;
		    this.requestChunkCallbackList = this.requestChunkCallbackList || {};

		    if (this.requestChunkCallbackList[chunkX] && this.requestChunkCallbackList[chunkX][chunkY]) {
		        if (!callback) return;
		        // This chunk has already been requested, add to the callback list
		        this.requestChunkCallbackList[chunkX][chunkY].push(callback);
		    } else {
		        this.requestChunkCallbackList[chunkX] = this.requestChunkCallbackList[chunkX] || {};

		        if (callback) {
		            // Create a callback list for this chunk
		            this.requestChunkCallbackList[chunkX][chunkY] = [callback];
		        } else {
		            this.requestChunkCallbackList[chunkX][chunkY] = [];
		        }

		        var startTime = Date.now();
		        this.requestUserChunk(chunkX, chunkY, function (image) {
		            // If the request started before we cleared, ignore this
		            if (this.lastClear > startTime) return;
		            // For responsiveness make sure the callback doesnt happen in the same event frame
		            this.setUserChunk(chunkX, chunkY, image);
		        }.bind(this));
		    }

		    this.garbageCollect();
		};

		// This function can be overridden to make certain chunks not unload
		TiledCanvas.prototype.beforeUnloadChunk = function beforeUnloadChunk () { return true; }

		/*
			Tries to remove as many chunks as possible that have not been used for more than MIN_INACTIVE_UNLOAD_TIME
			Chunks that have been drawn on will never be removed
			Only removes chunk if we are over the limit
		*/
		TiledCanvas.prototype.garbageCollect = function garbageCollect () {
			if (this.chunkCount() > this.settings.maxLoadedChunks) {
				for (var x in this.chunks) {
					for (var y in this.chunks[x]) {
						if (this.canBeUnloaded(x, y) && this.beforeUnloadChunk(x, y)) {
							this.chunks[x][y] = null;
							delete this.chunks[x][y];
						}
					}
				}
			}
		};

		/*
			Returns the amount of loaded, non-empty chunks
		*/
		TiledCanvas.prototype.chunkCount = function chunkCount () {
			var count = 0;
			
			for (var x in this.chunks)
				for (var y in this.chunks[x])
					if (this.chunks[x][y] != "empty" && this.chunks[x][y])
						count++;
			
			return count;
		};

		TiledCanvas.prototype.isInView = function isInView (cx, cy) {
			var minX = Math.floor(this.leftTopX / this.settings.chunkSize);
			var minY = Math.floor(this.leftTopY / this.settings.chunkSize);
			var maxX = Math.ceil((this.leftTopX + this.canvas.width / this.zoom) / this.settings.chunkSize);
			var maxY = Math.ceil((this.leftTopY + this.canvas.height / this.zoom) / this.settings.chunkSize);

			return cx >= minX && cx <= maxX &&
			       cy >= minY && cy <= maxY;
		};

		TiledCanvas.prototype.canBeUnloaded = function canBeUnloaded (cx, cy) {
			return this.chunks[cx] &&
			       this.chunks[cx][cy] &&
			       Date.now() - (this.chunks[cx][cy].lastDrawn || 0) > this.MIN_INACTIVE_UNLOAD_TIME &&
			       !this.chunks[cx][cy].hasBeenDrawnOn &&
				   !this.isInView(cx, cy);
		};

		TiledCanvas.prototype.setUserChunk = function setUserChunk (chunkX, chunkY, image) {
		    // Don't set the user chunk twice
		    if (this.chunks[chunkX] && this.chunks[chunkX][chunkY]) return;

		    // If the image is falsy and there is no queue then this chunk is transparent
		    // for performance reasons empty chunks should not allocate memory
		    if (!image && (!this.requestChunkCallbackList[chunkX] || this.requestChunkCallbackList[chunkX][chunkY].length == 0)) {
		        this.chunks[chunkX] = this.chunks[chunkX] || {};
		        this.chunks[chunkX][chunkY] = "empty";
		        delete this.requestChunkCallbackList[chunkX][chunkY];
				this.redrawOnce(); // Clear the possible loading image
		        return;
		    }

		    // Draw the chunk
		    this.chunks[chunkX] = this.chunks[chunkX] || {};
		    this.chunks[chunkX][chunkY] =  this.newCtx(this.settings.chunkSize, this.settings.chunkSize, -chunkX * this.settings.chunkSize, -chunkY * this.settings.chunkSize);
		    this.chunks[chunkX][chunkY].addedTime = Date.now();

		    if (image) this.chunks[chunkX][chunkY].drawImage(image, chunkX * this.settings.chunkSize, chunkY * this.settings.chunkSize);

		    // Run all callbacks
		    var callbackList = this.requestChunkCallbackList[chunkX][chunkY];
		    for (var k = 0; k < callbackList.length; k++) {
		        callbackList[k]();
		    }

		    // Do a full redraw of the tiled canvas
		    this.redrawOnce();

		    delete this.requestChunkCallbackList[chunkX][chunkY];
		};

		TiledCanvas.prototype.copyArray = function copyArray (arr) {
		    var temp = [];
		    for (var k = 0; k < arr.length; k++) {
		        temp[k] = arr[k];
		    }
		    return temp;
		};

		TiledCanvas.prototype.executeChunk = function executeChunk (chunkX, chunkY, queue) {
		    // Executes the current queue on a chunk
		    // If queue is set execute that queue instead
		    this.chunks[chunkX] = this.chunks[chunkX] || [];
		 
		    if (!this.chunks[chunkX][chunkY] || this.chunks[chunkX][chunkY] == "empty") {
		        // This chunk has never been painted to before
		        // We first have to ask what this chunk looks like
		        // Remember the Queue untill we got the chunk
		        // if we already remembered a queue then add this queue to it
		        // Only do this when we actually want to use userdefined chunks
		        if (typeof this.requestUserChunk == "function" && this.chunks[chunkX][chunkY] !== "empty") {
		            this.requestChunk(chunkX, chunkY, function (queue) {
		                this.executeChunk(chunkX, chunkY, queue);
		            }.bind(this, this.copyArray(queue || this.contextQueue)))
		            return;
		        } else {
		            this.chunks[chunkX][chunkY] =  this.newCtx(this.settings.chunkSize, this.settings.chunkSize, -chunkX * this.settings.chunkSize, -chunkY * this.settings.chunkSize);
		        }
		    }

		    var ctx = this.chunks[chunkX][chunkY];
		    var queue = queue || this.contextQueue;

		    for (var queuekey = 0; queuekey < queue.length; queuekey++) {
		        if (typeof ctx[queue[queuekey][0]] === 'function') {
		            this.executeQueueOnChunk(ctx, queue[queuekey]);
		        } else {
		            ctx[queue[queuekey][0]] = queue[queuekey][1];
		        }
		    }
		};

		TiledCanvas.prototype.executeQueueOnChunk = function executeQueueOnChunk (ctx, args) {
		    ctx[args[0]].apply(ctx, Array.prototype.slice.call(args, 1));
		    ctx.hasBeenDrawnOn = true;
		};

		TiledCanvas.prototype.drawingRegion = function (startX, startY, endX, endY, border) {
		    border = border || 0;
		    this.affecting[0][0] = Math.floor((Math.min(startX, endX) - border) / this.settings.chunkSize);
		    this.affecting[0][1] = Math.floor((Math.min(startY, endY) - border) / this.settings.chunkSize);
		    this.affecting[1][0] = Math.ceil((Math.max(endX, startX) + border) / this.settings.chunkSize);
		    this.affecting[1][1] = Math.ceil((Math.max(endY, startY) + border) / this.settings.chunkSize);
		};

		TiledCanvas.prototype.newCtx = function newCtx (width, height, translateX, translateY) {
		    var ctx = document.createElement('canvas').getContext('2d');
		    ctx.canvas.width = width;
		    ctx.canvas.height = height;
		    ctx.translate(translateX, translateY);
		    return ctx;
		};

		TiledCanvas.prototype.createContext = function createContext () {
		    var context = {};
		    var ctx = document.createElement('canvas').getContext('2d');
		    for (var key in ctx) {
		        if (typeof ctx[key] === 'function') {
		            context[key] = function (func) {
		                this.contextQueue.push(arguments);
		            }.bind(this, key);
		        } else if (typeof ctx[key] !== 'object') {
		            context.__defineGetter__(key, function (key) {
		                var ctx = this.newCtx();
		                for (var queuekey = 0; queuekey < this.contextQueue.length; queuekey++) {
		                    if (typeof ctx[args[0]] === 'function') {
		                        ctx[args[0]].apply(ctx, args.slice(1));
		                    } else {
		                        ctx[args[0]] = args[1];
		                    }
		                }
		                return ctx[key];
		            }.bind(this, key));

		            context.__defineSetter__(key, function (key, value) {
		                this.contextQueue.push(arguments);
		            }.bind(this, key));
		        }
		    }
		    return context;
		};
		function Paint (container, settings) {
			this.eventHandlers = {};
			this.settings = this.utils.merge(this.utils.copy(settings), this.defaultSettings);

			this.container = container;
			this.boundingBoxList = [];

			this.scale = [1, 1]; // Used for horizontal and vertical mirror
			this.rotation = 0; // Rotation in degrees
			
			this.frames = []; // The frames that will be displayed
			// Contains objects of the form: {leftTop: [0,0], width: 500, height: 100, shift: 200, opacity: 0.4}

			this.addCanvas(container);
			this.resize();

			this.controls = new Controls(container, this.createControlArray());

			if(this.settings.showMouseCords) this.addCoordDom(container);

			// Set tool values
			this.changeTool("brush");
			this.setColor(new tinycolor());
			this.setStrokeColor(new tinycolor());
			this.changeToolSize(5, true);
			this.changeStrokeSize(5, true);
			
			this.rotateControl=$(container).find('.rotateControl');
			this.resizeControl=$(container).find('.resizeControl');
				
			// add rotate and resize control
			if(!this.rotateControl.length){
				this.rotateControl=$('<a href="javascript:void(0)" class="position-absolute text-dark rotateControl" style="display:none;"><i class="fa fa-redo"></i></a>');
				this.rotateControl.appendTo($(container));
			}
			if(!this.resizeControl.length){
				this.resizeControl=$('<a href="javascript:void(0)" class="position-absolute text-dark resizeControl" style="display:none;"><i class="fa fa-expand-arrows-alt"></i></a>');
				this.resizeControl.appendTo($(container));
			}
			this.isRotating = false;
			this.isResizing = false;
			this.initialCords=null;
			this.initialDrawingCords=null;
			this.rotateControl
			.click(e=>{
					this.initialCords=e;
					this.isRotating = !this.isRotating;
					this.effectsCanvas.style.cursor = "ns-resize";
			})
			// .mousemove(e=>{
			//     if(isRotating){
			//     	let angle=Math.atan2(initialCords.clientY - e.clientY, initialCords.clientX - e.clientX);
			//     	console.log('rotating',angle);
			//     	this.rotateDrawing(angle);
			//     }
			//  });
			this.resizeControl
			.click(e=>{
				  this.initialCords=e;
			    this.initialDrawingCords=Object.assign({},this.localDrawings[this.selectedDrawingIndex]);
			    this.isResizing = !this.isResizing;
			    this.effectsCanvas.style.cursor = "nesw-resize";
			})
			// .mousemove(_=>{
			//     if(isResizing){
			//     	console.log('resizing');
			//     	this.resizeDrawing();
			//     }
			//  })
			// .mouseup(_=>{
			//     isResizing = false;
			// });

			$(this.controls.byName["tool-color"].input).spectrum("set", this.current_color);
			$(this.controls.byName["tool-strokecolor"].input).spectrum("set", this.current_stroke_color);

			this.localDrawings = [];
			this.paths = {};
			this.localUserPaths = [];
			this.localEraserPaths = [];

			// Drawings that have not yet finalized
			// The server still has to write them to image
			// They could still be undone
			this.publicdrawings = [];
			
			this.altPressed = false;
			this.rightClick = false;
			this.leftClick = false;
			this.keyMap = []; // https://stackoverflow.com/questions/29266602/javascript-when-having-pressed-2-keys-simultaneously-down-leaving-one-of-them

			window.addEventListener("resize", this.resize.bind(this));
			window.addEventListener("redraw", this.resize.bind(this));
			window.addEventListener("keypress", this.keypress.bind(this));
			window.addEventListener("keydown", this.keydown.bind(this));
			window.addEventListener("keyup", this.keyup.bind(this));
			window.addEventListener('wheel', this.wheel.bind(this));

			//addEventListener didn't work
			window.onmouseout = function detectAltTab() {
				this.altPressed = false;
			}.bind(this);
			
			//introJs().setOptions({ 'tooltipPosition': 'auto', 'showProgress': true }).start();
		}

		Paint.prototype.MAX_RANDOM_COORDS = 1048576;
		Paint.prototype.FIX_CANVAS_PIXEL_SIZE = 0;
		Paint.prototype.PATH_PRECISION = 1000;
		Paint.prototype.MIN_PATH_WIDTH = 1.001;

		Paint.prototype.defaultSettings = {
			maxSize: 100,
			maxLineLength: 200,
			showMouseCords: false
		};

		Paint.prototype.defaultShortcuts = {

		};

		// Redraws everything taking into account mirroring and rotation
		Paint.prototype.redrawAll = function redrawAll () {
			this.hideDrawingControls();
			for (var k = 0; k < this.canvasArray.length; k++) {
				var ctx = this.canvasArray[k].getContext("2d");

				ctx.save();
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.restore();

				ctx.setTransform(
					this.scale[0], 0, 0,
					this.scale[1], this.canvasArray[k].width / 2, this.canvasArray[k].height / 2
				);

				ctx.rotate(this.rotation * Math.PI / 180);
				ctx.translate(-this.canvasArray[k].width / 2, -this.canvasArray[k].height / 2);
			}

			this.background.redrawOnce();
			this.public.redrawOnce();
			this.local.redrawOnce();

			this.redrawPaths();
			this.drawImage();
			this.drawGrid();
			this.redrawLocals();
			this.redrawFrames();
		};

		Paint.prototype.setHorizontalMirror = function setHorizontalMirror (value) {
			this.scale[0] = value ? -1 : 1;
			this.redrawAll();

			this.dispatchEvent({
				type: "canvaschange",
				rotation: this.rotation,
				scale: this.scale
			});
		};

		Paint.prototype.setVerticalMirror = function setVerticalMirror (value) {
			this.scale[1] = value ? -1 : 1;
			this.redrawAll();

			this.dispatchEvent({
				type: "canvaschange",
				rotation: this.rotation,
				scale: this.scale
			});
		};
		Paint.prototype.showDrawingControls = function showDrawingControls (e, ne,se){
			if(typeof this.selectedDrawingIndex != 'undefined'){
				let adjustX=$('#content-block').offset().left;
				let adjustY=$('#content-block').offset().top + $('#play-menu').height();
				// Don't show the control after setting offset, hidding element's offset keep in increasing
				this.rotateControl.show().offset({top: ne[1]+adjustY - 15,left: ne[0]+adjustX });
				this.resizeControl.show().offset({top: se[1]+adjustY, left: se[0]+adjustX});
			}
		};
		Paint.prototype.hideControls= function hideControls(){
			if(this.rotateControl) this.rotateControl.hide();
			if(this.resizeControl) this.resizeControl.hide();
		}
		Paint.prototype.hideDrawingControls = function hideDrawingControls (){
				this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
				this.isRotating=false;
				this.isResizing=false;
				this.initialDrawingCords=null;
				this.hideControls();
		};
		
		Paint.prototype.rotateDrawing = function rotateDrawing(angle){
			if(typeof this.selectedDrawingIndex !='undefined0'){
				this.localDrawings[this.selectedDrawingIndex].rotate=angle;
				this.redrawLocals();
				this.drawSelection(angle);
				this.dispatchEvent({
					type: "rotate",
					rotate: angle,
					index: this.selectedDrawingIndex
				});
			}
		};
		Paint.prototype.resizeDrawing = function resizeDrawing(changeX, changeY, newCords){
			if(typeof this.selectedDrawingIndex != 'undefined'){
				let drawing=this.localDrawings[this.selectedDrawingIndex];
				switch(drawing.type){
					case 'circle':
						this.localDrawings[this.selectedDrawingIndex].x1=this.initialDrawingCords.x1+changeX;
						this.localDrawings[this.selectedDrawingIndex].y2=this.initialDrawingCords.y2+changeY;
					break;
					case 'rhombus':
						this.localDrawings[this.selectedDrawingIndex].x1=this.initialDrawingCords.x1+changeX;
						this.localDrawings[this.selectedDrawingIndex].y1=this.initialDrawingCords.y1+changeY;

						this.localDrawings[this.selectedDrawingIndex].x2=this.initialDrawingCords.x1+changeX;
						this.localDrawings[this.selectedDrawingIndex].y2=this.localDrawings[this.selectedDrawingIndex].y1 - Math.abs(this.localDrawings[this.selectedDrawingIndex].x1 -this.localDrawings[this.selectedDrawingIndex].x);
					break;
					case 'triangle':
						this.localDrawings[this.selectedDrawingIndex].x1=this.initialDrawingCords.x1+changeX;
						this.localDrawings[this.selectedDrawingIndex].y2=this.initialDrawingCords.y2-changeY;
					break;
					case 'arrow':
						this.localDrawings[this.selectedDrawingIndex].x1=Math.round((this.local.leftTopX + (newCords[0] / this.local.zoom)) * this.PATH_PRECISION) / this.PATH_PRECISION;
						this.localDrawings[this.selectedDrawingIndex].y1=Math.round((this.local.leftTopY + (newCords[1] / this.local.zoom)) * this.PATH_PRECISION) / this.PATH_PRECISION;
					break;
					case 'line':
						this.localDrawings[this.selectedDrawingIndex].x1=Math.round((this.local.leftTopX + (newCords[0] / this.local.zoom)) * this.PATH_PRECISION) / this.PATH_PRECISION;
						this.localDrawings[this.selectedDrawingIndex].y1=Math.round((this.local.leftTopY + (newCords[1] / this.local.zoom)) * this.PATH_PRECISION) / this.PATH_PRECISION;
					break;
					case 'text':
						this.localDrawings[this.selectedDrawingIndex].size=this.initialDrawingCords.size+(changeX/10);
					break;
				}
				this.redrawLocals();
				this.drawSelection(0);
				let tempDrawing=Object.assign({},this.localDrawings[this.selectedDrawingIndex]);
				tempDrawing.color=drawing.color.toRgbString();
				if(drawing.stroke_color) tempDrawing.stroke_color=drawing.stroke_color.toRgbString();
				
				this.dispatchEvent({
					type: "resize",
					drawing: tempDrawing,
					index: this.selectedDrawingIndex
				});	
			}
		};
		Paint.prototype.drawSelection = function drawSelection (angle){
			if(!this.rectanglePoints.length) return;

			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
			var context = this.effectsCanvasCtx;
			context.save();
			context.globalCompositeOperation="destination-over";
			if(angle){
				context.translate( (this.rectanglePoints[1][0] + this.rectanglePoints[0][0]) / 2, (this.rectanglePoints[1][1] + this.rectanglePoints[0][1]) / 2 );
				context.rotate(angle);
				context.translate( this.rectanglePoints[0][0], this.rectanglePoints[0][1]);
			}
			context.setLineDash([5, 3]);
			context.beginPath();
			context.moveTo(this.rectanglePoints[0][0],this.rectanglePoints[0][1]);
			context.lineTo(this.rectanglePoints[1][0],this.rectanglePoints[1][1]);
			context.lineTo(this.rectanglePoints[2][0],this.rectanglePoints[2][1]);
			context.lineTo(this.rectanglePoints[3][0],this.rectanglePoints[3][1]);
			context.lineTo(this.rectanglePoints[0][0],this.rectanglePoints[0][1]);
			context.strokeStyle = '#6d6d6d'; /* gray */
			context.lineWidth = 1 *  this.local.zoom;
			context.stroke();
			context.closePath();
			context.restore();
			this.showDrawingControls(event,[this.rectanglePoints[2][0],this.rectanglePoints[2][1]], [this.rectanglePoints[1][0],this.rectanglePoints[1][1]] );
		};
		Paint.prototype.setRotation = function setRotation (value) {
			this.rotation = value % 360;
			this.redrawAll();

			this.dispatchEvent({
				type: "canvaschange",
				rotation: this.rotation,
				scale: this.scale
			});
		};

		Paint.prototype.addCanvas = function addCanvas (container) {
			// The things that have been drawn and we already know the order of
			// but have yet to be finalized
			var gridC = container.appendChild(this.createCanvas("grid"));
			gridC.oncontextmenu = function() {
				 return false;  
			}
			// The background pngs
			var backgroundC = container.appendChild(this.createCanvas("background"));
			backgroundC.oncontextmenu = function() {
				 return false;  
			} 
			
			// The things that have been drawn and we already know the order of
			// but have yet to be finalized
			var publicC = container.appendChild(this.createCanvas("public"));
			publicC.oncontextmenu = function() {
				 return false;  
			} 
			// This canvas is used to display parts of the background and public
			// The use case is to display the previous frames in an animation
			var frameC = container.appendChild(this.createCanvas("frames"));
			frameC.oncontextmenu = function() {
				 return false;  
			} 
			// The things we drew but the server hasn't confirmed yet
			var localC  = container.appendChild(this.createCanvas("local"));
			localC.oncontextmenu = function() {
				 return false;  
			} 
			// Canvas for things like cursor that should always be at the top
			var effectC = container.appendChild(this.createCanvas("effect"));
			effectC.oncontextmenu = function() {
				 return false;  
			} 
			var backgroundCtx = backgroundC.getContext("2d");
			backgroundCtx.mozImageSmoothingEnabled = false;
			backgroundCtx.webkitImageSmoothingEnabled = false;
			backgroundCtx.msImageSmoothingEnabled = false;
			backgroundCtx.imageSmoothingEnabled = false;

			this.background = new TiledCanvas(backgroundC);
			this.public = new TiledCanvas(publicC);
			this.local = new TiledCanvas(localC);
			this.gridC = gridC;
			this.public.requestUserChunk = function requestPublicUserChunk (cx, cy, callback) {
				// We actually dont have background chunks, but we have to make sure
				// the background canvas requests background images when we get
				// drawings for that chunk so that no race condition happens when we
				// finalize all the drawings
				callback();
				this.background.requestChunk(cx, cy);
			}.bind(this);
			
			this.public.beforeUnloadChunk = function beforeUnloadChunk (cx, cy) {
				if((this.public.canBeUnloaded(cx, cy) || (this.public.chunks[cx] && this.public.chunks[cx][cy] == "empty")) &&
				   (this.background.canBeUnloaded(cx, cy) || (this.background.chunks[cx] && this.background.chunks[cx][cy] == "empty"))) {
					console.log("Unloading chunk", cx, cy);
					this.background.chunks[cx][cy] = null;
					delete this.background.chunks[cx][cy];
					this.public.chunks[cx][cy] = null;
					delete this.public.chunks[cx][cy];
					return true;
				}
				
				return false;
			}.bind(this);
			
			this.background.beforeUnloadChunk = this.public.beforeUnloadChunk;

			this.effectsCanvas = effectC;
			this.effectsCanvasCtx = effectC.getContext("2d");

			this.gridCCtx = gridC.getContext("2d");
			this.gridC.context=this.gridCCtx; 

			effectC.addEventListener("mousedown", this.exectool.bind(this));
			effectC.addEventListener("mousemove", this.exectool.bind(this));
			effectC.addEventListener("mouseup", this.exectool.bind(this));
			effectC.addEventListener("mouseleave", this.exectool.bind(this));

			effectC.addEventListener("touchstart", this.exectool.bind(this));
			effectC.addEventListener("touchmove", this.exectool.bind(this));
			effectC.addEventListener("touchend", this.exectool.bind(this));

			this.canvasArray = [backgroundC, publicC, frameC, localC, effectC];

			// Used as the point where new canvasses should be added
			// This way effectC stays on top
			this.lastCanvas = localC;

			// The paths are still being drawn, they are on top of everything else
			this.pathCanvas = this.newCanvasOnTop("paths");
			this.pathContext = this.pathCanvas.getContext("2d");
			this.framesContext = frameC.getContext("2d");
		};

		Paint.prototype.addCoordDom = function addCoordDom (container) {
			this.coordDiv = container.appendChild(document.createElement("div"));
			this.coordDiv.className = "mouse-coords";

			this.coordDiv.appendChild(document.createTextNode("x:"));
			var xInput = this.coordDiv.appendChild(document.createElement("input"));
			this.coordDiv.appendChild(document.createTextNode("y:"));
			var yInput = this.coordDiv.appendChild(document.createElement("input"));

			xInput.type = "number";
			yInput.type = "number";

			xInput.min = -this.MAX_RANDOM_COORDS;
			yInput.min = -this.MAX_RANDOM_COORDS;

			xInput.max = this.MAX_RANDOM_COORDS;
			yInput.max = this.MAX_RANDOM_COORDS;

			xInput.addEventListener("input", function (event) {
				this.goto(parseInt(event.target.value) - this.canvasArray[0].width / this.public.zoom / 2 || 0, this.public.leftTopY);
			}.bind(this));

			yInput.addEventListener("input", function (event) {
				this.goto(this.public.leftTopX, parseInt(event.target.value) - this.canvasArray[0].height / this.public.zoom / 2 || 0);
			}.bind(this));

			var randomButton = this.coordDiv.appendChild(document.createElement("div"));
			randomButton.className = "control-button random-button";

			var randomButtonImage = randomButton.appendChild(document.createElement("img"));
			randomButtonImage.src = "images/icons/randomlocation.png";
			randomButtonImage.alt = "Jump to random location";
			randomButtonImage.title = "Jump to random location";
			randomButton.setAttribute("data-intro", "Since you are new, you are restricted on where you can draw. Use this button to find a spot.");

			randomButton.addEventListener("click", function () {
				var maxCoords = this.MAX_RANDOM_COORDS;
				this.goto(Math.random() * maxCoords * 2 - maxCoords, Math.random() * maxCoords * 2 - maxCoords);
			}.bind(this));
		};

		Paint.prototype.setMouseCoords = function setMouseCoords (x, y) {
			// Assume first input is x, second is y
			var xSet = false;
			for (var k = 0; k < this.coordDiv.children.length; k++) {
				if (this.coordDiv.children[k].type == "number") {
					this.coordDiv.children[k].value = xSet ? y.toFixed() : x.toFixed();
					if (xSet) return;
					xSet = true;
				}
			}
		};

		Paint.prototype.newCanvasOnTop = function newCanvasOnTop (name) {
			var canvas = this.createCanvas(name || "foreign");

			// Insert the canvas behind the current last canvas
			this.lastCanvas.parentNode.insertBefore(canvas, this.lastCanvas.nextSibling);

			// Put it as new canvas, put it in the canvasarray and return
			this.lastCanvas = canvas;
			this.canvasArray.push(canvas);

			// Set the coords
			canvas.leftTopX = this.public.leftTopX;
			canvas.leftTopY = this.public.leftTopY;

			// Invalidate canvas size
			this.resize();

			return canvas;
		};

		// Resets the paint (background, position, paths, ...)
		Paint.prototype.clear = function clear () {
			this.public.clearAll();
			this.background.clearAll();
			this.local.clearAll();

			this.paths = {};
			this.localUserPaths = [];
			this.localDrawings = [];
			this.publicdrawings = [];

			//this.goto(0, 0, true);
		};

		Paint.prototype.goto = function goto (worldX, worldY, dontTriggerEvent) {
			if (typeof worldX !== "number") console.warn("worldX in goto was not a number!");
			if (typeof worldY !== "number") console.warn("worldY in goto was not a number!");

			if (worldX !== worldX) console.warn("worldX was NaN");
			if (worldY !== worldY) console.warn("worldY was NaN");
			// Move both local and public tiledcanvas and set all canvas leftTopX/Y properties
			this.background.goto(worldX, worldY);
			this.local.goto(worldX, worldY);
			this.public.goto(worldX, worldY);

			for (var k = 0; k < this.canvasArray.length; k++) {
				this.canvasArray[k].leftTopX = this.public.leftTopX;
				this.canvasArray[k].leftTopY = this.public.leftTopY;
			}

			this.redrawPaths();
			this.redrawFrames();
			if(!dontTriggerEvent)
				this.dispatchEvent({
					type: "move",
					leftTopX: worldX,
					leftTopY: worldY
				});
		};

		Paint.prototype.finalizeAll = function finalizeAll (amountToKeep) {
			this.drawDrawings("background", this.publicdrawings.slice(0, this.publicdrawings.length - (amountToKeep || 0)));
			this.publicdrawings.splice(0, this.publicdrawings.length - (amountToKeep || 0));

			this.public.clearAll();
			this.drawDrawings("public", this.publicdrawings);
		};

		Paint.prototype.createCanvas = function createCanvas (name) {
			var canvas = document.createElement("canvas");
			canvas.className = "paint-canvas paint-canvas-" + name;
			return canvas;
		};

		// Invalidate the canvas size
		Paint.prototype.resize = function resize () {
			// for (var cKey = 0; cKey < this.canvasArray.length; cKey++) {
			// 	this.canvasArray[cKey].width = this.canvasArray[cKey].offsetWidth;
			// 	this.canvasArray[cKey].height = this.canvasArray[cKey].offsetHeight;
			// }
			this.public.reinitializeImageSmoothing();
			this.background.reinitializeImageSmoothing();
			this.local.reinitializeImageSmoothing();
			this.redrawAll();

			for (var k = 0; k < this.boundingBoxList.length; k++) {
				this.boundingBoxList[k].boundingBoxCache = this.boundingBoxList[k].getBoundingClientRect();
			}
		};

		Paint.prototype.keypress = function keypress (event) {
			var key = event.keyCode || event.which;

			if (event.target == document.body) {

				if (key == 99) {
					console.log("Pressed C, toggling color selector.");
					$(this.controls.byName["tool-color"].input).spectrum("toggle");
				}

				if (key > 47 && key < 58) {
					var number = key - 48;
					this.setColor(tinycolor(this.current_color.toRgb()).setAlpha(number / 9));
				}

				if (key == 91 || key == 44 || key == 45 || key == 219
				 || key == 186 || key == 96)
					this.changeToolSize(--this.current_size, true);
				
				if (key == 93 || key == 46 || key == 221
				 || key == 187 || key == 43 || key == 61)
					this.changeToolSize(++this.current_size, true);

				if (key == 109)
					this.setHorizontalMirror(this.scale[0] == 1);

				if (key == 107)
					this.setVerticalMirror(this.scale[1] == 1);

				var toolShortcuts = {
					98: "brush",
					103: "grab",
					108: "line",
					112: "picker",
					116: "text",
					118: "picker",
					122: "zoom"
				};

				if (toolShortcuts[key]) {
					console.log("Switching tool to " + toolShortcuts[key]);
					this.changeTool(toolShortcuts[key]);
				}
			}
		};

		Paint.prototype.keydown = function keydown (event) {
			var key = event.keyCode || event.which;
			if (event.target == document.body) {
				this.keyMap[key] = true;		
				
				if ( event.ctrlKey && (key == 32 || this.keyMap[32])) {
					if(this.current_tool !== "zoom") {
						this.previous_tool = this.current_tool;
						this.changeTool("zoom");
					}
					return;
				}

				if (key == 27) {
					this.setRotation(0);
					this.setHorizontalMirror(false);
					this.setVerticalMirror(false);
				}

				if (this.current_tool !== "grab" && this.current_tool !== "select" || this.previous_tool == undefined && key == 32) {
					this.previous_tool = this.current_tool;
					this.changeTool("grab");
				}

				if (this.current_tool !== "picker" && key == 18) {
					this.previous_tool = this.current_tool;
					this.changeTool("picker");
					this.altPressed = true;
				}

				if (event.ctrlKey && event.keyCode == 90) {
					this.undo();
					event.preventDefault();
				}
			}
		};

		Paint.prototype.keyup = function keyup (event) {
			var key = event.keyCode || event.which;
			if (event.target == document.body) {
				this.keyMap[key] = null;
				
				if (this.current_tool == "zoom" && event.ctrlKey || key == 32 || this.keyMap[32]) {
					this.changeTool(this.previous_tool);
					return;
				}

				if (this.current_tool == "grab" && key == 32 && this.previous_tool) {
					this.changeTool(this.previous_tool);
				}
				if (key == 18) {
					this.altPressed = false;
				}
				if (this.current_tool == "picker" && key == 18 && this.previous_tool) {
					this.changeTool(this.previous_tool);
				}
				if (this.current_tool == "select" && key == 46 && typeof this.selectedDrawingIndex !='undefined') {
					this.removeDrawing(this.selectedDrawingIndex);
				}
			}
		};

		Paint.prototype.wheel = function wheel (event) { // <---- new function
			if (this.altPressed) {
				var targetCoords = this.getCoords(event);
				var scaledCoords = this.scaledCoords(targetCoords, event);
				
				var x = scaledCoords[0];
				var y = scaledCoords[1];
				var zoomFactor = 1.1;

				if (event.deltaY < 0){
					//scrolling up
					this.zoomToPoint(this.public.zoom * ( zoomFactor ), x, y);
				} else
				if (event.deltaY > 0){
					//scrolling down
					this.zoomToPoint(this.public.zoom * ( 1 / zoomFactor ), x, y);
				}
			}
		};

		// From, to: [x, y]
		// Returns a data url of the background + public layer
		// Returns a canvas if returnCanvas is true
		Paint.prototype.exportImage = function exportImage (from, to, returnCanvas) {
			var canvas = document.createElement("canvas");
			canvas.width = Math.abs(from[0] - to[0]);
			canvas.height = Math.abs(from[1] - to[1]);

			this.background.drawToCanvas(canvas, from, to);
			this.public.drawToCanvas(canvas, from, to);

			if (returnCanvas) return canvas;
			return canvas.toDataURL();
		};

		Paint.prototype.redrawLocalDrawings = function redrawLocalDrawings () {
			this.redrawLocals();
		};

		// Shedule for the paths to be redrawn in the next frame
		Paint.prototype.redrawPaths = function redrawPaths () {
			if (this.redrawPathsTimeout) return;
			this.redrawPathsTimeout = requestAnimationFrame(this._redrawPaths.bind(this));
		};

		// Shedule for the frames to be redrawn in the next frame
		Paint.prototype.redrawFrames = function redrawFrames () {
			if (this.redrawFramesTimeout) return;
			this.redrawFramesTimeout = requestAnimationFrame(this._redrawFrames.bind(this));
		};

		Paint.prototype._redrawFrames = function _redrawFrames () {
			if (this._framesHaveBeenDrawn) {
				this.framesContext.clearRect(0, 0, this.framesContext.canvas.width, this.framesContext.canvas.height);
				this._framesHaveBeenDrawn = false;
			}

			delete this.redrawFramesTimeout;
			
			for (var k = 0; k < this.frames.length; k++) {
				this.drawFrame(this.frames[k], this.framesContext);
				this._framesHaveBeenDrawn = true;
			}
		};
		Paint.prototype.addBackgroundImage = function addImage (image) {
			this.backgroundImage=image;
			this.drawDrawing("background", {type: 'bgImage',image: image});
		};
		Paint.prototype.clearWorkspace = function clearWorkspace (dontTriggerEvent){
			this.localDrawings =[];
			this.redrawLocals();
			if(!dontTriggerEvent)
			this.dispatchEvent({
				type: "clearWorkspace"
			});
		};
		Paint.prototype.openEqEditor= function openEqEditor (event){
			var that=this;
			var modalHtml='<div class="modal d-block" role="dialog">';
						modalHtml +='<div class="modal-dialog modal-lg">';
							modalHtml +='<div class="modal-content">';
								modalHtml +='<div class="modal-header">';
									modalHtml +='<h2>Equation Editor</h2>';
								modalHtml +='</div>';
								modalHtml +='<div class="modal-body">';
									modalHtml +='<div class="row"><div class="col-sm-12"><div id="currentEquationToolbar"></div></div></div>';
									modalHtml +='<div class="row"><div class="col-sm-12 mt-2"><textarea id="equationBox" class="form-control"></textarea></div></div>';
									modalHtml +='<div class="row"><div class="col-sm-12 text-center mt-2"><img id="equationImage" /></div></div>';
								modalHtml +='</div>';
								modalHtml +='<div class="modal-footer">';
									modalHtml +='<button type="button" class="btn btn-primary copy-val">Select</button>';
									modalHtml +='<button type="button" class="btn btn-default close-editor">Close</button>';
								modalHtml +='</div>';
							modalHtml +='</div>';
						modalHtml +='</div>';
			modalHtml +='</div>';
			var modalBackdropHtml='<div class="modal-backdrop fade show d-block"></div>';
			that.equationModal=$(modalHtml).appendTo('body');
			that.equationModalBackdrop=$(modalBackdropHtml).appendTo('body');

			that.equationEditor=new EqTextArea('equationImage', 'equationBox');
			EqEditor.moveto('currentEquationToolbar');
			EqEditor.add(that.equationEditor,true); 
			that.equationModal.find('#equationBox').focus();

			that.equationModal.find('#currentEquationToolbar .panel map area').mouseover(function(e){
				that.equationModal.find('#currentEquationToolbar #hover').css({'left': $(this).position().left,'top': $(this).position().top});
			});
			that.equationModal.find('.close-editor').click(function(){
				EqEditor.moveto('equationToolbar');
				that.equationModal.remove();
				that.equationModalBackdrop.remove();
			});
			that.equationModal.find('.copy-val').click(function(){
				EqEditor.moveto('equationToolbar');
				that.currentEquation=that.equationEditor.exportEquation('safe');
				
				if(that.currentEquation === '') return;

				that.currentEquationImage=$('<img style="position: absolute;" src="https://latex.codecogs.com/png.latex?'+that.currentEquation+'">').appendTo('.right-sidebar');
				that.currentEquationImage.hide();

				that.changeTool(event);
				that.equationModal.remove();
				that.equationModalBackdrop.remove();
			});
		};
		Paint.prototype.showGrid = function showGrid (show,dontTriggerEvent) {
			if(!dontTriggerEvent)
			this.dispatchEvent({
				type: "grid",
				show: !this.gridVisible
			});
			if(typeof show == 'string'){
				this.gridVisible=!this.gridVisible;
			}else{
				this.gridVisible=show;
			}
			this.drawDrawing("gridC", {type: 'grid',showGrid: this.gridVisible});
		};

		Paint.prototype.drawGrid = function drawGrid (){
			this.drawDrawing("gridC", {type: 'grid',showGrid: this.gridVisible});
		};
		Paint.prototype.drawImage = function drawImage (){
			if(!this.backgroundImage) return;
			// Force the redrawing of locals in this frame
			this.drawDrawing.bind({type: 'bgImage',image: this.backgroundImage}, "background")
			this.background.redrawOnce();
		};
		Paint.prototype.drawFrame = function drawFrame (frame, framesContext) {
			// TODO: Optimization possibility: only draw frames that are in vision
			if (frame.disabled) return;
			
			var to = [frame.leftTop[0] + frame.width, frame.leftTop[1] + frame.height];
			var frameCanvas = this.exportImage(frame.leftTop, to, true);
			
			var relativeX = frame.leftTop[0] - this.public.leftTopX + frame.shift;
			var relativeY = frame.leftTop[1] - this.public.leftTopY;
			
			framesContext.globalAlpha = frame.opacity;
			framesContext.drawImage(frameCanvas, relativeX * this.public.zoom, relativeY * this.public.zoom, frameCanvas.width * this.public.zoom, frameCanvas.height * this.public.zoom);
		};

		Paint.prototype._redrawPaths = function _redrawPaths () {
			// only drawing on local
			return;
			this.pathContext.clearRect(0, 0, this.pathContext.canvas.width, this.pathContext.canvas.height);
			delete this.redrawPathsTimeout;

			for (var pathId in this.paths) {
				this.drawPath(this.paths[pathId]);
			}

			for (var pathId = 0; pathId < this.localUserPaths.length; pathId++) {
				this.drawPath(this.localUserPaths[pathId]);
			}
		};

		Paint.prototype.drawImageTiledCanvas = function drawImageTiledCanvas (image, ctx, tiledCanvas) {
			ctx.drawImage(this, ctx.canvas.width / 2 - imgWidth / 2, ctx.canvas.height / 2 - img.height / 2, imgWidth, imgHeight);
			tiledCanvas.drawingRegion(minX, minY, maxX, maxY, path.size);
			tiledCanvas.execute();
		};
		Paint.prototype.erasePathTiledCanvas = function erasePathTiledCanvas (path, ctx, tiledCanvas) {
			var minX = path.points[0][0],
			    minY = path.points[0][1],
			    maxX = path.points[0][0],
			    maxY = path.points[0][1];

			ctx.save();
			// Start on the first point
			ctx.beginPath();
			ctx.globalCompositeOperation="destination-out";
			ctx.moveTo(path.points[0][0], path.points[0][1] + this.FIX_CANVAS_PIXEL_SIZE); // Might not be necessary

			// Connect a line between all points
			for (var pointId = 1; pointId < path.points.length; pointId++) {
				ctx.lineTo(path.points[pointId][0], path.points[pointId][1] + this.FIX_CANVAS_PIXEL_SIZE); // Might not be necessary

				minX = Math.min(path.points[pointId][0], minX);
				minY = Math.min(path.points[pointId][1], minY);
				maxX = Math.max(path.points[pointId][0], maxX);
				maxY = Math.max(path.points[pointId][1], maxY);
			}

			ctx.lineWidth = path.size; // Might not be necessary

			ctx.lineCap = "round";

			ctx.stroke();
			ctx.closePath();
			ctx.restore();
			
			tiledCanvas.drawingRegion(minX, minY, maxX, maxY, path.size);
			tiledCanvas.execute();
			
			if (tiledCanvas == this.public || tiledCanvas == this.background)
				this.redrawFrames();
		};

		Paint.prototype.erasePath = function erasePath (path, ctx, tiledCanvas) {
			var ctx = ctx || this.pathContext;
			if (!path.points || !path.points[0]) return;

			if (tiledCanvas) {
				this.erasePathTiledCanvas(path, ctx, tiledCanvas);
				return;
			}

			ctx.save();
			// Start on the first point
			ctx.beginPath();
			ctx.globalCompositeOperation="destination-out";
			var x = path.points[0][0] - this.public.leftTopX,
			    y = path.points[0][1] - this.public.leftTopY;
			ctx.moveTo(x * this.local.zoom, y * this.local.zoom + this.FIX_CANVAS_PIXEL_SIZE);

			var minX = Infinity;
			var minY = Infinity;
			var maxX = -Infinity;
			var maxY = -Infinity;

			// Connect a line between all points
			for (var pointId = 1; pointId < path.points.length; pointId++) {
				var x = path.points[pointId][0] - this.public.leftTopX,
				    y = path.points[pointId][1] - this.public.leftTopY;
				ctx.lineTo(x * this.local.zoom, y * this.local.zoom + this.FIX_CANVAS_PIXEL_SIZE);
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
			}

			ctx.lineWidth = path.size * this.local.zoom;

			ctx.lineJoin = "round";
			ctx.lineCap = "round";

			ctx.stroke();
			ctx.closePath();
			ctx.restore();
			ctx.lineJoin = "miter";
			ctx.lineCap = "butt";
		};

		Paint.prototype.drawPathTiledCanvas = function drawPathTiledCanvas (path, ctx, tiledCanvas) {
			var minX = path.points[0][0],
			    minY = path.points[0][1],
			    maxX = path.points[0][0],
			    maxY = path.points[0][1];

			// Start on the first point
			ctx.beginPath();
			ctx.moveTo(path.points[0][0], path.points[0][1] + this.FIX_CANVAS_PIXEL_SIZE); // Might not be necessary

			// Connect a line between all points
			for (var pointId = 1; pointId < path.points.length; pointId++) {
				ctx.lineTo(path.points[pointId][0], path.points[pointId][1] + this.FIX_CANVAS_PIXEL_SIZE); // Might not be necessary

				minX = Math.min(path.points[pointId][0], minX);
				minY = Math.min(path.points[pointId][1], minY);
				maxX = Math.max(path.points[pointId][0], maxX);
				maxY = Math.max(path.points[pointId][1], maxY);
			}

			ctx.strokeStyle = path.color.toRgbString();
			ctx.lineWidth = path.size; // Might not be necessary

			ctx.lineCap = "round";

			ctx.stroke();
			ctx.closePath();

			tiledCanvas.drawingRegion(minX, minY, maxX, maxY, path.size);
			tiledCanvas.execute();
			
			if (tiledCanvas == this.public || tiledCanvas == this.background)
				this.redrawFrames();
		};

		Paint.prototype.drawPath = function drawPath (path, ctx, tiledCanvas) {
			var ctx = ctx || this.pathContext;
			if (!path.points || !path.points[0]) return;

			if (tiledCanvas) {
				this.drawPathTiledCanvas(path, ctx, tiledCanvas);
				return;
			}
			// Start on the first point
			ctx.beginPath();
			var x = path.points[0][0] - this.public.leftTopX,
			    y = path.points[0][1] - this.public.leftTopY;
			ctx.moveTo(x * this.local.zoom, y * this.local.zoom + this.FIX_CANVAS_PIXEL_SIZE);

			var minX = Infinity;
			var minY = Infinity;
			var maxX = -Infinity;
			var maxY = -Infinity;

			// Connect a line between all points
			for (var pointId = 1; pointId < path.points.length; pointId++) {
				var x = path.points[pointId][0] - this.public.leftTopX,
				    y = path.points[pointId][1] - this.public.leftTopY;
				ctx.lineTo(x * this.local.zoom, y * this.local.zoom + this.FIX_CANVAS_PIXEL_SIZE);
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
			}

			if (path.color.type == "gradient") {
				var lastX = path.points[path.points.length - 1][0];
				var lastY = path.points[path.points.length - 1][1];

				var gradient = ctx.createLinearGradient(minX, 0,
				                                        maxX, 0);

				for (var k = 0; k < path.color.length; k++) {
					gradient.addColorStop(path.color[k].pos, path.color[k].color);
				}

				ctx.strokeStyle = gradient;
			} else {
				path.color = tinycolor(path.color);
				ctx.strokeStyle = path.color.toRgbString();
			}

			ctx.lineWidth = path.size * this.local.zoom;

			ctx.lineJoin = "round";
			ctx.lineCap = "round";

			ctx.stroke();
			ctx.closePath();
			ctx.lineJoin = "miter";
			ctx.lineCap = "butt";
		};

		Paint.prototype.redrawLocals = function redrawLocals (noclear) {
			if(!this.localDrawings) return;
			// Force the redrawing of locals in this frame
			this.local.clearAll();
			this.localDrawings.forEach(this.drawDrawing.bind(this, "local"));

			this.local.redrawOnce();
		}

		Paint.prototype.removeLocalDrawing = function removeLocalDrawing (drawing) {
			var index = this.localDrawings.indexOf(drawing);
			this.localDrawings.splice(index, 1);
			this.redrawLocalDrawings();
		};

		// From, to: [0, 0]
		// frames: number of frames
		Paint.prototype.addFrame = function addFrame (from, to, frames, opacity, gutter, shift, customWidth) {
			var width = Math.abs(from[0] - to[0]);
			this.frames.push({
				leftTop: [Math.min(from[0], to[0]), Math.min(from[1], to[1])],
				width: customWidth || width,
				height: Math.abs(from[1] - to[1]),
				shift: shift || (width / frames),
				opacity: opacity,
				gutter: gutter || 0
			});
			this.redrawFrames();
		};

		Paint.prototype.addPublicDrawings = function addPublicDrawings (drawings) {
			for (var k = 0; k < drawings.length; k++) this.addPublicDrawing(drawings[k]);
		};

		Paint.prototype.addPublicDrawing = function addPublicDrawing (drawing) {
			this.publicdrawings.push(drawing);
			this.drawDrawing("public", drawing);
			this.redrawFrames();
		};

		Paint.prototype.undodrawings = function undodrawings (socketid, all) {
			for (var k = this.publicdrawings.length - 1; k >= 0; k--) {
				if (this.publicdrawings[k].id == socketid || this.publicdrawings[k].socketid == socketid) {
					this.publicdrawings.splice(k, 1);

					if (!all) break;
				}
			}

			this.public.clearAll();
			this.drawDrawings("public", this.publicdrawings);
			this.redrawFrames();
		};

		Paint.prototype.undo = function undo (dontTriggerEvent) {
			this.localDrawings.pop();
			this.redrawLocals();
			if(!dontTriggerEvent)
			this.dispatchEvent({
				type: "undo"
			});
		};

		Paint.prototype.addPath = function addPath (id, props) {
			this.paths[id] = props;
			this.paths[id].points = this.paths[id].points || [];
			this.redrawPaths();
			this.redrawFrames();
		};

		Paint.prototype.addPathPoint = function addPathPoint (id, point) {
			if (!this.paths[id]) {
				console.error("Path ", id, " not known. Can't add point.");
				return;
			}

			this.paths[id].points.push(point);
			this.redrawPaths();
			this.redrawFrames();
		};

		Paint.prototype.generateGrid = function generateGrid (leftTop, squares, sqwidth, sqheight, gutter) {
			for (var k = 0; k < squares; k++) {
				var localLeftTop = [leftTop[0] + k * sqwidth + k * gutter, leftTop[1]];
				this.addUserPath();
				this.addUserPathPoint(localLeftTop);
				this.addUserPathPoint([localLeftTop[0] + sqwidth, localLeftTop[1]]);
				this.addUserPathPoint([localLeftTop[0] + sqwidth, localLeftTop[1] + sqheight]);
				this.addUserPathPoint([localLeftTop[0]          , localLeftTop[1] + sqheight]);
				this.addUserPathPoint(localLeftTop);
				this.endUserPath();
			}
		};

		Paint.prototype.previewGrid = function previewGrid (leftTop, squares, sqwidth, sqheight, gutter) {
			var context = this.effectsCanvasCtx;
			context.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
			var x = (leftTop[0] - this.public.leftTopX) * this.public.zoom,
			    y = (leftTop[1] - this.public.leftTopY) * this.public.zoom;
			context.setLineDash([]); // overwrite the selection tool line dash effect
			for (var k = 0; k < squares; k++) {
				var localLeftTop = [x + k * sqwidth * this.public.zoom + k * gutter * this.public.zoom, y];
				context.beginPath();

				context.rect(localLeftTop[0], localLeftTop[1], sqwidth * this.public.zoom, sqheight * this.public.zoom);
				context.lineWidth = this.current_size * this.public.zoom;
				context.strokeStyle = this.current_color.toRgbString();
				context.stroke();
			}
		};

		// Draw the given path on the public layer and remove it
		Paint.prototype.finalizePath = function finalizePath (id) {
			if (!this.paths[id]) {
				return;
			}

			this.drawPath(this.paths[id], this.public.context, this.public);
			this.publicdrawings.push(this.paths[id]);
			this.removePath(id);
		};

		Paint.prototype.removePath = function removePath (id) {
			delete this.paths[id];
			this.redrawPaths();
		};

		// Remove the given point of the given path
		// Returns true if removed, false if not
		Paint.prototype.removePathPoint = function removePathPoint (id, point) {
			for (var k = this.paths.points.length - 1; k >= 0; k++) {
				if (this.paths.points[k] == point) {
					this.paths.points.splice(k, 1);
					this.redrawPaths();
					return true;
				}
			}

			return false;
		};
		Paint.prototype.addHighlight = function addHighlight (drawing) {
			let paint=this;
			paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
			let context=paint.effectsCanvasCtx;
			context.globalCompositeOperation="source-over";
			for (var i = 1; i < drawing.points.length; i ++){
		  	context.beginPath();
				context.fillStyle = drawing.color;
				context.lineWidth = drawing.size;
				context.moveTo(drawing.points[i-1][0], drawing.points[i-1][1]);
				context.lineTo(drawing.points[i][0], drawing.points[i][1]);			
				context.strokeStyle = drawing.color;
				context.lineWidth = drawing.size;
				context.lineJoin = "round";
				context.lineCap = "round";
				context.stroke();
				context.closePath();
		  }
		};
		Paint.prototype.removeDrawing = function removeDrawing (selectedIndex, dontTriggerEvent){
			if(this.localDrawings[selectedIndex]){
				this.localDrawings.splice(selectedIndex,1);
				this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
				this.redrawLocals();
				this.hideDrawingControls();
				
				if(!dontTriggerEvent)
				this.dispatchEvent({
					type: "removedrawing",
					index: selectedIndex
				});
			}
		};
		Paint.prototype.addDrawing = function addDrawing (drawing) {
			this.localDrawings.push(drawing);
			drawing.color=tinycolor(drawing.color);
			drawing.stroke_color=tinycolor(drawing.stroke_color);
			this.drawDrawing("local", drawing);
		};
		// Function that should be called when a new drawing is added
		// because of a user interaction. Calls the userdrawing event
		Paint.prototype.addUserDrawing = function addUserDrawing (drawing) {
			let tempDrawing=Object.assign({},drawing);
			tempDrawing.color=drawing.color.toRgbString();
			if(drawing.stroke_color) tempDrawing.stroke_color=drawing.stroke_color.toRgbString();
			this.addDrawing(drawing);
			this.dispatchEvent({
				type: "userdrawing",
				drawing: tempDrawing,
				removeDrawing: this.removeLocalDrawing.bind(this, drawing)
			});
		};

		// Functions for the current eraser path (eraser path = path we are drawing)
		Paint.prototype.addEraserPath = function addEraserPath (color) {
			this.localEraserPaths.push({
				type: "eraser",
				color: color ||this.current_color,
				size: this.current_size
			});
			//this.drawPath(this.localUserPaths[this.localUserPaths.length -1]);
			this.dispatchEvent({
				type: "starteraserpath",
				props: this.localEraserPaths[this.localEraserPaths.length - 1]
			});
		};

		Paint.prototype.addEraserPathPoint = function addEraserPathPoint (point) {
			var lastPath = this.localEraserPaths[this.localEraserPaths.length - 1];
			lastPath.points = lastPath.points || [];
			lastPath.points.push(point);

			this.dispatchEvent({
				type: "eraserpathpoint",
				point: point
			});
			this.erasePath(lastPath,this.effectsCanvasCtx);
		};

		Paint.prototype.endEraserPath = function endEraserPath (final) {
			var lastPath = this.localEraserPaths[this.localEraserPaths.length - 1];
			
			if (typeof lastPath === 'undefined')
				return;
			
			this.dispatchEvent({
				type: "enderaserpath"
			});
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
			if(final) this.addUserDrawing(lastPath)
			this.erasePath(lastPath,this.local.context,this.local);
		};
		// Functions for the current user path (user path = path we are drawing)
		Paint.prototype.addUserPath = function addUserPath (color) {
			this.localUserPaths.push({
				type: "path",
				color: color ||this.current_color,
				size: this.current_size
			});
			//this.drawPath(this.localUserPaths[this.localUserPaths.length -1]);
			this.dispatchEvent({
				type: "startuserpath",
				props: this.localUserPaths[this.localUserPaths.length - 1]
			});
		};

		Paint.prototype.addUserPathPoint = function dispatchPathPoint (point) {
			var lastPath = this.localUserPaths[this.localUserPaths.length - 1];
			lastPath.points = lastPath.points || [];
			lastPath.points.push(point);

			this.dispatchEvent({
				type: "userpathpoint",
				point: point,
				removePathPoint: this.removeUserPathPoint.bind(this, lastPath, point)
			});
			this.drawPath(lastPath,this.effectsCanvasCtx);
		};

		Paint.prototype.endUserPath = function endUserPath () {
			var lastPath = this.localUserPaths[this.localUserPaths.length - 1];
			
			if (typeof lastPath === 'undefined')
				return;
			
			this.dispatchEvent({
				type: "enduserpath",
				removePath: this.removeUserPath.bind(this, lastPath)
			});
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
			this.addUserDrawing(lastPath)
			this.drawPath(lastPath,this.local.context,this.local);
		};

		Paint.prototype.removeUserPathPoint = function removeUserPathPoint (path, point) {
			for (var k = 0; k < path.points.length; k++) {
				if (path.points[k] == point) {
					path.points.splice(k, 1);
					return;
				}
			}
		};

		Paint.prototype.removeUserPath = function removeUserPath (path, finalize, id) {
			path.socketid = id;
			this.publicdrawings.push(path);
			for (var k = 0; k < this.localUserPaths.length; k++) {
				if (this.localUserPaths[k] == path) {
		            if (finalize)
		                this.drawPath(path, this.public.context, this.public);

					this.localUserPaths.splice(k, 1);
					this.redrawPaths();
					return true;
				}
			}

			return false;
		};

		// Put the drawings on the given layer ('background', 'public', 'local', 'effects')
		// This function forces a redraw after the drawings have been added
		Paint.prototype.drawDrawings = function drawDrawings (layer, drawings) {
			for (var dKey = 0; dKey < drawings.length; dKey++) {
				if (typeof this.drawFunctions[drawings[dKey].type] == "function")
					this.drawFunctions[drawings[dKey].type].call(this, this[layer].context, drawings[dKey], this[layer]);
				else if (drawings[dKey].points)
					this.drawFunctions.path.call(this, this[layer].context, drawings[dKey], this[layer]);
				else
					console.error("Unknown drawing", drawings[dKey]);

			}
			
			this[layer].redrawOnce();
		};

		// Put the drawing on the given layer ('background', 'public', 'local', 'effects','gridC')
		// This function only redraws at the next browser drawframe
		Paint.prototype.drawDrawing = function drawDrawing (layer, drawing) {
			this.drawFunctions[drawing.type].call(this, this[layer].context, drawing, this[layer]);
			if(typeof this[layer].redrawOnce =='function') this[layer].redrawOnce();
		};

		// User interaction on the canvas
		Paint.prototype.exectool = function exectool (event) {
			// Don't do the default stuff
			if (event && typeof event.preventDefault == "function")
				event.preventDefault();
			
			if (event.type == "mousedown") {
				if (event.button === 0) {
					this.leftClick = true;
				}
				if (event.button === 2) {
					this.rightClick = true;
				}
			}
			else if (event.type == "mouseup") {
				if (event.button === 0) {
					this.leftClick = false;
				}
				if (event.button === 2) {
					this.rightClick = false;
				}
			}

			if (typeof this.tools[this.current_tool] == "function") {
				if (this.rightClick && event.altKey) { // right click
					this.tools["change_size"](this, event);
				} else if (this.leftClick && this.keyMap[82]) {
					this.tools["change_rotation"](this, event);
				}
				else
					this.tools[this.current_tool](this, event);
			}

			if (typeof event == "object") {
				var coords = this.getCoords(event);
				coords = this.scaledCoords(coords, event);
				coords[0] = this.local.leftTopX + (coords[0] / this.local.zoom);
				coords[1] = this.local.leftTopY + (coords[1] / this.local.zoom);

				if(this.settings.showMouseCords) this.setMouseCoords(coords[0], coords[1]);
			}

			if (document.activeElement && document.activeElement !== this.textToolInput)
				document.activeElement.blur();
		};

		Paint.prototype.changeTool = function changeTool (tool) {
			this.exectool("remove");
			this.current_tool = tool;
			delete this.selectedDrawingIndex;
			this.hideDrawingControls();
			this.trianglePoints=null;
			this.effectsCanvas.style.opacity=1;
			if(this.clearHighlightTimer) clearTimeout(this.clearHighlightTimer);
			if(tool=='highlight') this.effectsCanvas.style.opacity=0.5;
			
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);

			for (var name in this.controls.byName)
				this.controls.byName[name].input.classList.remove("paint-selected-tool");
			if(this.controls.byName[tool].input) this.controls.byName[tool].input.classList.add("paint-selected-tool");
			this.exectool("setup");
		};

		Paint.prototype._changeStrokeColor = function _changeStrokeColor (color) {
			this.current_stroke_color = tinycolor(color);
			this.currentColorMode = "color";
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
		};

		Paint.prototype._changeColor = function _changeColor (color) {
			this.current_color = tinycolor(color);
			this.currentColorMode = "color";
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
		};

		// Change gradient coming from the gradientcreator
		Paint.prototype._changeGradient = function _changeGradient (event) {
			this.current_color = event.stops;
			this.current_color.type = "gradient";
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
		};

		Paint.prototype.changeToolSize = function changeToolSize (size, setinput) {
			if (this.brushing) return;

			if (size > this.settings.maxSize) size = this.settings.maxSize;
			if (size <= 1) size = this.MIN_PATH_WIDTH;
			if (size == 2.001) size = 2;

			this.current_size = parseFloat(size);
			
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);

			if (setinput) {
				this.controls.byName["tool-size"].input.value = size;
				// this.controls.byName["tool-size"].integerOutput.textContent = (size==this.MIN_PATH_WIDTH) ? '1' : size; // display 1 instead of min path size fraction
			}
			if (this.lastMovePoint) {
				var context = this.effectsCanvasCtx;
				context.beginPath();
				context.arc(this.lastMovePoint[0], this.lastMovePoint[1], (this.current_size * this.local.zoom) / 2, 0, 2 * Math.PI, true);
				context.fillStyle = this.current_color.toRgbString();
				context.fill();
			}
		};
		Paint.prototype.changeStrokeSize = function changeStrokeSize (size, setinput) {
			if (this.brushing) return;

			if (size > this.settings.maxSize) size = this.settings.maxSize;
			if (size <= 1) size = this.MIN_PATH_WIDTH;
			if (size == 2.001) size = 2;

			this.current_stroke_size = parseFloat(size);
			
			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);

			if (setinput) {
				this.controls.byName["tool-strokesize"].input.value = size;
				// this.controls.byName["tool-size"].integerOutput.textContent = (size==this.MIN_PATH_WIDTH) ? '1' : size; // display 1 instead of min path size fraction
			}
			if (this.lastMovePoint) {
				var context = this.effectsCanvasCtx;
				context.beginPath();
				context.arc(this.lastMovePoint[0], this.lastMovePoint[1], (this.current_stroke_size * this.local.zoom) / 2, 0, 2 * Math.PI, true);
				context.fillStyle = this.current_stroke_color.toRgbString();
				context.fill();
			}
		};

		Paint.prototype.setColor = function setColor (color) {
			if (this.brushing) return;
			this._changeColor(color);
			$(this.controls.byName["tool-color"].input).spectrum("set", this.current_color);
		};
		
		Paint.prototype.setStrokeColor = function setStrokeColor (color) {
			if (this.brushing) return;
			this._changeStrokeColor(color);
			$(this.controls.byName["tool-strokecolor"].input).spectrum("set", this.current_stroke_color);
		};

		Paint.prototype.createControlArray = function createControlArray () {
			return [{
				name: "hide-tools",
				type: "button",
				html: "i",
				place: "bottom",
				classAppend: "hide-tool",
				elemClass: "tool-item fa fa-angle-double-down",
				title: "Toggle control bar",
				value: "hide-tool",
				action: function(e){
					let classes=document.querySelector('.content-tabs.d-block').querySelector('.controls-bottom').classList;
					if(classes.contains('hideMe')){
						classes.remove('hideMe');	
					}else{
						classes.add('hideMe');
					}
				}
			}, {
				name: "grab",
				type: "button",
				html: "i",
				place: "bottom",
				elemClass: "tool-item fa fa-hand-paper",
				title: "Change tool to grab",
				value: "grab",
				action: this.changeTool.bind(this)
			}, {
				name: "select",
				type: "button",
				html: "i",
				place: "left",
				elemClass: "tool-item tool-select fa fa-mouse-pointer",
				title: "Change tool to select shape",
				value: "select",
				action: this.changeTool.bind(this)
			}, {
				/* Always place group container control first before entering place(shapes) as it's value(shapes)*/
				name: "shapes",
				type: "group",
				html: "i",
				place: "left",
				elemClass: "tool-item fa fa-shapes",
				title: "Select shape to draw",
				value: "shapes",
				action: _=>{}
			}, {
				name: "line",
				type: "button",
				html: "i",
				place: "shapes",
				elemClass: "tool-item fa fa-slash",
				title: "Change tool to line",
				value: "line",
				action: this.changeTool.bind(this)
			}, {
				name: "arrow",
				type: "button",
				html: "i",
				place: "shapes",
				elemClass: "tool-item tool-arrow",
				title: "Change tool to arrow",
				value: "arrow",
				action: this.changeTool.bind(this)
			}, {
				name: "circle",
				type: "button",
				html: "i",
				place: "shapes",
				elemClass: "tool-item tool-circle",
				title: "Change tool to circle",
				value: "circle",
				action: this.changeTool.bind(this)
			}, {
				name: "ellipse",
				type: "button",
				html: "i",
				place: "shapes",
				elemClass: "tool-item tool-pen",
				title: "Change tool to bezier curve, Double click when finished",
				value: "ellipse",
				action: this.changeTool.bind(this)
			}, {
				name: "triangle",
				type: "button",
				html: "i",
				place: "shapes",
				elemClass: "tool-item tool-triangle",
				title: "Change tool to triangle",
				value: "triangle",
				action: this.changeTool.bind(this)
			}, {
				name: "rhombus",
				type: "button",
				html: "i",
				place: "shapes",
				elemClass: "tool-item tool-rectangle",
				title: "Change tool to rhombus",
				value: "rhombus",
				action: this.changeTool.bind(this)
			}, {
				name: "brush",
				type: "button",
				html: "i",
				place: "left",
				elemClass: "tool-item tool-brush",
				title: "Change tool to brush",
				value: "brush",
				action: this.changeTool.bind(this)
			}, {
				name: "highlight",
				type: "button",
				html: "i",
				place: "left",
				elemClass: "tool-item tool-highlight fa fa-highlighter fa-2x",
				title: "Change tool to highlight",
				value: "highlight",
				action: this.changeTool.bind(this)
			}, {
				name: "text",
				type: "button",
				html: "i",
				place: "left",
				elemClass: "tool-item tool-text",
				title: "Change tool to text",
				value: "text",
				action: this.changeTool.bind(this)
			}, {
				name: "eraser",
				type: "button",
				html: "i",
				place: "left",
				elemClass: "tool-item tool-eraser",
				title: "Change tool to eraser",
				value: "eraser",
				action: this.changeTool.bind(this)
			},/* {
				name: "picker",
				type: "button",
				html: "i",
				elemClass: "fa fa-eye-dropper",
				title: "Change tool to picker",
				value: "picker",
				action: this.changeTool.bind(this)
			}, *//*{
				name: "select",
				type: "button",
				html: "i",
				elemClass: "fas fa-search",
				title: "Change tool to select",
				value: "select",
				action: this.changeTool.bind(this)
			}, {
				name: "block",
				type: "button",
				image: "images/icons/block.png",
				title: "Change tool to block",
				value: "block",
				action: this.changeTool.bind(this)
			},*/
			 {
				name: "tool-strokesize",
				type: "group",
				html: "i",
				place: "left",
				elemClass: "tool-item  fa fa-fill",
				title: "Select stroke size",
				value: "strokesize",
				action: _=>{}
			},
			 {
				name: "tool-line",
				place: "strokesize",
				type: "html",
				text: "Stroke size",
				value: '<span class="tool-item align-middle d-table-cell"><hr class="border-dark m-0" style="border-width: 4px;"/></span>',
				action: _=>{}
			},
			{
				name: "tool-strokesize",
				place: "strokesize",
				type: "integer",
				range: false,
				text: "Tool stroke size",
				min: 1,
				max: this.defaultSettings.maxSize,
				value: 5,
				title: "Change the stroke size of the tool",
				action: this.changeStrokeSize.bind(this)
			},
			{
				name: "tool-size",
				type: "group",
				html: "i",
				place: "left",
				elemClass: "tool-item fa fa-pen-nib",
				title: "Select tool size",
				value: "toolsize",
				action: _=>{}
			},
			 {
				name: "tool-fillcircle",
				place: "toolsize",
				type: "html",
				text: "Stroke size",
				value: '<span class="tool-item fa fa-circle"></span>',
				action: _=>{}
			}, 
			 {
				name: "tool-size",
				place: "toolsize",
				type: "integer",
				range: false,
				text: "Tool size",
				min: 1,
				max: this.defaultSettings.maxSize,
				value: 5,
				title: "Change the tool size",
				action: this.changeToolSize.bind(this)
			}, {
				name: "zoom-in",
				type: "button",
				html: "i",
				place: "bottom",
				elemClass: "tool-item fas fa-search-plus",
				title: "Drag tool to zoom in/out",
				value: 1.2,
				action: this.zoom.bind(this)
			}, {
				name: "zoom-out",
				place: "bottom",
				type: "button",
				html: "i",
				elemClass: "tool-item fas fa-search-minus",
				title: "Reset zoom",
				value: 1 / 1.2,
				action: this.zoom.bind(this)
			},
			/* {
				name: "zoom-in",
				type: "button",
				html: "i",
				elemClass: "fas fa-search-plus",
				title: "Zoom in",
				value: 1.2,
				action: this.zoom.bind(this)
			}, {
				name: "zoom-out",
				type: "button",
				html: "i",
				elemClass: "fas fa-search-minus",
				title: "Zoom out",
				value: 1 / 1.2,
				action: this.zoom.bind(this)
			}, */{
				name: "tool-color",
				type: "color",
				text: "Tool color",
				value: "#FFFFFF",
				place: "bottom",
				title: "Change the color of the tool",
				action: this._changeColor.bind(this)
			}, {
				name: "tool-strokecolor",
				type: "color",
				text: "Tool stroke color",
				value: "#FFFFFF",
				place: "bottom",
				title: "Change the stroke color of the tool",
				action: this._changeStrokeColor.bind(this)
			}, {
				name: "eqeditor",
				type: "button",
				html: "i",
				elemClass: "tool-item fas fa-subscript",
				place: "left",
				value: 'eqeditor',
				title: "Add mathematical equation to the workspace",
				action: this.openEqEditor.bind(this)
			}, {
				name: "tool-grid",
				type: "button",
				html: "i",
				elemClass: "tool-item fas fa-th",
				value: "true",
				place: "left",
				title: "Toggle Grid",
				action: this.showGrid.bind(this)
			}, {
				name: "undo",
				type: "button",
				html: "i",
				place: "bottom",
				elemClass: "tool-item fa fa-undo-alt",
				title: "Undo drawing",
				action: this.undo.bind(this)
			},{
				name: "tool-clear",
				type: "button",
				html: "i",
				elemClass: "tool-item fa fa-trash",
				place: "left",
				title: "Clear Workspace",
				action: this.clearWorkspace.bind(this)
			}/*, {
				name: "gradient",
				type: "gradient",
				action: this._changeGradient.bind(this)
			}*/];
		};
		Paint.prototype.setLocalZoom = function setLocalZoom (zoom){
			this.local.zoom=zoom;
		}
		Paint.prototype.zoom = function zoom (zoomFactor, dontTriggerEvent) {
			if(!dontTriggerEvent)
			this.dispatchEvent({
				type: "zoom",
				zoomFactor: zoomFactor,
				zoom: this.local.zoom
			});
			this.zoomAbsolute(this.local.zoom * zoomFactor,!dontTriggerEvent);
		};

		Paint.prototype.zoomToPoint = function zoomToPoint(zoomFactor, pointX, pointY){
			if((zoomFactor>0.98)&&(zoomFactor<1.02)) zoomFactor=1;
			if (zoomFactor < 0.1) zoomFactor = 0.1;
			
			pointX = this.local.leftTopX + (pointX / this.local.zoom);
			pointY = this.local.leftTopY + (pointY / this.local.zoom);
			
			var ratioX = (pointX - this.local.leftTopX) / (this.canvasArray[0].width / this.local.zoom);
			var ratioY = (pointY - this.local.leftTopY) / (this.canvasArray[0].height / this.local.zoom);
			
			var newX = pointX - ((ratioX * this.canvasArray[0].width) / zoomFactor);
			var newY = pointY - ((ratioY * this.canvasArray[0].height) / zoomFactor);
			
			if(zoomFactor==1){
				newX=Math.round(newX)
				newY=Math.round(newY)
			}
			
			this.local.absoluteZoom(zoomFactor);
			this.background.absoluteZoom(zoomFactor);
			
			this.goto(newX, newY,!dontTriggerEvent);

			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
			this.redrawPaths();
			this.redrawFrames();
		}

		Paint.prototype.zoomAbsolute = function zoomAbsolute (zoomFactor, dontTriggerEvent) {
			if((zoomFactor>0.98)&&(zoomFactor<1.02)) zoomFactor=1;
			if (zoomFactor < 0.1) zoomFactor = 0.1;
			var currentMiddleX = this.local.leftTopX + this.canvasArray[0].width / this.local.zoom / 2;
			var currentMiddleY = this.local.leftTopY + this.canvasArray[0].height / this.local.zoom / 2;

			var newX = currentMiddleX - this.canvasArray[0].width / zoomFactor / 2;
			var newY = currentMiddleY - this.canvasArray[0].height / zoomFactor / 2;
			
			if(zoomFactor==1){
				newX=Math.round(newX)
				newY=Math.round(newY)
			}

			this.local.absoluteZoom(zoomFactor);
			this.background.absoluteZoom(zoomFactor);
			
			if(dontTriggerEvent) this.goto(newX, newY);

			this.effectsCanvasCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
			this.redrawPaths();
			this.redrawFrames();
		};

		// Get the coordinates of the event relative to the upper left corner of the target element
		Paint.prototype.getCoords = function getCoords (event) {
			// If there is no clientX/Y (meaning no mouse event) and there are no changed touches
			// meaning no touch event, then we can't get the coords relative to the target element
			// for this event
			if ((typeof event.clientX !== "number" && (!event.changedTouches || !event.changedTouches[0])) ||
				(typeof event.clientY !== "number" && (!event.changedTouches || !event.changedTouches[0])))
				return [0, 0];


			// Return the coordinates relative to the target element
			var clientX = (typeof event.clientX === 'number') ? event.clientX : event.changedTouches[0].clientX,
			    clientY = (typeof event.clientY === 'number') ? event.clientY : event.changedTouches[0].clientY,
			    target = event.target || document.elementFromPoint(clientX, clientY);

			if (this.boundingBoxList.indexOf(target) == -1)
				this.boundingBoxList.push(target);

			target.boundingBoxCache = (target.boundingBoxCache && target.boundingBoxCache.left > 0) ? target.boundingBoxCache : target.getBoundingClientRect();
			var relativeX = clientX - target.boundingBoxCache.left,
			    relativeY = clientY - target.boundingBoxCache.top;

			return [relativeX, relativeY];
		};

		// TODO: Fix rotation and mirror
		Paint.prototype.getColorAt = function getColorAt (point) {
			for (var cKey = 0; cKey < this.canvasArray.length; cKey++) {
				this.tempPixelCtx.drawImage(this.canvasArray[cKey], point[0], point[1], 1, 1, 0, 0, 1, 1);
			}

			var pixel = this.tempPixelCtx.getImageData(0, 0, 1, 1).data;

			return tinycolor(this.rgbToHex(pixel[0], pixel[1], pixel[2]));
		};

		Paint.prototype.scaledCoords = function scaledCoords (point, event) {
			var newPoint = [point[0], point[1]];
			var target = event.target || document.elementFromPoint(point[0], point[1]);

			if (this.rotation !== 0 || this.scale[0] !== 1 || this.scale[1] !== 1) {
				newPoint[0] -= target.offsetWidth / 2;
				newPoint[1] -= target.offsetHeight / 2;

				newPoint[0] *= this.scale[0];
				newPoint[1] *= this.scale[1];

				var oldX = newPoint[0];
				var cos = Math.cos(-this.rotation * Math.PI / 180);
				var sin = Math.sin(-this.rotation * Math.PI / 180);
				newPoint[0] = newPoint[0] * cos - newPoint[1] * sin;
				newPoint[1] =        oldX * sin + newPoint[1] * cos;

				newPoint[0] += target.offsetWidth / 2;
				newPoint[1] += target.offsetHeight / 2;
			}

			return newPoint;
		};

		Paint.prototype.rgbToHex = function rgbToHex (r, g, b) {
			var hex = ((r << 16) | (g << 8) | b).toString(16);
			return "#" + ("000000" + hex).slice(-6);
		};

		Paint.prototype.tempPixelCtx = document.createElement("canvas").getContext("2d");

		// Tools, called on events
		Paint.prototype.tools = {
			zoom: function zoom (paint, event) {
				if (event == "remove") {
					delete paint.lastZoomPoint;
					delete paint.lastZoomPointDelta;
					paint.effectsCanvas.style.cursor = "";

					if (typeof paint.effectsCanvasCtx.setLineDash == "function")
						paint.effectsCanvasCtx.setLineDash([]);

					return;
				}

				paint.effectsCanvas.style.cursor = "zoom-in";

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				
				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.lastZoomPoint) {
					paint.lastTargetZoomPoint = targetCoords;
					paint.lastZoomPoint = scaledCoords;
					paint.lastZoomPointDelta = scaledCoords;
				}

				if (event.type == "mouseup" || event.type == "touchend") {
					delete paint.lastZoomPoint;
					delete paint.lastZoomPointDelta;
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastZoomPoint) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
					
					var x1 = scaledCoords[0];
					var y1 = scaledCoords[1];
					var x2 = paint.lastZoomPoint[0];
					var y2 = paint.lastZoomPoint[1];
					
					var x3 = paint.lastZoomPointDelta[0];
					var y3 = paint.lastZoomPointDelta[1];

					var minX = Math.min(x1, x2);
					var minY = Math.min(y1, y2);

					var width = x1 - x2;
					var height = Math.abs(y1 - y2);
					
					let delta = targetCoords[0] - paint.lastTargetZoomPoint[0]; 
					let zoomFactor = 1.1;
					if(delta < 0) { // zoom out
						paint.zoomToPoint(paint.public.zoom * ( 1 / zoomFactor ), x2, y2);
						
					} else if (delta > 0) {//zoom in
						paint.zoomToPoint(paint.public.zoom * ( zoomFactor ), x2, y2);
					}

					paint.lastZoomPointDelta = scaledCoords;
					paint.lastTargetZoomPoint = targetCoords; 
				}	
			},
			/*select: function select (paint, event) {
				if (event == "remove") {
					delete paint.lastSelectPoint;
					paint.effectsCanvas.style.cursor = "";

					if (typeof paint.effectsCanvasCtx.setLineDash == "function")
						paint.effectsCanvasCtx.setLineDash([]);

					return;
				}

				paint.effectsCanvas.style.cursor = "cell";

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.lastSelectPoint) {
					paint.lastSelectPoint = scaledCoords;
				}

				if (event.type == "mouseup" || event.type == "touchend") {
					// If mouseup is on the same point as mousedown we switch behaviour by making
					// a box between two clicks instead of dragging the box around
					if (paint.lastSelectPoint[0] == scaledCoords[0] && paint.lastSelectPoint[1] == scaledCoords[1]) {
						return;
					}

					var x1 = Math.round(paint.local.leftTopX + (paint.lastSelectPoint[0] / paint.local.zoom));
					var y1 = Math.round(paint.local.leftTopY + (paint.lastSelectPoint[1] / paint.local.zoom));

					var x2 = Math.round(paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom));
					var y2 = Math.round(paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom));

					paint.dispatchEvent({
						type: "select",
						from: [x1, y1],
						to: [x2, y2]
					});

					delete paint.lastSelectPoint;
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastSelectPoint) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);

					var x1 = scaledCoords[0];
					var y1 = scaledCoords[1];
					var x2 = paint.lastSelectPoint[0];
					var y2 = paint.lastSelectPoint[1];

					var minX = Math.min(x1, x2);
					var minY = Math.min(y1, y2);

					var width = Math.abs(x1 - x2);
					var height = Math.abs(y1 - y2);

					var context = paint.effectsCanvasCtx;
					context.beginPath();

					if (typeof context.setLineDash == "function")
						context.setLineDash([4]);

					context.rect(minX, minY, width, height);
					context.lineWidth = 2;
					context.strokeStyle = "darkgray";
					context.stroke();
				}	
			},*/
			grab: function grab (paint, event) {
				// Tool canceled or deselected
				if (event == "remove" || event.type == "mouseup" || event.type == "touchend" || event.type === 'mouseleave') {
					delete paint.lastGrabCoords;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				// First time we grab?
				if (!paint.lastGrabCoords) {
					// If this is just a mousemove we are just moving
					// our mouse without holding the button down
					if (event.type == "mousedown" || event.type == "touchstart") {
						paint.lastGrabCoords = scaledCoords;
						paint.effectsCanvas.style.cursor = "move";
					}
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastGrabCoords) {
					// How much should the drawings be moved
					var relativeMotionX = paint.lastGrabCoords[0] - scaledCoords[0],
					    relativeMotionY = paint.lastGrabCoords[1] - scaledCoords[1];

					paint.goto(paint.local.leftTopX + (relativeMotionX / paint.local.zoom), paint.local.leftTopY + (relativeMotionY / paint.local.zoom));

					// Update last grab position
					paint.lastGrabCoords = scaledCoords;
				}		
			},
			select: function select (paint, event) {
				// Tool canceled or deselected
				if (event == "remove" || event.type == "mouseup" || event.type == "touchend" || event.type === 'mouseleave') {
					delete paint.lastSelectCoords;
					paint.isDragging=false;
					paint.effectsCanvas.style.cursor = "";
					delete paint.lastClickedAt;
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				
				// Is rotating or resizing?
				if (event.type == "mousemove" && typeof paint.selectedDrawingIndex !='undefined' && (paint.isResizing || paint.isRotating)) {
					if(paint.isResizing){
						let changeX=event.clientX - paint.initialCords.clientX;
					  let changeY=event.clientY - paint.initialCords.clientY;
					  //changeX = changeX < 0 ? 0 : changeX;
					  //changeY = changeY < 0 ? 0 : changeY;
					  paint.resizeDrawing(changeX,changeY,scaledCoords);
				    return;
					}
					if(paint.isRotating){
						let angle=Math.atan2(paint.initialCords.clientY - event.clientY, paint.initialCords.clientX - event.clientX);
			    	angle =angle * (180 / Math.PI);
			    	//if(angle < 0 ) angle = 360+angle;
			    	//console.log('rotating',angle);
			    	paint.rotateDrawing(angle);
			    	return;
					}
				}
					

				// First time we grab?
				if (!paint.lastSelectCoords) {
					// If this is just a mousemove we are just moving
					// our mouse without holding the button down
					if (event.type == "mousedown" || event.type == "touchstart") {
						if(!paint.lastClickedAt) paint.lastClickedAt=new Date();
						let doubleClick=( (new Date() - paint.lastClickedAt) < 300 );
						paint.lastClickedAt=new Date();
						if(doubleClick){
							paint.isDragging=true;
						}
						paint.lastSelectCoords = scaledCoords;
						let scaledLastSelectCoords = Object.assign([],paint.lastSelectCoords);
						scaledLastSelectCoords[0]=Math.round((paint.local.leftTopX + (scaledLastSelectCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION;
						scaledLastSelectCoords[1]=Math.round((paint.local.leftTopY + (scaledLastSelectCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION;
						
						paint.hideDrawingControls();
						paint.effectsCanvas.style.cursor = "move";
						var keepSearching=true;
						paint.rectanglePoints=[];
						var drawing={},scaledDrawing={};
						let minX,maxX,minY,maxY,minScaledX,maxScaledX,minScaledY,maxScaledY,diffX,diffY,hiddenContext,textWidth;
						for(var i=paint.localDrawings.length; i >0 ; i--){
							delete paint.selectedDrawingIndex;
							drawing=Object.assign({},paint.localDrawings[i-1]);
							scaledDrawing=Object.assign({},paint.localDrawings[i-1]);
							scaledDrawing.x=Math.round(((scaledDrawing.x - paint.local.leftTopX) * paint.local.zoom) * paint.PATH_PRECISION)/ paint.PATH_PRECISION;
							scaledDrawing.x1=Math.round(((scaledDrawing.x1 - paint.local.leftTopX) * paint.local.zoom) * paint.PATH_PRECISION)/ paint.PATH_PRECISION;
							scaledDrawing.y=Math.round(((scaledDrawing.y - paint.local.leftTopY) * paint.local.zoom) * paint.PATH_PRECISION)/ paint.PATH_PRECISION;
							scaledDrawing.y1=Math.round(((scaledDrawing.y1 - paint.local.leftTopY) * paint.local.zoom) * paint.PATH_PRECISION)/ paint.PATH_PRECISION;
							switch(paint.localDrawings[i-1].type){
								case 'circle':
									let circleRadius=Math.max(Math.abs(drawing.x - drawing.x1),Math.abs(drawing.y - drawing.y1));
									let scaledCircleRadius=Math.max(Math.abs(scaledDrawing.x - scaledDrawing.x1),Math.abs(scaledDrawing.y - scaledDrawing.y1));
									var distancesquared = (scaledLastSelectCoords[0] - drawing.x1) * (scaledLastSelectCoords[0] - drawing.x1) + (scaledLastSelectCoords[1] - drawing.y1) * (scaledLastSelectCoords[1] - drawing.y1);
  								if(distancesquared <= circleRadius * circleRadius){
  									console.log('Inside circle');
										paint.selectedDrawingIndex=i-1;
  									keepSearching=false;
  									paint.rectanglePoints=[
  										[scaledDrawing.x1 - scaledCircleRadius - 5, scaledDrawing.y1 + scaledCircleRadius + 5],
											[scaledDrawing.x1 + scaledCircleRadius + 5, scaledDrawing.y1 + scaledCircleRadius + 5],
											[scaledDrawing.x1 + scaledCircleRadius + 5, scaledDrawing.y1 - scaledCircleRadius - 5],
											[scaledDrawing.x1 - scaledCircleRadius - 5, scaledDrawing.y1 - scaledCircleRadius - 5]
  									]
  								}
								break;
								case 'rhombus':
									diffX=Math.abs(drawing.x1 - drawing.x);
									if(drawing.x <= scaledLastSelectCoords[0] && scaledLastSelectCoords[0] <= drawing.x + diffX && drawing.y - diffX <= scaledLastSelectCoords[1] && scaledLastSelectCoords[1] <= drawing.y){
										console.log('Inside rhombus');
										paint.selectedDrawingIndex=i-1;
  									keepSearching=false;
  									paint.rectanglePoints=[
  										[scaledDrawing.x - 5, scaledDrawing.y + 5],
											[scaledDrawing.x1 + 5, scaledDrawing.y + 5],
											[scaledDrawing.x1 + 5, scaledDrawing.y - (scaledDrawing.x1 - scaledDrawing.x) - 5],
											[scaledDrawing.x - 5, scaledDrawing.y - (scaledDrawing.x1 - scaledDrawing.x) - 5]
  									]
									}
								break;
								case 'arrow':
									minX=Math.min(drawing.x1,drawing.x);
									minY=Math.min(drawing.y1,drawing.y);
									maxX=Math.max(drawing.x1,drawing.x);
									maxY=Math.max(drawing.y1,drawing.y);
									
									minScaledX=Math.min(scaledDrawing.x1,scaledDrawing.x);
									minScaledY=Math.min(scaledDrawing.y1,scaledDrawing.y);
									maxScaledX=Math.max(scaledDrawing.x1,scaledDrawing.x);
									maxScaledY=Math.max(scaledDrawing.y1,scaledDrawing.y);
									
									diffX=Math.abs(drawing.x1 - drawing.x);
									if(minX - 10 <= scaledLastSelectCoords[0] && scaledLastSelectCoords[0] <= maxX + 10 && minY - 10 <= scaledLastSelectCoords[1] && scaledLastSelectCoords[1] <= maxY + 10){
										paint.selectedDrawingIndex=i-1;
  									keepSearching=false;
  									paint.rectanglePoints=[
  										[minScaledX - 10, maxScaledY + 10],
											[maxScaledX + 10, maxScaledY + 10],
											[maxScaledX + 10, minScaledY - 10],
											[minScaledX - 10, minScaledY - 10]
  									]
									}
								break;
								case 'line':
									minX=Math.min(drawing.x1,drawing.x);
									minY=Math.min(drawing.y1,drawing.y);
									maxX=Math.max(drawing.x1,drawing.x);
									maxY=Math.max(drawing.y1,drawing.y);
									
									minScaledX=Math.min(scaledDrawing.x1,scaledDrawing.x);
									minScaledY=Math.min(scaledDrawing.y1,scaledDrawing.y);
									maxScaledX=Math.max(scaledDrawing.x1,scaledDrawing.x);
									maxScaledY=Math.max(scaledDrawing.y1,scaledDrawing.y);
									
									diffX=Math.abs(drawing.x1 - drawing.x);
									if(minX - 10 <= scaledLastSelectCoords[0] && scaledLastSelectCoords[0] <= maxX + 10 && minY -10 <= scaledLastSelectCoords[1] && scaledLastSelectCoords[1] <= maxY + 10){
										paint.selectedDrawingIndex=i-1;
  									keepSearching=false;
  									paint.rectanglePoints=[
  										[minScaledX - 10, maxScaledY + 10],
											[maxScaledX + 10, maxScaledY + 10],
											[maxScaledX + 10, minScaledY - 10],
											[minScaledX - 10, minScaledY - 10]
  									]
									}
								break;
								case 'text':
									let hiddenContext = document.createElement("canvas").getContext("2d");
									hiddenContext.font = drawing.size + "pt Verdana, Geneva, sans-serif";
									let textWidth = hiddenContext.measureText(drawing.text).width;
									
									minScaledX=scaledDrawing.x;
									minScaledY=scaledDrawing.y;
									maxScaledX=scaledDrawing.x+textWidth-10;
									maxScaledY=scaledDrawing.y;
									
									if(drawing.x - 10 <= scaledLastSelectCoords[0] && scaledLastSelectCoords[0] <= drawing.x + textWidth + 10 && drawing.y - drawing.size -10 <= scaledLastSelectCoords[1] && scaledLastSelectCoords[1] <= drawing.y + 10){
										paint.selectedDrawingIndex=i-1;
  									keepSearching=false;
  									paint.rectanglePoints=[
  										[minScaledX - 10, maxScaledY + 10],
											[maxScaledX, maxScaledY + 10],
											[maxScaledX, minScaledY - drawing.size],
											[minScaledX - 10, minScaledY - drawing.size]
  									]
									}
								break;
								case 'triangle':
									var point=[scaledLastSelectCoords[0],scaledLastSelectCoords[1]],
									triangle=[
										[drawing.x, drawing.y],
										[drawing.x1, drawing.y],
										[drawing.x2, drawing.y2]
									],
					     		cx = point[0], cy = point[1],
					        t0 = triangle[0], t1 = triangle[1], t2 = triangle[2],
					        v0x = t2[0]-t0[0], v0y = t2[1]-t0[1],
					        v1x = t1[0]-t0[0], v1y = t1[1]-t0[1],
					        v2x = cx-t0[0], v2y = cy-t0[1],
					        dot00 = v0x*v0x + v0y*v0y,
					        dot01 = v0x*v1x + v0y*v1y,
					        dot02 = v0x*v2x + v0y*v2y,
					        dot11 = v1x*v1x + v1y*v1y,
					        dot12 = v1x*v2x + v1y*v2y;
					        // credit: https://github.com/mattdesl/point-in-triangle
							    // Compute barycentric coordinates
							    var b = (dot00 * dot11 - dot01 * dot01),
							        inv = b === 0 ? 0 : (1 / b),
							        u = (dot11*dot02 - dot01*dot12) * inv,
							        v = (dot00*dot12 - dot01*dot02) * inv
							    if(u>=0 && v>=0 && (u+v < 1)){
							    	console.log('inside triangle');
							    	paint.selectedDrawingIndex=i-1;
  									keepSearching=false;
  									paint.rectanglePoints=[
  										[scaledDrawing.x - 5, scaledDrawing.y + 5],
											[scaledDrawing.x1 + 5, scaledDrawing.y + 5],
											[scaledDrawing.x1 + 5,scaledDrawing.y2 - 5],
											[scaledDrawing.x - 5,scaledDrawing.y2 - 5]
  									]
							    }
								break;
							}
							if(!keepSearching) break;
						}
						if(typeof paint.selectedDrawingIndex !== 'undefined'){
							paint.drawSelection(0);
						}
					}
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && typeof paint.selectedDrawingIndex != 'undefined' && paint.isDragging) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
					console.log(paint.lastSelectCoords,scaledCoords);
					// How much should the drawings be moved
					var relativeMotionX = paint.lastSelectCoords[0] - scaledCoords[0],
					    relativeMotionY = paint.lastSelectCoords[1] - scaledCoords[1];
					paint.localDrawings[paint.selectedDrawingIndex].x=paint.localDrawings[paint.selectedDrawingIndex].x-relativeMotionX;
					paint.localDrawings[paint.selectedDrawingIndex].x1=paint.localDrawings[paint.selectedDrawingIndex].x1-relativeMotionX;
					if(paint.localDrawings[paint.selectedDrawingIndex].x2){
						paint.localDrawings[paint.selectedDrawingIndex].x2=paint.localDrawings[paint.selectedDrawingIndex].x2-relativeMotionX;	
					}
					paint.localDrawings[paint.selectedDrawingIndex].y=paint.localDrawings[paint.selectedDrawingIndex].y-relativeMotionY;
					paint.localDrawings[paint.selectedDrawingIndex].y1=paint.localDrawings[paint.selectedDrawingIndex].y1-relativeMotionY;
					if(paint.localDrawings[paint.selectedDrawingIndex].y2){
						paint.localDrawings[paint.selectedDrawingIndex].y2=paint.localDrawings[paint.selectedDrawingIndex].y2-relativeMotionY;
					}
					// Update last drag position
					paint.lastSelectCoords = scaledCoords;
					paint.redrawLocals();
					paint.hideDrawingControls();
				}		
			},
			line: function line (paint, event) {
				if (event == "remove") {
					delete paint.lastLinePoint;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.lastLinePoint) {
					paint.lastLinePoint = scaledCoords;
				}

				if (event.type == "mouseup" || event.type == "touchend") {
					// If mouseup is on the same point as mousedown we switch behaviour by making
					// a line between two clicks instead of dragging
					if (paint.lastLinePoint[0] == scaledCoords[0] && paint.lastLinePoint[1] == scaledCoords[1]) {
						return;
					}

					paint.addUserDrawing({
						type: "line",
						x: Math.round((paint.local.leftTopX + (paint.lastLinePoint[0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
						y: Math.round((paint.local.leftTopY + (paint.lastLinePoint[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						x1: Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						y1: Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						size: paint.current_size,
						color: paint.current_color
					});

					delete paint.lastLinePoint;
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastLinePoint) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);

					// TODO refactor this to use drawFunctions
					var context = paint.effectsCanvasCtx;
					context.globalCompositeOperation="destination-over";
					context.beginPath();
					context.arc(paint.lastLinePoint[0], paint.lastLinePoint[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);
					context.fillStyle = paint.current_color.toRgbString();
					context.fill();

					context.beginPath();
					context.moveTo(paint.lastLinePoint[0], paint.lastLinePoint[1]);
					context.lineTo(scaledCoords[0], scaledCoords[1]);			
					context.strokeStyle = paint.current_color.toRgbString();
					context.lineWidth = paint.current_size * paint.local.zoom ;
					context.stroke();

					context.beginPath();
					context.arc(scaledCoords[0], scaledCoords[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);
					context.fillStyle = paint.current_color.toRgbString();
					context.fill();			
				}
			},
			arrow: function arrow (paint, event) {
				if (event == "remove") {
					delete paint.lastLinePoint;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.lastLinePoint) {
					paint.lastLinePoint = scaledCoords;
				}

				if (event.type == "mouseup" || event.type == "touchend") {
					// If mouseup is on the same point as mousedown we switch behaviour by making
					// a line between two clicks instead of dragging
					if (paint.lastLinePoint[0] == scaledCoords[0] && paint.lastLinePoint[1] == scaledCoords[1]) {
						return;
					}

					paint.addUserDrawing({
						type: "arrow",
						x: Math.round((paint.local.leftTopX + (paint.lastLinePoint[0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
						y: Math.round((paint.local.leftTopY + (paint.lastLinePoint[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						x1: Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						y1: Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						size: paint.current_size,
						color: paint.current_color,
						stroke_size: paint.current_stroke_size,
						stroke_color: paint.current_stroke_color
					});

					delete paint.lastLinePoint;
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastLinePoint) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);

					// TODO refactor this to use drawFunctions
					var context = paint.effectsCanvasCtx;
					context.globalCompositeOperation="destination-over";
					context.beginPath();
					context.arc(paint.lastLinePoint[0], paint.lastLinePoint[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);
					context.closePath();
					context.fillStyle = paint.current_color.toRgbString();
					context.fill();

					context.beginPath();
					context.moveTo(paint.lastLinePoint[0], paint.lastLinePoint[1]);
					context.lineTo(scaledCoords[0], scaledCoords[1]);			
					context.strokeStyle = paint.current_color.toRgbString();
					context.lineWidth = paint.current_size * paint.local.zoom ;
					context.stroke();

					// context.beginPath();
					// context.arc(scaledCoords[0], scaledCoords[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);
					// context.fillStyle = paint.current_color.toRgbString();
					// context.fill();

					let headlen = 10;
		      let angle = Math.atan2(scaledCoords[1]-paint.lastLinePoint[1],scaledCoords[0]-paint.lastLinePoint[0]);
					context.beginPath();
					context.lineCap = "butt";
					context.lineJoin = "miter";
	        context.moveTo(scaledCoords[0], scaledCoords[1]);
	        context.lineTo(scaledCoords[0]-headlen*Math.cos(angle-Math.PI/7),scaledCoords[1]-headlen*Math.sin(angle-Math.PI/7));

	        //path from the side point of the arrow, to the other side point
	        context.lineTo(scaledCoords[0]-headlen*Math.cos(angle+Math.PI/7),scaledCoords[1]-headlen*Math.sin(angle+Math.PI/7));

	        //path from the side point back to the tip of the arrow, and then again to the opposite side point
	        context.lineTo(scaledCoords[0], scaledCoords[1]);
	        context.lineTo(scaledCoords[0]-headlen*Math.cos(angle-Math.PI/7),scaledCoords[1]-headlen*Math.sin(angle-Math.PI/7));

	        //draws the paths created above
	        context.strokeStyle = paint.current_color.toRgbString();
	        context.lineWidth = paint.current_size * paint.local.zoom;
	        context.stroke();
	        context.fillStyle = paint.current_color.toRgbString();
	        context.fill();
				}
			},
			triangle: function triangle (paint, event) {
				if (event == "remove") {
					delete paint.lastLinePoint;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				if ((event.type == "mousedown" || event.type == "touchstart")) {
					if(!paint.trianglePoints || paint.trianglePoints.length == 2){
						paint.trianglePoints=[scaledCoords];	
					}else{
						paint.trianglePoints.push(scaledCoords);
						if(paint.trianglePoints.length==2){
							// Draw final triangle here	
							let triangleDrawing={
								type: "triangle",
								x: Math.round((paint.local.leftTopX + (paint.trianglePoints[0][0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
								y: Math.round((paint.local.leftTopY + (paint.trianglePoints[0][1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
								x1: Math.round((paint.local.leftTopX + (paint.trianglePoints[1][0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
								y1: Math.round((paint.local.leftTopY + (paint.trianglePoints[1][1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
								size: paint.current_size,
								color: paint.current_color,
								stroke_size: paint.current_stroke_size,
								stroke_color: paint.current_stroke_color
							};
							let length=Math.abs(triangleDrawing.x - triangleDrawing.x1);
							triangleDrawing.x2=triangleDrawing.x + length / 2;
							triangleDrawing.y2=triangleDrawing.y1 - length;
							
							paint.addUserDrawing(triangleDrawing);
							
							delete paint.trianglePoints;
							paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
						}
					}
					
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.trianglePoints) {
					
					if(!paint.trianglePoints) return;

					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
					// TODO refactor this to use drawFunctions
					var context = paint.effectsCanvasCtx;
					if(paint.trianglePoints.length ==1){
						context.globalCompositeOperation="destination-over";
						context.beginPath();
						context.moveTo(paint.trianglePoints[0][0], paint.trianglePoints[0][1]);
						context.lineTo(scaledCoords[0], paint.trianglePoints[0][1]);			
						context.lineTo( ( scaledCoords[0] + paint.trianglePoints[0][0] )/2 , paint.trianglePoints[0][1] - ((scaledCoords[0] - paint.trianglePoints[0][0]) * (Math.sqrt(3)/2) ) );			
						context.strokeStyle = paint.current_stroke_color.toRgbString();
						context.fillStyle = paint.current_color.toRgbString();
						context.lineWidth = paint.current_stroke_size ;
						context.closePath();
						context.stroke();
						context.fill();
					}	
				}
			},
			ellipse: function ellipse (paint, event) {
				if (event == "remove") {
					delete paint.lastLinePoint;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				if ((event.type == "mousedown" || event.type == "touchstart")) {
					if(!paint.lastClickedAt) paint.lastClickedAt=new Date();
					let doubleClick=( (new Date() - paint.lastClickedAt) < 300 );
					paint.lastClickedAt=new Date();

					if(!paint.trianglePoints){
						paint.trianglePoints=[
							scaledCoords
						];	
					}else{
						paint.trianglePoints.push(scaledCoords);
						
						if(doubleClick){
							paint.trianglePoints=paint.trianglePoints.map(function(cords){
								return [
									Math.round((paint.local.leftTopX + (cords[0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
									Math.round((paint.local.leftTopY + (cords[1] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION
								];
							});
							// Draw final triangle here	
							paint.addUserDrawing({
								type: "ellipse",
								points: paint.trianglePoints,
								size: paint.current_size,
								color: paint.current_color,
								stroke_size: paint.current_stroke_size,
								stroke_color: paint.current_stroke_color
							});
							delete paint.trianglePoints;
							paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
						}
					}
					
				}

				if (paint.trianglePoints) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
					// TODO refactor this to use drawFunctions
					var context = paint.effectsCanvasCtx;
					context.globalCompositeOperation="destination-over";
					context.beginPath();
					context.strokeStyle = paint.current_color.toRgbString();
					context.lineWidth = 2 ;
					
					context.moveTo(paint.trianglePoints[0][0], paint.trianglePoints[0][1]);
					if(paint.trianglePoints.length ==1){
						context.lineTo(scaledCoords[0], scaledCoords[1]);
					}else{
						for (var i = 1; i < paint.trianglePoints.length - 1; i ++){
					      let xc = (paint.trianglePoints[i][0] + paint.trianglePoints[i + 1][0]) / 2;
					      let yc = (paint.trianglePoints[i][1] + paint.trianglePoints[i + 1][1]) / 2;
					      context.quadraticCurveTo(paint.trianglePoints[i][0], paint.trianglePoints[i][1], xc, yc);
					  }
					  // curve through the last two points
					  context.quadraticCurveTo(paint.trianglePoints[i][0], paint.trianglePoints[i][1], scaledCoords[0],scaledCoords[1]);
							
					}
					context.stroke();
						
				}
			},
			rhombus: function rhombus (paint, event) {
				if (event == "remove") {
					delete paint.lastLinePoint;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				if ((event.type == "mousedown" || event.type == "touchstart")) {
					if(!paint.trianglePoints || paint.trianglePoints.length == 2){
						paint.trianglePoints=[scaledCoords];	
					}else{
						paint.trianglePoints.push(scaledCoords);
						if(paint.trianglePoints.length==2){
							// Draw final triangle here	
							let rhombusDrawing={
								type: "rhombus",
								x: Math.round((paint.local.leftTopX + (paint.trianglePoints[0][0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
								y: Math.round((paint.local.leftTopY + (paint.trianglePoints[0][1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
								x1: Math.round((paint.local.leftTopX + (paint.trianglePoints[1][0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
								y1: Math.round((paint.local.leftTopY + (paint.trianglePoints[1][1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
								size: paint.current_size,
								color: paint.current_color,
								stroke_size: paint.current_stroke_size,
								stroke_color: paint.current_stroke_color
							};
							rhombusDrawing.x2=rhombusDrawing.x1;
							rhombusDrawing.y2=rhombusDrawing.y1-Math.abs(rhombusDrawing.x1 - rhombusDrawing.x);
							
							paint.addUserDrawing(rhombusDrawing);
							delete paint.trianglePoints;
							paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
						}
					}
					
				}

				if ((event.type == "mousemove" || event.type == "touchmove") && paint.trianglePoints) {
					
					if(!paint.trianglePoints) return;

					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
					// TODO refactor this to use drawFunctions
					var context = paint.effectsCanvasCtx;
					context.globalCompositeOperation="destination-over";
					if(paint.trianglePoints.length ==1){
						var diffX=scaledCoords[0] - paint.trianglePoints[0][0];
						var diffY=scaledCoords[1] - paint.trianglePoints[0][1];
						context.beginPath();
						context.moveTo(paint.trianglePoints[0][0], paint.trianglePoints[0][1]);
						context.lineTo(scaledCoords[0], paint.trianglePoints[0][1]);			
						context.lineTo(scaledCoords[0], paint.trianglePoints[0][1] - (diffX));
						context.lineTo(paint.trianglePoints[0][0], paint.trianglePoints[0][1] - (diffX));
						context.lineWidth=paint.current_stroke_size;
						context.strokeStyle=paint.current_stroke_color.toRgbString();
						context.fillStyle = paint.current_color.toRgbString();
						context.closePath();
						context.stroke();
						context.fill();
					}
				}
			},
			eqeditor: function eqeditor(paint, event){
				
				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				// add equation to canvas
				if ((event.type == "mouseup" || event.type == "touchend")) {
					paint.addUserDrawing({
						type: "equation",
						x: Math.round((paint.local.leftTopX + (paint.lastLinePoint[0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
						y: Math.round((paint.local.leftTopY + (paint.lastLinePoint[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						image: paint.currentEquationImage.attr('src'),
						meta: {equation: paint.currentEquation},
						size: paint.current_size,
						color: paint.current_color
					});
					paint.currentEquationImage.remove();
					paint.changeTool('brush');
				}
				// show image over canvas
				if ((event.type == "mousemove" || event.type == "touchmove")) {
					paint.lastLinePoint=[scaledCoords[0],scaledCoords[1] - paint.currentEquationImage.get(0).clientHeight];
					paint.currentEquationImage.css({left: scaledCoords[0] + 16 +'px',top: scaledCoords[1] + 42 - paint.currentEquationImage.get(0).clientHeight+'px'}).show();
				}
			},
			circle: function circle (paint, event) {
				if (event == "remove") {
					delete paint.lastLinePoint;
					delete paint.drawingCircle;
					paint.effectsCanvas.style.cursor = "";
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				if ((event.type == "mousedown" || event.type == "touchstart")) {
					paint.lastLinePoint = scaledCoords;
					paint.drawingCircle=true;
				}

				if (event.type == "mouseup" || event.type == "touchend") {
					paint.drawingCircle=false;
					// If mouseup is on the same point as mousedown we switch behaviour by making
					// a line between two clicks instead of dragging
					if (paint.lastLinePoint[0] == scaledCoords[0] && paint.lastLinePoint[1] == scaledCoords[1]) {
						return;
					}
					let circleDrawing={
						type: "circle",
						x: Math.round((paint.local.leftTopX + (paint.lastLinePoint[0] / paint.local.zoom)) * paint.PATH_PRECISION)/ paint.PATH_PRECISION,
						y: Math.round((paint.local.leftTopY + (paint.lastLinePoint[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						x1: Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						y1: Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
						size: paint.current_size,
						color: paint.current_color,
						stroke_size: paint.current_stroke_size,
						stroke_color: paint.current_stroke_color
					};
					let circleRadius=Math.max(Math.abs(circleDrawing.x - circleDrawing.x1),Math.abs(circleDrawing.y - circleDrawing.y1));
					circleDrawing.x2=circleDrawing.x1;
					circleDrawing.y2=circleDrawing.y1 - circleRadius;
					
					paint.addUserDrawing(circleDrawing);

					delete paint.lastLinePoint;
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
				}

				if ((event.type == "mousemove" || event.type == "touchmove")) {
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
					// TODO refactor this to use drawFunctions
					var context = paint.effectsCanvasCtx;
					context.globalCompositeOperation="destination-over";
					if(paint.drawingCircle){
						let circleRadius=Math.max(Math.abs(paint.lastLinePoint[0] - scaledCoords[0]),Math.abs(paint.lastLinePoint[1] - scaledCoords[1]));
						context.beginPath();
						context.arc(scaledCoords[0], scaledCoords[1], circleRadius, 0, 2 * Math.PI, true);
						context.fillStyle = paint.current_color.toRgbString();
						context.lineWidth=paint.current_stroke_size * paint.local.zoom;
						context.strokeStyle=paint.current_stroke_color.toRgbString();
						context.stroke();
						context.fill();	
					}else{
						context.beginPath();
						context.arc(scaledCoords[0], scaledCoords[1], 2, 0, 2 * Math.PI, true);

						if (paint.current_color.type == "gradient") {
							if (!paint.current_color[0]) {
								context.fillStyle = "black";
							} else {
								context.fillStyle = paint.current_color[0].color.toRgbString();	
							}
						} else {
							context.fillStyle = paint.current_color.toRgbString();
						}
						context.lineWidth=paint.current_stroke_size * paint.local.zoom;
						context.strokeStyle=paint.current_stroke_color.toRgbString();
						context.stroke();
						context.fill();
						// Save the last move point for efficient clearing
						paint.lastMovePoint= scaledCoords;
					}
								
				}
			},
			brush: function brush (paint, event, type) {
				if (event == "remove") {
					delete paint.lastMovePoint;
					delete paint.lockcolor;
					delete paint.brushing;
					return;
				}
				paint.lastMovePoint = paint.lastMovePoint || [0, 0];
				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				if (event.type == "mousedown" || event.type == "touchstart") {
					paint.brushing = true;
					if(!paint.brushStrokes) paint.brushStrokes=[];
					if(!paint.localBrushStrokes) paint.localBrushStrokes=[];
					
					paint.localBrushStrokes.push(scaledCoords);
					paint.brushStrokes.push([Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
					                        Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION]);

					// Clear the previous mouse dot
					paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0] - paint.current_size * paint.local.zoom * 2, paint.lastMovePoint[1] - paint.current_size * paint.local.zoom * 2, paint.current_size * paint.local.zoom * 4, paint.current_size * paint.local.zoom * 4);

				}

				if (event.type == "mouseup" || event.type == "touchend" || event.type == "mouseleave") {
					if(paint.brushing){
						paint.addUserDrawing({
							type: "brush",
							points: paint.brushStrokes,
							size: paint.current_size,
							color: paint.current_color,
							stroke_size: paint.current_stroke_size,
							stroke_color: paint.current_stroke_color
						});
					}
					paint.brushing = false;
					delete paint.brushStrokes;
					delete paint.localBrushStrokes;
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
				}

				if (event.type == "mousemove" || event.type == "touchmove") {
					// If we are brushing we don't need to draw a preview
					if (!this.brushing) {
						// Clear the previous mouse dot
						paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0] - paint.current_size * paint.local.zoom * 2, paint.lastMovePoint[1] - paint.current_size * paint.local.zoom * 2, paint.current_size * paint.local.zoom * 4, paint.current_size * paint.local.zoom * 4);

						// Draw the current mouse position
						var context = paint.effectsCanvasCtx;
						context.beginPath();
						context.globalCompositeOperation="destination-over";
						context.arc(scaledCoords[0], scaledCoords[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);

						if (paint.current_color.type == "gradient") {
							if (!paint.current_color[0]) {
								context.fillStyle = "black";
							} else {
								context.fillStyle = paint.current_color[0].color.toRgbString();	
							}
						} else {
							context.fillStyle = paint.current_color.toRgbString();
						}
						context.closePath()
						context.fill();
						
						// Save the last move point for efficient clearing
						paint.lastMovePoint[0] = scaledCoords[0];
						paint.lastMovePoint[1] = scaledCoords[1];
					}


					// If the last brush point is set we are currently drawing
					if (paint.brushing) {
						paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
						var context = paint.effectsCanvasCtx;
						paint.localBrushStrokes.push(scaledCoords);
						paint.brushStrokes.push([Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
					                            Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION]);
						for (var i = 1; i < paint.localBrushStrokes.length; i ++){
					  	context.beginPath();
							context.globalCompositeOperation="destination-over";
							context.moveTo(paint.localBrushStrokes[i-1][0], paint.localBrushStrokes[i-1][1]);
							context.lineTo(paint.localBrushStrokes[i][0], paint.localBrushStrokes[i][1]);			
							context.strokeStyle = paint.current_color.toRgbString();
							context.lineWidth = paint.current_size;
							context.lineJoin = "round";
							context.lineCap = "round";
							context.stroke();
							context.closePath();
					  }
					}
				}
			},
			highlight: function highlight (paint, event, type) {
				if (event == "remove") {
					delete paint.lastMovePoint;
					delete paint.lockcolor;
					delete paint.highlighting;
					return;
				}
				if(typeof paint.clearHighlightTimer =='undefined') paint.clearHighlightTimer=null;
				paint.lastMovePoint = paint.lastMovePoint || [0, 0];
				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				if (event.type == "mousedown" || event.type == "touchstart") {
					if(paint.clearHighlightTimer){
						clearTimeout(paint.clearHighlightTimer);
					}
					paint.highlighting = true;
					paint.highlightStrokes=[];
					paint.highlightStrokes.push(scaledCoords);

					// Clear the previous mouse dot
					paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0] - paint.current_size * paint.local.zoom * 2, paint.lastMovePoint[1] - paint.current_size * paint.local.zoom * 2, paint.current_size * paint.local.zoom * 4, paint.current_size * paint.local.zoom * 4);
				}

				if (event.type == "mouseup" || event.type == "touchend" || event.type == "mouseleave") {
					if(paint.highlighting){
						paint.dispatchEvent({
							type: "highlight",
							drawing: {
								points: paint.highlightStrokes,
								size: paint.current_size,
								color: paint.current_color.toRgbString()
							}
						});
						delete paint.highlightStrokes;
						paint.clearHighlightTimer=setTimeout(function(){
							paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);	
						},5000);
					}
					paint.highlighting = false;
					// delete paint.highlightStrokes;
					// paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
				}

				if (event.type == "mousemove" || event.type == "touchmove") {
					

					// If the last brush point is set we are currently drawing
					if (paint.highlighting) {
						paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
						paint.highlightStrokes.push(scaledCoords);
						paint.addHighlight({points: paint.highlightStrokes,color: paint.current_color.toRgbString(), size: paint.current_size});
					}
				}
			},
			eraser: function eraser (paint, event, type) {
				if (event == "remove") {
					delete paint.lastMovePoint;
					delete paint.lockcolor;
					delete paint.brushing;
					return;
				}
				paint.lastMovePoint = paint.lastMovePoint || [0, 0];

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				if (event.type == "mousedown" || event.type == "touchstart") {
					paint.brushing = true;
					paint.addEraserPath();
					paint.addEraserPathPoint([Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
					                        Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION]);

					// Clear the previous mouse dot
					paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0] - paint.current_size * paint.local.zoom * 2, paint.lastMovePoint[1] - paint.current_size * paint.local.zoom * 2, paint.current_size * paint.local.zoom * 4, paint.current_size * paint.local.zoom * 4);

				}

				if (paint.brushing && (event.type == "mouseup" || event.type == "touchend" || event.type == "mouseleave" )) {
					paint.endEraserPath(true);
					paint.brushing = false;
				}
				if (event.type == "mousemove" || event.type == "touchmove") {
					// If we are brushing we don't need to draw a preview
					if (!paint.brushing) {
						// Clear the previous mouse dot
						paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0] - paint.current_size * paint.local.zoom * 2, paint.lastMovePoint[1] - paint.current_size * paint.local.zoom * 2, paint.current_size * paint.local.zoom * 4, paint.current_size * paint.local.zoom * 4);

						// Draw the current mouse position
						var context = paint.effectsCanvasCtx;
						context.beginPath();
						context.arc(scaledCoords[0], scaledCoords[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);

						context.fillStyle = "white";
						context.lineWidth=1;
						context.strokeStyle="black";
						context.stroke();
						context.fill();
						context.closePath();
						// Save the last move point for efficient clearing
						paint.lastMovePoint[0] = scaledCoords[0];
						paint.lastMovePoint[1] = scaledCoords[1];
					}

					// If the last brush point is set we are currently drawing
					if (paint.brushing) {
						paint.addEraserPathPoint([Math.round((paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION,
					                            Math.round((paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)) * paint.PATH_PRECISION) / paint.PATH_PRECISION]);
						paint.endEraserPath();
					}
				}
			},
			picker: function picker (paint, event) {
				if (event == "remove") {
					delete paint.picking;
					paint.effectsCanvas.style.cursor = "";
					return;
				}
				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);

				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.picking && !paint.rightClick) {
					paint.picking = true;
					paint.setColor(paint.getColorAt(targetCoords).setAlpha(paint.current_color.getAlpha()));
					paint.effectsCanvas.style.cursor = "crosshair";
				}

				if (event.type == "mouseup" || event.type == "touchend") {
					delete paint.picking;
					paint.effectsCanvas.style.cursor = "";
					this.change_size(paint,"remove");
				}

				if (event.type == "mousemove" || event.type == "touchmove") {
					if (paint.picking)
						paint.setColor(paint.getColorAt(targetCoords).setAlpha(paint.current_color.getAlpha()));
				}
			},
			block: function block (paint, event) {
				this.brush(paint, event, "block");
			},
			text: function text (paint, event) {
				if (event == "remove") {
					// Remove lastmove data
					delete paint.lastMovePoint;
					delete paint.lastToolText;

					// Remove the text tool from dom and paint object
					paint.textToolInput && paint.container.removeChild(paint.textToolInput);
					delete paint.textToolInput;
					return;
				}

				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);

				// Create an input for the text if one doesn't exist
				if (!paint.textToolInput) {
					let controlElem=paint.controls.byName['text'].containerAppend;
					let textControl;
					paint.controls.controls.forEach(function(control){
						if(control.name=='text'){
							textControl=control;
							return;
						}
					})
					paint.textToolInput = document.createElement("input");

					paint.textToolInput.className = "form-control mt-1 w-auto position-absolute";
					paint.textToolInput.placeholder = "Type some text";
					if(textControl.place=='left'){
						paint.textToolInput.style.top=(controlElem.offsetTop) + 'px';
						paint.textToolInput.style.left='37px';
					}else{
						paint.textToolInput.style.top='37px';
						paint.textToolInput.style.left=(controlElem.offsetLeft + 37) + 'px';
					}
					paint.container.appendChild(paint.textToolInput);
					paint.textToolInput.addEventListener("input", function () {
						this.exectool("redraw");
					}.bind(paint));
				}

				paint.textToolInput.focus();

				if ((event.type == "mouseup" || event.type == "touchend") && paint.textToolInput.value) {
					paint.addUserDrawing({
						type: "text",
						text: paint.textToolInput.value.slice(0, 256) || "",
						x: Math.round(paint.local.leftTopX + (scaledCoords[0] / paint.local.zoom)),
						y: Math.round(paint.local.leftTopY + (scaledCoords[1] / paint.local.zoom)),
						size: paint.current_size,
						color: paint.current_color,
						stroke_size: paint.current_stroke_size,
						stroke_color: paint.current_stroke_color
					});
					paint.textToolInput.value = "";
				}

				if (event.type == "mousemove" || event.type == "touchmove") {
					paint.lastMovePoint = paint.lastMovePoint || [0, 0];

					paint.effectsCanvasCtx.font = paint.current_size * paint.local.zoom + "px Verdana, Geneva, sans-serif";
					paint.effectsCanvasCtx.globalCompositeOperation="destination-over";
							
					// Remove the old text and draw the new one (use half height margin)
					paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0],
					                                 paint.lastMovePoint[1] - (paint.current_size * paint.local.zoom * 1.5),
					                                 paint.effectsCanvasCtx.measureText(paint.lastToolText).width,
					                                 paint.current_size * paint.local.zoom * 2);

					paint.effectsCanvasCtx.fillStyle = paint.current_color.toRgbString();
					paint.effectsCanvasCtx.fillText(paint.textToolInput.value.slice(0, 256), scaledCoords[0], scaledCoords[1]);

					paint.lastToolText = paint.textToolInput.value.slice(0, 256);
					paint.lastMovePoint = scaledCoords;
				}

				if (event == "redraw") {
					paint.effectsCanvasCtx.globalCompositeOperation="destination-over";
					paint.effectsCanvasCtx.font = paint.current_size * paint.local.zoom + "px Verdana, Geneva, sans-serif";
					// Remove the old text and draw the new one (use half height margin)
					paint.effectsCanvasCtx.clearRect(paint.lastMovePoint[0],
					                                 paint.lastMovePoint[1] - (paint.current_size * paint.local.zoom * 1.5),
					                                 paint.effectsCanvasCtx.measureText(paint.lastToolText).width,
					                                 paint.current_size * paint.local.zoom * 2);

					paint.effectsCanvasCtx.fillStyle = paint.current_color.toRgbString();
					paint.effectsCanvasCtx.fillText(paint.textToolInput.value.slice(0, 256), paint.lastMovePoint[0], paint.lastMovePoint[1]);
					paint.lastToolText = paint.textToolInput.value.slice(0, 256);
				}
			},
			change_size: function change_size (paint, event) {
				if (event == "remove") {
					delete paint.lastChangeSizePoint;
					delete paint.lastChangeSizePointAlt;
					return;
				}
				
				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				
				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.lastChangeSizePoint && !paint.leftClick) {
					paint.lastTargetZoomPoint = targetCoords;
					paint.lastChangeSizePoint = scaledCoords;
					paint.lastChangeSizePointAlt = scaledCoords;
				}
				
				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastChangeSizePoint) {
					var x1 = scaledCoords[0];
					var y1 = scaledCoords[1];

					var x3 = paint.lastChangeSizePointAlt[0];
					var y3 = paint.lastChangeSizePointAlt[1];
					
					var delta = targetCoords[0] - paint.lastTargetZoomPoint[0];
					var change = 1;
					
					if (delta < 0) { // mouse move left
						paint.current_size -= change;
					} else if (delta > 0) {
						paint.current_size += change;
					}
					paint.changeToolSize(paint.current_size, true);
					paint.lastChangeSizePointAlt = scaledCoords;
					paint.lastTargetZoomPoint = targetCoords;
					
					// Clear the previous mouse dot
					paint.effectsCanvasCtx.clearRect(0, 0, paint.effectsCanvas.width, paint.effectsCanvas.height);
		            
					// Draw the current mouse position
					var context = paint.effectsCanvasCtx;
					context.beginPath();
					context.arc(paint.lastChangeSizePoint[0], paint.lastChangeSizePoint[1], (paint.current_size * paint.local.zoom) / 2, 0, 2 * Math.PI, true);
		            
					if (paint.current_color.type == "gradient") {
						if (!paint.current_color[0]) {
							context.fillStyle = "black";
						} else {
							context.fillStyle = paint.current_color[0].color.toRgbString();	
						}
					} else {
						context.fillStyle = paint.current_color.toRgbString();
					}
		      context.closePath();      
					context.fill();
				}
			},
			change_rotation: function change_rotation (paint, event) {
				if (event == "remove") {
					delete paint.lastChangeRotationPoint;
					delete paint.RotationPointOnRight;
					return;
				}
				
				// Get the coordinates relative to the canvas
				var targetCoords = paint.getCoords(event);
				var scaledCoords = paint.scaledCoords(targetCoords, event);
				
				if ((event.type == "mousedown" || event.type == "touchstart") && !paint.lastChangeRotationPoint && paint.leftClick) {
					paint.lastChangeRotationPoint = targetCoords;
				}
				
				if ((event.type == "mousedown" || event.type == "touchstart")){
					if(targetCoords[0] > paint.canvasArray[0].width / 2)
						paint.RotationPointOnRight = true;
					else 
						paint.RotationPointOnRight = false;
					var x1 = targetCoords[0];
					var y1 = targetCoords[1];
					var p1 = {
						x: x1,
						y: y1
					};

					var p2 = {
						x: paint.canvasArray[0].width / 2,
						y: paint.canvasArray[0].height / 2
					};
					
					if(paint.RotationPointOnRight){
						p3 = p1;
						p1 = p2;
						p2 = p3;
					}
					paint.anglething =  Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
					paint.anglething -= anondraw.collab.paint.rotation;
				}
				
				if ((event.type == "mousemove" || event.type == "touchmove") && paint.lastChangeRotationPoint) {
					var x1 = targetCoords[0];
					var y1 = targetCoords[1];

					var x3 = paint.lastChangeRotationPoint[0];
					var y3 = paint.lastChangeRotationPoint[1];
					
					var p1 = {
						x: x1,
						y: y1
					};

					var p2 = {
						x: paint.canvasArray[0].width / 2,
						y: paint.canvasArray[0].height / 2
					};
					
					if(paint.RotationPointOnRight){
						p3 = p1;
						p1 = p2;
						p2 = p3;
					}

					var angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
					console.log(angleDeg, paint.anglething);
					angleDeg = angleDeg - paint.anglething;
					console.log("new angle",angleDeg);
					
					paint.setRotation(angleDeg * paint.scale[0] * paint.scale[1]);

					paint.lastChangeRotationPoint = targetCoords;
				}
			}
		};
		// Drawfunctions
		// this = current paint

		Paint.prototype.drawFunctions = {
			brush: function (context, drawing, tiledCanvas) {
				let topLeftX=drawing.points[0][0];
				let topLeftY=drawing.points[0][1];
				let bottomRightX=drawing.points[0][0];
				let bottomRightY=drawing.points[0][1];
				for (var i = 1; i < drawing.points.length; i ++){
			  	context.beginPath();
					context.globalCompositeOperation="source-over";
					context.moveTo(drawing.points[i-1][0], drawing.points[i-1][1]);
					context.lineTo(drawing.points[i][0], drawing.points[i][1]);			
					context.strokeStyle = drawing.color.toRgbString();
					context.lineWidth = drawing.size ;
					context.lineCap = "round";
					context.stroke();
					context.closePath();

			    topLeftX=Math.min(topLeftX,drawing.points[i][0]);
		      topLeftY=Math.min(topLeftY,drawing.points[i][1]);
		      bottomRightX=Math.max(bottomRightX,drawing.points[i][0]);
		      bottomRightY=Math.max(bottomRightY,drawing.points[i][1]);
			  }
			 //  context.lineJoin = "miter";
				// context.lineCap = "butt";
				if (tiledCanvas) {
					tiledCanvas.drawingRegion(topLeftX, topLeftY, bottomRightX, bottomRightY, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			eraser: function (context, drawing, tiledCanvas) {
				let topLeftX=drawing.points[0][0];
				let topLeftY=drawing.points[0][1];
				let bottomRightX=drawing.points[0][0];
				let bottomRightY=drawing.points[0][1];
				context.save();
				context.beginPath();
				context.globalCompositeOperation="destination-out";
				for (var i = 1; i < drawing.points.length; i ++){
			  	context.moveTo(drawing.points[i-1][0], drawing.points[i-1][1]);
					context.lineTo(drawing.points[i][0], drawing.points[i][1]);			
				  topLeftX=Math.min(topLeftX,drawing.points[i][0]);
		      topLeftY=Math.min(topLeftY,drawing.points[i][1]);
		      bottomRightX=Math.max(bottomRightX,drawing.points[i][0]);
		      bottomRightY=Math.max(bottomRightY,drawing.points[i][1]);
			  }
		  	context.lineWidth = drawing.size ;
				context.lineCap = "round";
				context.stroke();
				context.closePath();
				context.restore();
				
				if (tiledCanvas) {
					tiledCanvas.drawingRegion(topLeftX, topLeftY, bottomRightX, bottomRightY, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			block: function (context, drawing, tiledCanvas) {
				context.fillStyle = drawing.color.toRgbString();
				context.fillRect(drawing.x, drawing.y, drawing.size, drawing.size);

				if (tiledCanvas) {
					tiledCanvas.drawingRegion(drawing.x, drawing.y, drawing.x, drawing.y, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			line: function (context, drawing, tiledCanvas) {
				context.save();
				context.beginPath();
				context.globalCompositeOperation="source-over";
				let midX=(drawing.x + drawing.x1)/2;
				let midY=(drawing.y + this.FIX_CANVAS_PIXEL_SIZE + drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE ) / 2;
				if(drawing.rotate){
					context.translate(midX ,midY);
					context.rotate(drawing.rotate);
					context.translate(-midX,-midY);
				}
				context.moveTo(drawing.x, drawing.y + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineTo(drawing.x1, drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE);
				
				context.strokeStyle = drawing.color.toRgbString();
				context.lineWidth = drawing.size;

				context.lineCap = "round";

				context.stroke();
				context.closePath();
				context.restore();
				
				if (tiledCanvas) {
					let diff=Math.max(Math.abs(drawing.x - drawing.x1),Math.abs(drawing.y - drawing.y1));
					tiledCanvas.drawingRegion(midX - diff/2, midY - diff/2, midX + diff/2, midY + diff/2, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			arrow: function (context, drawing, tiledCanvas) {
				var headlen = 10;
        var angle = Math.atan2(drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE-drawing.y,drawing.x1-drawing.x);
        context.save();
				context.beginPath();
				context.globalCompositeOperation="source-over";
				
				let centerX=(drawing.x + drawing.x1)/2;
				let centerY=(drawing.y + this.FIX_CANVAS_PIXEL_SIZE + drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE ) / 2;
				let maxLength=Math.max(Math.abs(drawing.x1-drawing.x),Math.abs(drawing.y1-drawing.y));
				if(drawing.rotate){
					context.translate(centerX ,centerY);
					context.rotate(drawing.rotate);
					context.translate(-centerX,-centerY);
				}
				context.strokeStyle = drawing.color.toRgbString();
				context.lineWidth = drawing.size;
				context.lineCap = "round";
				
				context.moveTo(drawing.x, drawing.y + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineTo(drawing.x1, drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE);
				
				context.stroke();

				context.moveTo(drawing.x1, drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE);
        context.lineTo(drawing.x1-headlen*Math.cos(angle-Math.PI/7),drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE -headlen*Math.sin(angle-Math.PI/7));

        //path from the side point of the arrow, to the other side point
        context.lineTo(drawing.x1-headlen*Math.cos(angle+Math.PI/7),drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE-headlen*Math.sin(angle+Math.PI/7));

        //path from the side point back to the tip of the arrow, and then again to the opposite side point
        context.lineTo(drawing.x1, drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE);
        context.lineTo(drawing.x1-headlen*Math.cos(angle-Math.PI/7),drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE-headlen*Math.sin(angle-Math.PI/7));

        //draws the paths created above
        context.strokeStyle = drawing.color.toRgbString();
        context.lineWidth = drawing.size ;
        context.stroke();
        context.fillStyle = drawing.color.toRgbString();
        context.fill();
        context.closePath();
				context.restore();
				if (tiledCanvas) {
					tiledCanvas.drawingRegion(centerX-maxLength , centerY-maxLength, centerX+maxLength, centerY+maxLength, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			triangle: function (context, drawing, tiledCanvas) {
				context.save();
				context.beginPath();
				context.globalCompositeOperation="source-over";
				if(drawing.rotate){
					let minX=Math.min(drawing.x,drawing.x1,drawing.x2);
					let maxX=Math.max(drawing.x,drawing.x1,drawing.x2);
					let minY=Math.min(drawing.y,drawing.y1,drawing.y2);
					let maxY=Math.max(drawing.y,drawing.y1,drawing.y2);
					context.translate( (minX + maxX)/2 , (minY + maxY +  + this.FIX_CANVAS_PIXEL_SIZE * 2)/2);
					context.rotate(drawing.rotate);
					context.translate( -((minX + maxX)/2) , -((minY + maxY +  + this.FIX_CANVAS_PIXEL_SIZE * 2)/2));
				}
				context.moveTo(drawing.x, drawing.y + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineTo(drawing.x1, drawing.y + this.FIX_CANVAS_PIXEL_SIZE);			
				context.lineTo(drawing.x2 , drawing.y2 + this.FIX_CANVAS_PIXEL_SIZE );			
				context.strokeStyle = drawing.stroke_color.toRgbString();
				context.fillStyle = drawing.color.toRgbString();
				context.lineWidth = drawing.stroke_size;
				context.closePath();
				
				context.stroke();
				context.fill();
				
				context.restore();
				
				if (tiledCanvas) {
					var topLeftX=Math.min(drawing.x,drawing.x1);
					var topLeftY=Math.min(drawing.y,drawing.y - ((drawing.x1 - drawing.x) * (Math.sqrt(3)/2) ));
					var bottomRightX=Math.max(drawing.x,drawing.x1);
					var bottomRightY=Math.max(drawing.y,drawing.y - ((drawing.x1 - drawing.x) * (Math.sqrt(3)/2) ));
					
					tiledCanvas.drawingRegion(topLeftX - drawing.stroke_size -50 , topLeftY -drawing.stroke_size -50, bottomRightX + drawing.stroke_size, bottomRightY + drawing.stroke_size, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			rhombus: function (context, drawing, tiledCanvas) {
				context.save();
				context.beginPath();
				context.globalCompositeOperation="source-over";
				var diffX=drawing.x1 - drawing.x;
				var diffY=drawing.y2 - drawing.y;
				if(drawing.rotate){
					context.translate((drawing.x1 + drawing.x)/2 ,(drawing.y2 +drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE*2) /2);
					context.rotate(drawing.rotate);
					context.translate( -((drawing.x1 + drawing.x)/2) , -((drawing.y2 +drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE*2) /2));
				}
				context.moveTo(drawing.x, drawing.y + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineTo(drawing.x1, drawing.y + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineTo(drawing.x1, drawing.y2 + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineTo(drawing.x, drawing.y2 + this.FIX_CANVAS_PIXEL_SIZE);
				context.lineWidth=drawing.stroke_size;
				context.strokeStyle=drawing.stroke_color.toRgbString();
				context.fillStyle = drawing.color.toRgbString();
				context.closePath();
				context.stroke();
				context.fill();
				context.restore();
				if (tiledCanvas) {
					var topLeftX=Math.min(drawing.x,drawing.x1,drawing.x - diffX);
					var topLeftY=Math.min(drawing.y,drawing.y1,drawing.y - diffX);
					var bottomRightX=Math.max(drawing.x,drawing.x1,drawing.x - diffX);
					var bottomRightY=Math.max(drawing.y,drawing.y1,drawing.y - diffY);
					
					tiledCanvas.drawingRegion(topLeftX - drawing.stroke_size, topLeftY - drawing.stroke_size, bottomRightX + drawing.stroke_size, bottomRightY + drawing.stroke_size, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			ellipse: function (context, drawing, tiledCanvas) {
				context.beginPath();
				context.globalCompositeOperation="source-over";
				context.strokeStyle = drawing.color.toRgbString();
				context.moveTo(drawing.points[0][0], drawing.points[0][1]);
				context.lineWidth = 2 ;

				let topLeftX=drawing.points[0][0];
				let topLeftY=drawing.points[0][1];
				let bottomRightX=drawing.points[0][0];
				let bottomRightY=drawing.points[0][1];
				for (var i = 1; i < drawing.points.length - 2; i ++){
			      let xc = (drawing.points[i][0] + drawing.points[i + 1][0]) / 2;
			      let yc = (drawing.points[i][1] + drawing.points[i + 1][1]) / 2;
			      topLeftX=Math.min(topLeftX,drawing.points[i][0],xc);
			      topLeftY=Math.min(topLeftY,drawing.points[i][1],yc);
			      bottomRightX=Math.max(bottomRightX,drawing.points[i][0],xc);
			      bottomRightY=Math.max(bottomRightY,drawing.points[i][1],yc);
			      context.quadraticCurveTo(drawing.points[i][0], drawing.points[i][1], xc, yc);
			  }
			  // curve through the last two points
			  context.quadraticCurveTo(drawing.points[i][0], drawing.points[i][1], drawing.points[i+1][0],drawing.points[i+1][1]);
				context.stroke();

				if (tiledCanvas) {
					tiledCanvas.drawingRegion(topLeftX, topLeftY, bottomRightX, bottomRightY, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			circle: function (context, drawing, tiledCanvas) {
				let circleRadius=Math.max(Math.abs(drawing.x - drawing.x1),Math.abs(drawing.y - drawing.y1));
				let centerX=drawing.x;
				let centerY=drawing.y;
				let width=Math.abs(drawing.x - drawing.x1);
				let height=Math.abs(drawing.y1 - drawing.y2);
				context.save();
				context.beginPath();
				context.globalCompositeOperation="source-over";
				if(drawing.rotate){
					context.translate(((drawing.x + drawing.x1) / 2) ,(drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE + drawing.y2 + this.FIX_CANVAS_PIXEL_SIZE ) / 2);
					context.rotate(drawing.rotate);
					context.translate(-((drawing.x + drawing.x1) / 2) ,-((drawing.y1 + this.FIX_CANVAS_PIXEL_SIZE + drawing.y2 + this.FIX_CANVAS_PIXEL_SIZE) / 2));
					
				}
				if(height != circleRadius){
					context.moveTo(centerX, centerY);
				  context.bezierCurveTo(
				    centerX, centerY - height,
				    centerX + width*2, centerY - height,
				    centerX + width*2, centerY);
				  context.bezierCurveTo(
				    centerX + width*2, centerY + height,
				    centerX, centerY + height,
				    centerX, centerY);
				}else{
					context.arc(drawing.x1, drawing.y1, circleRadius, 0, 2 * Math.PI, true);
				}
				
				context.fillStyle = drawing.color.toRgbString();
				context.lineWidth=drawing.stroke_size;
				context.strokeStyle=drawing.stroke_color.toRgbString();
				context.stroke();
				context.fill();
				context.closePath();
				context.restore();
				
				if (tiledCanvas) {
					let topLeftX=drawing.x1 - circleRadius - drawing.stroke_size;
					let topLeftY=drawing.y1-circleRadius - drawing.stroke_size;
					let bottomRightX=drawing.x1+circleRadius + drawing.stroke_size;
					let bottomRightY=drawing.y1+circleRadius + drawing.stroke_size;
					tiledCanvas.drawingRegion(topLeftX, topLeftY, bottomRightX, bottomRightY, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			},
			grid: function (context, drawing, canvas){
				// credits: https://codepen.io/airen/pen/wJMGwW?editors=1010
				function drawScreen (context) {
			    var dx = 50;
			    var dy = 50;
			    var x = 0;
			    var y = 0;
			    var w = canvas.width;
			    var h = canvas.height;
			    var xy = 10;
			    var counter=1;
			    while (y < h) {
			      context.beginPath();
			      if(counter % 4 ==0){
			      	context.lineWidth = 1;
			      	context.strokeStyle='#000000';
				    }else if(counter % 2 ==0){
			      	context.lineWidth = 0.5;
			      	context.strokeStyle='#000000';
				    }else{
				    	context.lineWidth = 0.3;
			      	context.strokeStyle='#000000';
				    }
			      y = y + dy;
			      context.moveTo(x, y);
			      context.lineTo(w, y);
			      context.stroke();
			      context.closePath();
			      
			      xy += 10;  
			      counter +=1;
			    }
			    
			    y = 0;  
			    xy =10; 
			    counter =1;
			    while (x < w) {
			      context.beginPath();
			      if(counter % 4 ==0){
			      	context.lineWidth = 1;
			      	context.strokeStyle='#000000';
				    }else if(counter % 2 ==0){
			      	context.lineWidth = 0.5;
			      	context.strokeStyle='#000000';
				    }else{
				    	context.lineWidth = 0.3;
			      	context.strokeStyle='#000000';
				    }
			      x = x + dx;
			      context.moveTo(x, y);  
			      context.lineTo(x,h);  
			      context.stroke();   
			      context.closePath();
			      xy+=10;  
			      counter +=1;
			    }
			  }
			  context.clearRect(0, 0, canvas.width, canvas.height);
			  if(drawing.showGrid){
			  	drawScreen(context)	
			  }else{
					//context.clearRect(0, 0, canvas.width, canvas.height);
				}
			},
			equation: function (context, drawing, tiledCanvas){
				if(!drawing.image) return;
				var img = new Image();
				img.onload = function() {
					let imgWidth=img.width;
					let imgHeight=img.height;
					let topLeftX=drawing.x;
					let topLeftY=drawing.y;
					let bottomRightX=topLeftX+imgWidth;
					let bottomRightY=topLeftY+imgHeight;
					context.drawImage(this, topLeftX, topLeftY, imgWidth, imgHeight);
					if (tiledCanvas) {
						tiledCanvas.drawingRegion(topLeftX, topLeftY, bottomRightX, bottomRightY, 0);
						tiledCanvas.executeNoRedraw();
						tiledCanvas.redrawOnce();
					}
				};
				img.src = drawing.image;
			},
			bgImage: function (context, drawing, tiledCanvas){
				if(!drawing.image) return;
				var img = new Image();
				img.onload = function() {
					tiledCanvas.clearAll();
					let imgWidth=img.width;
					let imgHeight=img.height;
					let topLeftX=50;
					let topLeftY=50;
					let bottomRightX=topLeftX+imgWidth;
					let bottomRightY=topLeftY+imgHeight;
					context.drawImage(this, topLeftX, topLeftY, imgWidth, imgHeight);
					if (tiledCanvas) {
						tiledCanvas.drawingRegion(topLeftX, topLeftY, bottomRightX, bottomRightY, 0);
						tiledCanvas.executeNoRedraw();
						tiledCanvas.redrawOnce();
					}
				};
				img.src = drawing.image;
			},
			path: function (context, drawing, tiledCanvas) {
				this.drawPath(drawing, context, tiledCanvas);
			},
			text: function (context, drawing, tiledCanvas) {
				// Context can't be used because it's a tiledCanvas context
				// and that doesnt have a meastureText function that actually returns
				// valid data, so we need to create a hidden context
				var hiddenContext = document.createElement("canvas").getContext("2d");
				hiddenContext.font = drawing.size + "pt Verdana, Geneva, sans-serif";
				var textWidth = hiddenContext.measureText(drawing.text).width;

				context.save();
				context.beginPath();
				context.globalCompositeOperation="source-over";
				if(drawing.rotate){
					context.translate(drawing.x + textWidth/2 ,drawing.y + this.FIX_CANVAS_PIXEL_SIZE);
					context.rotate(drawing.rotate);
					context.translate(-(drawing.x + textWidth/2) ,-(drawing.y + this.FIX_CANVAS_PIXEL_SIZE));
				}
				context.font = drawing.size + "px Verdana, Geneva, sans-serif";
				context.fillStyle = drawing.color.toRgbString();

				context.fillText(drawing.text, drawing.x, drawing.y);
				context.closePath();
				context.restore();
				
				if (tiledCanvas) {
					
					tiledCanvas.drawingRegion(drawing.x, drawing.y - drawing.size, drawing.x + textWidth, drawing.y, drawing.size);
					tiledCanvas.executeNoRedraw();
				}
			}
		};

		Paint.prototype.utils = {
			copy: function (object) {
				// Returns a deep copy of the object
				var copied_object = {};
				for (var key in object) {
					if (typeof object[key] == "object") {
						copied_object[key] = this.copy(object[key]);
					} else {
						copied_object[key] = object[key];
					}
				}
				return copied_object;
			},
			merge: function (targetobject, object) {
				// All undefined keys from targetobject will be filled
				// by those of object (goes deep)
				if (typeof targetobject != "object") {
					targetobject = {};
				}

				for (var key in object) {
					if (typeof object[key] == "object") {
						targetobject[key] = this.merge(targetobject[key], object[key]);
					} else if (typeof targetobject[key] == "undefined") {
						targetobject[key] = object[key];
					}
				}

				return targetobject;
			},
			sqDistance: function sqDistance (point1, point2) {
				var xDist = point1[0] - point2[0];
				var yDist = point1[1] - point2[1];
				return xDist * xDist + yDist * yDist;
			}
		};

		EventDispatcher.prototype.apply(Paint.prototype);
		return new Paint(...paintArgs);
	})(require('jquery'),...args)
}
