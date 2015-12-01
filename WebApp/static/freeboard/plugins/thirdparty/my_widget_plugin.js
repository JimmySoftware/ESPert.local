// # Building a Freeboard Plugin
//
// A freeboard plugin is simply a javascript file that is loaded into a web page after the main freeboard.js file is loaded.
//
// Let's get started with an example of a datasource plugin and a widget plugin.
//
// -------------------

// Best to encapsulate your plugin in a closure, although not required.
(function()
{
	// ## A Widget Plugin
	//
	// -------------------
	// ### Widget Definition
	//
	// -------------------
	// **freeboard.loadWidgetPlugin(definition)** tells freeboard that we are giving it a widget plugin. It expects an object with the following:
	freeboard.loadWidgetPlugin({
		// Same stuff here as with datasource plugin.
		"type_name"   : "my_widget_plugin",
		"display_name": "Widget Plugin Example 2",
        "description" : "Some sort of description <strong>with optional html!</strong>",
		// **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
		"external_scripts": [
			"http://mydomain.com/myscript1.js", "http://mydomain.com/myscript2.js"
		],
		// **fill_size** : If this is set to true, the widget will fill be allowed to fill the entire space given it, otherwise it will contain an automatic padding of around 10 pixels around it.
		"fill_size" : false,
		"settings"    : [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "on_text",
                display_name: "On Text",
                type: "text"
            },
            {
                name: "off_text",
                display_name: "Off Text",
                type: "text"
            },
			{
				"name"        : "the_text",
				"display_name": "Some Text",
				// We'll use a calculated setting because we want what's displayed in this widget to be dynamic based on something changing (like a datasource).
				"type"        : "text"
			},
			{
				"name"        : "size",
				"display_name": "Size",
				"type"        : "option",
				"options"     : [
					{
						"name" : "Regular",
						"value": "regular"
					},
					{
						"name" : "Big",
						"value": "big"
					}
				]
			}
		],
		// Same as with datasource plugin, but there is no updateCallback parameter in this case.
		newInstance   : function(settings, newInstanceCallback)
		{
			newInstanceCallback(new myWidgetPlugin(settings));
		}
	});

	// ### Widget Implementation
	//
	// -------------------
	// Here we implement the actual widget plugin. We pass in the settings;
	freeboard.addStyle('.switch-light', "border-radius:15%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
	freeboard.addStyle('.switch-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	freeboard.addStyle('.indicator-text', "margin-top:10px;");

	var myWidgetPlugin = function(settings)
	{
		var self = this;
		var currentSettings = settings;
		var isOn = false;

		// Here we create an element to hold the text we're going to display. We're going to set the value displayed in it below.
		var titleElement = $('<h2 class="section-title"></h2>');
		var myTextElement = $("<span></span>");
		var indicatorElement = $('<div class="switch-light"></div>');
		var stateElement = $('<div class="indicator-text"></div>');

        function updateState() {
			indicatorElement.toggleClass("on", isOn);

			if (isOn) {
                stateElement.html((_.isUndefined(currentSettings.on_text) ? "" : '<a href="#" onclick="return publish(\''+currentSettings.the_text+'\',\''+0+'\');">'+currentSettings.on_text)+'</a>');
            }
            else {
                stateElement.html((_.isUndefined(currentSettings.off_text) ? "" : '<a href="#" onclick="return publish(\''+currentSettings.the_text+'\',\''+1+'\');">'+currentSettings.off_text)+'</a>');
            }
        }

		// **render(containerElement)** (required) : A public function we must implement that will be called when freeboard wants us to render the contents of our widget. The container element is the DIV that will surround the widget.
		self.render = function(containerElement)
		{
			// Here we append our text element to the widget container element.
			$(containerElement).append(titleElement).append(myTextElement).append(indicatorElement).append(stateElement);
		}

		// **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
		//
		// Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
		//
		// Blocks of different sizes may be supported in the future.
		self.getHeight = function()
		{
			if(currentSettings.size == "big")
			{
				return 3;
			}
			else
			{
				return 2;
			}
		}

		// **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
		self.onSettingsChanged = function(newSettings)
		{
			// Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
			currentSettings = newSettings;

 			titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
		}

		// **onCalculatedValueChanged(settingName, newValue)** (required) : A public function we must implement that will be called when a calculated value changes. Since calculated values can change at any time (like when a datasource is updated) we handle them in a special callback function here.
		self.onCalculatedValueChanged = function(settingName, newValue)
		{
			// Remember we defined "the_text" up above in our settings.
			if(settingName == "the_text")
			{
				// Here we do the actual update of the value that's displayed in on the screen.
				$(myTextElement).html(newValue);
			}
            if (settingName == "value") {
                isOn = Boolean(Number(newValue));
				if( isOn ) {
					//$(stateElement).html(currentSettings.on_text);
				}
				else {
					//$(stateElement).html(currentSettings.off_text);
				}
				updateState();
            }
		}

		// **onDispose()** (required) : Same as with datasource plugins.
		self.onDispose = function()
		{
		}

		this.onSettingsChanged(settings);
	}
}());